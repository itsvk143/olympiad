import { olympiadTests, getOlympiadTestById } from './exams/olympiad.js';
import { createOlympiadQuestion, getTestConfigForClass, DIFFICULTY_DISTRIBUTIONS } from './exams/olympiadQuestionGenerator.js';
import { getTopicsForClassAndSubject } from './exams/olympiadSyllabus.js';
import { formatQuestionToLegacy } from '@/lib/questionFormatter';

export const getTestById = (id) => {
    if (!id) return undefined;
    return getOlympiadTestById(id);
};

export const getAllTests = () => {
    return olympiadTests;
};

// In-memory cache for generated questions
const testQuestionsDatabase = {};

// Main Function to get questions with resilient generator fallback
export const getQuestionsForTest = (testId) => {
    if (!testId) return [];

    if (testQuestionsDatabase[testId]) {
        return testQuestionsDatabase[testId];
    }

    if (typeof testId === 'string' && testId.startsWith('olympiad-class-')) {
        const parts = testId.split('-');
        if (parts.length >= 5) {
            const classNum = parseInt(parts[2], 10);
            const subjectSlug = parts[3];
            const paperNum = parseInt(parts[4], 10);
            const subject = subjectSlug === 'mathematics' ? 'Mathematics' : (subjectSlug === 'science' ? 'Science' : 'English');

            const config = getTestConfigForClass(classNum);
            const diffDist = DIFFICULTY_DISTRIBUTIONS[paperNum] || { easyPct: 40, modPct: 40, diffPct: 20 };
            const topics = getTopicsForClassAndSubject(classNum, subject);

            const count = config.questionsCount;
            const easyTarget = Math.round(count * (diffDist.easyPct / 100));
            const modTarget = Math.round(count * (diffDist.modPct / 100));

            const questions = [];
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

                const formatted = formatQuestionToLegacy(qDoc, i + 1);
                questions.push(formatted);
            }

            testQuestionsDatabase[testId] = questions;
            return questions;
        }
    }

    return [];
};
