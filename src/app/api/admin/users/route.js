import clientPromise from '@/lib/mongodb';
import { auth } from '@/lib/auth';

export async function GET(request) {
    try {
        const session = await auth();
        
        // Authorization Check
        if (!session?.user?.isAdmin) {
            return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const client = await clientPromise;
        const db = client.db('testseries');

        // Fetch all users from the NextAuth collection
        const users = await db.collection('users').find({}, {
            projection: {
                name: 1,
                email: 1,
                image: 1,
                role: 1,
                createdAt: 1,
                profileCompletedAt: 1,
                isApproved: 1,
                approvals: 1,
                exam: 1,
                examPreparingFor: 1,
                paymentStatus: 1,
                accountStatus: 1,
                authorizationStartDate: 1,
                authorizationExpiryDate: 1,
                state: 1,
                city: 1,
                schoolName: 1,
                coachingName: 1,
                mobileNo: 1,
                studentCode: 1,
            }
        }).toArray();

        const userEmails = users.map(u => (u.email || '').trim().toLowerCase()).filter(Boolean);

        // Fetch latest email notification per student in one single aggregation
        const latestNotifications = await db.collection('emailNotifications').aggregate([
            { $match: { studentEmail: { $in: userEmails } } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$studentEmail',
                    status: { $first: '$status' },
                    notificationId: { $first: '$notificationId' },
                    sentAt: { $first: '$sentAt' },
                    createdAt: { $first: '$createdAt' },
                    activatedCategories: { $first: '$activatedCategories' },
                    errorMessage: { $first: '$errorMessage' }
                }
            }
        ]).toArray().catch(err => {
            console.warn('Could not fetch latest notifications:', err.message);
            return [];
        });

        const notifMap = new Map(latestNotifications.map(n => [n._id, n]));

        const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const resultsCount = await db.collection('testResults').countDocuments({
                userEmail: { $regex: new RegExp(`^${user.email}$`, 'i') },
                status: { $nin: ['RESET', 'DELETED'] },
                isReset: { $ne: true },
                isDeleted: { $ne: true }
            });
            const isAdmin = user.role === 'admin' || adminEmails.includes(user.email?.toLowerCase());
            const emailKey = user.email?.trim().toLowerCase();
            return {
                ...user,
                _id: user._id.toString(),
                testsTaken: resultsCount,
                isAdmin,
                latestEmailNotification: notifMap.get(emailKey) || null
            };
        }));

        usersWithStats.sort((a, b) => {
            if (a.isAdmin && !b.isAdmin) return 1;
            if (!a.isAdmin && b.isAdmin) return -1;
            return 0;
        });

        return Response.json(usersWithStats);
    } catch (error) {
        console.error('Failed to fetch admin users:', error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
