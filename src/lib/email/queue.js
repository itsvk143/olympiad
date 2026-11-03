import { ObjectId } from 'mongodb';
import {
    getResendClient,
    isResendConfigured,
    renderActivationEmailHtml,
    renderActivationEmailText,
    RESEND_DAILY_LIMIT,
    RESEND_MONTHLY_LIMIT
} from './resend.js';

let indexesInitialized = false;

/**
 * Ensures indexes exist on emailNotifications collection.
 */
export async function initEmailNotificationsIndexes(db) {
    if (indexesInitialized) return;
    try {
        const collections = await db.listCollections({ name: 'emailNotifications' }).toArray();
        if (collections.length === 0) {
            await db.createCollection('emailNotifications');
        }

        const collection = db.collection('emailNotifications');
        await Promise.all([
            collection.createIndex({ notificationId: 1 }, { unique: true, sparse: true }),
            collection.createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true }),
            collection.createIndex({ studentId: 1 }),
            collection.createIndex({ studentEmail: 1 }),
            collection.createIndex({ status: 1 }),
            collection.createIndex({ createdAt: -1 }),
            collection.createIndex({ sentAt: -1 })
        ]);
        indexesInitialized = true;
    } catch (err) {
        console.warn('Warning: Could not create emailNotifications indexes:', err.message);
    }
}

/**
 * Check Resend free quota usage against daily and monthly limits.
 */
export async function checkFreeQuota(db) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayCount, monthCount] = await Promise.all([
        db.collection('emailNotifications').countDocuments({
            status: 'SENT',
            sentAt: { $gte: startOfToday }
        }),
        db.collection('emailNotifications').countDocuments({
            status: 'SENT',
            sentAt: { $gte: startOfMonth }
        })
    ]);

    const dailyLimit = RESEND_DAILY_LIMIT;
    const monthlyLimit = RESEND_MONTHLY_LIMIT;

    if (todayCount >= dailyLimit) {
        return {
            allowed: false,
            reason: `Resend daily free limit reached (${todayCount}/${dailyLimit} sent today). Notification kept in queue until quota resets.`,
            todayCount,
            monthCount,
            dailyLimit,
            monthlyLimit
        };
    }

    if (monthCount >= monthlyLimit) {
        return {
            allowed: false,
            reason: `Resend monthly free limit reached (${monthCount}/${monthlyLimit} sent this month). Notification kept in queue.`,
            todayCount,
            monthCount,
            dailyLimit,
            monthlyLimit
        };
    }

    return {
        allowed: true,
        todayCount,
        monthCount,
        dailyLimit,
        monthlyLimit
    };
}

/**
 * Creates and enqueues a new notification event with idempotency protection.
 */
export async function createNotificationEvent(db, {
    studentId,
    studentName,
    studentEmail,
    activatedCategories,
    triggeredBy,
    triggerSource = 'INDIVIDUAL_TOGGLE',
    idempotencyKey = null
}) {
    if (!studentEmail || !Array.isArray(activatedCategories) || activatedCategories.length === 0) {
        return null;
    }

    await initEmailNotificationsIndexes(db);

    const now = new Date();
    const randPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const notificationId = `NOTIF-${dateStr}-${randPart}`;

    // Normalize categories to upper case
    const normalizedCategories = activatedCategories.map(c => c.toUpperCase());

    const finalIdempotencyKey = idempotencyKey ||
        `notif_${studentId}_${normalizedCategories.sort().join('_')}_${Math.floor(now.getTime() / 60000)}`;

    const eventDoc = {
        notificationId,
        studentId: studentId ? new ObjectId(studentId) : null,
        studentName: studentName || 'Student',
        studentEmail: studentEmail.trim().toLowerCase(),
        notificationType: 'TEST_ACCESS_ACTIVATED',
        activatedCategories: normalizedCategories,
        triggeredBy: triggeredBy || 'Admin',
        triggerSource,
        idempotencyKey: finalIdempotencyKey,
        status: 'PENDING',
        provider: 'RESEND',
        providerMessageId: null,
        retryCount: 0,
        maxRetries: 3,
        lastAttemptAt: null,
        sentAt: null,
        errorMessage: null,
        createdAt: now,
        updatedAt: now
    };

    try {
        const result = await db.collection('emailNotifications').insertOne(eventDoc);
        return { ...eventDoc, _id: result.insertedId };
    } catch (err) {
        // E11000 duplicate key error on idempotencyKey
        if (err.code === 11000) {
            console.log(`[EmailQueue] Duplicate notification suppressed for idempotency key: ${finalIdempotencyKey}`);
            return await db.collection('emailNotifications').findOne({ idempotencyKey: finalIdempotencyKey });
        }
        console.error('[EmailQueue] Failed to enqueue email notification:', err);
        throw err;
    }
}

/**
 * Processes pending notifications in the queue.
 */
export async function processEmailQueue(db, maxBatch = 15) {
    await initEmailNotificationsIndexes(db);

    // Atomically claim pending notifications
    const pendingDocs = await db.collection('emailNotifications')
        .find({ status: 'PENDING' })
        .sort({ createdAt: 1 })
        .limit(maxBatch)
        .toArray();

    if (pendingDocs.length === 0) {
        return { processed: 0, sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const doc of pendingDocs) {
        // Atomic claim
        const claimResult = await db.collection('emailNotifications').findOneAndUpdate(
            { _id: doc._id, status: 'PENDING' },
            {
                $set: {
                    status: 'PROCESSING',
                    lastAttemptAt: new Date(),
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );

        if (!claimResult) {
            continue; // Claimed by another concurrent process
        }

        const claimed = claimResult;

        // 1. Check if Resend is configured
        if (!isResendConfigured()) {
            await db.collection('emailNotifications').updateOne(
                { _id: claimed._id },
                {
                    $set: {
                        status: 'FAILED',
                        errorMessage: 'RESEND_API_KEY environment variable is not configured. Add it in Railway.',
                        updatedAt: new Date()
                    }
                }
            );
            failed++;
            continue;
        }

        // 2. Check Resend Free Quota
        const quota = await checkFreeQuota(db);
        if (!quota.allowed) {
            await db.collection('emailNotifications').updateOne(
                { _id: claimed._id },
                {
                    $set: {
                        status: 'QUOTA_EXCEEDED',
                        errorMessage: quota.reason,
                        updatedAt: new Date()
                    }
                }
            );
            failed++;
            continue;
        }

        // 3. Dispatch Email through Resend
        const resend = getResendClient();
        const fromAddress = process.env.EMAIL_FROM || 'PollTestSeries <notifications@polltest.in>';
        const appUrl = process.env.APP_URL || 'https://polltest.in';

        try {
            const htmlContent = renderActivationEmailHtml({
                studentName: claimed.studentName,
                studentEmail: claimed.studentEmail,
                activatedCategories: claimed.activatedCategories,
                appUrl
            });

            const textContent = renderActivationEmailText({
                studentName: claimed.studentName,
                studentEmail: claimed.studentEmail,
                activatedCategories: claimed.activatedCategories,
                appUrl
            });

            const response = await resend.emails.send({
                from: fromAddress,
                to: claimed.studentEmail,
                subject: 'Your PollTestSeries Test Access Is Now Active!',
                html: htmlContent,
                text: textContent
            });

            if (response.error) {
                throw new Error(response.error.message || JSON.stringify(response.error));
            }

            // Successful dispatch
            await db.collection('emailNotifications').updateOne(
                { _id: claimed._id },
                {
                    $set: {
                        status: 'SENT',
                        sentAt: new Date(),
                        providerMessageId: response.data?.id || null,
                        errorMessage: null,
                        updatedAt: new Date()
                    }
                }
            );
            sent++;
        } catch (err) {
            console.error(`[EmailQueue] Failed to send email for ${claimed.studentEmail}:`, err.message);

            const isRetryable = err.message?.includes('rate_limit') ||
                                err.message?.includes('timeout') ||
                                err.message?.includes('429') ||
                                err.message?.includes('500') ||
                                err.message?.includes('503');

            const nextRetryCount = (claimed.retryCount || 0) + 1;
            const canRetry = isRetryable && nextRetryCount < (claimed.maxRetries || 3);

            await db.collection('emailNotifications').updateOne(
                { _id: claimed._id },
                {
                    $set: {
                        status: canRetry ? 'PENDING' : 'FAILED',
                        retryCount: nextRetryCount,
                        errorMessage: err.message || 'Unknown sending failure',
                        updatedAt: new Date()
                    }
                }
            );
            failed++;
        }
    }

    return { processed: pendingDocs.length, sent, failed };
}

/**
 * Triggers queue processing in the background without awaiting.
 */
export function triggerBackgroundQueue(db) {
    setImmediate(() => {
        processEmailQueue(db).catch(err => {
            console.error('[EmailQueue] Background worker encountered an error:', err);
        });
    });
}

/**
 * Allows an authorized admin to manually retry a failed or quota-exceeded notification.
 */
export async function retryNotification(db, notificationId, adminEmail) {
    const notif = await db.collection('emailNotifications').findOne({ notificationId });
    if (!notif) {
        throw new Error('Notification not found');
    }

    await db.collection('emailNotifications').updateOne(
        { notificationId },
        {
            $set: {
                status: 'PENDING',
                errorMessage: null,
                updatedAt: new Date()
            },
            $push: {
                retryAudit: {
                    retriedBy: adminEmail,
                    retriedAt: new Date()
                }
            }
        }
    );

    triggerBackgroundQueue(db);
    return { success: true, notificationId };
}
