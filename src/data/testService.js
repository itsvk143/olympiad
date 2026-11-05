import { olympiadTests, getOlympiadTestById } from './exams/olympiad.js';

export const getTestById = (id) => {
    if (!id) return undefined;
    return getOlympiadTestById(id);
};

export const getAllTests = () => {
    return olympiadTests;
};

// Database for static/manual questions fallback
const testQuestionsDatabase = {};

// Main Function to get questions
export const getQuestionsForTest = (testId) => {
    if (testQuestionsDatabase[testId]) {
        return testQuestionsDatabase[testId];
    }
    // Questions are served dynamically from the Central Question Bank (MongoDB)
    return [];
};
