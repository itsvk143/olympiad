import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { calculate732DayExpiry } from "@/lib/authorization";

// ── Startup validation — logs clearly which env vars are missing on Vercel ────
const missing = [];
if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) missing.push('AUTH_SECRET');
if (!process.env.GOOGLE_CLIENT_ID)     missing.push('GOOGLE_CLIENT_ID');
if (!process.env.GOOGLE_CLIENT_SECRET) missing.push('GOOGLE_CLIENT_SECRET');
if (!process.env.MONGODB_URI)          missing.push('MONGODB_URI');
if (missing.length > 0) {
    console.error('❌ NextAuth Configuration Error — missing env vars:', missing.join(', '));
}

// next-auth v5 uses AUTH_SECRET; fall back to NEXTAUTH_SECRET for compatibility
if (!process.env.AUTH_SECRET && process.env.NEXTAUTH_SECRET) {
    process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET;
}

// next-auth v5 requires AUTH_TRUST_HOST=true behind Vercel's reverse proxy
if (process.env.VERCEL || process.env.VERCEL_URL) {
    process.env.AUTH_TRUST_HOST = 'true';
}

function CustomMongoDBAdapter(clientPromise) {
    const adapter = MongoDBAdapter(clientPromise, { databaseName: 'testseries' });

    return {
        ...adapter,

        /**
         * Look up a user by linked OAuth provider account.
         * Ensures robust ObjectId matching and prevents orphaned or mismatched records.
         */
        async getUserByAccount({ provider, providerAccountId }) {
            const client = await clientPromise;
            const db = client.db('testseries');

            const account = await db.collection('accounts').findOne({ provider, providerAccountId });
            if (!account) return null;

            let user = null;
            try {
                if (account.userId) {
                    if (ObjectId.isValid(account.userId) && (account.userId instanceof ObjectId || String(account.userId).length === 24)) {
                        user = await db.collection('users').findOne({ _id: new ObjectId(account.userId) });
                    }
                    if (!user) {
                        user = await db.collection('users').findOne({
                            $or: [{ id: account.userId }, { _id: account.userId }]
                        });
                    }
                }
            } catch (err) {
                console.error('[Auth] Error looking up user for account:', err);
            }

            if (!user && account.email) {
                user = await db.collection('users').findOne({
                    email: { $regex: new RegExp(`^${account.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
                });
            }

            if (!user) {
                console.warn(`[Auth] No user found for OAuth account (${provider}:${providerAccountId})`);
                return null;
            }

            // Self-heal account.userId so it always references the user's ObjectId
            if (!account.userId || !account.userId.equals?.(user._id)) {
                await db.collection('accounts').updateOne(
                    { _id: account._id },
                    { $set: { userId: user._id } }
                ).catch(err => console.error('[Auth] Error repairing account userId:', err));
            }

            const { _id, id: _legacyId, ...rest } = user;
            return { ...rest, id: _id.toString() };
        },

        /**
         * Normalized, case-insensitive email lookup.
         * Strips any rogue 'id' property so NextAuth receives the Mongo hex string.
         */
        async getUserByEmail(email) {
            if (!email) return null;
            const client = await clientPromise;
            const db = client.db('testseries');
            const normalizedEmail = email.toLowerCase().trim();
            const escaped = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const user = await db.collection('users').findOne({
                email: { $regex: new RegExp(`^${escaped}$`, 'i') }
            });

            if (!user) return null;
            const { _id, id: _legacyId, ...rest } = user;
            return { ...rest, id: _id.toString() };
        },

        /**
         * Look up a user by ID.
         */
        async getUser(id) {
            if (!id) return null;
            const client = await clientPromise;
            const db = client.db('testseries');

            let user = null;
            try {
                if (ObjectId.isValid(id) && (id instanceof ObjectId || String(id).length === 24)) {
                    user = await db.collection('users').findOne({ _id: new ObjectId(id) });
                }
                if (!user) {
                    user = await db.collection('users').findOne({
                        $or: [{ id: id }, { _id: id }]
                    });
                }
            } catch (err) {
                console.error('[Auth] Error in getUser:', err);
            }

            if (!user) return null;
            const { _id, id: _legacyId, ...rest } = user;
            return { ...rest, id: _id.toString() };
        },

        /**
         * Creates a new student user record with account recovery.
         * Strips incoming UUID 'id' to prevent rogue fields and ensures the MongoDB ObjectId is returned.
         */
        async createUser(user) {
            const client = await clientPromise;
            const db = client.db('testseries');

            const normalizedEmail = user.email ? user.email.toLowerCase().trim() : '';

            // Guard against duplicate user creation if race condition occurs
            if (normalizedEmail) {
                const escaped = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const existing = await db.collection('users').findOne({
                    email: { $regex: new RegExp(`^${escaped}$`, 'i') }
                });
                if (existing) {
                    const { _id, id: _legacyId, ...rest } = existing;
                    return { ...rest, id: _id.toString() };
                }
            }

            // Sequence generator for unique studentCode
            const counter = await db.collection('counters').findOneAndUpdate(
                { _id: 'studentCode' },
                { $inc: { seq: 1 } },
                { returnDocument: 'after', upsert: true }
            );

            const seq = counter?.seq ?? 1;
            const studentCode = `S${String(seq).padStart(10, '0')}`;

            // Strip any rogue 'id' from NextAuth v5 so MongoDB doesn't store a non-ObjectId string id
            const { id: _ignoreId, ...userToInsert } = user;
            userToInsert.studentCode = studentCode;
            userToInsert.email = normalizedEmail || user.email;
            userToInsert.createdAt = new Date();

            // Check if this student previously paid (historical payment recovery)
            let historicalPayment = null;
            if (normalizedEmail) {
                const escaped = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                historicalPayment = await db.collection('payments').findOne({
                    email: { $regex: new RegExp(`^${escaped}$`, 'i') },
                    $or: [
                        { paymentStatus: { $in: ['PAID', 'CONFIRMED'] } },
                        { status: { $in: ['paid', 'CONFIRMED'] } },
                        { amountVerified: true }
                    ]
                }, { sort: { createdAt: -1 } });
            }

            if (historicalPayment) {
                console.log(`[Auth] Recovering paid access for recreated student ${normalizedEmail} (Payment: ${historicalPayment.razorpayPaymentId || historicalPayment._id})`);
                const startDate = new Date();
                const expiryDate = calculate732DayExpiry(startDate);

                userToInsert.paymentStatus = 'CONFIRMED';
                userToInsert.accountStatus = 'ACTIVE';
                userToInsert.isApproved = true;
                userToInsert.approvals = { mock: true, live: true, subject: true, chapter: true, subtopic: true };
                userToInsert.authorizationStartDate = startDate.toISOString();
                userToInsert.authorizationExpiryDate = expiryDate.toISOString();
                userToInsert.paymentConfirmedAt = historicalPayment.paidAt || startDate;
                userToInsert.approvedAt = startDate;
                userToInsert.hasPaidAccess = true;
                userToInsert.paidExam = historicalPayment.exam || 'NEET';
                if (historicalPayment.exam) {
                    userToInsert.exam = historicalPayment.exam;
                    userToInsert.examPreparingFor = historicalPayment.exam;
                }
                userToInsert.authorizationHistory = [{
                    action: 'AUTO_RESTORED_ON_GOOGLE_RELOGIN',
                    paymentId: historicalPayment.razorpayPaymentId || historicalPayment._id?.toString(),
                    orderId: historicalPayment.razorpayOrderId,
                    amount: historicalPayment.finalAmount || historicalPayment.amount,
                    exam: historicalPayment.exam,
                    timestamp: startDate,
                    note: 'Account recreated via Google sign-in. Verified payment history detected and 732-day access restored.'
                }];
            } else {
                userToInsert.paymentStatus = 'PENDING';
                userToInsert.accountStatus = 'PENDING_APPROVAL';
                userToInsert.authorizationStartDate = null;
                userToInsert.authorizationExpiryDate = null;
                userToInsert.paymentConfirmedAt = null;
                userToInsert.approvedAt = null;
                userToInsert.approvedBy = null;
                userToInsert.authorizationHistory = [];
                userToInsert.approvals = { mock: false, live: false, subject: false, chapter: false, subtopic: false };
            }

            const result = await db.collection('users').insertOne(userToInsert);
            const createdUserId = result.insertedId;

            // Re-link payment records to this new student user ID and studentCode
            if (normalizedEmail) {
                const escaped = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                await db.collection('payments').updateMany(
                    { email: { $regex: new RegExp(`^${escaped}$`, 'i') } },
                    { $set: { studentId: createdUserId, studentCode: userToInsert.studentCode, updatedAt: new Date() } }
                );
            }

            return { ...userToInsert, id: createdUserId.toString() };
        },

        /**
         * Links an OAuth provider account to a user ID.
         * Ensures account.userId is always stored as an ObjectId matching users._id.
         */
        async linkAccount(account) {
            const client = await clientPromise;
            const db = client.db('testseries');

            let userIdObj = null;
            if (account.userId instanceof ObjectId) {
                userIdObj = account.userId;
            } else if (typeof account.userId === 'string' && ObjectId.isValid(account.userId) && account.userId.length === 24) {
                userIdObj = new ObjectId(account.userId);
            } else {
                const user = await db.collection('users').findOne({
                    $or: [{ id: account.userId }, { _id: account.userId }]
                });
                if (user) userIdObj = user._id;
            }

            if (!userIdObj && ObjectId.isValid(account.userId)) {
                userIdObj = new ObjectId(account.userId);
            }

            const finalUserId = userIdObj || account.userId;

            // Clean up any stale account rows for this provider + providerAccountId or user
            await db.collection('accounts').deleteMany({
                $or: [
                    { provider: account.provider, providerAccountId: account.providerAccountId },
                    ...(userIdObj ? [{ userId: userIdObj, provider: account.provider }] : [])
                ]
            });

            const accountToInsert = {
                ...account,
                userId: finalUserId
            };

            await db.collection('accounts').insertOne(accountToInsert);
            return account;
        },

        /**
         * Create session with guaranteed ObjectId matching users._id.
         */
        async createSession(data) {
            const client = await clientPromise;
            const db = client.db('testseries');

            let userIdObj = null;
            if (data.userId instanceof ObjectId) {
                userIdObj = data.userId;
            } else if (typeof data.userId === 'string' && ObjectId.isValid(data.userId) && data.userId.length === 24) {
                userIdObj = new ObjectId(data.userId);
            } else {
                const user = await db.collection('users').findOne({
                    $or: [{ id: data.userId }, { _id: data.userId }]
                });
                if (user) userIdObj = user._id;
            }

            if (!userIdObj && ObjectId.isValid(data.userId)) {
                userIdObj = new ObjectId(data.userId);
            }

            const sessionToInsert = {
                ...data,
                userId: userIdObj || data.userId,
            };

            const result = await db.collection('sessions').insertOne(sessionToInsert);
            return {
                ...data,
                id: result.insertedId.toString(),
                userId: (userIdObj || data.userId).toString(),
            };
        },

        /**
         * Retrieve session and corresponding user safely.
         */
        async getSessionAndUser(sessionToken) {
            const client = await clientPromise;
            const db = client.db('testseries');

            const session = await db.collection('sessions').findOne({ sessionToken });
            if (!session) return null;

            let user = null;
            if (session.userId) {
                if (ObjectId.isValid(session.userId) && (session.userId instanceof ObjectId || String(session.userId).length === 24)) {
                    user = await db.collection('users').findOne({ _id: new ObjectId(session.userId) });
                }
                if (!user) {
                    user = await db.collection('users').findOne({
                        $or: [{ id: session.userId }, { _id: session.userId }]
                    });
                }
            }

            if (!user) {
                return null;
            }

            const { _id: sessionId, ...sessionRest } = session;
            const { _id: userId, id: _legacyId, ...userRest } = user;

            return {
                session: {
                    ...sessionRest,
                    id: sessionId.toString(),
                    userId: userId.toString(),
                },
                user: {
                    ...userRest,
                    id: userId.toString(),
                },
            };
        },

        /**
         * Delete user cascading to accounts and sessions.
         */
        async deleteUser(userId) {
            const client = await clientPromise;
            const db = client.db('testseries');
            const uId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

            await Promise.all([
                db.collection('accounts').deleteMany({ $or: [{ userId: uId }, { userId: userId }] }),
                db.collection('sessions').deleteMany({ $or: [{ userId: uId }, { userId: userId }] }),
                db.collection('users').deleteOne({ _id: uId }),
            ]);
        }
    };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    adapter: CustomMongoDBAdapter(clientPromise),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            // Self-healing: if an existing user signs in and has a verified payment in payments collection,
            // ensure their access and confirmed status are active!
            if (user?.email) {
                try {
                    const client = await clientPromise;
                    const db = client.db('testseries');
                    const normalizedEmail = user.email.toLowerCase().trim();
                    const escaped = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                    const historicalPayment = await db.collection('payments').findOne({
                        email: { $regex: new RegExp(`^${escaped}$`, 'i') },
                        $or: [
                            { paymentStatus: { $in: ['PAID', 'CONFIRMED'] } },
                            { status: { $in: ['paid', 'CONFIRMED'] } },
                            { amountVerified: true }
                        ]
                    }, { sort: { createdAt: -1 } });

                    if (historicalPayment) {
                        const existingUser = await db.collection('users').findOne({
                            email: { $regex: new RegExp(`^${escaped}$`, 'i') }
                        });

                        if (existingUser && (existingUser.paymentStatus !== 'CONFIRMED' && existingUser.paymentStatus !== 'PAID')) {
                            const startDate = new Date();
                            const expiryDate = calculate732DayExpiry(startDate);
                            await db.collection('users').updateOne(
                                { _id: existingUser._id },
                                {
                                    $set: {
                                        paymentStatus: 'CONFIRMED',
                                        accountStatus: 'ACTIVE',
                                        isApproved: true,
                                        approvals: { mock: true, live: true, subject: true, chapter: true, subtopic: true },
                                        authorizationStartDate: startDate.toISOString(),
                                        authorizationExpiryDate: expiryDate.toISOString(),
                                        hasPaidAccess: true,
                                        paidExam: historicalPayment.exam || existingUser.exam || 'NEET',
                                        updatedAt: startDate
                                    }
                                }
                            );
                        }
                    }
                } catch (e) {
                    console.error('[Auth] Error in signIn payment reconciliation:', e);
                }
            }
            return true;
        },
        async session({ session, user }) {
            if (session.user && user) {
                const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
                session.user.isAdmin = user.role === 'admin' || (user.email && adminEmails.includes(user.email.toLowerCase()));
                session.user.id = user.id;
                if (user.role) {
                    session.user.role = user.role;
                }
                if (user.studentCode) {
                    session.user.studentCode = user.studentCode;
                }
                session.user.paymentStatus = user.paymentStatus || 'PENDING';
                session.user.accountStatus = user.accountStatus || 'PENDING_APPROVAL';
                session.user.authorizationExpiryDate = user.authorizationExpiryDate || null;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/signin',
    },
});
