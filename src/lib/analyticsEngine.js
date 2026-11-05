import { normalizeCorrectOption } from './questionFormatter.js';
import { getAnswerForQuestion } from './scoringEngine.js';

export const CANONICAL_TEST_TYPES = [
    { id: 'LIVE', label: 'Live Test', isCompleteExam: true, isFocused: false },
    { id: 'PART', label: 'Part Test', isCompleteExam: true, isFocused: false },
    { id: 'MOCK', label: 'Mock Test', aliasId: 'FULL', isCompleteExam: true, isFocused: false },
    { id: 'SUBJECT', label: 'Subjectwise Test', isCompleteExam: false, isFocused: true },
    { id: 'TOPIC', label: 'Topicwise Test', aliasId: 'SUBTOPIC', isCompleteExam: false, isFocused: true },
    { id: 'CHAPTER', label: 'Chapterwise Test', isCompleteExam: false, isFocused: true }
];

export const TEST_CATEGORIES = CANONICAL_TEST_TYPES.reduce((acc, cat) => {
    acc[cat.id] = cat;
    if (cat.aliasId) acc[cat.aliasId] = cat;
    return acc;
}, {});

/**
 * Categorize a test based on its ID or attributes.
 * Strict category isolation: PART, MOCK (FULL), LIVE, CHAPTER, TOPIC (SUBTOPIC), SUBJECT, PYQ, POLL, OTHER.
 * Categorizes Group A (Focused Tests) and Group B (Complete-Examination Tests).
 *
 * @param {string} testId
 * @param {boolean} [isLiveAttempt=false]
 * @returns {{ id: string, label: string, aliasId?: string, isFocused: boolean, isCompleteExam: boolean }}
 */
export function categorizeTestId(testId = '', isLiveAttempt = false) {
    const raw = String(testId || '').trim();
    const upper = raw.toUpperCase();

    // Check focused tests FIRST so live delivery mode does not misclassify a subtopic/chapter test as a full live exam
    if (upper.includes('-CHAPTER-')) {
        return { id: 'CHAPTER', label: 'Chapterwise Test', isFocused: true, isCompleteExam: false };
    }
    if (upper.includes('-SUBTOPIC-') || upper.includes('-TOPIC-')) {
        return { id: 'TOPIC', label: 'Topicwise Test', aliasId: 'SUBTOPIC', isFocused: true, isCompleteExam: false };
    }
    if (upper.includes('-SUBJECT-')) {
        return { id: 'SUBJECT', label: 'Subjectwise Test', isFocused: true, isCompleteExam: false };
    }

    // Complete-Examination Tests
    if (upper.includes('-PART-')) {
        return { id: 'PART', label: 'Part Test', isFocused: false, isCompleteExam: true };
    }
    if (upper.includes('-MOCK-') || upper.includes('-FULL-')) {
        return { id: 'MOCK', label: 'Mock Test', aliasId: 'FULL', isFocused: false, isCompleteExam: true };
    }
    if (isLiveAttempt || upper.includes('-LIVE-') || upper.includes('-CT-') || upper.includes('-SUNDAY-')) {
        return { id: 'LIVE', label: 'Live Test', isFocused: false, isCompleteExam: true };
    }

    // Specialized & Legacy tests
    if (upper.includes('-PYQ-') || upper.includes('-PAPER-')) {
        return { id: 'PYQ', label: 'Previous Year Questions (PYQ)', isFocused: false, isCompleteExam: true };
    }
    if (raw.toLowerCase().startsWith('poll-') || upper.includes('-POLL-')) {
        return { id: 'POLL', label: 'Poll Test', isFocused: true, isCompleteExam: false };
    }

    return { id: 'OTHER', label: 'Other Test', isFocused: false, isCompleteExam: false };
}

/**
 * Standardize Exam Type ID and display name.
 * 
 * @param {Object} result
 * @returns {{ id: string, name: string }}
 */
export function extractExamType(result = {}) {
    const rawExam = String(result.examType || result.exam || '').toLowerCase().trim();
    const testId = String(result.testId || '').toLowerCase().trim();

    if (rawExam.includes('olympiad') || testId.includes('olympiad')) {
        return { id: 'olympiad', name: 'Olympiad' };
    }

    if (rawExam.includes('bitsat') || testId.includes('bitsat')) {
        return { id: 'bitsat', name: 'BITSAT' };
    }
    if (rawExam.includes('jee-adv') || testId.includes('jee-adv')) {
        return { id: 'jee-adv', name: 'JEE Advanced' };
    }
    if (rawExam.includes('jee') || testId.includes('jee')) {
        return { id: 'jee-mains', name: 'JEE Main' };
    }
    if (rawExam.includes('neet') || testId.includes('neet')) {
        return { id: 'neet', name: 'NEET' };
    }

    const fallback = rawExam || 'other';
    return { id: fallback, name: fallback.toUpperCase() };
}

/**
 * Safe division helper.
 */
export function safeDivide(numerator, denominator, multiplier = 1, decimals = 2) {
    if (!denominator || typeof denominator !== 'number' || isNaN(denominator) || denominator === 0) {
        return 0;
    }
    const val = (numerator / denominator) * multiplier;
    return isNaN(val) ? 0 : Number(val.toFixed(decimals));
}

/**
 * Format duration in seconds to human readable string (e.g. "1h 24m" or "42m 10s").
 */
export function formatDurationSeconds(seconds) {
    if (!seconds || typeof seconds !== 'number' || seconds <= 0) return '0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
        return `${hrs}h ${mins}m`;
    }
    if (mins > 0) {
        return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
}

/**
 * Deep evaluation of a single test attempt.
 * Evaluates every question response against the answer key and marking scheme.
 * Computes exact counts, marks, deductions, and flags data-quality inconsistencies.
 * 
 * @param {Object} attempt
 * @returns {Object} Evaluated attempt details
 */
export function evaluateAttempt(attempt = {}) {
    if (!attempt || typeof attempt !== 'object') {
        return null;
    }

    const testId = attempt.testId || 'Unknown Test';
    const examInfo = extractExamType(attempt);
    const isBitsat = examInfo.id === 'bitsat';
    const defaultPosMarks = isBitsat ? 3 : 4;
    const defaultNegMarks = 1;

    const questions = Array.isArray(attempt.questions) ? attempt.questions : [];
    const answers = attempt.answers || {};
    const timeSpent = attempt.timeSpent || {};

    let totalQuestions = questions.length;
    let evaluatedQuestions = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;
    let keyMissingCount = 0;
    let obtainedMarks = 0;
    let maximumMarks = 0;
    let totalNegativeMarksLost = 0;

    const subjectStatsMap = {};
    const chapterStatsMap = {};
    const topicStatsMap = {};
    const evaluatedQuestionsList = [];
    const dataQualityWarnings = [];

    // Evaluate each question
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        evaluatedQuestions++;

        const qPos = typeof q.marks === 'number' ? q.marks : defaultPosMarks;
        const qNeg = typeof q.negativeMarks === 'number' ? q.negativeMarks : defaultNegMarks;

        maximumMarks += qPos;

        const subjName = (q.subject || 'General').trim();
        const chapName = (q.chapter || 'General').trim();
        const topName = (q.topic || q.chapter || 'General').trim();

        // Check metadata completeness
        if (!q.subject) {
            dataQualityWarnings.push(`Question #${i + 1} has missing subject metadata.`);
        }
        if (!q.chapter) {
            dataQualityWarnings.push(`Question #${i + 1} has missing chapter metadata.`);
        }

        // Initialize Subject Map
        if (!subjectStatsMap[subjName]) {
            subjectStatsMap[subjName] = {
                subject: subjName,
                total: 0,
                attempted: 0,
                correct: 0,
                wrong: 0,
                unattempted: 0,
                score: 0,
                maxMarks: 0,
                negativeMarksLost: 0,
                timeSpent: 0,
                chapters: new Set(),
                topics: new Set()
            };
        }
        subjectStatsMap[subjName].total++;
        subjectStatsMap[subjName].maxMarks += qPos;
        subjectStatsMap[subjName].chapters.add(chapName);
        subjectStatsMap[subjName].topics.add(topName);

        // Initialize Chapter Map
        const chapKey = `${subjName}__${chapName}`;
        if (!chapterStatsMap[chapKey]) {
            chapterStatsMap[chapKey] = {
                subject: subjName,
                chapter: chapName,
                total: 0,
                attempted: 0,
                correct: 0,
                wrong: 0,
                unattempted: 0,
                score: 0,
                maxMarks: 0,
                negativeMarksLost: 0,
                timeSpent: 0
            };
        }
        chapterStatsMap[chapKey].total++;
        chapterStatsMap[chapKey].maxMarks += qPos;

        // Initialize Topic Map
        const topKey = `${subjName}__${chapName}__${topName}`;
        if (!topicStatsMap[topKey]) {
            topicStatsMap[topKey] = {
                subject: subjName,
                chapter: chapName,
                topic: topName,
                total: 0,
                attempted: 0,
                correct: 0,
                wrong: 0,
                unattempted: 0,
                score: 0,
                maxMarks: 0,
                negativeMarksLost: 0,
                timeSpent: 0
            };
        }
        topicStatsMap[topKey].total++;
        topicStatsMap[topKey].maxMarks += qPos;

        // Question timing
        const qIdKey = q.id !== undefined ? String(q.id) : (q._id ? String(q._id) : String(i + 1));
        const qTime = timeSpent[qIdKey] || (timeSpent[i + 1] ?? 0);
        const validTime = typeof qTime === 'number' && qTime > 0 ? qTime : 0;
        subjectStatsMap[subjName].timeSpent += validTime;
        chapterStatsMap[chapKey].timeSpent += validTime;
        topicStatsMap[topKey].timeSpent += validTime;

        // Student's answer
        const clientAns = getAnswerForQuestion(answers, q, i);
        const hasAnswer = clientAns !== undefined && clientAns !== null && String(clientAns).trim() !== '';

        const rawExpected = q.correctOption ?? q.correctAnswer ?? q.answer;
        const hasKey = rawExpected !== undefined && rawExpected !== null && String(rawExpected).trim() !== '';

        if (!hasKey) {
            keyMissingCount++;
            dataQualityWarnings.push(`Question #${i + 1} is missing an authoritative answer key.`);
        }

        let status = 'UNATTEMPTED';
        let marksAwarded = 0;
        let negDeduction = 0;

        if (hasAnswer) {
            subjectStatsMap[subjName].attempted++;
            chapterStatsMap[chapKey].attempted++;
            topicStatsMap[topKey].attempted++;

            if (!hasKey) {
                status = 'KEY_MISSING';
                unattemptedCount++;
            } else {
                const isNumerical = (q.type || q.questionType || '').toString().toUpperCase().includes('NUMERICAL');
                let isMatch = false;

                if (isNumerical) {
                    const normExpected = String(rawExpected).trim().toLowerCase();
                    const normActual = String(clientAns).trim().toLowerCase();
                    isMatch = normExpected.length > 0 && normExpected === normActual;
                    if (!isMatch && !isNaN(Number(normExpected)) && !isNaN(Number(normActual))) {
                        isMatch = Math.abs(Number(normExpected) - Number(normActual)) < 0.0001;
                    }
                } else {
                    const normExpected = normalizeCorrectOption(rawExpected, q.options);
                    const normActual = String(clientAns).trim().toLowerCase();
                    isMatch = normActual === normExpected.toLowerCase();
                }

                if (isMatch) {
                    status = 'CORRECT';
                    correctCount++;
                    marksAwarded = qPos;
                    obtainedMarks += qPos;
                    subjectStatsMap[subjName].correct++;
                    subjectStatsMap[subjName].score += qPos;
                    chapterStatsMap[chapKey].correct++;
                    chapterStatsMap[chapKey].score += qPos;
                    topicStatsMap[topKey].correct++;
                    topicStatsMap[topKey].score += qPos;
                } else {
                    status = 'INCORRECT';
                    wrongCount++;
                    marksAwarded = -qNeg;
                    negDeduction = qNeg;
                    obtainedMarks -= qNeg;
                    totalNegativeMarksLost += qNeg;
                    subjectStatsMap[subjName].wrong++;
                    subjectStatsMap[subjName].score -= qNeg;
                    subjectStatsMap[subjName].negativeMarksLost += qNeg;
                    chapterStatsMap[chapKey].wrong++;
                    chapterStatsMap[chapKey].score -= qNeg;
                    chapterStatsMap[chapKey].negativeMarksLost += qNeg;
                    topicStatsMap[topKey].wrong++;
                    topicStatsMap[topKey].score -= qNeg;
                    topicStatsMap[topKey].negativeMarksLost += qNeg;
                }
            }
        } else {
            status = 'UNATTEMPTED';
            unattemptedCount++;
            subjectStatsMap[subjName].unattempted++;
            chapterStatsMap[chapKey].unattempted++;
            topicStatsMap[topKey].unattempted++;
        }

        evaluatedQuestionsList.push({
            qNum: i + 1,
            id: q.id !== undefined ? q.id : (q._id ? String(q._id) : i + 1),
            _id: q._id ? String(q._id) : undefined,
            subject: subjName,
            chapter: chapName,
            topic: topName,
            text: q.text || `Question #${i + 1}`,
            options: q.options || [],
            image: q.image || null,
            studentAnswer: hasAnswer ? String(clientAns) : null,
            correctAnswer: hasKey ? normalizeCorrectOption(rawExpected, q.options) : 'N/A',
            hasAnswer,
            hasKey,
            status,
            marksAwarded,
            negativeMarksLost: negDeduction,
            timeSpent: validTime,
            hasSolution: Boolean(q.explanation || (q.solution && q.solution.length > 0)),
            explanation: q.explanation || q.solution || null
        });
    }

    // Override maximumMarks if test had pre-configured totalMarks and 0 questions were stored
    if (maximumMarks === 0 && (attempt.maximumMarks || attempt.totalMarks)) {
        maximumMarks = Number(attempt.maximumMarks || attempt.totalMarks);
    }
    if (totalQuestions === 0) {
        correctCount = Number(attempt.correctAnswers || 0);
        wrongCount = Number(attempt.wrongAnswers || 0);
        const unattempted = Number(attempt.unattemptedQuestions || 0);
        totalQuestions = Number(attempt.totalQuestions || (correctCount + wrongCount + unattempted));
        unattemptedCount = Math.max(0, totalQuestions - correctCount - wrongCount);
        obtainedMarks = typeof attempt.marksObtained === 'number' ? attempt.marksObtained : (attempt.score || 0);
        totalNegativeMarksLost = wrongCount * defaultNegMarks;
    }

    // Consistency Checks
    const savedScore = typeof attempt.marksObtained === 'number' ? attempt.marksObtained : attempt.score;
    if (typeof savedScore === 'number' && savedScore !== obtainedMarks && evaluatedQuestions > 0) {
        dataQualityWarnings.push(
            `Score discrepancy: Database saved score (${savedScore}) differs from re-evaluated score (${obtainedMarks}).`
        );
    }

    const answeredCount = correctCount + wrongCount;
    const scorePercentage = maximumMarks > 0 ? Number(((obtainedMarks / maximumMarks) * 100).toFixed(2)) : 0;
    const accuracy = safeDivide(correctCount, answeredCount, 100);
    const attemptRate = safeDivide(answeredCount, totalQuestions, 100);

    // Finalize Subject Summaries
    const subjectList = Object.values(subjectStatsMap).map(s => {
        const sAnswered = s.correct + s.wrong;
        const sAccuracy = safeDivide(s.correct, sAnswered, 100);
        const sAttemptRate = safeDivide(sAnswered, s.total, 100);
        const sPercentage = s.maxMarks > 0 ? Number(((s.score / s.maxMarks) * 100).toFixed(2)) : 0;
        const avgTimePerQ = safeDivide(s.timeSpent, s.total, 1, 1);
        const avgTimePerCorrect = safeDivide(s.timeSpent, s.correct, 1, 1);

        return {
            ...s,
            chaptersCount: s.chapters.size,
            topicsCount: s.topics.size,
            answered: sAnswered,
            accuracy: sAccuracy,
            attemptRate: sAttemptRate,
            percentage: sPercentage,
            avgTimePerQ,
            avgTimePerCorrect
        };
    });

    // Finalize Chapter Summaries
    const chapterList = Object.values(chapterStatsMap).map(c => {
        const cAnswered = c.correct + c.wrong;
        return {
            ...c,
            answered: cAnswered,
            accuracy: safeDivide(c.correct, cAnswered, 100),
            attemptRate: safeDivide(cAnswered, c.total, 100),
            percentage: c.maxMarks > 0 ? Number(((c.score / c.maxMarks) * 100).toFixed(2)) : 0,
            avgTimePerQ: safeDivide(c.timeSpent, c.total, 1, 1)
        };
    }).sort((a, b) => b.negativeMarksLost - a.negativeMarksLost || a.accuracy - b.accuracy);

    // Finalize Topic Summaries
    const topicList = Object.values(topicStatsMap).map(t => {
        const tAnswered = t.correct + t.wrong;
        return {
            ...t,
            answered: tAnswered,
            accuracy: safeDivide(t.correct, tAnswered, 100),
            attemptRate: safeDivide(tAnswered, t.total, 100),
            percentage: t.maxMarks > 0 ? Number(((t.score / t.maxMarks) * 100).toFixed(2)) : 0
        };
    }).sort((a, b) => b.negativeMarksLost - a.negativeMarksLost);

    // Incorrect Questions
    const incorrectQuestions = evaluatedQuestionsList.filter(q => q.status === 'INCORRECT');

    // Aggregate Incorrect by Subject
    const incorrectBySubject = subjectList.map(s => ({
        subject: s.subject,
        count: s.wrong,
        negativeMarksLost: s.negativeMarksLost,
        signedDeduction: -s.negativeMarksLost,
        fill: '#ef4444' // MANDATORY RED
    })).filter(s => s.count > 0);

    // Aggregate Incorrect by Chapter
    const incorrectByChapter = chapterList.map(c => ({
        chapter: c.chapter,
        subject: c.subject,
        count: c.wrong,
        negativeMarksLost: c.negativeMarksLost,
        signedDeduction: -c.negativeMarksLost,
        fill: '#ef4444' // MANDATORY RED
    })).filter(c => c.count > 0);

    // Aggregate Incorrect by Topic
    const incorrectByTopic = topicList.map(t => ({
        topic: t.topic,
        chapter: t.chapter,
        subject: t.subject,
        count: t.wrong,
        negativeMarksLost: t.negativeMarksLost,
        signedDeduction: -t.negativeMarksLost,
        fill: '#ef4444' // MANDATORY RED
    })).filter(t => t.count > 0);

    return {
        testId,
        testTitle: attempt.testTitle || attempt.title || testId,
        attemptId: attempt._id ? String(attempt._id) : (attempt.testAttemptId || 'att-1'),
        attemptedAt: attempt.attemptedAt || new Date().toISOString(),
        examType: examInfo.id,
        examName: examInfo.name,
        category: categorizeTestId(testId, attempt.isLiveAttempt),
        status: attempt.status || 'SUBMITTED',
        isLiveAttempt: Boolean(attempt.isLiveAttempt),
        totalQuestions,
        evaluatedQuestions,
        answeredCount,
        correctCount,
        wrongCount,
        unattemptedCount,
        keyMissingCount,
        obtainedMarks,
        maximumMarks,
        scorePercentage,
        accuracy,
        attemptRate,
        totalNegativeMarksLost,
        signedScoreDeduction: -totalNegativeMarksLost,
        timeTaken: attempt.timeTaken || 0,
        timeFormatted: formatDurationSeconds(attempt.timeTaken || 0),
        violationCount: attempt.violationCount || (attempt.violations?.length || 0),
        rank: attempt.rank || 'N/A',
        totalStudents: attempt.totalStudents || 0,
        subjects: subjectList,
        chapters: chapterList,
        topics: topicList,
        questions: evaluatedQuestionsList,
        incorrectQuestions,
        incorrectBySubject,
        incorrectByChapter,
        incorrectByTopic,
        dataQualityWarnings
    };
}

/**
 * Generate evidence-based Personalized Student Improvement Plan.
 * Analyzes errors, negative marks, low accuracy, and time management.
 * 
 * @param {Object} evaluatedAttempt
 * @returns {Array<{ priority: number, type: string, title: string, reason: string, evidence: string, recommendedAction: string, actionType: string, payload: Object }>}
 */
export function generateImprovementPlan(evaluatedAttempt) {
    if (!evaluatedAttempt) return [];

    const plan = [];
    let priorityCounter = 1;

    // 1. High-Impact Negative Marking Chapters
    const weakChapters = (evaluatedAttempt.chapters || [])
        .filter(c => c.wrong >= 2 || (c.wrong >= 1 && c.accuracy < 50))
        .sort((a, b) => b.negativeMarksLost - a.negativeMarksLost || a.accuracy - b.accuracy);

    for (const chap of weakChapters.slice(0, 3)) {
        plan.push({
            priority: priorityCounter++,
            type: 'CHAPTER_REVISION',
            subject: chap.subject,
            chapter: chap.chapter,
            title: `${chap.subject}: ${chap.chapter}`,
            reason: `Lost ${chap.negativeMarksLost} marks to negative marking with ${chap.wrong} incorrect question${chap.wrong > 1 ? 's' : ''} (${chap.accuracy}% accuracy).`,
            evidence: `${chap.correct} correct, ${chap.wrong} wrong out of ${chap.total} questions assigned in this chapter.`,
            recommendedAction: `Review solution explanations for these ${chap.wrong} questions, revise core chapter formulas, and practice chapter test.`,
            actionType: 'REVIEW_QUESTIONS',
            payload: { subject: chap.subject, chapter: chap.chapter }
        });
    }

    // 2. Subject Accuracy Concerns
    const lowAccuracySubjects = (evaluatedAttempt.subjects || [])
        .filter(s => s.answered > 0 && s.accuracy < 65)
        .sort((a, b) => a.accuracy - b.accuracy);

    for (const subj of lowAccuracySubjects.slice(0, 2)) {
        plan.push({
            priority: priorityCounter++,
            type: 'SUBJECT_ACCURACY',
            subject: subj.subject,
            title: `${subj.subject}: Accuracy Improvement Needed`,
            reason: `Student accuracy in ${subj.subject} is ${subj.accuracy}%, falling below the 75% competitive benchmark.`,
            evidence: `${subj.wrong} incorrect responses resulted in -${subj.negativeMarksLost} marks deducted from ${subj.subject} score.`,
            recommendedAction: `Focus on eliminating negative marking by attempting only confident questions, and review incorrect questions in detail.`,
            actionType: 'FILTER_SUBJECT',
            payload: { subject: subj.subject }
        });
    }

    // 3. Time Management & High Unattempted Questions
    const unattemptedRatio = evaluatedAttempt.totalQuestions > 0
        ? (evaluatedAttempt.unattemptedCount / evaluatedAttempt.totalQuestions)
        : 0;

    if (unattemptedRatio >= 0.35 && evaluatedAttempt.totalQuestions >= 10) {
        plan.push({
            priority: priorityCounter++,
            type: 'TIME_MANAGEMENT',
            title: 'Time Allocation & Speed Optimization',
            reason: `${evaluatedAttempt.unattemptedCount} out of ${evaluatedAttempt.totalQuestions} questions (${Number((unattemptedRatio * 100).toFixed(1))}%) were left unattempted.`,
            evidence: `Total duration recorded: ${evaluatedAttempt.timeFormatted}. A large portion of marks was left on the table due to unattempted questions.`,
            recommendedAction: 'Practice timed sectional tests. Allocate no more than 60-90 seconds per MCQ on the first pass and bookmark lengthy questions for later.',
            actionType: 'TIMED_PRACTICE',
            payload: {}
        });
    }

    // 4. Excessive Negative Marks Alert
    if (evaluatedAttempt.totalNegativeMarksLost >= 20) {
        plan.push({
            priority: priorityCounter++,
            type: 'NEGATIVE_MARKING_HAZARD',
            title: 'High Negative Marking Risk Alert',
            reason: `Total negative marking penalty reached -${evaluatedAttempt.totalNegativeMarksLost} marks (${evaluatedAttempt.wrongCount} wrong answers).`,
            evidence: `Gaining ${evaluatedAttempt.correctCount * 4} positive marks but losing ${evaluatedAttempt.totalNegativeMarksLost} marks significantly dropped net score to ${evaluatedAttempt.obtainedMarks}.`,
            recommendedAction: 'Apply strict option-elimination strategies. Avoid wild guesses where fewer than 2 options have been eliminated.',
            actionType: 'REVIEW_NEGATIVE_QUESTIONS',
            payload: {}
        });
    }

    // Fallback if student performed flawlessly or data is minimal
    if (plan.length === 0) {
        if (evaluatedAttempt.totalQuestions === 0) {
            plan.push({
                priority: 1,
                type: 'INSUFFICIENT_DATA',
                title: 'More Test Data Needed',
                reason: 'Insufficient completed question records to construct targeted recommendations.',
                evidence: 'No evaluated question responses found for this scope.',
                recommendedAction: 'Complete more full-length or part tests to unlock comprehensive AI-driven performance recommendations.',
                actionType: 'TAKE_TEST',
                payload: {}
            });
        } else {
            plan.push({
                priority: 1,
                type: 'MAINTAIN_EXCELLENCE',
                title: 'High Performance Maintenance',
                reason: `Excellent attempt with ${evaluatedAttempt.accuracy}% accuracy and minimal negative marks lost.`,
                evidence: `Scored ${evaluatedAttempt.obtainedMarks}/${evaluatedAttempt.maximumMarks} (${evaluatedAttempt.scorePercentage}%).`,
                recommendedAction: 'Continue full-length timed mock tests under examination conditions to maintain speed and consistency.',
                actionType: 'PRACTICE_MOCK',
                payload: {}
            });
        }
    }

    return plan;
}

/**
 * Extracts all available dependent filter options from a student's active test results.
 * 
 * @param {Array<Object>} testResults
 * @returns {Object} Filter hierarchy
 */
export function extractAvailableFilters(testResults = []) {
    const activeResults = (testResults || []).filter(r =>
        !r.isReset && !r.isDeleted && r.status !== 'RESET' && r.status !== 'DELETED'
    );

    const examMap = new Map();
    const categoriesByExam = {}; // examId -> Map of category IDs -> label
    const testsByScope = {};      // `${examId}__${categoryId}` -> Map of testId -> testMeta
    const subjectsByTest = {};   // testId -> Set of subjects
    const subjectsByExam = {};   // examId -> Set of unique subjects across tests
    const attemptsByTest = {};   // testId -> Array of attempts

    activeResults.forEach((r, idx) => {
        const exam = extractExamType(r);
        const cat = categorizeTestId(r.testId, r.isLiveAttempt);
        const testId = r.testId || 'unknown';
        const testTitle = r.testTitle || r.title || testId;
        const attemptId = r._id ? String(r._id) : (r.testAttemptId || `att-${idx}`);

        // Register Exam
        if (!examMap.has(exam.id)) {
            examMap.set(exam.id, exam.name);
        }

        // Register Category for Exam
        if (!categoriesByExam[exam.id]) {
            categoriesByExam[exam.id] = new Map();
        }
        categoriesByExam[exam.id].set(cat.id, cat.label);
        if (cat.aliasId) {
            categoriesByExam[exam.id].set(cat.aliasId, cat.label);
        }

        // Register Test for (Exam + Category)
        const scopeKey = `${exam.id}__${cat.id}`;
        if (!testsByScope[scopeKey]) {
            testsByScope[scopeKey] = new Map();
        }
        if (!testsByScope[scopeKey].has(testId)) {
            testsByScope[scopeKey].set(testId, {
                testId,
                title: testTitle,
                category: cat.id,
                examType: exam.id
            });
        }
        if (cat.aliasId) {
            const aliasScopeKey = `${exam.id}__${cat.aliasId}`;
            if (!testsByScope[aliasScopeKey]) {
                testsByScope[aliasScopeKey] = new Map();
            }
            if (!testsByScope[aliasScopeKey].has(testId)) {
                testsByScope[aliasScopeKey].set(testId, {
                    testId,
                    title: testTitle,
                    category: cat.aliasId,
                    examType: exam.id
                });
            }
        }

        // Register Subjects in this Test and for this Exam
        if (!subjectsByTest[testId]) {
            subjectsByTest[testId] = new Set();
        }
        if (!subjectsByExam[exam.id]) {
            subjectsByExam[exam.id] = new Set();
        }

        if (Array.isArray(r.questions)) {
            r.questions.forEach(q => {
                if (q.subject && q.subject.trim()) {
                    const sTrim = q.subject.trim();
                    subjectsByTest[testId].add(sTrim);
                    subjectsByExam[exam.id].add(sTrim);
                }
            });
        } else if (r.subjectStats && typeof r.subjectStats === 'object') {
            Object.keys(r.subjectStats).forEach(s => {
                const sTrim = s.trim();
                subjectsByTest[testId].add(sTrim);
                subjectsByExam[exam.id].add(sTrim);
            });
        }

        // Register Attempt for this Test
        if (!attemptsByTest[testId]) {
            attemptsByTest[testId] = [];
        }
        const score = typeof r.marksObtained === 'number' ? r.marksObtained : (r.score || 0);
        const max = typeof r.maximumMarks === 'number' ? r.maximumMarks : (r.totalMarks || 0);
        const pct = max > 0 ? Number(((score / max) * 100).toFixed(2)) : 0;

        attemptsByTest[testId].push({
            attemptId,
            testId,
            score,
            totalMarks: max,
            percentage: pct,
            date: r.attemptedAt || new Date().toISOString(),
            status: r.status || 'SUBMITTED',
            isLiveAttempt: Boolean(r.isLiveAttempt),
            duration: r.timeTaken || 0,
            rawResult: r
        });
    });

    // Ensure common standard subjects for supported competitive exams
    if (examMap.has('olympiad')) {
        if (!subjectsByExam['olympiad']) subjectsByExam['olympiad'] = new Set();
        ['Mathematics', 'Science', 'English'].forEach(s => subjectsByExam['olympiad'].add(s));
    }
    if (examMap.has('neet')) {
        if (!subjectsByExam['neet']) subjectsByExam['neet'] = new Set();
        ['Physics', 'Chemistry', 'Botany', 'Zoology'].forEach(s => subjectsByExam['neet'].add(s));
    }
    if (examMap.has('jee-mains')) {
        if (!subjectsByExam['jee-mains']) subjectsByExam['jee-mains'] = new Set();
        ['Physics', 'Chemistry', 'Mathematics'].forEach(s => subjectsByExam['jee-mains'].add(s));
    }
    if (examMap.has('jee-adv')) {
        if (!subjectsByExam['jee-adv']) subjectsByExam['jee-adv'] = new Set();
        ['Physics', 'Chemistry', 'Mathematics'].forEach(s => subjectsByExam['jee-adv'].add(s));
    }

    // Sort attempts chronologically
    Object.values(attemptsByTest).forEach(attList => {
        attList.sort((a, b) => new Date(a.date) - new Date(b.date));
        // Add 1-based attempt number
        attList.forEach((att, i) => {
            att.attemptNumber = i + 1;
        });
    });

    return {
        exams: Array.from(examMap.entries()).map(([id, name]) => ({ id, name })),
        categoriesByExam: Object.fromEntries(
            Object.entries(categoriesByExam).map(([examId, catMap]) => [
                examId,
                Array.from(catMap.entries()).map(([id, label]) => ({ id, label }))
            ])
        ),
        testsByScope: Object.fromEntries(
            Object.entries(testsByScope).map(([scopeKey, testMap]) => [
                scopeKey,
                Array.from(testMap.values())
            ])
        ),
        subjectsByTest: Object.fromEntries(
            Object.entries(subjectsByTest).map(([testId, subjSet]) => [
                testId,
                Array.from(subjSet)
            ])
        ),
        subjectsByExam: Object.fromEntries(
            Object.entries(subjectsByExam).map(([examId, subjSet]) => [
                examId,
                Array.from(subjSet)
            ])
        ),
        attemptsByTest
    };
}

/**
 * Main analytics computation engine.
 * Computes KPIs, category-isolated charts, subject extractions, and red negative marking.
 * 
 * @param {Object} params
 * @param {Array<Object>} params.testResults
 * @param {string} [params.exam='ALL']
 * @param {string} [params.category='ALL']
 * @param {string} [params.testId='ALL']
 * @param {string} [params.subject='ALL']
 * @param {string} [params.attemptId=null]
 * @param {string} [params.compareAttemptId=null]
 * @returns {Object} Complete verified analytics package
 */
export function computeAnalytics({
    testResults = [],
    exam = 'ALL',
    category = 'ALL',
    testId = 'ALL',
    subject = 'ALL',
    attemptId = null,
    compareAttemptId = null
}) {
    // 1. Filter out inactive/deleted attempts and deduplicate
    const rawActive = (testResults || []).filter(r =>
        !r.isReset && !r.isDeleted && r.status !== 'RESET' && r.status !== 'DELETED'
    );

    const seenAttemptKeys = new Set();
    const activeResults = [];
    for (const r of rawActive) {
        const key = r._id ? String(r._id) : (r.testAttemptId || `${r.testId}_${r.attemptedAt}`);
        if (!seenAttemptKeys.has(key)) {
            seenAttemptKeys.add(key);
            activeResults.push(r);
        }
    }

    // 2. Pre-evaluate active attempts for authoritative scoring and subject extractions
    const evaluatedAttemptsMap = new Map();
    activeResults.forEach(r => {
        const key = r._id ? String(r._id) : (r.testAttemptId || `${r.testId}_${r.attemptedAt}`);
        const ev = evaluateAttempt(r);
        evaluatedAttemptsMap.set(key, ev);
    });

    // 3. Extract available filter options
    const availableFilters = extractAvailableFilters(activeResults);

    // 4. Compute Global Best Rank (All Tests) across student's broader eligible test history
    // Independent of category and individual test filters
    let bestRankCandidate = null;

    activeResults.forEach(r => {
        const rawRank = r.rank ?? r.globalRank ?? r.liveRank;
        let numRank = null;
        if (typeof rawRank === 'number' && rawRank > 0) {
            numRank = rawRank;
        } else if (typeof rawRank === 'string' && /^\d+$/.test(rawRank.trim())) {
            const parsed = parseInt(rawRank.trim(), 10);
            if (parsed > 0) numRank = parsed;
        }

        if (numRank !== null) {
            const time = new Date(r.attemptedAt || r.date || 0).getTime();
            const cohort = Number(r.totalStudents || r.totalGlobalStudents || r.totalLiveStudents || 0);
            const tTitle = r.testTitle || r.title || r.testId || 'Test';

            if (!bestRankCandidate || numRank < bestRankCandidate.rank) {
                bestRankCandidate = {
                    rank: numRank,
                    rankDisplay: `#${numRank}`,
                    testId: r.testId,
                    testTitle: tTitle,
                    totalStudents: cohort,
                    date: r.attemptedAt || r.date,
                    timestamp: time
                };
            } else if (numRank === bestRankCandidate.rank) {
                // Consistent tie-breaker: most recent qualifying test, then larger cohort
                if (time > bestRankCandidate.timestamp) {
                    bestRankCandidate = {
                        rank: numRank,
                        rankDisplay: `#${numRank}`,
                        testId: r.testId,
                        testTitle: tTitle,
                        totalStudents: cohort,
                        date: r.attemptedAt || r.date,
                        timestamp: time
                    };
                } else if (time === bestRankCandidate.timestamp && cohort > bestRankCandidate.totalStudents) {
                    bestRankCandidate.totalStudents = cohort;
                }
            }
        }
    });

    const bestRankAllTests = bestRankCandidate || {
        rank: 'N/A',
        rankDisplay: 'N/A',
        testId: null,
        testTitle: null,
        totalStudents: 0,
        date: null
    };

    // 5. Apply Hierarchical Scope Filtering
    let scopedResults = activeResults;

    // Filter by Exam
    if (exam && exam !== 'ALL') {
        scopedResults = scopedResults.filter(r => extractExamType(r).id === exam);
    }

    // Filter by Category (STRICT ISOLATION with alias normalization: FULL <-> MOCK, SUBTOPIC <-> TOPIC)
    if (category && category !== 'ALL') {
        const normCat = category === 'FULL' ? 'MOCK' : (category === 'SUBTOPIC' ? 'TOPIC' : category);
        scopedResults = scopedResults.filter(r => {
            const cat = categorizeTestId(r.testId, r.isLiveAttempt);
            const itemCat = cat.id === 'FULL' ? 'MOCK' : (cat.id === 'SUBTOPIC' ? 'TOPIC' : cat.id);
            return itemCat === normCat || cat.id === category || cat.aliasId === category;
        });
    }

    // Filter by Test ID
    if (testId && testId !== 'ALL') {
        scopedResults = scopedResults.filter(r => r.testId === testId);
    }

    // Filter by Subject (if an individual subject is explicitly selected)
    if (subject && subject !== 'ALL') {
        scopedResults = scopedResults.filter(r => {
            const key = r._id ? String(r._id) : (r.testAttemptId || `${r.testId}_${r.attemptedAt}`);
            const ev = evaluatedAttemptsMap.get(key);
            if (ev && ev.subjects && ev.subjects.length > 0) {
                return ev.subjects.some(s => s.subject.toLowerCase() === subject.toLowerCase());
            }
            if (r.subject && r.subject.toLowerCase() === subject.toLowerCase()) return true;
            return false;
        });
    }

    // 6. Compute Scope-dependent metrics for Exactly Four Summary Cards
    const testsTaken = scopedResults.length;
    const uniqueTestIdsSet = new Set(scopedResults.map(r => r.testId).filter(Boolean));
    const uniqueTests = uniqueTestIdsSet.size;
    const eligibleAttempts = testsTaken;

    // Sort scoped results chronologically for accurate trend
    const chronologicalResults = [...scopedResults].sort((a, b) => new Date(a.attemptedAt || 0) - new Date(b.attemptedAt || 0));

    // Sort strictly by submission/evaluation timestamp descending for Latest Score
    const sortedByDateDesc = [...scopedResults].sort((a, b) => {
        const timeA = new Date(a.attemptedAt || a.date || 0).getTime();
        const timeB = new Date(b.attemptedAt || b.date || 0).getTime();
        return timeB - timeA;
    });

    // Check if tests in scope have identical maximum marks
    const maxMarksList = scopedResults.map(r => {
        const key = r._id ? String(r._id) : (r.testAttemptId || `${r.testId}_${r.attemptedAt}`);
        const ev = evaluatedAttemptsMap.get(key);
        if (subject && subject !== 'ALL' && ev?.subjects) {
            const sMatch = ev.subjects.find(s => s.subject.toLowerCase() === subject.toLowerCase());
            if (sMatch) return sMatch.maxMarks;
        }
        return (typeof r.maximumMarks === 'number' ? r.maximumMarks : (r.totalMarks || (r.score > 360 ? 720 : 360)));
    });
    const allSameMaxMarks = new Set(maxMarksList).size <= 1;

    let bestAttempt = null;
    let bestPct = -Infinity;
    let bestRaw = -Infinity;

    let totalScoreSum = 0;
    let totalMaxMarksSum = 0;
    let totalPctSum = 0;
    let totalTimeTaken = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalUnattempted = 0;
    let totalAssignedQuestions = 0;
    let totalNegativeMarksLost = 0;

    chronologicalResults.forEach((r) => {
        const key = r._id ? String(r._id) : (r.testAttemptId || `${r.testId}_${r.attemptedAt}`);
        const ev = evaluatedAttemptsMap.get(key);

        let score, max;
        if (subject && subject !== 'ALL' && ev?.subjects) {
            const sMatch = ev.subjects.find(s => s.subject.toLowerCase() === subject.toLowerCase());
            score = sMatch ? sMatch.score : (r.marksObtained ?? r.score ?? 0);
            max = sMatch ? sMatch.maxMarks : (r.maximumMarks ?? r.totalMarks ?? 180);
        } else {
            score = typeof r.marksObtained === 'number' ? r.marksObtained : (r.score || 0);
            max = typeof r.maximumMarks === 'number' ? r.maximumMarks : (r.totalMarks || (score > 360 ? 720 : 360));
        }

        const pct = max > 0 ? (score / max) * 100 : 0;
        const testTitle = r.testTitle || r.title || r.testId || 'Test';
        const date = r.attemptedAt || r.date;

        totalScoreSum += score;
        totalMaxMarksSum += max;
        totalPctSum += pct;

        if (allSameMaxMarks) {
            if (!bestAttempt || score > bestRaw) {
                bestRaw = score;
                bestAttempt = { score, maximumMarks: max, percentage: Number(pct.toFixed(1)), testTitle, date };
            }
        } else {
            // Compare by percentage when maximum marks differ across tests in scope
            if (!bestAttempt || pct > bestPct || (pct === bestPct && score > bestRaw)) {
                bestPct = pct;
                bestRaw = score;
                bestAttempt = { score, maximumMarks: max, percentage: Number(pct.toFixed(1)), testTitle, date };
            }
        }

        totalTimeTaken += (r.timeTaken || 0);

        const c = ev ? ev.correctCount : (typeof r.correctAnswers === 'number' ? r.correctAnswers : (r.correct || 0));
        const w = ev ? ev.wrongCount : (typeof r.wrongAnswers === 'number' ? r.wrongAnswers : (r.wrong || 0));
        const u = ev ? ev.unattemptedCount : (typeof r.unattemptedQuestions === 'number' ? r.unattemptedQuestions : (r.unattempted || 0));
        const qCount = ev ? ev.totalQuestions : (typeof r.totalQuestions === 'number' ? r.totalQuestions : (c + w + u));

        totalCorrect += c;
        totalWrong += w;
        totalUnattempted += u;
        totalAssignedQuestions += qCount;

        totalNegativeMarksLost += ev ? ev.totalNegativeMarksLost : (w * 1);
    });

    // Best Score Details (Card 2)
    let bestScoreDetails;
    if (!bestAttempt || testsTaken === 0) {
        bestScoreDetails = {
            score: 0,
            maximumMarks: 0,
            percentage: 0,
            testTitle: '',
            displayScore: 'N/A',
            displaySub: 'No attempts in scope',
            hasAttempts: false,
            allSameMaxMarks: true
        };
    } else {
        bestScoreDetails = {
            score: bestAttempt.score,
            maximumMarks: bestAttempt.maximumMarks,
            percentage: bestAttempt.percentage,
            testTitle: bestAttempt.testTitle,
            displayScore: `${bestAttempt.score} / ${bestAttempt.maximumMarks}`,
            displaySub: allSameMaxMarks && testId !== 'ALL'
                ? `${bestAttempt.percentage}% · Highest achieved`
                : `${bestAttempt.percentage}% · ${bestAttempt.testTitle}`,
            hasAttempts: true,
            allSameMaxMarks
        };
    }

    // Latest Score Details (Card 3)
    let latestScoreDetails;
    if (sortedByDateDesc.length === 0) {
        latestScoreDetails = {
            score: 0,
            maximumMarks: 0,
            percentage: 0,
            testTitle: '',
            date: null,
            formattedDate: '',
            displayScore: 'N/A',
            displaySub: 'No attempts in scope',
            hasAttempts: false
        };
    } else {
        const latestR = sortedByDateDesc[0];
        const key = latestR._id ? String(latestR._id) : (latestR.testAttemptId || `${latestR.testId}_${latestR.attemptedAt}`);
        const ev = evaluatedAttemptsMap.get(key);

        let lScore, lMax;
        if (subject && subject !== 'ALL' && ev?.subjects) {
            const sMatch = ev.subjects.find(s => s.subject.toLowerCase() === subject.toLowerCase());
            lScore = sMatch ? sMatch.score : (latestR.marksObtained ?? latestR.score ?? 0);
            lMax = sMatch ? sMatch.maxMarks : (latestR.maximumMarks ?? latestR.totalMarks ?? 180);
        } else {
            lScore = typeof latestR.marksObtained === 'number' ? latestR.marksObtained : (latestR.score || 0);
            lMax = typeof latestR.maximumMarks === 'number' ? latestR.maximumMarks : (latestR.totalMarks || (lScore > 360 ? 720 : 360));
        }

        const lPct = lMax > 0 ? Number(((lScore / lMax) * 100).toFixed(1)) : 0;
        const lTitle = latestR.testTitle || latestR.title || latestR.testId || 'Test';
        const lDate = latestR.attemptedAt || latestR.date;
        const formattedDate = lDate ? new Date(lDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';

        latestScoreDetails = {
            score: lScore,
            maximumMarks: lMax,
            percentage: lPct,
            testTitle: lTitle,
            date: lDate,
            formattedDate,
            displayScore: `${lScore} / ${lMax}`,
            displaySub: `${lPct}% · ${lTitle}${formattedDate ? ` (${formattedDate})` : ''}`,
            hasAttempts: true
        };
    }

    const averageScore = testsTaken > 0 ? Math.round(totalScoreSum / testsTaken) : 0;
    const averageScorePercentage = safeDivide(totalPctSum, testsTaken);
    const totalAnswered = totalCorrect + totalWrong;
    const averageAccuracy = safeDivide(totalCorrect, totalAnswered, 100);
    const averageAttemptRate = safeDivide(totalAnswered, totalAssignedQuestions, 100);

    const summaryKPIs = {
        testsTaken,
        uniqueTests,
        eligibleAttempts,
        bestScore: bestScoreDetails.hasAttempts ? bestScoreDetails.score : 0,
        bestScoreDetails,
        latestScore: latestScoreDetails.hasAttempts ? latestScoreDetails.score : 0,
        latestScoreDetails,
        bestRankAllTests,
        averageScore,
        averageScorePercentage,
        totalCorrect,
        totalWrong,
        totalUnattempted,
        averageAccuracy,
        averageAttemptRate,
        totalNegativeMarksLost,
        totalTimeSeconds: totalTimeTaken,
        totalTimeFormatted: formatDurationSeconds(totalTimeTaken)
    };

    // 7. Build Authoritative Category-Isolated Score Trend & Negative Marking Models
    // Complete Exams and Focused Tests are strictly separated to prevent connecting different maximum marks
    const completeExamTrend = [];
    const focusedTrend = [];
    const subjectCrossTestTrend = [];
    const categoryTrend = [];

    const allChronological = [...activeResults].sort((a, b) => new Date(a.attemptedAt || 0) - new Date(b.attemptedAt || 0));

    allChronological.forEach((r, idx) => {
        const key = r._id ? String(r._id) : (r.testAttemptId || `${r.testId}_${r.attemptedAt}`);
        const ev = evaluatedAttemptsMap.get(key);
        const catInfo = categorizeTestId(r.testId, r.isLiveAttempt);
        const examInfo = extractExamType(r);

        const score = typeof r.marksObtained === 'number' ? r.marksObtained : (r.score || 0);
        const max = typeof r.maximumMarks === 'number' ? r.maximumMarks : (r.totalMarks || (score > 360 ? 720 : 360));
        const pct = max > 0 ? Number(((score / max) * 100).toFixed(2)) : 0;
        const testTitle = r.testTitle || r.title || r.testId || 'Test';
        const formattedDate = new Date(r.attemptedAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

        const itemBase = {
            attemptIndex: idx + 1,
            attemptId: r._id ? String(r._id) : (r.testAttemptId || `att-${idx}`),
            testId: r.testId,
            testTitle,
            category: catInfo.id,
            categoryLabel: catInfo.label,
            isCompleteExam: catInfo.isCompleteExam,
            isFocused: catInfo.isFocused,
            examType: examInfo.id,
            examName: examInfo.name,
            date: formattedDate,
            rawDate: r.attemptedAt,
            score,
            maximumMarks: max,
            percentage: pct,
            wrongCount: ev ? ev.wrongCount : (r.wrongAnswers || 0),
            correctCount: ev ? ev.correctCount : (r.correctAnswers || 0),
            unattemptedCount: ev ? ev.unattemptedCount : (r.unattemptedQuestions || 0),
            negativeMarksLost: ev ? ev.totalNegativeMarksLost : ((r.wrongAnswers || 0) * 1),
            signedDeduction: -(ev ? ev.totalNegativeMarksLost : ((r.wrongAnswers || 0) * 1)),
            status: r.status || 'SUBMITTED',
            isLiveAttempt: Boolean(r.isLiveAttempt),
            rank: r.rank || 'N/A',
            totalStudents: r.totalStudents || 0
        };

        // Complete Exam series (Part, Live, Mock)
        if (catInfo.isCompleteExam && (exam === 'ALL' || examInfo.id === exam)) {
            completeExamTrend.push({
                ...itemBase,
                scoreScope: 'OVERALL'
            });
        }

        // Focused Test series (Chapterwise, Topicwise, Subjectwise)
        if (catInfo.isFocused && (exam === 'ALL' || examInfo.id === exam)) {
            focusedTrend.push({
                ...itemBase,
                scoreScope: 'FOCUSED'
            });
        }

        // Filtered Category Trend
        const normSelectedCat = category === 'FULL' ? 'MOCK' : (category === 'SUBTOPIC' ? 'TOPIC' : category);
        const itemCat = catInfo.id === 'FULL' ? 'MOCK' : (catInfo.id === 'SUBTOPIC' ? 'TOPIC' : catInfo.id);
        if (normSelectedCat !== 'ALL' && itemCat === normSelectedCat && (exam === 'ALL' || examInfo.id === exam)) {
            categoryTrend.push({
                ...itemBase,
                scoreScope: catInfo.isCompleteExam ? 'OVERALL' : 'FOCUSED'
            });
        }

        // Subject Extraction across all 6 supported test types
        if (ev && ev.subjects && ev.subjects.length > 0) {
            ev.subjects.forEach(s => {
                if (subject !== 'ALL' && s.subject.toLowerCase() !== subject.toLowerCase()) {
                    return;
                }
                if (exam !== 'ALL' && examInfo.id !== exam) {
                    return;
                }
                subjectCrossTestTrend.push({
                    attemptIndex: idx + 1,
                    attemptId: r._id ? String(r._id) : (r.testAttemptId || `att-${idx}`),
                    testId: r.testId,
                    testTitle,
                    category: catInfo.id,
                    categoryLabel: catInfo.label,
                    isCompleteExam: catInfo.isCompleteExam,
                    isFocused: catInfo.isFocused,
                    examType: examInfo.id,
                    scoreScope: 'SUBJECT',
                    subject: s.subject,
                    date: formattedDate,
                    rawDate: r.attemptedAt,
                    score: s.score,
                    maximumMarks: s.maxMarks,
                    percentage: s.percentage,
                    wrongCount: s.wrong,
                    correctCount: s.correct,
                    unattemptedCount: s.unattempted,
                    negativeMarksLost: s.negativeMarksLost,
                    signedDeduction: -s.negativeMarksLost,
                    status: r.status || 'SUBMITTED',
                    isLiveAttempt: Boolean(r.isLiveAttempt)
                });
            });
        }
    });

    // Determine current Score Trend observations
    let activeScoreTrend = [];
    if (subject && subject !== 'ALL') {
        // Individual Subject extracted trend across all compatible test types
        activeScoreTrend = subjectCrossTestTrend;
    } else if (category && category !== 'ALL') {
        activeScoreTrend = categoryTrend;
    } else {
        // All categories: keep observations separate so complete exams and focused tests don't merge into one line
        activeScoreTrend = chronologicalResults.map((r, i) => {
            const catInfo = categorizeTestId(r.testId, r.isLiveAttempt);
            const key = r._id ? String(r._id) : (r.testAttemptId || `${r.testId}_${r.attemptedAt}`);
            const ev = evaluatedAttemptsMap.get(key);
            const score = typeof r.marksObtained === 'number' ? r.marksObtained : (r.score || 0);
            const max = typeof r.maximumMarks === 'number' ? r.maximumMarks : (r.totalMarks || (score > 360 ? 720 : 360));
            const pct = max > 0 ? Number(((score / max) * 100).toFixed(2)) : 0;

            return {
                attemptIndex: i + 1,
                attemptId: r._id ? String(r._id) : (r.testAttemptId || `att-${i}`),
                testId: r.testId,
                testTitle: r.testTitle || r.title || r.testId,
                category: catInfo.id,
                categoryLabel: catInfo.label,
                isCompleteExam: catInfo.isCompleteExam,
                isFocused: catInfo.isFocused,
                date: new Date(r.attemptedAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                rawDate: r.attemptedAt,
                score,
                maximumMarks: max,
                percentage: pct,
                // Separate fields for dual-line plotting: lines will not connect incompatible scopes
                completeExamScore: catInfo.isCompleteExam ? score : null,
                focusedScore: catInfo.isFocused ? score : null,
                wrongCount: ev ? ev.wrongCount : (r.wrongAnswers || 0),
                negativeMarksLost: ev ? ev.totalNegativeMarksLost : ((r.wrongAnswers || 0) * 1),
                signedDeduction: -(ev ? ev.totalNegativeMarksLost : ((r.wrongAnswers || 0) * 1)),
                status: r.status || 'SUBMITTED',
                isLiveAttempt: Boolean(r.isLiveAttempt)
            };
        });
    }

    // Attach sub-trends directly to array object
    activeScoreTrend.completeExamTrend = completeExamTrend;
    activeScoreTrend.focusedTrend = focusedTrend;
    activeScoreTrend.subjectCrossTestTrend = subjectCrossTestTrend;
    activeScoreTrend.categoryTrend = categoryTrend;

    // 8. Build Authoritative Negative Marking Trend Models (MANDATORY RED: #ef4444)
    const completeExamNegativeTrend = completeExamTrend.map(item => ({
        ...item,
        fill: '#ef4444',
        stroke: '#ef4444'
    }));

    const focusedNegativeTrend = focusedTrend.map(item => ({
        ...item,
        fill: '#ef4444',
        stroke: '#ef4444'
    }));

    const subjectCrossTestNegativeTrend = subjectCrossTestTrend.map(item => ({
        ...item,
        fill: '#ef4444',
        stroke: '#ef4444'
    }));

    let activeNegativeTrend = [];
    if (subject && subject !== 'ALL') {
        activeNegativeTrend = subjectCrossTestNegativeTrend;
    } else if (category && category !== 'ALL') {
        activeNegativeTrend = categoryTrend.map(item => ({ ...item, fill: '#ef4444', stroke: '#ef4444' }));
    } else {
        activeNegativeTrend = activeScoreTrend.map(item => ({
            ...item,
            completeExamNegativeMarksLost: item.isCompleteExam ? item.negativeMarksLost : null,
            focusedNegativeMarksLost: item.isFocused ? item.negativeMarksLost : null,
            fill: '#ef4444',
            stroke: '#ef4444'
        }));
    }

    activeNegativeTrend.completeExamTrend = completeExamNegativeTrend;
    activeNegativeTrend.focusedTrend = focusedNegativeTrend;
    activeNegativeTrend.subjectCrossTestTrend = subjectCrossTestNegativeTrend;

    // 9. Selected Attempt Evaluation
    let targetAttemptResult = null;
    if (attemptId) {
        targetAttemptResult = scopedResults.find(r =>
            String(r._id) === String(attemptId) || r.testAttemptId === attemptId
        );
    }
    if (!targetAttemptResult && chronologicalResults.length > 0) {
        targetAttemptResult = chronologicalResults[chronologicalResults.length - 1];
    }

    const evaluatedAttempt = targetAttemptResult ? evaluateAttempt(targetAttemptResult) : null;

    // Attach reconciled negative marking breakdowns and audit summary
    activeNegativeTrend.bySubject = evaluatedAttempt ? evaluatedAttempt.incorrectBySubject : [];
    activeNegativeTrend.byChapter = evaluatedAttempt ? evaluatedAttempt.incorrectByChapter : [];
    activeNegativeTrend.byTopic = evaluatedAttempt ? evaluatedAttempt.incorrectByTopic : [];
    activeNegativeTrend.audit = {
        totalWrong: evaluatedAttempt ? evaluatedAttempt.wrongCount : 0,
        totalNegativeMarksLost: evaluatedAttempt ? evaluatedAttempt.totalNegativeMarksLost : 0,
        signedDeduction: evaluatedAttempt ? -(evaluatedAttempt.totalNegativeMarksLost) : 0,
        grossScore: (evaluatedAttempt ? evaluatedAttempt.correctCount : 0) * (evaluatedAttempt?.examType === 'bitsat' ? 3 : 4),
        netScore: evaluatedAttempt ? evaluatedAttempt.obtainedMarks : 0,
        maximumMarks: evaluatedAttempt ? evaluatedAttempt.maximumMarks : 0
    };

    // Apply Subject Filter on Evaluated Attempt details
    let filteredSubjects = evaluatedAttempt ? evaluatedAttempt.subjects : [];
    let filteredChapters = evaluatedAttempt ? evaluatedAttempt.chapters : [];
    let filteredTopics = evaluatedAttempt ? evaluatedAttempt.topics : [];
    let filteredIncorrectQuestions = evaluatedAttempt ? evaluatedAttempt.incorrectQuestions : [];
    let filteredIncorrectBySubject = evaluatedAttempt ? evaluatedAttempt.incorrectBySubject : [];
    let filteredIncorrectByChapter = evaluatedAttempt ? evaluatedAttempt.incorrectByChapter : [];
    let filteredQuestions = evaluatedAttempt ? evaluatedAttempt.questions : [];

    if (subject && subject !== 'ALL' && evaluatedAttempt) {
        filteredSubjects = filteredSubjects.filter(s => s.subject.toLowerCase() === subject.toLowerCase());
        filteredChapters = filteredChapters.filter(c => c.subject.toLowerCase() === subject.toLowerCase());
        filteredTopics = filteredTopics.filter(t => t.subject.toLowerCase() === subject.toLowerCase());
        filteredIncorrectQuestions = filteredIncorrectQuestions.filter(q => q.subject.toLowerCase() === subject.toLowerCase());
        filteredIncorrectBySubject = filteredIncorrectBySubject.filter(s => s.subject.toLowerCase() === subject.toLowerCase());
        filteredIncorrectByChapter = filteredIncorrectByChapter.filter(c => c.subject.toLowerCase() === subject.toLowerCase());
        filteredQuestions = filteredQuestions.filter(q => q.subject.toLowerCase() === subject.toLowerCase());
    }

    // 10. Evidence-based Student Improvement Plan
    const improvementPlan = evaluatedAttempt ? generateImprovementPlan(evaluatedAttempt) : [];

    // 11. Attempt Comparison
    let comparison = null;
    if (compareAttemptId && evaluatedAttempt) {
        const compRaw = activeResults.find(r =>
            String(r._id) === String(compareAttemptId) || r.testAttemptId === compareAttemptId
        );
        if (compRaw) {
            const compEvaluated = evaluateAttempt(compRaw);
            if (compEvaluated) {
                comparison = {
                    attemptA: {
                        attemptId: evaluatedAttempt.attemptId,
                        testId: evaluatedAttempt.testId,
                        date: evaluatedAttempt.attemptedAt,
                        score: evaluatedAttempt.obtainedMarks,
                        maxMarks: evaluatedAttempt.maximumMarks,
                        percentage: evaluatedAttempt.scorePercentage,
                        accuracy: evaluatedAttempt.accuracy,
                        attemptRate: evaluatedAttempt.attemptRate,
                        correct: evaluatedAttempt.correctCount,
                        wrong: evaluatedAttempt.wrongCount,
                        unattempted: evaluatedAttempt.unattemptedCount,
                        negativeMarks: evaluatedAttempt.totalNegativeMarksLost,
                        duration: evaluatedAttempt.timeFormatted
                    },
                    attemptB: {
                        attemptId: compEvaluated.attemptId,
                        testId: compEvaluated.testId,
                        date: compEvaluated.attemptedAt,
                        score: compEvaluated.obtainedMarks,
                        maxMarks: compEvaluated.maximumMarks,
                        percentage: compEvaluated.scorePercentage,
                        accuracy: compEvaluated.accuracy,
                        attemptRate: compEvaluated.attemptRate,
                        correct: compEvaluated.correctCount,
                        wrong: compEvaluated.wrongCount,
                        unattempted: compEvaluated.unattemptedCount,
                        negativeMarks: compEvaluated.totalNegativeMarksLost,
                        duration: compEvaluated.timeFormatted
                    },
                    diff: {
                        score: evaluatedAttempt.obtainedMarks - compEvaluated.obtainedMarks,
                        percentage: Number((evaluatedAttempt.scorePercentage - compEvaluated.scorePercentage).toFixed(2)),
                        accuracy: Number((evaluatedAttempt.accuracy - compEvaluated.accuracy).toFixed(2)),
                        negativeMarks: evaluatedAttempt.totalNegativeMarksLost - compEvaluated.totalNegativeMarksLost,
                        correct: evaluatedAttempt.correctCount - compEvaluated.correctCount,
                        wrong: evaluatedAttempt.wrongCount - compEvaluated.wrongCount
                    }
                };
            }
        }
    }

    // Active Scope Breadcrumb
    const activeScope = {
        exam: exam === 'ALL' ? 'All Exams' : (availableFilters.exams.find(e => e.id === exam)?.name || exam.toUpperCase()),
        category: category === 'ALL' ? 'All Categories' : categorizeTestId(category).label,
        testId: testId === 'ALL' ? 'All Tests' : (evaluatedAttempt?.testTitle || testId),
        subject: subject === 'ALL' ? 'All Subjects' : subject,
        attemptId: evaluatedAttempt?.attemptId || 'Latest'
    };

    return {
        summary: summaryKPIs,
        availableFilters,
        activeScope,
        scoreTrend: activeScoreTrend,
        scoreTrendDetails: {
            observations: activeScoreTrend,
            completeExamTrend,
            focusedTrend,
            subjectCrossTestTrend,
            categoryTrend
        },
        negativeMarking: activeNegativeTrend,
        negativeMarkingDetails: {
            observations: activeNegativeTrend,
            completeExamTrend: completeExamNegativeTrend,
            focusedTrend: focusedNegativeTrend,
            subjectCrossTestTrend: subjectCrossTestNegativeTrend,
            bySubject: evaluatedAttempt ? evaluatedAttempt.incorrectBySubject : [],
            byChapter: evaluatedAttempt ? evaluatedAttempt.incorrectByChapter : [],
            byTopic: evaluatedAttempt ? evaluatedAttempt.incorrectByTopic : [],
            audit: activeNegativeTrend.audit
        },
        selectedAttempt: evaluatedAttempt ? {
            ...evaluatedAttempt,
            subjects: filteredSubjects,
            chapters: filteredChapters,
            topics: filteredTopics,
            questions: filteredQuestions,
            incorrectQuestions: filteredIncorrectQuestions,
            incorrectBySubject: filteredIncorrectBySubject,
            incorrectByChapter: filteredIncorrectByChapter
        } : null,
        improvementPlan,
        comparison,
        dataQualityWarnings: evaluatedAttempt ? evaluatedAttempt.dataQualityWarnings : []
    };
}
