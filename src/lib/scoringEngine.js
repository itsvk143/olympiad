import { normalizeCorrectOption } from './questionFormatter.js';

/**
 * Standard question answer matching helper.
 * Finds student's answer whether keyed by:
 * 1. q.id (numeric or string)
 * 2. 1-based index (e.g. 46, "46")
 * 3. q._id (ObjectId string)
 * 4. 0-based index (fallback)
 */
export function getAnswerForQuestion(answers, q, index) {
    if (!answers || typeof answers !== 'object') return undefined;

    // 1. Explicit question ID on question object (numeric or string)
    if (q.id !== undefined && q.id !== null) {
        if (answers[q.id] !== undefined) return answers[q.id];
        if (answers[String(q.id)] !== undefined) return answers[String(q.id)];
    }

    // 2. MongoDB ObjectId (string or ObjectId)
    if (q._id !== undefined && q._id !== null) {
        const idStr = q._id.toString();
        if (answers[idStr] !== undefined) return answers[idStr];
    }

    // 3. Question Number / 1-based index (e.g. 46, "46")
    if (q.qNum !== undefined && q.qNum !== null) {
        if (answers[q.qNum] !== undefined) return answers[q.qNum];
        if (answers[String(q.qNum)] !== undefined) return answers[String(q.qNum)];
    }
    if (typeof index === 'number') {
        const qNum = index + 1;
        if (answers[qNum] !== undefined) return answers[qNum];
        if (answers[String(qNum)] !== undefined) return answers[String(qNum)];
    }

    // 4. 0-based index fallback (ONLY if answers object actually contains key 0)
    if (typeof index === 'number' && (answers[0] !== undefined || answers['0'] !== undefined)) {
        if (answers[index] !== undefined) return answers[index];
        if (answers[String(index)] !== undefined) return answers[String(index)];
    }

    return undefined;
}

/**
 * Canonical test scoring function.
 * Evaluates student responses against authoritative questions and marking scheme.
 * 
 * @param {Object} params
 * @param {Object} params.answers - Student submitted answers map
 * @param {Array} params.questions - Array of question objects
 * @param {Object} [params.testDefinition] - Test metadata (totalMarks, examType, etc.)
 * @param {Object} [params.customMarkingScheme] - Custom posMarks/negMarks
 * @returns {Object} Comprehensive evaluation result
 */
export function calculateTestResult({
    answers = {},
    questions = [],
    testDefinition = {},
    customMarkingScheme = null,
    timeSpent = {}
}) {
    const isTestEmpty = !Array.isArray(questions) || questions.length === 0;

    const testId = (testDefinition.id || testDefinition.testId || '').toLowerCase();
    const examType = (testDefinition.examType || testDefinition.category || '').toLowerCase();

    // Olympiad default marking scheme (1 mark, 0 negative marks unless specified)
    const defaultPosMarks = testDefinition.marksPerQuestion ?? 1;
    const defaultNegMarks = testDefinition.negativeMarks ?? 0;

    let totalQuestions = questions?.length || 0;
    let evaluatedQuestions = 0;
    let attemptedQuestions = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let marksObtained = 0;
    let maximumMarks = 0;

    const subjectWiseResults = {};

    if (!isTestEmpty) {
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            evaluatedQuestions++;

            const posMarks = customMarkingScheme?.posMarks ?? q.marks ?? defaultPosMarks;
            const negMarks = customMarkingScheme?.negMarks ?? q.negativeMarks ?? defaultNegMarks;

            maximumMarks += posMarks;

            // Initialize subject aggregation
            const subjName = (q.subject || 'General').trim();
            if (!subjectWiseResults[subjName]) {
                subjectWiseResults[subjName] = {
                    subject: subjName,
                    total: 0,
                    attempted: 0,
                    correct: 0,
                    wrong: 0,
                    unattempted: 0,
                    score: 0,
                    maxMarks: 0,
                    percentage: 0,
                    accuracy: 0,
                    time: 0
                };
            }
            subjectWiseResults[subjName].total++;
            subjectWiseResults[subjName].maxMarks += posMarks;

            const clientAns = getAnswerForQuestion(answers, q, i);
            const hasAnswer = clientAns !== undefined && clientAns !== null && String(clientAns).trim() !== '';

            // Accumulate time spent if available
            const qKey = q.id !== undefined ? String(q.id) : (q._id ? String(q._id) : String(i + 1));
            const qTime = timeSpent[qKey] || (timeSpent[i + 1] ?? 0);
            if (typeof qTime === 'number' && qTime > 0) {
                subjectWiseResults[subjName].time += qTime;
            }

            if (hasAnswer) {
                attemptedQuestions++;
                subjectWiseResults[subjName].attempted++;

                const isNumerical = (q.type || q.questionType || '').toString().toUpperCase().includes('NUMERICAL');
                const rawAns = q.correctOption ?? q.correctAnswer ?? q.answer;

                let isMatch = false;
                if (isNumerical) {
                    const normExpected = String(rawAns ?? '').trim().toLowerCase();
                    const normActual = String(clientAns).trim().toLowerCase();
                    isMatch = normExpected.length > 0 && normExpected === normActual;
                    if (!isMatch && !isNaN(Number(normExpected)) && !isNaN(Number(normActual))) {
                        isMatch = Math.abs(Number(normExpected) - Number(normActual)) < 0.0001;
                    }
                } else {
                    const normalizedExpected = normalizeCorrectOption(rawAns, q.options);
                    const normalizedActual = String(clientAns).trim().toLowerCase();
                    isMatch = normalizedActual === normalizedExpected.toLowerCase();
                }

                if (isMatch) {
                    correctAnswers++;
                    marksObtained += posMarks;
                    subjectWiseResults[subjName].correct++;
                    subjectWiseResults[subjName].score += posMarks;
                } else {
                    wrongAnswers++;
                    marksObtained -= negMarks;
                    subjectWiseResults[subjName].wrong++;
                    subjectWiseResults[subjName].score -= negMarks;
                }
            } else {
                subjectWiseResults[subjName].unattempted++;
            }
        }
    }

    // Override maximumMarks if testDefinition specifies an explicit positive totalMarks and questions were empty
    if (maximumMarks === 0 && testDefinition.totalMarks) {
        maximumMarks = Number(testDefinition.totalMarks);
    }

    const unattemptedQuestions = Math.max(0, totalQuestions - attemptedQuestions);
    const percentage = maximumMarks > 0 ? Number(((marksObtained / maximumMarks) * 100).toFixed(2)) : 0;
    const accuracy = attemptedQuestions > 0 ? Number(((correctAnswers / attemptedQuestions) * 100).toFixed(2)) : 0;

    // Finalize subject percentages and accuracy
    for (const subj of Object.values(subjectWiseResults)) {
        subj.unattempted = Math.max(0, subj.total - subj.attempted);
        subj.percentage = subj.maxMarks > 0 ? Number(((subj.score / subj.maxMarks) * 100).toFixed(2)) : 0;
        subj.accuracy = subj.attempted > 0 ? Number(((subj.correct / subj.attempted) * 100).toFixed(2)) : 0;
    }

    const evaluationStatus = totalQuestions > 0 ? 'EVALUATED' : 'PENDING';

    return {
        totalQuestions,
        evaluatedQuestions,
        attemptedQuestions,
        correctAnswers,
        wrongAnswers,
        unattemptedQuestions,
        marksObtained,
        maximumMarks,
        score: marksObtained,      // Schema compatibility
        totalMarks: maximumMarks,  // Schema compatibility
        percentage,
        accuracy,
        subjectWiseResults,
        subjectStats: subjectWiseResults, // Schema compatibility
        evaluationStatus
    };
}
