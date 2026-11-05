import clientPromise from '@/lib/mongodb';
import { auth } from '@/lib/auth';
import { olympiadTests } from '@/data/exams/olympiad';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.isAdmin) {
            return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const client = await clientPromise;
        const db = client.db();

        let initializedCount = 0;
        let updatedCount = 0;

        for (const test of olympiadTests) {
            const testId = test.id;
            const existing = await db.collection('testPapers').findOne({ testId });

            if (existing) {
                // Keep existing questions, update metadata
                await db.collection('testPapers').updateOne(
                    { testId },
                    {
                        $set: {
                            title: test.title,
                            subject: test.subject,
                            subjectSlug: test.subjectSlug,
                            classGrade: test.classGrade,
                            studentClass: test.studentClass,
                            paperNumber: test.paperNumber,
                            paperCode: test.paperCode,
                            exam: 'olympiad',
                            examType: 'Olympiad',
                            category: 'olympiad',
                            type: 'MOCK',
                            duration: test.duration,
                            totalMarks: test.totalMarks,
                            questionsCount: test.questionsCount,
                            marksPerQuestion: test.marksPerQuestion,
                            negativeMarks: test.negativeMarks,
                            difficulty: test.difficulty,
                            difficultyDistribution: test.difficultyDistribution,
                            topics: test.topics,
                            description: test.description,
                            updatedAt: new Date()
                        }
                    }
                );
                updatedCount++;
            } else {
                // Insert new Olympiad test paper
                await db.collection('testPapers').insertOne({
                    testId,
                    title: test.title,
                    subject: test.subject,
                    subjectSlug: test.subjectSlug,
                    classGrade: test.classGrade,
                    studentClass: test.studentClass,
                    paperNumber: test.paperNumber,
                    paperCode: test.paperCode,
                    exam: 'olympiad',
                    examType: 'Olympiad',
                    category: 'olympiad',
                    type: 'MOCK',
                    duration: test.duration,
                    totalMarks: test.totalMarks,
                    questionsCount: test.questionsCount,
                    marksPerQuestion: test.marksPerQuestion,
                    negativeMarks: test.negativeMarks,
                    difficulty: test.difficulty,
                    difficultyDistribution: test.difficultyDistribution,
                    topics: test.topics,
                    description: test.description,
                    questions: [],
                    status: 'PUBLISHED',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                initializedCount++;
            }
        }

        return Response.json({
            success: true,
            totalOlympiadTests: olympiadTests.length,
            initializedCount,
            updatedCount,
            message: `Successfully initialized ${initializedCount} new and updated ${updatedCount} existing Olympiad test papers.`
        });
    } catch (err) {
        console.error('Failed to initialize Olympiad tests:', err);
        return Response.json({ error: err.message || 'Initialization failed' }, { status: 500 });
    }
}
