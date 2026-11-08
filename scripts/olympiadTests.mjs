/**
 * Dedicated Olympiad Test Definitions for Classes 1 to 12 (MJS version for scripts)
 * Total: 360 tests (12 Classes × 3 Subjects × 10 Papers).
 */

import { OLYMPIAD_CLASSES, OLYMPIAD_SUBJECTS, getTopicsForClassAndSubject } from './olympiadSyllabus.mjs';

export const DIFFICULTY_DISTRIBUTIONS = {
    1:  { easyPct: 50, modPct: 40, diffPct: 10, label: 'Introductory Foundation' },
    2:  { easyPct: 45, modPct: 40, diffPct: 15, label: 'Concept Builder' },
    3:  { easyPct: 40, modPct: 45, diffPct: 15, label: 'Skill Reinforcement' },
    4:  { easyPct: 40, modPct: 40, diffPct: 20, label: 'Standard Olympiad' },
    5:  { easyPct: 35, modPct: 45, diffPct: 20, label: 'Advanced Application' },
    6:  { easyPct: 35, modPct: 40, diffPct: 25, label: 'Analytical Challenge' },
    7:  { easyPct: 30, modPct: 45, diffPct: 25, label: 'High-Order Thinking' },
    8:  { easyPct: 30, modPct: 40, diffPct: 30, label: 'National Standard' },
    9:  { easyPct: 25, modPct: 45, diffPct: 30, label: 'Mastery & Problem Solving' },
    10: { easyPct: 25, modPct: 40, diffPct: 35, label: 'Grand Finale Invitational' }
};

export function getTestConfigForClass(classNum) {
    const c = Number(classNum);
    if (c >= 1 && c <= 2) {
        return { questionsCount: 25, duration: 40, marksPerQuestion: 1 };
    }
    if (c >= 3 && c <= 5) {
        return { questionsCount: 30, duration: 45, marksPerQuestion: 1 };
    }
    if (c >= 6 && c <= 8) {
        return { questionsCount: 40, duration: 60, marksPerQuestion: 1 };
    }
    return { questionsCount: 50, duration: 75, marksPerQuestion: 1 };
}

export function generateOlympiadTests() {
    const tests = [];

    for (const classNum of OLYMPIAD_CLASSES) {
        const { questionsCount, duration, marksPerQuestion } = getTestConfigForClass(classNum);
        const totalMarks = questionsCount * marksPerQuestion;

        for (const subject of OLYMPIAD_SUBJECTS) {
            const subjectSlug = subject.toLowerCase();
            const subjectCode = subject === 'Mathematics' ? 'MATH' : (subject === 'Science' ? 'SCI' : 'ENG');
            const topics = getTopicsForClassAndSubject(classNum, subject);

            for (let paperNum = 1; paperNum <= 10; paperNum++) {
                const padPaper = String(paperNum).padStart(2, '0');
                const testId = `olympiad-class-${classNum}-${subjectSlug}-${padPaper}`;
                const diffDist = DIFFICULTY_DISTRIBUTIONS[paperNum];

                tests.push({
                    id: testId,
                    testId,
                    title: `Class ${classNum} ${subject} Olympiad - Paper ${paperNum} (${diffDist.label})`,
                    shortTitle: `Class ${classNum} ${subjectCode} - P${paperNum}`,
                    paperCode: `OLY-CL${classNum}-${subjectCode}-P${padPaper}`,
                    exam: 'olympiad',
                    examType: 'Olympiad',
                    subject,
                    subjectSlug,
                    classGrade: String(classNum),
                    studentClass: classNum,
                    paperNumber: paperNum,
                    type: 'MOCK',
                    category: 'olympiad',
                    duration,
                    totalMarks,
                    questionsCount,
                    marksPerQuestion,
                    negativeMarks: 0,
                    difficulty: paperNum <= 3 ? 'Easy' : (paperNum <= 7 ? 'Moderate' : 'Difficult'),
                    difficultyDistribution: diffDist,
                    topics,
                    description: `Official-pattern Class ${classNum} ${subject} Olympiad Examination Paper #${paperNum}. ${diffDist.easyPct}% Easy, ${diffDist.modPct}% Moderate, ${diffDist.diffPct}% Difficult.`,
                    isOlympiad: true
                });
            }
        }
    }

    return tests;
}

export const olympiadTests = generateOlympiadTests();

