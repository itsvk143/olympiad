import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { auth } from '@/lib/auth';
import {
    normalizeToCanonicalExam,
    getCanonicalExamDisplay,
    CANONICAL_EXAMS,
    logAdminAudit
} from '@/lib/authorization';

export async function POST(request, { params }) {
    try {
        const session = await auth();

        const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        const isUserAdmin = session?.user?.role === 'admin' ||
            session?.user?.isAdmin === true ||
            (session?.user?.email && adminEmails.includes(session.user.email.toLowerCase()));

        if (!isUserAdmin) {
            return Response.json({ error: 'Unauthorized. Admin privileges required.' }, { status: 403 });
        }

        const { id } = await params;

        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
            return Response.json({ error: 'Invalid User ID format' }, { status: 400 });
        }

        const body = await request.json();
        const { newExam, reason = '' } = body;

        const canonicalNewExam = normalizeToCanonicalExam(newExam);
        if (!canonicalNewExam || !CANONICAL_EXAMS.includes(canonicalNewExam)) {
            return Response.json({
                error: 'Invalid exam selection. Allowed exam is: OLYMPIAD.'
            }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('testseries');
        const objectId = new ObjectId(id);

        const user = await db.collection('users').findOne({ _id: objectId });
        if (!user) {
            return Response.json({ error: 'Student not found.' }, { status: 404 });
        }

        const prevExam = normalizeToCanonicalExam(user.exam || user.examPreparingFor) || 'NOT_SET';
        const newDisplay = getCanonicalExamDisplay(canonicalNewExam);

        // Update student record - strictly preserving test results, attempts, and history
        await db.collection('users').updateOne(
            { _id: objectId },
            {
                $set: {
                    exam: canonicalNewExam,
                    examPreparingFor: newDisplay,
                    examLastChangedAt: new Date(),
                    examLastChangedBy: session.user.email || 'Admin',
                    updatedAt: new Date()
                }
            }
        );

        // Record entry in admin audit log
        await logAdminAudit(db, {
            action: 'ADMIN_EXAM_CHANGE',
            studentId: objectId,
            adminId: session.user.id || session.user.email,
            prevStatus: prevExam,
            newStatus: canonicalNewExam,
            details: {
                reason: reason.trim() || 'Admin updated enrolled exam',
                studentEmail: user.email,
                studentName: user.name,
                adminEmail: session.user.email
            }
        });

        console.log(`✅ Exam changed for student ${user.email}: ${prevExam} -> ${canonicalNewExam} by ${session.user.email}`);

        return Response.json({
            success: true,
            message: `Student exam successfully updated to ${newDisplay}`,
            exam: canonicalNewExam,
            examPreparingFor: newDisplay
        });
    } catch (error) {
        console.error('Failed to change student exam:', error);
        return Response.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}
