import { promises as fs } from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { auth } from '@/lib/auth';
import { getTestById, getQuestionsForTest } from '@/data/testService';
import { formatQuestionToLegacy, formatQuestionToCentralized } from '@/lib/questionFormatter';
import { balanceTestQuestions, toValidObjectId } from '@/lib/testQuestionBalancer';
import { checkTestAccess } from '@/lib/authorization';
import { getCanonicalChapter } from '@/lib/chapterMapping';

const getFilePath = (testId) => {
    let folderName = 'questions'; // Default fallback

    if (!testId) {
        folderName = 'questionsneet';
    } else if (testId.startsWith('neet')) {
        folderName = 'questionsneet';
    } else if (testId.startsWith('jee-mains')) {
        folderName = 'questionsjeem';
    } else if (testId.startsWith('jee-advance')) {
        folderName = 'questionsjeea';
    } else if (testId.startsWith('board12')) {
        folderName = 'questionsboard12';
    }

    const baseDir = path.join(process.cwd(), 'src/data', folderName);

    // Default fallback if logic fails
    if (!testId) return path.join(baseDir, 'mock.json');

    if (testId.includes('MOCK')) return path.join(baseDir, 'mock.json');
    if (testId.includes('PYQ')) return path.join(baseDir, 'pyq.json');

    const subject = testId.toLowerCase().includes('physics') ? 'physics' :
        testId.toLowerCase().includes('chemistry') ? 'chemistry' :
            testId.toLowerCase().includes('biology') ? 'biology' :
                testId.toLowerCase().includes('mathematics') ? 'mathematics' : null;

    if (testId.includes('SUBJECT') && subject) {
        return path.join(baseDir, `subject_${subject}.json`);
    }

    if (testId.includes('CHAPTER') && subject) {
        return path.join(baseDir, `chapter_${subject}.json`);
    }

    if (testId.includes('SUBTOPIC') && subject) {
        return path.join(baseDir, `subtopic_${subject}.json`);
    }

    // Fallback for any other case
    return path.join(baseDir, 'mock.json');
};

async function getQuestionsFallback(testId) {
    try {
        const filePath = getFilePath(testId);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or is invalid, return empty object
        return {};
    }
}

// Ensure the local JSON/generator questions or questionBank questions are copied to DB on access
async function ensureDbHasTest(testId, db) {
    if (!testId || testId === 'global') return;
    let testPaper = await db.collection('testPapers').findOne({ testId });
    
    // If test exists and already has populated questions, keep title updated and return
    if (testPaper && testPaper.questions && testPaper.questions.length > 0) {
        const staticTest = getTestById(testId);
        if (staticTest?.title && testPaper.title !== staticTest.title) {
            await db.collection('testPapers').updateOne(
                { _id: testPaper._id },
                { $set: { title: staticTest.title, updatedAt: new Date() } }
            );
        }
        return;
    }

    const staticTest = getTestById(testId);
    const fallbackQuestions = await getQuestionsFallback(testId);
    let fbQs = fallbackQuestions[testId] || [];
    if (fbQs.length === 0) {
        fbQs = getQuestionsForTest(testId) || [];
    }
    
    const testChapter = staticTest?.chapter || '';
    let questionIds = [];

    // If static questions exist, map them
    if (fbQs.length > 0) {
        for (const q of fbQs) {
            const centralQ = formatQuestionToCentralized(q);
            if ((!centralQ.chapter || centralQ.chapter === '') && testChapter) {
                centralQ.chapter = testChapter;
                centralQ.topic = testChapter;
            }
            if (testId.includes('SUBTOPIC') && staticTest?.title) {
                centralQ.subTopic = staticTest.title;
            }

            let existingQ = await db.collection('questionBank').findOne({
                subject: centralQ.subject,
                question: centralQ.question
            });
            if (existingQ) {
                questionIds.push(existingQ._id);
            } else {
                const res = await db.collection('questionBank').insertOne(centralQ);
                questionIds.push(res.insertedId);
            }
        }
    } else if (testId.startsWith('bitsat-MOCK-') || testId.toUpperCase().includes('MATH-FULL')) {
        // BITSAT Full Mock Test (Mathematics Mode): Physics 30, Chemistry 30, English Proficiency 10, Logical Reasoning 20, Mathematics 40 = 130 questions
        const mockNum = parseInt(testId.replace(/\D/g, '') || '1', 10);
        const subjectQuotas = [
            { subject: 'Physics', count: 30 },
            { subject: 'Chemistry', count: 30 },
            { subject: 'English Proficiency', count: 10 },
            { subject: 'Logical Reasoning', count: 20 },
            { subject: 'Mathematics', count: 40 }
        ];

        for (const { subject: sName, count: sCount } of subjectQuotas) {
            const skipCount = ((mockNum - 1) * sCount);
            let sQs = await db.collection('questionBank')
                .find({ subject: sName })
                .sort({ usedInTests: 1, _id: 1 })
                .skip(skipCount)
                .limit(sCount)
                .toArray();

            if (sQs.length < sCount) {
                const needed = sCount - sQs.length;
                const existingIds = sQs.map(q => q._id);
                const extra = await db.collection('questionBank')
                    .find({ subject: sName, _id: { $nin: existingIds } })
                    .limit(needed)
                    .toArray();
                sQs = [...sQs, ...extra];
            }
            questionIds.push(...sQs.map(q => q._id));
        }
    } else if (testId.toLowerCase().includes('bio-full') || testId.toLowerCase().includes('bio-mock')) {
        // BITSAT Full Mock Test (Biology Mode): Physics 30, Chemistry 30, English Proficiency 10, Logical Reasoning 20, Biology 40 = 130 questions
        const mockNum = parseInt(testId.replace(/\D/g, '') || '1', 10);
        const subjectQuotas = [
            { subject: 'Physics', count: 30 },
            { subject: 'Chemistry', count: 30 },
            { subject: 'English Proficiency', count: 10 },
            { subject: 'Logical Reasoning', count: 20 },
            { subject: 'Biology', count: 40 }
        ];

        for (const { subject: sName, count: sCount } of subjectQuotas) {
            const skipCount = ((mockNum - 1) * sCount);
            let sQs = await db.collection('questionBank')
                .find({ subject: sName })
                .sort({ usedInTests: 1, _id: 1 })
                .skip(skipCount)
                .limit(sCount)
                .toArray();

            if (sQs.length < sCount) {
                const needed = sCount - sQs.length;
                const existingIds = sQs.map(q => q._id);
                const extra = await db.collection('questionBank')
                    .find({ subject: sName, _id: { $nin: existingIds } })
                    .limit(needed)
                    .toArray();
                sQs = [...sQs, ...extra];
            }
            questionIds.push(...sQs.map(q => q._id));
        }
    } else if (testId.includes('-PART-') || staticTest?.type === 'PART') {
        const isNeet = testId.startsWith('neet');
        const subjectsConfig = isNeet
            ? [
                { subject: 'Physics', count: 45 },
                { subject: 'Chemistry', count: 45 },
                { subject: 'Botany', count: 45 },
                { subject: 'Zoology', count: 45 }
              ]
            : [
                { subject: 'Physics', count: 25 },
                { subject: 'Chemistry', count: 25 },
                { subject: 'Mathematics', count: 25 }
              ];

        const partNum = parseInt(testId.replace(/\D/g, '') || '1', 10);

        for (const { subject: sName, count: sCount } of subjectsConfig) {
            const syllabusChapters = staticTest?.syllabus?.[sName] || [];
            const mappedChapters = syllabusChapters.map(ch => {
                const meta = getCanonicalChapter(sName, ch);
                return meta?.chapter || ch;
            }).filter(Boolean);
            const uniqueMapped = [...new Set(mappedChapters)];

            let sQs = [];

            // Zoology special priority for Neural Control and Coordination
            if (sName === 'Zoology' && syllabusChapters.some(c => /neural/i.test(c))) {
                const neuralRegex = /neural|neuron|cerebrum|cerebellum|synapse|reflex arc|action potential|nerve|nervous|axon|dendrite|myelin|neuro/i;
                const neuralQs = await db.collection('questionBank')
                    .find({
                        subject: 'Zoology',
                        chapter: 'Human Physiology',
                        $or: [
                            { topic: neuralRegex },
                            { question: neuralRegex }
                        ],
                        ...(isNeet ? { $nor: [{ questionType: { $regex: /numerical|numeric|integer/i } }, { type: { $regex: /numerical|numeric|integer/i } }] } : {})
                    })
                    .limit(sCount)
                    .toArray();
                sQs.push(...neuralQs);
            }

            // Draw proportionally across mapped chapters
            if (uniqueMapped.length > 0 && sQs.length < sCount) {
                const remainingNeeded = sCount - sQs.length;
                const perChap = Math.ceil(remainingNeeded / uniqueMapped.length);
                for (const chap of uniqueMapped) {
                    if (sQs.length >= sCount) break;
                    const target = Math.min(perChap, sCount - sQs.length);
                    const chQuery = {
                        subject: sName,
                        chapter: new RegExp(`^${chap.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
                        ...(isNeet ? { $nor: [{ questionType: { $regex: /numerical|numeric|integer/i } }, { type: { $regex: /numerical|numeric|integer/i } }] } : {}),
                        _id: { $nin: sQs.map(q => q._id) }
                    };
                    const totalInChap = await db.collection('questionBank').countDocuments(chQuery);
                    const skipOffset = totalInChap > target ? ((partNum - 1) * 7) % (totalInChap - target + 1) : 0;
                    const chapQs = await db.collection('questionBank')
                        .find(chQuery)
                        .sort({ usedInTests: 1, _id: 1 })
                        .skip(skipOffset)
                        .limit(target)
                        .toArray();
                    sQs.push(...chapQs);
                }
            }

            // If any slots remain, draw from all mapped chapters without skip
            if (uniqueMapped.length > 0 && sQs.length < sCount) {
                const existingIds = sQs.map(q => q._id);
                const moreFromMapped = await db.collection('questionBank')
                    .find({
                        subject: sName,
                        chapter: { $in: uniqueMapped.map(c => new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) },
                        _id: { $nin: existingIds },
                        ...(isNeet ? { $nor: [{ questionType: { $regex: /numerical|numeric|integer/i } }, { type: { $regex: /numerical|numeric|integer/i } }] } : {})
                    })
                    .sort({ usedInTests: 1, _id: 1 })
                    .limit(sCount - sQs.length)
                    .toArray();
                sQs.push(...moreFromMapped);
            }

            // Final fallback to entire subject only if syllabus chapters are completely exhausted
            if (sQs.length < sCount) {
                const existingIds = sQs.map(q => q._id);
                const extra = await db.collection('questionBank')
                    .find({
                        subject: sName,
                        _id: { $nin: existingIds },
                        ...(isNeet ? { $nor: [{ questionType: { $regex: /numerical|numeric|integer/i } }, { type: { $regex: /numerical|numeric|integer/i } }] } : {})
                    })
                    .limit(sCount - sQs.length)
                    .toArray();
                sQs.push(...extra);
            }

            questionIds.push(...sQs.map(q => q._id));
        }
    } else {
        // Dynamically resolve real questions from central questionBank!
        const rawSubject = staticTest?.subject || (testId.includes('Physics') ? 'Physics' : testId.includes('Chemistry') ? 'Chemistry' : testId.includes('Mathematics') ? 'Mathematics' : (testId.includes('English') ? 'English Proficiency' : (testId.includes('Reasoning') ? 'Logical Reasoning' : (testId.includes('Botany') ? 'Botany' : (testId.includes('Zoology') ? 'Zoology' : null)))));
        const isBitsatSubtopic = testId.startsWith('bitsat') && testId.includes('SUBTOPIC');
        const qCount = staticTest?.questionsCount || (isBitsatSubtopic ? 20 : (testId.includes('SUBTOPIC') ? 25 : (testId.includes('CHAPTER') ? 30 : (testId.includes('SUBJECT') ? 45 : 45))));

        let query = {};
        if (rawSubject) query.subject = rawSubject;

        // BITSAT strictly enforces Single-Correct MCQs (no Assertion-Reason, no Numerical)
        if (testId.startsWith('bitsat')) {
            query.$nor = [
                { questionType: { $regex: /assertion|ar|numerical/i } },
                { type: { $regex: /assertion|ar|numerical/i } }
            ];
        }

        const isNeet = testId.startsWith('neet');
        // NEET strictly enforces Multiple Choice Questions with options (NO Numerical questions permitted)
        if (isNeet) {
            query.$nor = [
                { questionType: { $regex: /numerical|numeric|integer/i } },
                { type: { $regex: /numerical|numeric|integer/i } },
                { options: { $size: 0 } },
                { options: null },
                { options: { $exists: false } }
            ];
            query['options.1'] = { $exists: true };
        }

        if (testId.includes('SUBTOPIC') && (staticTest?.title || staticTest?.chapter)) {
            const subTitle = staticTest?.title || '';
            const cleanSub = subTitle.replace(/[-_]/g, ' ').trim();
            const chapName = (staticTest?.chapter || '').replace(/[-_]/g, ' ').trim();

            // Scope strictly to chapter to prevent cross-chapter question contamination
            if (chapName) {
                const escapedChap = chapName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                    .replace(/\b(in|of)\b/gi, '(in|of)')
                    .replace(/(&|\band\b)/gi, '(&|and)');
                query.chapter = { $regex: new RegExp(`^${escapedChap}$`, 'i') };
            }

            if (cleanSub) {
                const subRegex = new RegExp(cleanSub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                query.$or = [
                    { subTopic: { $regex: subRegex } },
                    { subtopic: { $regex: subRegex } }
                ];
            }
        } else if (testId.includes('CHAPTER') && (staticTest?.chapter || staticTest?.title)) {
            const rawChap = (staticTest.chapter || staticTest.title).replace(/[-_]/g, ' ').trim();
            const chapMeta = getCanonicalChapter(rawSubject, rawChap);
            if (chapMeta && chapMeta.chapter) {
                query.chapter = chapMeta.chapter;
                if (chapMeta.subject) query.subject = chapMeta.subject;
            } else {
                const escapedChap = rawChap.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                    .replace(/\b(in|of)\b/gi, '(in|of)')
                    .replace(/(&|\band\b)/gi, '(&|and)');
                query.chapter = { $regex: new RegExp(`^${escapedChap}$`, 'i') };
            }
        } else if (testId.includes('SUBJECT') && staticTest?.chapters && staticTest.chapters.length > 0) {
            query.chapter = { $in: staticTest.chapters.map(c => new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')) };
        }

        let matched = [];
        const isChapter = testId.includes('CHAPTER');

        if (isChapter) {
            // Assign exactly 5 Easy and remaining Difficult questions from Question Bank
            const easyTarget = Math.min(5, qCount);
            const hardTarget = qCount - easyTarget;

            let easyQs = await db.collection('questionBank')
                .find({ ...query, difficulty: { $regex: /^easy$/i } })
                .limit(easyTarget)
                .toArray();

            let hardQs = await db.collection('questionBank')
                .find({ ...query, difficulty: { $regex: /difficult|hard/i } })
                .limit(hardTarget)
                .toArray();

            const takenIds = new Set([...easyQs.map(q => q._id.toString()), ...hardQs.map(q => q._id.toString())]);

            // Top up Easy quota from Medium if < 5 Easy available
            if (easyQs.length < easyTarget) {
                const needed = easyTarget - easyQs.length;
                const topUpEasy = await db.collection('questionBank')
                    .find({ ...query, _id: { $nin: Array.from(takenIds).map(id => new ObjectId(id)) }, difficulty: { $regex: /medium|moderate/i } })
                    .limit(needed)
                    .toArray();
                for (const q of topUpEasy) {
                    takenIds.add(q._id.toString());
                    easyQs.push(q);
                }
            }

            // Top up Difficult quota from Medium if < targetDifficult available
            if (hardQs.length < hardTarget) {
                const needed = hardTarget - hardQs.length;
                const topUpDiff = await db.collection('questionBank')
                    .find({ ...query, _id: { $nin: Array.from(takenIds).map(id => new ObjectId(id)) }, difficulty: { $regex: /medium|moderate/i } })
                    .limit(needed)
                    .toArray();
                for (const q of topUpDiff) {
                    takenIds.add(q._id.toString());
                    hardQs.push(q);
                }
            }

            // If still short, top up from ANY available question in the chapter
            if (takenIds.size < qCount) {
                const needed = qCount - takenIds.size;
                const topUpAny = await db.collection('questionBank')
                    .find({ ...query, _id: { $nin: Array.from(takenIds).map(id => new ObjectId(id)) } })
                    .limit(needed)
                    .toArray();
                for (const q of topUpAny) {
                    takenIds.add(q._id.toString());
                    hardQs.push(q);
                }
            }

            // Fallback enrichment if chapter had fewer questions
            const rawChap = (staticTest?.chapter || staticTest?.title || '').replace(/[-_]/g, ' ').trim();
            const chapMeta = getCanonicalChapter(rawSubject, rawChap);
            if (takenIds.size < qCount && chapMeta?.fallbackChapter) {
                const fbQuery = {
                    chapter: chapMeta.fallbackChapter,
                    ...(chapMeta.fallbackSubject ? { subject: chapMeta.fallbackSubject } : {})
                };
                const extra = await db.collection('questionBank')
                    .find({ ...fbQuery, _id: { $nin: Array.from(takenIds).map(id => new ObjectId(id)) } })
                    .limit(qCount - takenIds.size)
                    .toArray();
                matched = [...easyQs, ...hardQs, ...extra];
            } else {
                matched = [...easyQs, ...hardQs];
            }
        } else if (isBitsatSubtopic) {
            // Balanced difficulty for BITSAT: for 20 Qs => 5 Easy, 11 Moderate, 4 Difficult
            const easyTarget = Math.round(qCount * 0.25);
            const hardTarget = Math.round(qCount * 0.20);
            const modTarget = qCount - easyTarget - hardTarget;

            const easyQs = await db.collection('questionBank')
                .find({ ...query, difficulty: { $regex: /^easy$/i } })
                .limit(easyTarget)
                .toArray();

            const hardQs = await db.collection('questionBank')
                .find({ ...query, difficulty: { $regex: /hard|difficult/i } })
                .limit(hardTarget)
                .toArray();

            const takenIds = [...easyQs, ...hardQs].map(q => q._id);
            const modQs = await db.collection('questionBank')
                .find({ ...query, _id: { $nin: takenIds }, difficulty: { $not: { $regex: /easy|hard|difficult/i } } })
                .limit(modTarget)
                .toArray();

            matched = [...easyQs, ...modQs, ...hardQs];

            // If strict difficulty quotas didn't fill all slots, top up from the subtopic
            if (matched.length < qCount) {
                const fillIds = matched.map(q => q._id);
                const extra = await db.collection('questionBank')
                    .find({ ...query, _id: { $nin: fillIds } })
                    .limit(qCount - matched.length)
                    .toArray();
                matched = [...matched, ...extra];
            }
        } else {
            matched = await db.collection('questionBank')
                .find({ ...query, difficulty: { $ne: 'Easy' } })
                .sort({ difficulty: -1, _id: -1 })
                .limit(qCount)
                .toArray();
        }

        // Broaden to chapter / subject if subtopic matched zero
        if (matched.length === 0 && rawSubject) {
            const fallbackQuery = { subject: rawSubject };
            const chapName = (staticTest?.chapter || staticTest?.title || '').replace(/[-_]/g, ' ').trim();
            if ((testId.includes('SUBTOPIC') || testId.includes('CHAPTER')) && chapName) {
                const escapedChap = chapName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                    .replace(/\b(in|of)\b/gi, '(in|of)')
                    .replace(/(&|\band\b)/gi, '(&|and)');
                fallbackQuery.chapter = { $regex: new RegExp(`^${escapedChap}$`, 'i') };
            }
            if (isNeet) {
                fallbackQuery.$nor = [
                    { questionType: { $regex: /numerical|numeric|integer/i } },
                    { type: { $regex: /numerical|numeric|integer/i } },
                    { options: { $size: 0 } },
                    { options: null },
                    { options: { $exists: false } }
                ];
                fallbackQuery['options.1'] = { $exists: true };
            }
            matched = await db.collection('questionBank')
                .find({ ...fallbackQuery, ...(testId.startsWith('bitsat') ? { $nor: [{ questionType: { $regex: /assertion|ar|numerical/i } }, { type: { $regex: /assertion|ar|numerical/i } }] } : {}) })
                .limit(qCount)
                .toArray();
        }


        questionIds = matched.map(q => q._id);

        // Update usedInTests tracking
        if (questionIds.length > 0) {
            await db.collection('questionBank').updateMany(
                { _id: { $in: questionIds } },
                { $addToSet: { usedInTests: testId } }
            );
        }
    }

    const exam = testId.startsWith('neet') ? 'NEET' : testId.startsWith('jee-mains') ? 'JEE Main' : testId.startsWith('jee-advance') ? 'JEE Advanced' : (testId.startsWith('bitsat') ? 'BITSAT' : 'Other');
    if (questionIds.length > 0) {
        const loadedQs = await db.collection('questionBank').find({ _id: { $in: questionIds } }).toArray();
        const loadedMap = new Map(loadedQs.map(q => [q._id.toString(), q]));
        const orderedQs = questionIds.map(id => loadedMap.get(id.toString())).filter(Boolean);
        const { balancedQuestions } = await balanceTestQuestions(orderedQs, db, testId, exam);
        questionIds = balancedQuestions.map(q => q._id).filter(Boolean);
    }
    const subject = staticTest?.subject || (testId.includes('Physics') ? 'Physics' : testId.includes('Chemistry') ? 'Chemistry' : testId.includes('Mathematics') ? 'Mathematics' : (testId.includes('English') ? 'English Proficiency' : (testId.includes('Reasoning') ? 'Logical Reasoning' : (testId.includes('Botany') ? 'Botany' : (testId.includes('Zoology') ? 'Zoology' : 'Mixed')))));
    const title = staticTest?.title || testId.replace(/-/g, ' ');
    const isBitsatSub = testId.startsWith('bitsat') && testId.includes('SUBTOPIC');
    const duration = staticTest?.duration || (isBitsatSub ? 30 : (testId.includes('SUBJECT') || testId.includes('CHAPTER') || testId.includes('SUBTOPIC') ? 60 : 180));
    const totalMarks = staticTest?.totalMarks || (exam === 'BITSAT' ? (isBitsatSub ? 60 : (duration === 60 ? 90 : 390)) : (exam === 'NEET' ? (duration === 60 ? 180 : 720) : (duration === 60 ? 100 : 300)));
    
    if (testPaper) {
        const updateDoc = { updatedAt: new Date() };
        if (questionIds.length > 0) updateDoc.questions = questionIds;
        if (title) updateDoc.title = title;
        if (duration) updateDoc.duration = duration;
        if (totalMarks) updateDoc.totalMarks = totalMarks;
        await db.collection('testPapers').updateOne(
            { _id: testPaper._id },
            { $set: updateDoc }
        );
    } else {
        await db.collection('testPapers').insertOne({
            testId,
            title,
            exam,
            subject,
            duration,
            totalMarks,
            questions: questionIds,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');

    try {
        const client = await clientPromise;
        const db = client.db();

        if (testId && testId !== 'global') {
            const session = await auth();
            const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
            const isUserAdmin = session?.user?.role === 'admin' ||
                session?.user?.isAdmin === true ||
                (session?.user?.email && adminEmails.includes(session.user.email.toLowerCase()));

            if (!isUserAdmin) {
                if (!session?.user?.email) {
                    return Response.json({
                        error: 'UNAUTHENTICATED',
                        message: 'Authentication required to access test papers.'
                    }, { status: 401 });
                }

                const user = await db.collection('users').findOne({
                    email: { $regex: new RegExp(`^${session.user.email}$`, 'i') }
                });

                const access = checkTestAccess(user, testId);
                if (!access.allowed && !access.authorized) {
                    return Response.json({
                        error: access.reason || 'ACCESS_DENIED',
                        message: access.message || 'Access denied to this test.'
                    }, { status: 403 });
                }
            }

            // Lazily ensure the test is initialized in the DB if not already
            await ensureDbHasTest(testId, db);
 
            const query = (ObjectId.isValid(testId) && testId.length === 24)
                ? { $or: [{ testId }, { _id: new ObjectId(testId) }] }
                : { testId };
            const testPaper = await db.collection('testPapers').findOne(query);

            if (testPaper && testPaper.questions && testPaper.questions.length > 0) {
                const objectIds = [];
                const stringIds = [];

                for (const item of testPaper.questions) {
                    if (!item) continue;
                    if (typeof item === 'string') {
                        stringIds.push(item);
                        if (ObjectId.isValid(item) && item.length === 24) {
                            try { objectIds.push(new ObjectId(item)); } catch (e) {}
                        }
                    } else if (item._bsontype === 'ObjectID' || item instanceof ObjectId) {
                        objectIds.push(item);
                        stringIds.push(item.toString());
                    } else if (typeof item === 'object') {
                        const rawId = item.questionId || item._id || item.id;
                        if (rawId) {
                            stringIds.push(rawId.toString());
                            if (ObjectId.isValid(rawId)) {
                                try {
                                    objectIds.push(typeof rawId === 'string' && rawId.length === 24 ? new ObjectId(rawId) : rawId);
                                } catch (e) {}
                            }
                        }
                    }
                }

                const idFilters = [];
                if (objectIds.length > 0) idFilters.push({ _id: { $in: objectIds } });
                if (stringIds.length > 0) idFilters.push({ _id: { $in: stringIds } });

                let dbQuestions = [];
                if (idFilters.length > 0) {
                    dbQuestions = await db.collection('questionBank')
                        .find(idFilters.length === 1 ? idFilters[0] : { $or: idFilters })
                        .toArray();
                }

                // Map DB questions by string _id
                const questionsMap = new Map();
                for (const q of dbQuestions) {
                    if (q && q._id) {
                        questionsMap.set(q._id.toString(), q);
                    }
                }

                // Map and sort questions to maintain original order
                let orderedQuestions = testPaper.questions
                    .map((item, index) => {
                        let q = null;
                        if (typeof item === 'string' || item._bsontype === 'ObjectID' || item instanceof ObjectId) {
                            q = questionsMap.get(item.toString());
                        } else if (typeof item === 'object') {
                            const rawId = item.questionId || item._id || item.id;
                            if (rawId) {
                                q = questionsMap.get(rawId.toString());
                            }
                            if (!q && (item.question || item.text || item.questionText)) {
                                q = item;
                            }
                        }
                        if (!q) return null;
                        const qText = q.question || q.questionText || q.text;
                        if (!qText || qText.trim() === '') return null;
                        return formatQuestionToLegacy(q, index + 1);
                    })
                    .filter(Boolean);

                // For SUBTOPIC or CHAPTER tests, ensure loaded questions belong to the matching chapter and subject to prevent leakage
                if (testId.includes('SUBTOPIC') || testId.includes('CHAPTER')) {
                    const staticTest = getTestById(testId);
                    const chapName = (staticTest?.chapter || staticTest?.title || testPaper.chapter || testPaper.title || '').trim();
                    const subName = (staticTest?.subject || testPaper.subject || '').trim().toLowerCase();
                    if (chapName) {
                        const canonicalInfo = getCanonicalChapter(staticTest?.subject || testPaper.subject, chapName);
                        const canonicalChapter = (canonicalInfo?.chapter || chapName).toLowerCase().replace(/\b(in|of)\b/g, ' ').replace(/\s+/g, ' ').trim();
                        const normTarget = chapName.toLowerCase().replace(/\b(in|of)\b/g, ' ').replace(/\s+/g, ' ').trim();

                        const filtered = orderedQuestions.filter(q => {
                            if (subName && q.subject) {
                                const qSub = q.subject.trim().toLowerCase();
                                if (qSub !== subName && !(subName === 'botany' && qSub === 'zoology') && !(subName === 'zoology' && qSub === 'botany')) return false;
                            }
                            const qChap = (q.chapter || '').toLowerCase().replace(/\b(in|of)\b/g, ' ').replace(/\s+/g, ' ').trim();
                            if (!qChap) return true;
                            return qChap === normTarget || qChap.includes(normTarget) || normTarget.includes(qChap) ||
                                   qChap === canonicalChapter || qChap.includes(canonicalChapter) || canonicalChapter.includes(qChap);
                        });

                        // Keep original orderedQuestions if filtering would empty out valid assigned questions
                        if (filtered.length > 0) {
                            orderedQuestions = filtered;
                        }
                    }
                }

                if (orderedQuestions.length > 0) {
                    // Enforce exam-specific Assertion-Reasoning quotas and placement
                    const examName = testPaper.exam || (testId.startsWith('neet') ? 'NEET' : testId.startsWith('jee-mains') ? 'JEE Main' : testId.startsWith('jee-advance') ? 'JEE Advanced' : 'Other');
                    const { balancedQuestions, wasModified } = await balanceTestQuestions(orderedQuestions, db, testId, examName);
                    const finalQuestions = balancedQuestions.map((q, index) => ({ ...q, id: index + 1 }));

                    const needsIdMigration = testPaper.questions.some(item => typeof item === 'string' || (typeof item === 'object' && !(item._bsontype === 'ObjectID' || item instanceof ObjectId)));

                    if (wasModified || needsIdMigration) {
                        const newIds = finalQuestions
                            .map(q => toValidObjectId(q._id) || toValidObjectId(q.id) || q._id)
                            .filter(Boolean);
                        if (newIds.length > 0) {
                            db.collection('testPapers').updateOne(
                                { _id: testPaper._id },
                                { $set: { questions: newIds, updatedAt: new Date() } }
                            ).catch(err => console.error('Error auto-syncing balanced questions to testPaper:', err));
                        }
                    }

                    return Response.json(finalQuestions);
                }
            }

            // Fallback to static test questions or local JSON if DB paper had 0 resolved questions
            const staticTest = getTestById(testId);
            const fallbackQuestions = await getQuestionsFallback(testId);
            let fbQs = fallbackQuestions[testId] || [];
            if (fbQs.length === 0) {
                fbQs = getQuestionsForTest(testId) || [];
            }
            if (fbQs.length > 0) {
                return Response.json(fbQs);
            }

            return Response.json([]);
        }
 
        // Behavior when testId is not present or testId === 'global'
        // This dumps the ENTIRE question bank with correct answers — admin only!
        const globalSession = await auth();
        const globalAdminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        const isGlobalAdmin = globalSession?.user?.role === 'admin' ||
            globalSession?.user?.isAdmin === true ||
            (globalSession?.user?.email && globalAdminEmails.includes(globalSession.user.email.toLowerCase()));

        if (!isGlobalAdmin) {
            return Response.json({
                error: 'UNAUTHORIZED',
                message: 'Admin access required to view the question bank.'
            }, { status: 403 });
        }

        // Fetch all questions from the question bank with optional filters
        const filter = {};
        const subject = searchParams.get('subject');
        const chapter = searchParams.get('chapter');
        const subtopic = searchParams.get('subtopic');
        const type = searchParams.get('type');
        const limitParam = parseInt(searchParams.get('limit') || '3000', 10);

        if (subject && subject !== 'ALL') filter.subject = subject;
        if (chapter && chapter !== 'ALL') {
            if (chapter === '__empty__') {
                // Special case: fetch questions with no chapter assigned
                filter.chapter = { $in: ['', null] };
            } else {
                const escaped = chapter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                    .replace(/\b(in|of)\b/gi, '(in|of)')
                    .replace(/(&|\band\b)/gi, '(&|and)');
                filter.chapter = { $regex: new RegExp(`^${escaped}$`, 'i') };
            }
        }

        if (subtopic && subtopic !== 'ALL') {
            filter.$and = filter.$and || [];
            if (subtopic === '__empty__' || subtopic === '__uncategorized__') {
                filter.$and.push({
                    $or: [
                        { subTopic: { $in: ['', null] } },
                        { subtopic: { $in: ['', null] } }
                    ]
                });
            } else {
                filter.$and.push({
                    $or: [
                        { subTopic: subtopic },
                        { subtopic: subtopic }
                    ]
                });
            }
        }

        if (type && type !== 'ALL') {
            filter.$and = filter.$and || [];
            if (type === 'ASSERTION_REASON' || type.includes('ASSERTION')) {
                filter.$and.push({
                    $or: [
                        { questionType: { $regex: /assertion/i } },
                        { type: { $regex: /assertion/i } }
                    ]
                });
            } else if (type === 'NUMERICAL') {
                filter.$and.push({
                    $or: [
                        { questionType: { $regex: /numeric/i } },
                        { type: { $regex: /numeric/i } }
                    ]
                });
            } else if (type === 'MCQ') {
                filter.$and.push({
                    questionType: { $not: { $regex: /assertion|numeric/i } },
                    type: { $not: { $regex: /assertion|numeric/i } }
                });
            } else {
                filter.questionType = type;
            }
        }

        const dbQuestions = await db.collection('questionBank')
            .find(filter)
            .sort({ _id: -1 }) // newest first
            .limit(Math.min(limitParam, 5000))
            .toArray();

        // Populate test mappings for every question returned in global/explorer mode
        const qIds = dbQuestions.map(q => q._id).filter(Boolean);
        const qToTests = new Map();
        if (qIds.length > 0) {
            const matchedTests = await db.collection('testPapers').find(
                { questions: { $in: qIds } },
                { projection: { testId: 1, title: 1, exam: 1, subject: 1, questions: 1 } }
            ).toArray();

            const qIdSet = new Set(qIds.map(id => id.toString()));
            for (const tp of matchedTests) {
                if (!tp.questions || !Array.isArray(tp.questions)) continue;
                const testType = tp.type || (
                    tp.testId?.includes('PART') ? 'Part Test' :
                    (tp.testId?.includes('FULL') || tp.testId?.includes('MOCK')) ? 'Full Test' :
                    tp.testId?.includes('CHAPTER') ? 'Chapter Test' :
                    tp.testId?.includes('SUBTOPIC') ? 'Subtopic Test' :
                    tp.testId?.includes('PYQ') ? 'PYQ Test' : 'Test Paper'
                );
                const testMeta = {
                    testId: tp.testId,
                    title: tp.title || tp.testId,
                    exam: tp.exam || (tp.testId?.startsWith('neet') ? 'NEET' : tp.testId?.startsWith('jee') ? 'JEE Main' : 'BITSAT'),
                    subject: tp.subject || '',
                    type: testType
                };
                for (let i = 0; i < tp.questions.length; i++) {
                    const qId = tp.questions[i];
                    const qStr = qId?.toString();
                    if (qStr && qIdSet.has(qStr)) {
                        if (!qToTests.has(qStr)) qToTests.set(qStr, []);
                        qToTests.get(qStr).push({
                            ...testMeta,
                            position: i + 1
                        });
                    }
                }
            }
        }

        let legacyQuestions = dbQuestions.map((q, idx) => {
            const leg = formatQuestionToLegacy(q, idx + 1);
            const qStr = (q._id || q.questionId)?.toString();
            const tests = (qStr && qToTests.get(qStr)) || [];
            leg.assignedTests = tests;
            leg.isAssigned = tests.length > 0;
            return leg;
        });

        const mappingStatus = searchParams.get('mappingStatus');
        if (mappingStatus === 'ASSIGNED') {
            legacyQuestions = legacyQuestions.filter(q => q.isAssigned);
        } else if (mappingStatus === 'UNASSIGNED') {
            legacyQuestions = legacyQuestions.filter(q => !q.isAssigned);
        }

        const filterTestId = searchParams.get('filterTestId');
        if (filterTestId) {
            legacyQuestions = legacyQuestions.filter(q => q.assignedTests?.some(t => t.testId === filterTestId));
        }

        return Response.json(legacyQuestions);
        
    } catch (error) {
        console.error('API Error details:', error);
        return Response.json({ error: error.message || 'Internal server error', stack: process.env.NODE_ENV === 'development' ? error.stack : undefined }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.isAdmin) {
            return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const body = await request.json();
        const { testId, question, action } = body;
        
        if (!testId && action !== 'ADD' && action !== 'ADD_BULK') {
             return Response.json({ error: 'testId is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        // One-time initialization of DB with existing JSON data if not already present
        if (testId && testId !== 'global') {
            await ensureDbHasTest(testId, db);
        }

        if (action === 'ADD') {
            if (!question || (!question.text && !question.question)) {
                return Response.json({ error: 'Question text is required' }, { status: 400 });
            }

            const centralQ = formatQuestionToCentralized(question);
            let questionId;
            // De-duplicate check
            const existing = await db.collection('questionBank').findOne({
                subject: centralQ.subject,
                question: centralQ.question
            });
            if (existing) {
                questionId = existing._id;
            } else {
                const res = await db.collection('questionBank').insertOne(centralQ);
                questionId = res.insertedId;
            }
            
            // Add to testPaper's questions array if a valid testId is specified
            let newIndex = 1;
            if (testId && testId !== 'global') {
                await db.collection('testPapers').updateOne(
                    { testId },
                    { $push: { questions: questionId }, $set: { updatedAt: new Date() } }
                );
                
                const testPaper = await db.collection('testPapers').findOne({ testId });
                newIndex = testPaper?.questions?.length || 1;
            }
            const legacyQ = formatQuestionToLegacy({ _id: questionId, ...centralQ }, newIndex);
            return Response.json({ success: true, data: [legacyQ] });
            
        } else if (action === 'ADD_BULK') {
            const questionIds = [];
            const list = Array.isArray(question) ? question : [question];
            for (const q of list) {
                if (!q || (!q.text && !q.question)) continue;
                const centralQ = formatQuestionToCentralized(q);
                let questionId;
                const existing = await db.collection('questionBank').findOne({
                    subject: centralQ.subject,
                    question: centralQ.question
                });
                if (existing) {
                    questionId = existing._id;
                } else {
                    const res = await db.collection('questionBank').insertOne(centralQ);
                    questionId = res.insertedId;
                }
                questionIds.push(questionId);
            }
            
            if (testId && testId !== 'global') {
                await db.collection('testPapers').updateOne(
                    { testId },
                    { $push: { questions: { $each: questionIds } }, $set: { updatedAt: new Date() } }
                );
            }
            return Response.json({ success: true, count: questionIds.length });
            
        } else if (action === 'LINK_QUESTIONS') {
            const { questionIds } = body;
            if (!questionIds || !Array.isArray(questionIds)) {
                return Response.json({ error: 'questionIds array is required' }, { status: 400 });
            }
            const validObjectIds = questionIds
                .filter(id => ObjectId.isValid(id))
                .map(id => new ObjectId(id));

            if (validObjectIds.length === 0) {
                return Response.json({ error: 'No valid Question IDs provided' }, { status: 400 });
            }

            await db.collection('testPapers').updateOne(
                { testId },
                { 
                    $addToSet: { questions: { $each: validObjectIds } }, 
                    $setOnInsert: { createdAt: new Date() },
                    $set: { updatedAt: new Date() } 
                },
                { upsert: true }
            );
            return Response.json({ success: true, count: validObjectIds.length });
            
        } else if (action === 'UNLINK_QUESTION') {
            const { questionId } = body;
            if (!questionId) {
                return Response.json({ error: 'questionId is required' }, { status: 400 });
            }
            if (!ObjectId.isValid(questionId)) {
                return Response.json({ error: 'Invalid Question ID format' }, { status: 400 });
            }
            await db.collection('testPapers').updateOne(
                { testId },
                { 
                    $pull: { questions: new ObjectId(questionId) }, 
                    $set: { updatedAt: new Date() } 
                }
            );
            return Response.json({ success: true });

        } else if (action === 'UNLINK_ALL') {
            await db.collection('testPapers').updateOne(
                { testId },
                { 
                    $set: { questions: [], updatedAt: new Date() } 
                }
            );
            return Response.json({ success: true });

        } else if (action === 'UPDATE_DIFFICULTY') {
            const { questionId, difficulty } = body;
            if (!questionId || !difficulty) {
                return Response.json({ error: 'questionId and difficulty are required' }, { status: 400 });
            }
            await db.collection('questionBank').updateOne(
                { _id: typeof questionId === 'string' ? new ObjectId(questionId) : questionId },
                { $set: { difficulty, updatedAt: new Date() } }
            );
            return Response.json({ success: true, difficulty });

        } else if (action === 'EDIT') {
            if (!question) {
                return Response.json({ error: 'Question data is required' }, { status: 400 });
            }
            const centralQ = formatQuestionToCentralized(question);
            let qId = question._id;
            if (!qId && testId && testId !== 'global') {
                const testPaper = await db.collection('testPapers').findOne({ testId });
                if (testPaper && testPaper.questions) {
                    const qIndex = question.id - 1;
                    qId = testPaper.questions[qIndex];
                }
            }
            if (qId) {
                await db.collection('questionBank').updateOne(
                    { _id: typeof qId === 'string' ? new ObjectId(qId) : qId },
                    { $set: centralQ }
                );
                return Response.json({ success: true });
            }
            return Response.json({ error: 'Question not found' }, { status: 404 });
            
        } else if (action === 'DELETE') {
            let qId = question?._id;
            if (!qId && testId && testId !== 'global') {
                const testPaper = await db.collection('testPapers').findOne({ testId });
                if (testPaper && testPaper.questions) {
                    const qIndex = question.id - 1;
                    qId = testPaper.questions[qIndex];
                }
            }
            if (qId) {
                const objId = typeof qId === 'string' ? new ObjectId(qId) : qId;
                // Delete from questionBank
                await db.collection('questionBank').deleteOne({ _id: objId });
                // Pull from all testPapers
                await db.collection('testPapers').updateMany(
                    { questions: objId },
                    { $pull: { questions: objId }, $set: { updatedAt: new Date() } }
                );
                return Response.json({ success: true });
            }
            return Response.json({ error: 'Question not found' }, { status: 404 });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });
        
    } catch (error) {
        console.error('API Error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
