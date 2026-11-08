/**
 * Dedicated Seeding Script: Update Class 11 Olympiad Questions and Test Papers
 * Aligned with India's Official Selection Pathways:
 * • Mathematics: IOQM → RMO → INMO → IMO
 * • Physics: NSEP → INPhO → IPhO
 * • Chemistry: NSEC → INChO → IChO
 * • Biology: NSEB → INBO → IBO
 */

import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { getTopicsForClassAndSubject, OLYMPIAD_SUBJECTS } from './olympiadSyllabus.mjs';
import { DIFFICULTY_DISTRIBUTIONS, getTestConfigForClass } from './olympiadTests.mjs';
import { createOlympiadQuestion } from './olympiadQuestionGenerator.mjs';

dotenv.config({ path: '.env.local' });

let uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('❌ MONGODB_URI is not set in .env.local');
    process.exit(1);
}

if (!uri.includes('/testseries')) {
    uri = uri.replace(/\/?(\?|$)/, '/testseries$1');
}

async function run() {
    console.log('🚀 Connecting to MongoDB Atlas...');
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('testseries');
    console.log(`✓ Connected to: ${db.databaseName}`);

    const classNum = 11;
    const config = getTestConfigForClass(classNum);
    console.log(`📌 Seeding Class 11 (${config.questionsCount} questions/test, duration ${config.duration} min)...`);

    let totalUpdatedTests = 0;
    let totalQuestionsInserted = 0;

    for (const subject of OLYMPIAD_SUBJECTS) {
        const subjectSlug = subject.toLowerCase();
        const subjectCode = subject === 'Mathematics' ? 'MATH' : (subject === 'Science' ? 'SCI' : 'ENG');
        const topics = getTopicsForClassAndSubject(classNum, subject);

        for (let paperNum = 1; paperNum <= 10; paperNum++) {
            const padPaper = String(paperNum).padStart(2, '0');
            const testId = `olympiad-class-${classNum}-${subjectSlug}-${padPaper}`;
            const diffDist = DIFFICULTY_DISTRIBUTIONS[paperNum];

            let title = `Class ${classNum} ${subject} Olympiad - Paper ${paperNum}`;
            let description = `Official-pattern Class ${classNum} ${subject} Olympiad Examination Paper #${paperNum}.`;

            if (subject === 'Mathematics') {
                title = `Class 11 Mathematics Olympiad (IOQM → RMO → INMO → IMO Pathway) - Paper ${padPaper}`;
                description = `Official Class 11 Mathematics Olympiad Paper #${padPaper}. Calibrated to India’s national selection pathway: IOQM → RMO → INMO → IMO. Covers Number Theory, Combinatorics, Geometry & Olympiad Algebra.`;
            } else if (subject === 'Science') {
                title = `Class 11 Science Olympiad (NSEP Physics • NSEC Chemistry • NSEB Biology) - Paper ${padPaper}`;
                description = `Official Class 11 Science Olympiad Paper #${padPaper}. Aligned with the official Indian national selection pathway for representing India globally: Physics (NSEP → INPhO), Chemistry (NSEC → INChO), and Biology (NSEB → INBO).`;
            } else if (subject === 'English') {
                title = `Class 11 English Olympiad (IEO / Senior International Standard) - Paper ${padPaper}`;
                description = `Official Class 11 English Olympiad Paper #${padPaper}. Advanced rhetorical structures, critical reading, discourse analysis and lexicon.`;
            }

            console.log(`\n📝 Processing Test: ${testId} - "${title}"`);

            // 1. Delete previous questions associated with this testId
            const deleteResult = await db.collection('questionBank').deleteMany({ testId });
            console.log(`   - Removed ${deleteResult.deletedCount} old questions from questionBank`);

            // 2. Generate 50 new authentic Olympiad questions
            const count = config.questionsCount;
            const easyTarget = Math.round(count * (diffDist.easyPct / 100));
            const modTarget = Math.round(count * (diffDist.modPct / 100));

            const paperQuestions = [];
            for (let i = 0; i < count; i++) {
                let difficulty = 'Moderate';
                if (i < easyTarget) difficulty = 'Easy';
                else if (i < easyTarget + modTarget) difficulty = 'Moderate';
                else difficulty = 'Difficult';

                const topic = topics[i % topics.length] || `${subject} Olympiad Principles`;

                const qDoc = createOlympiadQuestion({
                    classNum,
                    subject,
                    paperNum,
                    qIndex: i,
                    topic,
                    difficulty
                });

                const padIndex = String(i + 1).padStart(3, '0');
                const subjShort = subject === 'Mathematics' ? 'MAT' : (subject === 'Science' ? 'SCI' : 'ENG');
                qDoc.testId = testId;
                qDoc.usedInTests = [testId];
                qDoc.commercialId = `OLY-CL${classNum}-${subjShort}-P${padPaper}-Q${padIndex}`;
                qDoc.createdAt = new Date();
                qDoc.updatedAt = new Date();

                paperQuestions.push(qDoc);
            }

            // 3. Insert new questions into questionBank
            const insertResult = await db.collection('questionBank').insertMany(paperQuestions);
            const actualObjectIds = Object.values(insertResult.insertedIds);
            totalQuestionsInserted += actualObjectIds.length;
            console.log(`   - Inserted ${actualObjectIds.length} new authentic questions into questionBank`);

            // 4. Update testPapers collection document
            await db.collection('testPapers').updateOne(
                { testId },
                {
                    $set: {
                        title,
                        shortTitle: `Class ${classNum} ${subjectCode} - P${padPaper}`,
                        subject,
                        subjectSlug,
                        classGrade: String(classNum),
                        studentClass: classNum,
                        paperNumber: paperNum,
                        paperCode: `OLY-CL${classNum}-${subjectCode}-P${padPaper}`,
                        exam: 'olympiad',
                        examType: 'Olympiad',
                        category: 'olympiad',
                        type: 'MOCK',
                        duration: config.duration,
                        totalMarks: count * config.marksPerQuestion,
                        questionsCount: count,
                        marksPerQuestion: config.marksPerQuestion,
                        negativeMarks: 0,
                        difficulty: paperNum <= 3 ? 'Easy' : (paperNum <= 7 ? 'Moderate' : 'Difficult'),
                        difficultyDistribution: diffDist,
                        topics,
                        description,
                        questions: actualObjectIds,
                        status: 'PUBLISHED',
                        isOlympiad: true,
                        updatedAt: new Date()
                    }
                },
                { upsert: true }
            );

            console.log(`   ✓ Test paper updated with ${actualObjectIds.length} mapped ObjectIds`);
            totalUpdatedTests++;
        }
    }

    console.log('\n======================================================');
    console.log(`🎉 Class 11 Olympiad Pathway Seeding Complete!`);
    console.log(`   Total Tests Updated: ${totalUpdatedTests} / 30`);
    console.log(`   Total Questions Seeded: ${totalQuestionsInserted}`);
    console.log('======================================================\n');

    await client.close();
}

run().catch(err => {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
});

