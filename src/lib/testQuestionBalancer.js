import { ObjectId } from 'mongodb';

export const isAR = (q) => {
    if (!q) return false;
    const t = (q.questionType || q.type || '').toString().toUpperCase();
    return t.includes('ASSERTION') || t.includes('AR') || (q.assertion && q.assertion.trim().length > 0);
};

export const toValidObjectId = (id) => {
    if (!id) return null;
    const s = (typeof id === 'object' && id._id) ? id._id.toString() : id.toString();
    return ObjectId.isValid(s) ? new ObjectId(s) : null;
};

/**
 * Interleaves non-AR and AR questions evenly so no two AR questions are consecutive.
 */
export function interleaveQuestions(nonAR, ar) {
    if (!ar || ar.length === 0) return [...(nonAR || [])];
    if (!nonAR || nonAR.length === 0) return [...ar];

    const total = nonAR.length + ar.length;
    const numAR = ar.length;
    const interval = Math.max(2, Math.floor(total / (numAR + 1)));

    const arPositions = new Set();
    let nextPos = interval - 1;
    for (let i = 0; i < numAR; i++) {
        while (nextPos < total && arPositions.has(nextPos)) {
            nextPos++;
        }
        if (nextPos < total) {
            arPositions.add(nextPos);
        }
        nextPos += interval;
    }

    const result = [];
    let nonArIdx = 0;
    let arIdx = 0;

    for (let i = 0; i < total; i++) {
        if (arPositions.has(i) && arIdx < ar.length) {
            if (result.length > 0 && isAR(result[result.length - 1])) {
                if (nonArIdx < nonAR.length) {
                    result.push(nonAR[nonArIdx++]);
                }
            }
            result.push(ar[arIdx++]);
        } else if (nonArIdx < nonAR.length) {
            result.push(nonAR[nonArIdx++]);
        } else if (arIdx < ar.length) {
            if (result.length > 0 && isAR(result[result.length - 1])) {
                if (nonArIdx < nonAR.length) {
                    result.push(nonAR[nonArIdx++]);
                }
            }
            result.push(ar[arIdx++]);
        }
    }

    while (nonArIdx < nonAR.length) result.push(nonAR[nonArIdx++]);
    while (arIdx < ar.length) {
        if (result.length > 0 && isAR(result[result.length - 1])) {
            result.splice(result.length - 1, 0, ar[arIdx++]);
        } else {
            result.push(ar[arIdx++]);
        }
    }

    return result;
}

/**
 * Enforces:
 * 1. For JEE: Maximum 5 AR questions, placed consecutively at the end.
 * 2. For NEET: Maximum 6 AR questions, interleaved non-consecutively.
 * 3. Excess AR questions replaced with matching topic/subject MCQs.
 *
 * @param {Array} questions - Array of question objects from questionBank
 * @param {Object} db - MongoDB database instance (optional, for fetching replacement MCQs)
 * @param {String} testId - Test identifier
 * @param {String} exam - Exam name ('NEET', 'JEE Main', etc.)
 * @returns {Promise<{ balancedQuestions: Array, wasModified: boolean }>}
 */
export async function balanceTestQuestions(questions, db = null, testId = null, exam = null) {
    if (!questions || questions.length === 0) {
        return { balancedQuestions: [], wasModified: false };
    }

    const tid = (testId || '').toLowerCase();
    const ex = (exam || '').toLowerCase();

    // BITSAT follows a dedicated 130-question blueprint without NEET/JEE AR restructuring
    if (tid.startsWith('bitsat') || ex.includes('bitsat')) {
        return { balancedQuestions: questions, wasModified: false };
    }

    const isJEE = tid.startsWith('jee') || ex.includes('jee');
    const isNEET = tid.startsWith('neet') || ex.includes('neet');

    const isBadNeetQ = (q) => {
        if (!q) return true;
        const rawType = (q.questionType || q.type || '').toString().toUpperCase();
        if (rawType.includes('NUMERICAL') || rawType.includes('NUMERIC') || rawType === 'INTEGER') return true;
        if (!Array.isArray(q.options) || q.options.length < 2) return true;
        return false;
    };
    const hasBadNeetQ = isNEET && questions.some(isBadNeetQ);

    const maxTotalAR = isJEE ? 5 : 6;
    const totalAR = questions.filter(isAR).length;

    let arAtEnd = true;
    if (totalAR > 0) {
        const lastSlice = questions.slice(questions.length - totalAR);
        const allLastAreAR = lastSlice.every(isAR);
        const anyBeforeAreAR = questions.slice(0, questions.length - totalAR).some(isAR);
        arAtEnd = allLastAreAR && !anyBeforeAreAR;
    }

    // If test series already strictly conforms (no bad questions, AR <= max quota and all AR at the end), return immediately
    if (!hasBadNeetQ && totalAR <= maxTotalAR && arAtEnd) {
        return { balancedQuestions: questions, wasModified: false };
    }

    // Group questions by subject
    const subjects = [];
    const bySubj = new Map();
    for (const q of questions) {
        const s = q.subject || 'Other';
        if (!bySubj.has(s)) {
            subjects.push(s);
            bySubj.set(s, []);
        }
        bySubj.get(s).push(q);
    }

    const arToKeepTotal = Math.min(totalAR, maxTotalAR);

    // Calculate quotas per subject
    const subjQuotas = new Map();
    let remainingQuota = arToKeepTotal;
    const numSubjs = subjects.length;
    const baseQuota = Math.floor(arToKeepTotal / numSubjs);

    for (const s of subjects) {
        const sAR = bySubj.get(s).filter(isAR).length;
        const q = Math.min(sAR, baseQuota);
        subjQuotas.set(s, q);
        remainingQuota -= q;
    }
    for (const s of subjects) {
        if (remainingQuota <= 0) break;
        const sAR = bySubj.get(s).filter(isAR).length;
        const cur = subjQuotas.get(s) || 0;
        if (sAR > cur) {
            subjQuotas.set(s, cur + 1);
            remainingQuota--;
        }
    }

    const usedIds = new Set(
        questions
            .map(q => (q._id ? q._id.toString() : q.id ? q.id.toString() : ''))
            .filter(Boolean)
    );

    const balancedFinal = [];

    for (const s of subjects) {
        const sQs = bySubj.get(s);
        const sAR = sQs.filter(isAR);
        const sNonAR = sQs.filter(q => !isAR(q) && !(isNEET && isBadNeetQ(q)));
        const badCount = isNEET ? sQs.filter(q => !isAR(q) && isBadNeetQ(q)).length : 0;

        const quota = subjQuotas.get(s) || 0;
        const keptAR = sAR.slice(0, quota);
        const excessAR = sAR.slice(quota);
        const excessCount = excessAR.length;
        const totalNeedReplacement = excessCount + badCount;

        let replacements = [];
        if (totalNeedReplacement > 0 && db) {
            // Find topic identifiers from the excess AR and bad questions
            const badQsInSub = isNEET ? sQs.filter(q => !isAR(q) && isBadNeetQ(q)) : [];
            const topics = [...new Set([...excessAR, ...badQsInSub].map(q => q.subTopic || q.chapter || q.topic).filter(Boolean))];
            const filterIds = [...usedIds].map(toValidObjectId).filter(Boolean);

            const topicFilter = topics.length > 0 ? {
                $or: [
                    { subTopic: { $in: topics } },
                    { chapter: { $in: topics } },
                    { topic: { $in: topics } }
                ]
            } : {};

            const neetExcludeFilter = isNEET ? [
                { questionType: { $regex: /assertion|ar|numerical|numeric|integer/i } },
                { type: { $regex: /assertion|ar|numerical|numeric|integer/i } },
                { options: { $size: 0 } },
                { options: null },
                { options: { $exists: false } }
            ] : [
                { questionType: { $regex: /assertion|ar/i } },
                { type: { $regex: /assertion|ar/i } }
            ];

            const neetExtraQuery = isNEET ? { 'options.1': { $exists: true } } : {};

            try {
                const candidates = await db.collection('questionBank').find({
                    _id: { $nin: filterIds },
                    subject: s,
                    ...topicFilter,
                    ...neetExtraQuery,
                    $nor: neetExcludeFilter
                }).limit(totalNeedReplacement).toArray();

                candidates.forEach(c => {
                    replacements.push(c);
                    usedIds.add(c._id.toString());
                });

                // If not enough candidate MCQs in exact topics, fallback to subject-level MCQs
                if (replacements.length < totalNeedReplacement) {
                    const needed = totalNeedReplacement - replacements.length;
                    const fallbackFilterIds = [...usedIds].map(toValidObjectId).filter(Boolean);
                    const fallbackCandidates = await db.collection('questionBank').find({
                        _id: { $nin: fallbackFilterIds },
                        subject: s,
                        ...neetExtraQuery,
                        $nor: neetExcludeFilter
                    }).limit(needed).toArray();

                    fallbackCandidates.forEach(c => {
                        replacements.push(c);
                        usedIds.add(c._id.toString());
                    });
                }
            } catch (err) {
                console.error('Error fetching MCQ replacement candidates:', err);
            }
        }

        const mergedNonAR = [...sNonAR, ...replacements];
        // Put all Assertion-Reasoning questions in consecutive series AT THE END
        let balancedSubj = [...mergedNonAR, ...keptAR];
        if (!isJEE && balancedSubj.length === 45) {
            balancedSubj = arrangeNeetSubject45(balancedSubj);
        } else if (isJEE && balancedSubj.length === 25) {
            balancedSubj = arrangeJeeSubject25(balancedSubj);
        }
        balancedFinal.push(...balancedSubj);
    }

    // If replacements were unavailable, ensure total count doesn't shrink unnecessarily
    if (balancedFinal.length < questions.length) {
        const finalIds = new Set(balancedFinal.map(q => (q._id ? q._id.toString() : q.id ? q.id.toString() : '')).filter(Boolean));
        for (const orig of questions) {
            if (isNEET && isBadNeetQ(orig)) continue; // Never re-inject numerical questions into NEET tests!
            const oId = orig._id ? orig._id.toString() : orig.id ? orig.id.toString() : '';
            if (oId && !finalIds.has(oId)) {
                balancedFinal.push(orig);
                finalIds.add(oId);
                if (balancedFinal.length >= questions.length) break;
            }
        }
    }

    return { balancedQuestions: balancedFinal, wasModified: true };
}

export function arrangeNeetSubject45(questions) {
    if (!questions || questions.length !== 45) return questions;
    const ar = questions.filter(isAR);
    const nonAR = questions.filter(q => !isAR(q));

    const easy = nonAR.filter(q => (q?.difficulty || '').toLowerCase() === 'easy');
    const hard = nonAR.filter(q => {
        const d = (q?.difficulty || '').toLowerCase();
        return d.includes('hard') || d.includes('difficult') || d.includes('challenging');
    });
    const med = nonAR.filter(q => !easy.includes(q) && !hard.includes(q));

    const easy5 = easy.slice(0, 5);
    while (easy5.length < 5 && med.length > 0) easy5.push(med.shift());
    while (easy5.length < 5 && hard.length > 0) easy5.push(hard.shift());

    const ar6 = ar.slice(0, 6);

    const remainingNonAR = [...med, ...hard, ...easy.slice(5)];
    const hard15 = remainingNonAR.filter(q => {
        const d = (q?.difficulty || '').toLowerCase();
        return d.includes('hard') || d.includes('difficult') || d.includes('challenging');
    }).slice(0, 15);

    const med19 = remainingNonAR.filter(q => !hard15.includes(q)).slice(0, 19);

    const result = new Array(45);
    // Q1, 3, 5, 7, 9 (0-indexed: 0, 2, 4, 6, 8)
    result[0] = easy5[0];
    result[2] = easy5[1];
    result[4] = easy5[2];
    result[6] = easy5[3];
    result[8] = easy5[4];

    // Q40 to 45 (0-indexed: 39 to 44)
    for (let i = 0; i < 6; i++) {
        result[39 + i] = ar6[i] || remainingNonAR.pop();
    }

    // Moderate: 19 slots (Q2, 4, 6, 8, 10, 11..24 -> indices 1, 3, 5, 7, 9, 10..23)
    result[1] = med19[0];
    result[3] = med19[1];
    result[5] = med19[2];
    result[7] = med19[3];
    result[9] = med19[4];
    for (let i = 5; i < 19; i++) {
        result[5 + i] = med19[i];
    }

    // Difficult: 15 slots (Q25 to Q39 -> indices 24 to 38)
    for (let i = 0; i < 15; i++) {
        result[24 + i] = hard15[i] || med19[i] || remainingNonAR.pop();
    }

    for (let i = 0; i < 45; i++) {
        if (!result[i]) {
            result[i] = questions[i];
        }
    }
    return result;
}

export function arrangeJeeSubject25(questions) {
    if (!questions || questions.length !== 25) return questions;
    const ar = questions.filter(isAR);
    const nonAR = questions.filter(q => !isAR(q));

    const easy = nonAR.filter(q => (q?.difficulty || '').toLowerCase() === 'easy');
    const hard = nonAR.filter(q => {
        const d = (q?.difficulty || '').toLowerCase();
        return d.includes('hard') || d.includes('difficult') || d.includes('challenging');
    });
    const med = nonAR.filter(q => !easy.includes(q) && !hard.includes(q));

    const easy5 = easy.slice(0, 5);
    while (easy5.length < 5 && med.length > 0) easy5.push(med.shift());
    while (easy5.length < 5 && hard.length > 0) easy5.push(hard.shift());

    const ar5 = ar.slice(0, 5);

    const remainingNonAR = [...med, ...hard, ...easy.slice(5)];
    const med5 = remainingNonAR.filter(q => {
        const d = (q?.difficulty || '').toLowerCase();
        return !d.includes('hard') && !d.includes('difficult') && !d.includes('challenging');
    }).slice(0, 5);

    const remainingHard = remainingNonAR.filter(q => !med5.includes(q));
    const hard10 = remainingHard.slice(0, 10);

    const result = new Array(25);
    // Q1, 3, 5, 7, 9 (0-indexed: 0, 2, 4, 6, 8) -> 5 Easy
    result[0] = easy5[0];
    result[2] = easy5[1];
    result[4] = easy5[2];
    result[6] = easy5[3];
    result[8] = easy5[4];

    // Q2, 4, 6, 8, 10 (0-indexed: 1, 3, 5, 7, 9) -> 5 Moderate
    result[1] = med5[0];
    result[3] = med5[1];
    result[5] = med5[2];
    result[7] = med5[3];
    result[9] = med5[4];

    // Q11 to 20 (0-indexed: 10 to 19) -> 10 Most Difficult
    for (let i = 0; i < 10; i++) {
        result[10 + i] = hard10[i] || remainingNonAR.pop();
    }

    // Q21 to 25 (0-indexed: 20 to 24) -> 5 Assertion Reasoning
    for (let i = 0; i < 5; i++) {
        result[20 + i] = ar5[i] || remainingNonAR.pop();
    }

    for (let i = 0; i < 25; i++) {
        if (!result[i]) {
            result[i] = questions[i];
        }
    }
    return result;
}
