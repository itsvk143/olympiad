import { auth } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { formatQuestionToLegacy } from '@/lib/questionFormatter';

export const maxDuration = 60; // 60 seconds

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Audit a single question via Gemini.
 * Returns the audit result or null on failure.
 */
async function auditQuestion(question) {
    // Skip if already has a solid explanation AND was audited — nothing to do.
    if (question.audited && question.explanation && question.explanation.length > 80) {
        return { id: question._id, skipped: true };
    }

    // Convert question to legacy format to use same prompt
    const legacyQ = formatQuestionToLegacy(question);

    const auditPrompt = `You are a subject matter expert for Olympiad examinations (Mathematics IMO, Science NSO, English IEO). Verify this MCQ.

Question: ${legacyQ.text}
Options:
${legacyQ.options.map(o => `${o.id}: ${o.text}`).join('\n')}
Declared Correct Option: ${legacyQ.correctOption}
Declared Explanation: ${legacyQ.explanation || 'None'}

Tasks:
1. Check if the declared correct option is right.
2. If wrong, provide the actual correct option letter (a/b/c/d).
3. If explanation is missing/too short/wrong, write a clear 2-sentence explanation.
4. If explanation is already good, keep it unchanged.

Respond ONLY with valid JSON (no markdown):
{"isCorrect": true, "correctedOption": "b", "explanation": "explanation here"}`;

    try {
        const geminiRes = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: auditPrompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!geminiRes.ok) throw new Error(`Gemini ${geminiRes.status}`);

        const geminiData = await geminiRes.json();
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const auditResult = JSON.parse(rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

        return {
            id: question._id,
            correctedOption: auditResult.correctedOption || legacyQ.correctOption,
            explanation: auditResult.explanation || legacyQ.explanation,
            wasCorrect: auditResult.isCorrect,
            corrected: legacyQ.correctOption !== auditResult.correctedOption
        };
    } catch (err) {
        console.error(`Audit failed for ${question._id}:`, err.message);
        return { id: question._id, error: err.message };
    }
}

export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.isAdmin) {
            return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        if (!GEMINI_API_KEY) {
            return Response.json({ error: 'Gemini API key not configured' }, { status: 500 });
        }

        const body = await request.json();
        // Default batch size: 10 parallel requests per Vercel invocation
        const batchSize = Math.min(body.batchSize || 10, 15);
        const testId = body.testId || null; // null = audit whole DB

        const client = await clientPromise;
        const db = client.db();

        let unauditedQuestions = [];
        let total = 0;
        let remaining = 0;

        if (testId) {
            const testPaper = await db.collection('testPapers').findOne({ testId });
            if (testPaper && testPaper.questions) {
                const questionIds = testPaper.questions;
                
                // Get unaudited questions in batch
                unauditedQuestions = await db.collection('questionBank')
                    .find({ _id: { $in: questionIds }, audited: { $ne: true } })
                    .limit(batchSize)
                    .toArray();

                remaining = await db.collection('questionBank').countDocuments({
                    _id: { $in: questionIds },
                    audited: { $ne: true }
                });
                
                total = questionIds.length;
            }
        } else {
            // Whole DB scope
            unauditedQuestions = await db.collection('questionBank')
                .find({ audited: { $ne: true } })
                .limit(batchSize)
                .toArray();

            remaining = await db.collection('questionBank').countDocuments({
                audited: { $ne: true }
            });
            
            total = await db.collection('questionBank').countDocuments({});
        }

        if (unauditedQuestions.length === 0) {
            return Response.json({ success: true, message: 'All questions have been audited!', processed: 0, finished: true, stats: { remaining: 0, total, progress: 100 } });
        }

        // Process ALL questions in the batch IN PARALLEL (not sequentially)
        const auditResults = await Promise.all(unauditedQuestions.map(q => auditQuestion(q)));

        // Write all results back to DB in parallel
        const writeOps = auditResults.map(async (result) => {
            if (!result || result.skipped || result.error) {
                // Still mark as audited even on error to avoid infinite retry loops
                await db.collection('questionBank').updateOne(
                    { _id: result.id },
                    { $set: { audited: true, auditedAt: new Date() } }
                );
                return result;
            }

            const mapping = { a: 0, b: 1, c: 2, d: 3 };
            const correctAnswer = mapping[result.correctedOption.toLowerCase()] ?? 0;

            await db.collection('questionBank').updateOne(
                { _id: result.id },
                {
                    $set: {
                        correctAnswer: correctAnswer,
                        explanation: result.explanation,
                        audited: true,
                        auditedAt: new Date()
                    }
                }
            );
            return result;
        });

        const results = await Promise.all(writeOps);

        // Progress stats — scoped to testId if provided
        let remainingAfter;
        if (testId) {
            const testPaper = await db.collection('testPapers').findOne({ testId });
            const questionIds = testPaper?.questions || [];
            remainingAfter = await db.collection('questionBank').countDocuments({
                _id: { $in: questionIds },
                audited: { $ne: true }
            });
        } else {
            remainingAfter = await db.collection('questionBank').countDocuments({
                audited: { $ne: true }
            });
        }

        return Response.json({
            success: true,
            processed: results.filter(r => !r?.skipped).length,
            results,
            stats: {
                remaining: remainingAfter,
                total,
                progress: Math.round(((total - remainingAfter) / total) * 100)
            }
        });

    } catch (error) {
        console.error('Auto Audit API Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
