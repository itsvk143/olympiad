import clientPromise from '@/lib/mongodb';
import { auth } from '@/lib/auth';
import { retryNotification } from '@/lib/email/queue';

export async function POST(request, { params }) {
    try {
        const session = await auth();

        if (!session?.user?.isAdmin) {
            return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const { id } = await params;
        if (!id) {
            return Response.json({ error: 'Notification ID required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('testseries');

        const result = await retryNotification(db, id, session.user.email || 'Admin');
        return Response.json(result);
    } catch (error) {
        console.error('Failed to retry notification:', error);
        return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
