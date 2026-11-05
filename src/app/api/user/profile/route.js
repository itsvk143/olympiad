import { auth } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { normalizeToCanonicalExam, getCanonicalExamDisplay, CANONICAL_EXAMS } from '@/lib/authorization';

export async function POST(request) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, mobileNo, schoolName, coachingName, city, state, studentClass } = body;
        const rawExam = body.exam || body.examPreparingFor;

        // Validate required fields (schoolName and coachingName are OPTIONAL)
        if (!name || !mobileNo || !city || !state || !rawExam || !studentClass) {
            return Response.json({ error: 'Name, mobile, class, exam, state and city are required' }, { status: 400 });
        }

        // Validate mobile number format
        if (!/^[0-9]{10}$/.test(mobileNo)) {
            return Response.json({ error: 'Invalid mobile number format' }, { status: 400 });
        }

        // STRICT SERVER-SIDE SINGLE-EXAM VALIDATION
        if (Array.isArray(rawExam)) {
            return Response.json({
                error: 'Multiple exam selection is not permitted. A student can register for only ONE exam.'
            }, { status: 400 });
        }

        const rawExamStr = String(rawExam).trim();
        const canonicalExam = normalizeToCanonicalExam(rawExamStr) || 'OLYMPIAD';

        const client = await clientPromise;
        const db = client.db('testseries');
        const userEmail = session.user.email.toLowerCase(); // Normalize email

        // Check if student already has a locked assigned exam
        const existingUser = await db.collection('users').findOne({
            email: { $regex: new RegExp(`^${userEmail}$`, 'i') }
        });

        const isUserAdmin = existingUser?.role === 'admin' || existingUser?.isAdmin === true;
        if (existingUser?.profileCompleted && (existingUser?.exam || existingUser?.examPreparingFor) && !isUserAdmin) {
            const existingCanonical = normalizeToCanonicalExam(existingUser.exam || existingUser.examPreparingFor);
            if (existingCanonical && existingCanonical !== canonicalExam) {
                return Response.json({
                    error: `Your assigned exam is locked to ${getCanonicalExamDisplay(existingCanonical)}. Students cannot change their assigned exam. Please contact an administrator if you need to correct your exam.`
                }, { status: 403 });
            }
        }

        const examDisplay = getCanonicalExamDisplay(canonicalExam);

        // Use findOneAndUpdate to atomically update or insert
        const result = await db.collection('users').findOneAndUpdate(
            { email: { $regex: new RegExp(`^${userEmail}$`, 'i') } },
            {
                $set: {
                    name,
                    mobileNo,
                    schoolName: schoolName || '',
                    coachingName: coachingName || '',
                    city,
                    state,
                    exam: canonicalExam,
                    examPreparingFor: examDisplay,
                    examAssignedAt: existingUser?.examAssignedAt || new Date(),
                    profileCompleted: true,
                    profileCompletedAt: new Date(),
                    email: userEmail
                },
                $setOnInsert: {
                    createdAt: new Date(),
                    paymentStatus: 'PENDING',
                    accountStatus: 'PENDING_APPROVAL',
                    authorizationStartDate: null,
                    authorizationExpiryDate: null,
                    paymentConfirmedAt: null,
                    approvedAt: null,
                    approvedBy: null,
                    authorizationHistory: [],
                    approvals: { mock: false, live: false, subject: false, chapter: false, subtopic: false }
                }
            },
            {
                upsert: true,
                returnDocument: 'after'
            }
        );

        console.log('✅ Profile updated/created for:', userEmail);

        // --- Push sync to teachingcommunity.in ---
        if (process.env.TEACHING_COMMUNITY_SYNC_URL && process.env.SYNC_API_KEY) {
            try {
                // Fire and forget, or await. We use fire and forget to not block the user response if teachingcommunity is slow
                fetch(process.env.TEACHING_COMMUNITY_SYNC_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.SYNC_API_KEY}`
                    },
                    body: JSON.stringify({
                        email: userEmail,
                        name,
                        mobileNo,
                        schoolName: schoolName || '',
                        coachingName: coachingName || '',
                        city,
                        state,
                        exam: canonicalExam,
                        examPreparingFor: examDisplay,
                        studentClass,
                        profileCompleted: true
                    })
                }).then(res => {
                    if (!res.ok) {
                        console.error('❌ Failed to sync to teachingcommunity.in:', res.statusText);
                    } else {
                        console.log('✅ Successfully synced to teachingcommunity.in for:', userEmail);
                    }
                }).catch(err => {
                    console.error('❌ Error hitting sync API:', err);
                });
            } catch (syncError) {
                console.error('❌ Synchronous error calling sync API:', syncError);
            }
        }

        return Response.json({
            success: true,
            message: 'Profile updated successfully',
            profileCompleted: true,
            isApproved: !!result?.isApproved,
            user: result
        });
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        return Response.json({ error: 'Failed to update profile: ' + error.message }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db('testseries');
        const userEmail = session.user.email.toLowerCase();

        // Try exact match first, then case-insensitive
        let user = await db.collection('users').findOne({ email: userEmail });

        if (!user) {
            // Fallback to case-insensitive search
            user = await db.collection('users').findOne({ email: { $regex: new RegExp(`^${userEmail}$`, 'i') } });
        }

        if (!user) {
            console.log('⚠️ User not found in DB:', userEmail);
            return Response.json({
                profileCompleted: false,
                paymentStatus: 'PENDING',
                accountStatus: 'PENDING_APPROVAL',
                isApproved: false,
                approvals: { mock: false, live: false, subject: false, chapter: false, subtopic: false },
                email: userEmail
            });
        }

        // Check if required fields exist to consider profile "completed"
        const isProfileActuallyCompleted = user.profileCompleted &&
            user.name &&
            user.examPreparingFor;

        // Default approvals if not set
        const defaultApprovals = { mock: false, live: false, subject: false, chapter: false, subtopic: false };
        const approvals = user.approvals || defaultApprovals;

        // Dynamic authorization evaluation
        const now = Date.now();
        let daysRemaining = null;
        let isAuthorized = false;

        const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        const isAdmin = user.role === 'admin' || user.isAdmin || adminEmails.includes(userEmail);

        if (isAdmin) {
            isAuthorized = true;
            daysRemaining = Infinity;
        } else if (user.paymentStatus === 'CONFIRMED' && user.authorizationExpiryDate) {
            const expiryTime = new Date(user.authorizationExpiryDate).getTime();
            if (!isNaN(expiryTime) && expiryTime > now) {
                isAuthorized = true;
                daysRemaining = Math.max(0, Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24)));
            }
        }

        const canonicalExam = normalizeToCanonicalExam(user.exam || user.examPreparingFor);
        const examDisplay = getCanonicalExamDisplay(canonicalExam);

        return Response.json({
            ...user,
            exam: canonicalExam || user.exam || '',
            examPreparingFor: examDisplay || user.examPreparingFor || '',
            isAdmin,
            profileCompleted: !!isProfileActuallyCompleted,
            isApproved: !!user.isApproved,
            isAuthorized,
            daysRemaining,
            approvals
        });
    } catch (error) {
        console.error('❌ Error fetching profile:', error);
        return Response.json({ error: 'Failed to fetch profile: ' + error.message }, { status: 500 });
    }
}
