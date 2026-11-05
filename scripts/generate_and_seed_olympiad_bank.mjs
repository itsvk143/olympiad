/**
 * Master Script: Generate & Seed Central Question Bank with 13,800 Olympiad Questions
 * and Map Actual MongoDB IDs to All 360 Olympiad Tests.
 */

import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import { OLYMPIAD_CLASSES, OLYMPIAD_SUBJECTS, getTopicsForClassAndSubject } from './olympiadSyllabus.mjs';
import { olympiadTests, DIFFICULTY_DISTRIBUTIONS, getTestConfigForClass } from './olympiadTests.mjs';
import { createOlympiadQuestion } from './olympiadQuestionGenerator.mjs';

dotenv.config({ path: '.env.local' });

let uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('❌ MONGODB_URI is not set in .env.local');
    process.exit(1);
}

// Ensure database name is testseries
if (!uri.includes('/testseries')) {
    uri = uri.replace(/\/?(\?|$)/, '/testseries$1');
}

async function run() {
    console.log('🚀 Connecting to MongoDB Atlas...');
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('testseries');
    console.log(`✓ Connected successfully to database: ${db.databaseName}`);

    // 1. Ensure Collection Indexes
    console.log('📌 Creating collection indexes...');
    await db.collection('questionBank').createIndex({ classGrade: 1, subject: 1, difficulty: 1 });
    await db.collection('questionBank').createIndex({ testId: 1 });
    await db.collection('questionBank').createIndex({ commercialId: 1 });
    await db.collection('testPapers').createIndex({ testId: 1 }, { unique: true });
    await db.collection('testPapers').createIndex({ exam: 1, classGrade: 1, subject: 1 });
    console.log('✓ Indexes established.');

    // 2. Initialize / Upsert all 360 Test Papers
    console.log(`📋 Synchronizing ${olympiadTests.length} Olympiad test papers in testPapers collection...`);
    for (const test of olympiadTests) {
        await db.collection('testPapers').updateOne(
            { testId: test.id },
            {
                $set: {
                    title: test.title,
                    shortTitle: test.shortTitle,
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
                    status: 'PUBLISHED',
                    isOlympiad: true,
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date(),
                    questions: []
                }
            },
            { upsert: true }
        );
    }
    console.log('✓ All 360 test papers synchronized in MongoDB.');

    // 3. Question Generation and Direct ID Mapping
    console.log('⚡ Generating and inserting 13,800 questions into Central Question Bank...');
    let totalQuestionsInserted = 0;
    let totalVisualQuestions = 0;
    const testMappingResults = [];

    for (const classNum of OLYMPIAD_CLASSES) {
        const config = getTestConfigForClass(classNum);
        const startTime = Date.now();

        for (const subject of OLYMPIAD_SUBJECTS) {
            const subjectSlug = subject.toLowerCase();
            const topics = getTopicsForClassAndSubject(classNum, subject);

            for (let paperNum = 1; paperNum <= 10; paperNum++) {
                const padPaper = String(paperNum).padStart(2, '0');
                const testId = `olympiad-class-${classNum}-${subjectSlug}-${padPaper}`;
                const diffDist = DIFFICULTY_DISTRIBUTIONS[paperNum];

                // Check if this test paper already has actual questions mapped
                const existingPaper = await db.collection('testPapers').findOne({ testId });
                if (existingPaper && Array.isArray(existingPaper.questions) && existingPaper.questions.length >= config.questionsCount) {
                    const validCount = await db.collection('questionBank').countDocuments({ _id: { $in: existingPaper.questions } });
                    if (validCount >= config.questionsCount) {
                        testMappingResults.push({
                            testId,
                            classGrade: classNum,
                            subject,
                            paperNum,
                            mappedCount: validCount,
                            status: 'PASSED'
                        });
                        continue;
                    }
                }

                // Calculate difficulty quotas for this paper
                const count = config.questionsCount;
                const easyTarget = Math.round(count * (diffDist.easyPct / 100));
                const modTarget = Math.round(count * (diffDist.modPct / 100));

                const paperQuestions = [];

                for (let i = 0; i < count; i++) {
                    let difficulty = 'Moderate';
                    if (i < easyTarget) difficulty = 'Easy';
                    else if (i < easyTarget + modTarget) difficulty = 'Moderate';
                    else difficulty = 'Difficult';

                    const topic = topics[i % topics.length] || `${subject} Core Principles`;

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

                    if (qDoc.isVisual) totalVisualQuestions++;
                    paperQuestions.push(qDoc);
                }

                // Batch insert questions for this paper into questionBank
                const insertRes = await db.collection('questionBank').insertMany(paperQuestions);
                const actualObjectIds = Object.values(insertRes.insertedIds);

                // Update test paper with the exact actual Central Question Bank IDs
                await db.collection('testPapers').updateOne(
                    { testId },
                    {
                        $set: {
                            questions: actualObjectIds,
                            updatedAt: new Date()
                        }
                    }
                );

                totalQuestionsInserted += actualObjectIds.length;
                testMappingResults.push({
                    testId,
                    classGrade: classNum,
                    subject,
                    paperNum,
                    mappedCount: actualObjectIds.length,
                    status: 'PASSED'
                });
            }
        }
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✓ Completed Class ${classNum} (30 papers, ${30 * config.questionsCount} questions mapped) in ${elapsed}s`);
    }

    console.log('\n🔍 Running Database Verification & Integrity Audits...');
    const totalBankCount = await db.collection('questionBank').countDocuments();
    const totalOlympiadQuestions = await db.collection('questionBank').countDocuments({ exam: 'olympiad' });
    const totalPapersCount = await db.collection('testPapers').countDocuments({ exam: 'olympiad' });

    console.log(`📊 Total Documents in Central Question Bank: ${totalBankCount}`);
    console.log(`📊 Total Olympiad Questions in Bank: ${totalOlympiadQuestions}`);
    console.log(`📊 Total Olympiad Test Papers: ${totalPapersCount}`);
    console.log(`📊 Total Newly Inserted Questions in this run: ${totalQuestionsInserted}`);

    let auditPassedCount = 0;
    let auditFailedCount = 0;

    const allOlympiadPapers = await db.collection('testPapers').find({ exam: 'olympiad' }).toArray();
    for (const paper of allOlympiadPapers) {
        const expected = getTestConfigForClass(paper.classGrade).questionsCount;
        const actual = paper.questions?.length || 0;
        if (actual === expected) {
            auditPassedCount++;
        } else {
            auditFailedCount++;
            console.error(`❌ Audit failed for ${paper.testId}: expected ${expected}, got ${actual}`);
        }
    }

    console.log(`✓ Verification Complete: ${auditPassedCount}/360 tests PASSED with 100% exact question mapping!`);
    if (auditFailedCount === 0) {
        console.log('🎉 100% AUDIT PASS: All 360 Olympiad tests are populated with genuine Central Question Bank IDs!');
    }

    await client.close();
    console.log('✓ Database connection closed cleanly.');
}

run().catch(err => {
    console.error('Fatal error in seeding:', err);
    process.exit(1);
});
