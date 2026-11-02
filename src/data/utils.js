
export const generateTests = (category, countOrChapters, type, subjectName = null, classGrade = 'All Test', chapterName = null) => {
    const isNamedType = type === 'CHAPTER' || type === 'SUBTOPIC';
    const isArray = Array.isArray(countOrChapters);
    const count = (isNamedType && isArray) ? countOrChapters.length : countOrChapters;
    const items = (isNamedType && isArray) ? countOrChapters : [];

    return Array.from({ length: count }, (_, i) => {
        let title = '';
        let description = '';
        const itemName = (isNamedType && isArray) ? items[i] : null;

        if (type === 'MOCK') {
            title = `${category.toUpperCase()} Full Test ${i + 1} (${classGrade})`;
            description = `Comprehensive Full Test for ${category.toUpperCase()} preparation. Covers ${classGrade === 'All Test' ? 'full' : 'Class ' + classGrade} syllabus.`;
        } else if (type === 'PYQ') {
            title = `${category.toUpperCase()} Paper ${2025 - i}`;
            description = `PYQ from ${2025 - i}.`;
        } else if (type === 'SUBJECT') {
            title = `${subjectName} Test ${i + 1} (${classGrade})`;
            description = `Focused test on ${subjectName} for ${category.toUpperCase()}.`;
        } else if (type === 'CHAPTER' || type === 'SUBTOPIC') {
            title = itemName || `${subjectName} ${type === 'CHAPTER' ? 'Chapter' : 'Subtopic'} Test ${i + 1}`;
            description = `${type === 'CHAPTER' ? 'Chapter-wise' : 'Subtopic focus'} test on ${itemName || subjectName} (${subjectName}).`;
        } else if (type === 'PART') {
            title = `${category.toUpperCase()} Part Test ${i + 1}`;
            description = `Part Syllabus Test covering specific chapters from all subjects.`;
        }

        return {
            id: `${category}-${type}-${subjectName ? subjectName + '-' : ''}${itemName ? itemName.replace(/\s+/g, '-') : i + 1}${classGrade !== 'All Test' ? '-' + classGrade : ''}`,
            title: title,
            type: type,
            subject: subjectName,
            chapter: chapterName || (type === 'CHAPTER' ? itemName : null),
            classGrade: classGrade,
            year: type === 'PYQ' ? 2025 - i : 2027,
            category: category,
            duration: (type === 'SUBJECT' || type === 'CHAPTER' || type === 'SUBTOPIC') 
                ? (category === 'bitsat' && type === 'SUBTOPIC' ? 30 : (category === 'bitsat' && (type === 'CHAPTER' || type === 'SUBJECT') ? 45 : 60))
                : 180,
            totalMarks: (type === 'SUBJECT' || type === 'CHAPTER' || type === 'SUBTOPIC') 
                ? (category === 'neet' ? 180 : (category === 'bitsat' ? (type === 'SUBTOPIC' ? 60 : (type === 'CHAPTER' ? 60 : 90)) : 100))
                : (category === 'neet' ? 720 : (category === 'bitsat' ? 390 : 300)),
            questionsCount: (type === 'SUBJECT' || type === 'CHAPTER' || type === 'SUBTOPIC')
                ? (category === 'neet' ? 45 : (category === 'bitsat' ? (type === 'SUBTOPIC' ? 20 : (type === 'CHAPTER' ? 20 : 30)) : 25))
                : (category === 'neet' ? 180 : (category === 'jee-mains' ? 75 : (category === 'bitsat' ? 130 : 90))),
            difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)],
            description: description,
        };
    });
};

export const generateChapterTests = (category, chaptersList, subjectName, classGrade) => {
    const tests = [];
    chaptersList.forEach((itemName) => {
        const slug = itemName.replace(/\s+/g, '-');
        const gradeSuffix = classGrade !== 'All Test' ? `-${classGrade}` : '';

        // Test 1: Existing chapterwise test
        tests.push({
            id: `${category}-CHAPTER-${subjectName ? subjectName + '-' : ''}${slug}${gradeSuffix}`,
            title: itemName,
            testNum: 1,
            type: 'CHAPTER',
            subject: subjectName,
            chapter: itemName,
            classGrade: classGrade,
            category: category,
            duration: category === 'bitsat' ? 45 : 60,
            totalMarks: category === 'neet' ? 180 : (category === 'bitsat' ? 60 : 100),
            questionsCount: category === 'neet' ? 45 : (category === 'bitsat' ? 20 : 25),
            difficulty: 'Mixed',
            description: `Chapterwise test on ${itemName} (${subjectName}).`
        });

        // Test 2: Additional chapterwise practice test
        tests.push({
            id: `${category}-CHAPTER-${subjectName ? subjectName + '-' : ''}${slug}${gradeSuffix}-TEST-2`,
            title: `${itemName} — Practice Test 2`,
            testNum: 2,
            type: 'CHAPTER',
            subject: subjectName,
            chapter: itemName,
            classGrade: classGrade,
            category: category,
            duration: category === 'bitsat' ? 45 : 60,
            totalMarks: category === 'neet' ? 180 : (category === 'bitsat' ? 60 : 100),
            questionsCount: category === 'neet' ? 45 : (category === 'bitsat' ? 20 : 25),
            difficulty: 'Medium',
            description: `Additional chapterwise practice test on ${itemName} (${subjectName}).`
        });

        // Test 3: Dedicated Assertion–Reasoning Special Test (NEET & JEE Main)
        if (category !== 'bitsat') {
            tests.push({
                id: `${category}-CHAPTER-${subjectName ? subjectName + '-' : ''}${slug}${gradeSuffix}-TEST-3`,
                title: 'Assertion–Reasoning Special Test',
                testNum: 3,
                type: 'CHAPTER',
                subject: subjectName,
                chapter: itemName,
                classGrade: classGrade,
                category: category,
                duration: 45,
                totalMarks: 80,
                questionsCount: 20,
                targetQuestionsCount: 20,
                difficulty: 'Hard',
                difficultyTier: 'AR Special',
                isSpecial: true,
                description: `Dedicated Assertion–Reasoning Special Test on ${itemName} (${subjectName}).`
            });
        }
    });
    return tests;
};

export const generateSubjectTests = (category, subjectName, classGrade, testConfigs) => {
    return testConfigs.map((cfg, i) => {
        const testNum = i + 1;
        const id = `${category}-SUBJECT-${subjectName}-${testNum}${classGrade !== 'All Test' ? '-' + classGrade : ''}`;
        const chapters = cfg.chapters || [];
        const title = cfg.title;
        const description = cfg.description || `Chapters: ${chapters.join(', ')}. Focused test on ${subjectName} for ${category.toUpperCase()}.`;

        return {
            id,
            title,
            type: 'SUBJECT',
            subject: subjectName,
            chapter: chapters[0] || null,
            chapters: chapters,
            classGrade,
            year: 2027,
            category,
            duration: 60,
            totalMarks: category === 'neet' ? 180 : 100,
            questionsCount: category === 'neet' ? 45 : 25,
            difficulty: ['Easy', 'Medium', 'Hard'][i % 3],
            description,
            syllabus: {
                [subjectName]: chapters
            }
        };
    });
};

export const generatePartTests = (category, syllabusOrCount, subjectChaptersMap = null, count = 10) => {
    // Support flexible signatures: (category, syllabus, count) or (category, count, subjectChaptersMap)
    let syllabus = subjectChaptersMap;
    let totalCount = count;

    if (typeof syllabusOrCount === 'object' && syllabusOrCount !== null) {
        syllabus = syllabusOrCount;
        if (typeof subjectChaptersMap === 'number') {
            totalCount = subjectChaptersMap;
        }
    } else if (typeof syllabusOrCount === 'number') {
        totalCount = syllabusOrCount;
        syllabus = subjectChaptersMap || {};
    }

    if (!syllabus || Object.keys(syllabus).length === 0) {
        return [];
    }

    const numPerGrade = Math.max(1, Math.floor(totalCount / 2));
    const tests = [];

    const chunkArray = (array, numChunks) => {
        const result = [];
        const baseSize = Math.floor(array.length / numChunks);
        let remainder = array.length % numChunks;
        let offset = 0;
        for (let i = 0; i < numChunks; i++) {
            const size = baseSize + (remainder > 0 ? 1 : 0);
            result.push(array.slice(offset, offset + size));
            offset += size;
            remainder--;
        }
        return result;
    };

    const examTitle = category === 'neet' ? 'NEET' : category === 'jee-mains' ? 'JEE Main' : category.toUpperCase();

    // 1. Part Tests 1 to numPerGrade
    for (let i = 0; i < numPerGrade; i++) {
        const syllabusObj = {};

        Object.entries(syllabus).forEach(([subject, gradeMap]) => {
            const chapters = Array.isArray(gradeMap) ? gradeMap : (gradeMap['11'] || []);
            const chunks = chunkArray(chapters, numPerGrade);
            const currentChapters = chunks[i] || [];
            if (currentChapters.length > 0) {
                syllabusObj[subject] = currentChapters;
            }
        });

        tests.push({
            id: `${category}-PART-${i + 1}`,
            title: `${examTitle} Part Test ${i + 1}`,
            type: 'PART',
            subject: 'Mixed',
            classGrade: 'All Test',
            year: 2027,
            category: category,
            duration: 180,
            totalMarks: category === 'neet' ? 720 : (category === 'bitsat' ? 390 : 300),
            questionsCount: category === 'neet' ? 180 : (category === 'jee-mains' ? 75 : (category === 'bitsat' ? 130 : 90)),
            difficulty: ['Easy', 'Medium', 'Hard'][i % 3],
            description: `Part Syllabus Test covering targeted chapters across all subjects.`,
            syllabus: syllabusObj
        });
    }

    // 2. Part Tests numPerGrade + 1 to totalCount
    for (let i = 0; i < numPerGrade; i++) {
        const testIndex = numPerGrade + i + 1;
        const syllabusObj = {};

        Object.entries(syllabus).forEach(([subject, gradeMap]) => {
            const chapters = Array.isArray(gradeMap) ? gradeMap : (gradeMap['12'] || []);
            const chunks = chunkArray(chapters, numPerGrade);
            const currentChapters = chunks[i] || [];
            if (currentChapters.length > 0) {
                syllabusObj[subject] = currentChapters;
            }
        });

        tests.push({
            id: `${category}-PART-${testIndex}`,
            title: `${examTitle} Part Test ${testIndex}`,
            type: 'PART',
            subject: 'Mixed',
            classGrade: 'All Test',
            year: 2027,
            category: category,
            duration: 180,
            totalMarks: category === 'neet' ? 720 : (category === 'bitsat' ? 390 : 300),
            questionsCount: category === 'neet' ? 180 : (category === 'jee-mains' ? 75 : (category === 'bitsat' ? 130 : 90)),
            difficulty: ['Easy', 'Medium', 'Hard'][(i + 1) % 3],
            description: `Part Syllabus Test covering targeted chapters across all subjects.`,
            syllabus: syllabusObj
        });
    }

    return tests;
};

export const generateLiveTests = (category, count) => {
    // Live tests are now standardized to 52 Sunday tests exclusively
    return [];
};

export const generateSundayTests = (category, ...args) => {
    const now = new Date();
    // The academic session starts in June (month index 5).
    // If current month is Jan-May (0-4), the active session started in June of the prior year.
    const defaultSessionYear = now.getMonth() < 5 ? now.getFullYear() - 1 : now.getFullYear();
    let year = null;
    let subjectChaptersMap = {};

    for (const arg of args) {
        if (typeof arg === 'number') {
            year = arg;
        } else if (typeof arg === 'object' && arg !== null) {
            subjectChaptersMap = arg;
        }
    }
    // Automatically use the active session year if no explicit year is provided
    if (!year) {
        year = defaultSessionYear;
    }

    const tests = [];

    // Automatically locate the 1st Sunday of JUNE
    let date = new Date(year, 5, 1);
    while (date.getDay() !== 0) {
        date.setDate(date.getDate() + 1);
    }

    // Exactly 52 weekly Sunday tests starting from the 1st Sunday of June
    while (tests.length < 52) {
        tests.push(new Date(date));
        date.setDate(date.getDate() + 7);
    }
    
    // Count tests before cutoffs
    let numClass11PartTests = 0;
    let numClass12PartTests = 0;
    
    tests.forEach((sundayDate, i) => {
        const grade = i % 2 === 0 ? '11' : '12';
        const mar31 = new Date(year + 1, 2, 31);
        const nov30 = new Date(year, 10, 30);
        if (grade === '11' && sundayDate <= mar31) numClass11PartTests++;
        if (grade === '12' && sundayDate <= nov30) numClass12PartTests++;
    });

    let class11PartIndex = 0;
    let class12PartIndex = 0;
    let class11FullIndex = 0;
    let class12FullIndex = 0;

    return tests.map((sundayDate, i) => {
        const liveStart = new Date(sundayDate);
        liveStart.setHours(0, 0, 0, 0);

        const liveEnd = new Date(liveStart);
        liveEnd.setHours(liveEnd.getHours() + 48);

        let status = 'Upcoming';
        if (now >= liveStart && now <= liveEnd) status = 'Active';
        else if (now > liveEnd) status = 'Ended';

        const monthName = liveStart.toLocaleString('en-US', { month: 'short' });
        const day = liveStart.getDate();
        const testYear = liveStart.getFullYear();
        
        const grade = i % 2 === 0 ? '11' : '12';
        const mar31 = new Date(year + 1, 2, 31);
        const nov30 = new Date(year, 10, 30);
        
        const isPartTest = (grade === '11' && liveStart <= mar31) || (grade === '12' && liveStart <= nov30);
        const totalPartTestsForGrade = grade === '11' ? numClass11PartTests : numClass12PartTests;
        
        let testIndexForGrade = 0;
        if (isPartTest) {
            testIndexForGrade = grade === '11' ? class11PartIndex++ : class12PartIndex++;
        } else {
            testIndexForGrade = grade === '11' ? class11FullIndex++ : class12FullIndex++;
        }
        
        let syllabusDescription = isPartTest ? `Sunday Part Test ${testIndexForGrade + 1} covering: ` : `Sunday Full Syllabus Test ${testIndexForGrade + 1} covering: \nAll Class ${grade} Chapters`;
        const syllabusObj = {};
        
        if (subjectChaptersMap && Object.keys(subjectChaptersMap).length > 0) {
            Object.entries(subjectChaptersMap).forEach(([subject, gradeMap]) => {
                const chapters = gradeMap[grade];
                if (!chapters || chapters.length === 0) return;
                
                if (isPartTest) {
                    const startFloat = (testIndexForGrade / totalPartTestsForGrade) * chapters.length;
                    const endFloat = ((testIndexForGrade + 1) / totalPartTestsForGrade) * chapters.length;
                    
                    let start = Math.floor(startFloat);
                    let end = Math.floor(endFloat);
                    
                    if (end === start) {
                        end = start + 1;
                    }
                    
                    start = Math.min(start, chapters.length - 1);
                    end = Math.min(end, chapters.length);
                    
                    const currentChapters = chapters.slice(start, end);
                    
                    if (currentChapters.length > 0) {
                        syllabusObj[subject] = currentChapters;
                        syllabusDescription += `\n${subject}: ${currentChapters.join(', ')}.`;
                    }
                } else {
                    syllabusObj[subject] = chapters;
                }
            });
        }

        const titlePrefix = isPartTest ? 'Part Test' : 'Full Syllabus Test';
        return {
            id: `${category}-SUNDAY-${testYear}-${monthName}-${day}`,
            title: `${category.toUpperCase()} Sunday ${titlePrefix} - ${monthName} ${day}, ${testYear} (Class ${grade}) (${status})`,
            type: 'LIVE',
            subject: 'Mixed',
            classGrade: grade,
            year: testYear,
            category: category,
            duration: 180,
            totalMarks: category === 'neet' ? 720 : 300,
            questionsCount: category === 'neet' ? 180 : (category === 'jee-mains' ? 75 : 90),
            difficulty: ['Easy', 'Medium', 'Hard'][i % 3],
            description: `Weekly ${titlePrefix} available for 48 hours. \n${syllabusDescription}`,
            liveStart: liveStart.toISOString(),
            liveEnd: liveEnd.toISOString(),
            syllabus: syllabusObj
        };
    });
};
