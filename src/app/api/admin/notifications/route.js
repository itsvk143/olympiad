import clientPromise from '@/lib/mongodb';
import { auth } from '@/lib/auth';
import { checkFreeQuota } from '@/lib/email/queue';
import { isResendConfigured } from '@/lib/email/resend';
import { ObjectId } from 'mongodb';

export async function GET(request) {
    try {
        const session = await auth();

        if (!session?.user?.isAdmin) {
            return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');
        const studentEmail = searchParams.get('studentEmail');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const client = await clientPromise;
        const db = client.db('testseries');

        const query = {};
        if (studentId) {
            try {
                query.studentId = new ObjectId(studentId);
            } catch {
                query.studentId = studentId;
            }
        }
        if (studentEmail) {
            query.studentEmail = studentEmail.trim().toLowerCase();
        }
        if (status && status !== 'ALL') {
            query.status = status;
        }

        const [notifications, quota, pendingCount, failedCount, sentCount] = await Promise.all([
            db.collection('emailNotifications')
                .find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .toArray(),
            checkFreeQuota(db),
            db.collection('emailNotifications').countDocuments({ status: 'PENDING' }),
            db.collection('emailNotifications').countDocuments({ status: 'FAILED' }),
            db.collection('emailNotifications').countDocuments({ status: 'SENT' })
        ]);

        return Response.json({
            notifications,
            stats: {
                todaySent: quota.todayCount,
                dailyLimit: quota.dailyLimit,
                monthSent: quota.monthCount,
                monthlyLimit: quota.monthlyLimit,
                pendingCount,
                failedCount,
                sentCount,
                resendConfigured: isResendConfigured()
            }
        });
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
