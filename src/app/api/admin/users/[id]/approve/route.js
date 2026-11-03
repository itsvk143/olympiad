import clientPromise from '@/lib/mongodb';
import { auth } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { createNotificationEvent, triggerBackgroundQueue } from '@/lib/email/queue';

// Default approvals - all test types approved by default
export const DEFAULT_APPROVALS = {
    live: true,
    mock: true,
    subject: true,
    chapter: true,
    subtopic: true,
};

export async function POST(request, { params }) {
    try {
        const session = await auth();

        if (!session?.user?.isAdmin) {
            return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { approvals, isApproved: explicitApproved, triggerSource: customSource } = body;

        let updateData = {};
        if (approvals && typeof approvals === 'object') {
            const isApproved = ['live', 'mock', 'subject', 'chapter', 'subtopic'].every(k => approvals[k] === true);
            updateData = { approvals, isApproved };
        } else if (typeof explicitApproved === 'boolean') {
            const newApprovals = {
                live: explicitApproved,
                mock: explicitApproved,
                subject: explicitApproved,
                chapter: explicitApproved,
                subtopic: explicitApproved,
            };
            updateData = { approvals: newApprovals, isApproved: explicitApproved };
        } else {
            return Response.json({ error: 'Invalid approvals object' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('testseries');

        // Fetch current user state for permission diffing and account activation
        const existingUser = await db.collection('users').findOne(
            { _id: new ObjectId(id) },
            { projection: { name: 1, email: 1, approvals: 1, authorizationExpiryDate: 1, authorizationStartDate: 1, paymentStatus: 1 } }
        );

        if (!existingUser) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        // If fully approved, also activate the account with authorization dates
        if (updateData.isApproved) {
            if (!existingUser.authorizationExpiryDate) {
                const startDate = new Date();
                const expiryDate = new Date(startDate.getTime() + (732 * 24 * 60 * 60 * 1000));
                updateData.accountStatus = 'ACTIVE';
                updateData.authorizationStartDate = startDate.toISOString();
                updateData.authorizationExpiryDate = expiryDate.toISOString();
                updateData.approvedAt = startDate;
            } else {
                updateData.accountStatus = 'ACTIVE';
            }
        }

        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        // Determine newly activated categories (transitioned from false/undefined to true)
        const allCategories = ['live', 'mock', 'subject', 'chapter', 'subtopic'];
        const newlyActivated = allCategories.filter(cat => {
            const prev = Boolean(existingUser.approvals && existingUser.approvals[cat]);
            const next = Boolean(updateData.approvals && updateData.approvals[cat]);
            return !prev && next;
        });

        // If at least one category was newly activated and user has a registered email, queue notification
        if (newlyActivated.length > 0 && existingUser.email) {
            const isAllCategories = newlyActivated.length === allCategories.length ||
                (updateData.isApproved && newlyActivated.length >= 3);
            const triggerSource = customSource || (isAllCategories ? 'APPROVE_ALL' : 'INDIVIDUAL_TOGGLE');

            // Unique idempotency key based on user and newly activated categories
            const idempotencyKey = `single_${id}_${newlyActivated.sort().join('_')}_${Date.now()}`;

            await createNotificationEvent(db, {
                studentId: existingUser._id,
                studentName: existingUser.name,
                studentEmail: existingUser.email,
                activatedCategories: newlyActivated,
                triggeredBy: session.user.email || 'Admin',
                triggerSource,
                idempotencyKey
            }).catch(err => console.error('[ApproveRoute] Error queuing notification:', err));

            // Trigger background queue execution asynchronously
            triggerBackgroundQueue(db);
        }

        return Response.json({ success: true, newlyActivated, ...updateData });
    } catch (error) {
        console.error('Failed to update user approval:', error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
