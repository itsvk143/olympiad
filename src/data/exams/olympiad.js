/**
 * Dedicated Olympiad Test Definitions for Classes 1 to 12
 * Covers Mathematics, Science, and English.
 * 
 * Total: 360 tests (12 Classes × 3 Subjects × 10 Papers).
 * 
 * Question Counts & Timings:
 * - Classes 1–2:  25 questions, 40 minutes
 * - Classes 3–5:  30 questions, 45 minutes
 * - Classes 6–8:  40 questions, 60 minutes
 * - Classes 9–12: 50 questions, 75 minutes
 */

import { OLYMPIAD_CLASSES, OLYMPIAD_SUBJECTS, getTopicsForClassAndSubject } from './olympiadSyllabus.js';

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
    // Classes 9 to 12
    return { questionsCount: 50, duration: 75, marksPerQuestion: 1 };
}

/**
 * Generate all 360 Olympiad tests with stable IDs and structured metadata.
 */
export function generateOlympiadTests() {
    const tests = [];

    for (const classNum of OLYMPIAD_CLASSES) {
        const config = getTestConfigForClass(classNum);
        
        for (const subject of OLYMPIAD_SUBJECTS) {
            const subjectSlug = subject.toLowerCase();
            const topics = getTopicsForClassAndSubject(classNum, subject);

            for (let paperNum = 1; paperNum <= 10; paperNum++) {
                const padPaper = String(paperNum).padStart(2, '0');
                const testId = `olympiad-class-${classNum}-${subjectSlug}-${padPaper}`;
                const diffDist = DIFFICULTY_DISTRIBUTIONS[paperNum];

                const totalMarks = config.questionsCount * config.marksPerQuestion;

                let title = `Class ${classNum} ${subject} Olympiad — Paper ${padPaper}`;
                let description = `Official Class ${classNum} ${subject} Olympiad Paper ${padPaper}. Contains ${config.questionsCount} questions (${diffDist.easyPct}% Easy, ${diffDist.modPct}% Moderate, ${diffDist.diffPct}% Difficult). Duration: ${config.duration} minutes.`;

                if (classNum === 11) {
                    if (subject === 'Mathematics') {
                        title = `Class 11 Mathematics Olympiad (IOQM → RMO → INMO → IMO Pathway) — Paper ${padPaper}`;
                        description = `Official Class 11 Mathematics Olympiad Paper ${padPaper}. Calibrated to India’s national and international qualification pathway: IOQM → RMO → INMO → IMO. Covers Number Theory, Combinatorics, Geometry & Olympiad Algebra. (${diffDist.easyPct}% Easy, ${diffDist.modPct}% Moderate, ${diffDist.diffPct}% Difficult).`;
                    } else if (subject === 'Science') {
                        title = `Class 11 Science Olympiad (NSEP Physics • NSEC Chemistry • NSEB Biology) — Paper ${padPaper}`;
                        description = `Official Class 11 Science Olympiad Paper ${padPaper}. Aligned with the official Indian national selection pathway for representing India globally: Physics (NSEP → INPhO), Chemistry (NSEC → INChO), and Biology (NSEB → INBO). (${diffDist.easyPct}% Easy, ${diffDist.modPct}% Moderate, ${diffDist.diffPct}% Difficult).`;
                    } else if (subject === 'English') {
                        title = `Class 11 English Olympiad (IEO / Senior International Standard) — Paper ${padPaper}`;
                        description = `Official Class 11 English Olympiad Paper ${padPaper}. Advanced rhetorical structures, critical reading, discourse analysis and lexicon. (${diffDist.easyPct}% Easy, ${diffDist.modPct}% Moderate, ${diffDist.diffPct}% Difficult).`;
                    }
                }

                tests.push({
                    id: testId,
                    testId: testId,
                    title: title,
                    exam: 'olympiad',
                    examType: 'Olympiad',
                    category: 'olympiad',
                    classGrade: String(classNum),
                    studentClass: classNum,
                    subject: subject,
                    subjectSlug: subjectSlug,
                    paperNumber: paperNum,
                    paperCode: `CL${classNum}-${subjectSlug.slice(0, 3).toUpperCase()}-P${padPaper}`,
                    type: 'MOCK',
                    duration: config.duration,
                    totalMarks: totalMarks,
                    questionsCount: config.questionsCount,
                    marksPerQuestion: config.marksPerQuestion,
                    negativeMarks: 0,
                    difficulty: paperNum <= 3 ? 'Easy' : (paperNum <= 7 ? 'Moderate' : 'Difficult'),
                    difficultyDistribution: diffDist,
                    topics: topics,
                    description: description,
                    status: 'PUBLISHED',
                    questions: [] // Array of Central Question Bank ObjectIds
                });
            }
        }
    }

    return tests;
}

export const olympiadTests = generateOlympiadTests();

/**
 * Helper to fetch tests filtered by class and/or subject.
 */
export function getOlympiadTestsByFilter({ classGrade = null, subject = null } = {}) {
    return olympiadTests.filter(t => {
        if (classGrade && String(t.classGrade) !== String(classGrade)) return false;
        if (subject && t.subject.toLowerCase() !== subject.toLowerCase()) return false;
        return true;
    });
}

/**
 * Helper to get a specific test by ID.
 */
export function getOlympiadTestById(testId) {
    if (!testId) return null;
    const cleanId = String(testId).trim().toLowerCase();
    return olympiadTests.find(t => t.id.toLowerCase() === cleanId || t.testId.toLowerCase() === cleanId) || null;
}

