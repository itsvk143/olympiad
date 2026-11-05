/**
 * Utility to normalize, canonicalize, and auto-format questions and LaTeX expressions.
 */

const cmdsWithBraces = 'sqrt|vec|hat|bar|dot|ddot|tilde|overline|underline|mathbf|mathrm|mathit|text|boldsymbol';
const fixCommandParens = (str) => {
    const re = new RegExp(`\\\\(${cmdsWithBraces})\\(([^()]+)\\)`, 'g');
    return str.replace(re, (m, cmd, content) => `\\${cmd}{${content}}`);
};

export const stripInternalQuestionTags = (text) => {
    if (!text || typeof text !== 'string') return text || '';
    return text.replace(/^\s*\[\s*(?:Top\b[^\]]*|Ranker\b[^\]]*|Olympiad\b[^\]]*|Cumulative\s+Grand\b[^\]]*)\]\s*/i, '');
};

/**
 * Canonicalizes LaTeX formatting:
 * - Unescapes \$ to $
 * - Normalizes double/multiple backslashes: \\alpha -> \alpha
 * - Fixes \( ... \) and \[ ... \] to $ and $$
 * - Fixes mismatched $$ ... $ and $ ... $$ delimiters
 * - Removes accidental nested $ inside math mode
 * - Converts \command(arg) to \command{arg}
 * - Wraps bare LaTeX options/values in $ ... $
 */
export const canonicalizeLatex = (text) => {
    if (!text || typeof text !== 'string') return '';
    let s = stripInternalQuestionTags(text).trim();

    // 1. Normalize triple or more dollars ($$$+ -> $$)
    s = s.replace(/\${3,}/g, () => '$$');

    // 1.1 Remove escaped dollars (\$ -> $)
    s = s.replace(/\\(\$)/g, '$1');

    // 2. Normalize quadruple & double backslashes before LaTeX commands: \\alpha -> \alpha
    // (preserves intentional line breaks like \\ in matrix or multiline)
    s = s.replace(/\\\\+([a-zA-Z])/g, '\\$1');

    // 3. Convert LaTeX \( ... \) and \[ ... \] to $ ... $ and $$ ... $$
    s = s.replace(/\\\(\s*\$?([\s\S]*?)\$?\s*\\\)/g, (m, g1) => `$${g1}$`);
    s = s.replace(/\\\[([\s\S]*?)\\\]/g, (m, g1) => `$$${g1}$$`);

    // 3.1. Fix $\frac${num}{den} where $ was placed right after \frac and optional trailing $
    s = s.replace(/\$\s*\\frac\s*\$\s*\{((?:[^{}]|\{[^{}]*\})*)\}\s*\{((?:[^{}]|\{[^{}]*\})*)\}\s*\$?(\$)?/g, (m, num, den, extra) => {
        return `$\\frac{${num}}{${den}}$${extra || ''}`;
    });
    s = s.replace(/\\frac\s*\$\s*\{((?:[^{}]|\{[^{}]*\})*)\}\s*\{((?:[^{}]|\{[^{}]*\})*)\}\s*\$?(\$)?/g, (m, num, den, extra) => {
        return `\\frac{${num}}{${den}}${extra || ''}`;
    });

    // 3.2. Fix displaced dollar on ion charges: e.g. \text{Fe}^{2}$+}$ -> \text{Fe}^{2+}$
    s = s.replace(/(\^[0-9]+|\^\{[0-9]+\})\$([+\-])\}/g, (m, sup, sign) => {
        const cleanSup = sup.replace(/[{}^]/g, '');
        return `^{${cleanSup}${sign}}$`;
    });

    // 3.3. Un-math-ify English words erroneously wrapped in $word$: e.g. $is$ -> is, $\text{Fe}^{2+}$$is$ -> $\text{Fe}^{2+}$ is
    s = s.replace(/(?<!\\)\$(is|and|or|of|in|to|with|for|where|which|when|then|if|at|by|from)\$(?!\$)/gi, ' $1 ');

    // 3.5. Clean accidental nested dollars inside fraction and command arguments
    s = s.replace(/\\frac\{([^{}]*)\}\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g, (m, a, b) => {
        return `\\frac{${a.replace(/\$/g, '')}}{${b.replace(/\$/g, '')}}`;
    });
    s = s.replace(/\\(sqrt|text|mathrm|mathbf)\{((?:[^{}]|\{[^{}]*\})*)\}/g, (m, cmd, inner) => {
        return `\\${cmd}{${inner.replace(/\$/g, '')}}`;
    });

    // 4. Fix nested $...$$...$$: e.g. $E = E^\circ - $$\frac{...}$$ -> $E = E^\circ - \frac{...}$
    s = s.replace(/\$([^$]+?)\s*([+\-=])\s*\$\$\\frac\{([^$]+?)\}\$\$/g, (m, p1, p2, p3) => `$${p1} ${p2} \\frac{${p3}}$`);
    s = s.replace(/\$([^$]+?)\s*([+\-=])\s*\$\\frac\{([^$]+?)\}\$/g, (m, p1, p2, p3) => `$${p1} ${p2} \\frac{${p3}}$`);

    // 5. Fix opening $$ with closing $ for standalone formulas or options
    s = s.replace(/(^|\s)\$\$([a-zA-Z0-9\\_{}^+\-=().,;:/\s]+?)\$(?!\$)/g, (match, prefix, content) => {
        // Do not match across multi-word english prose sentences
        const stripped = content.replace(/\\(text|mathrm|mathbf)\{[^{}]*\}/g, '').trim();
        const words = stripped.match(/[a-zA-Z]{4,}/g) || [];
        const nonCmdWords = words.filter(w => !['frac', 'sqrt', 'alpha', 'beta', 'rightleftharpoons', 'approx', 'times', 'cell'].includes(w));
        if (nonCmdWords.length >= 3) return match;
        return `${prefix}$$${content}$$`;
    });

    // 6. Fix opening $ with closing $$ for standalone formulas or options
    s = s.replace(/(?<!\$)\$([a-zA-Z0-9\\_{}^+\-=().,;:/\s]+?)\$\$(\s|[.,;]|$)/g, (match, content, suffix) => {
        const stripped = content.replace(/\\(text|mathrm|mathbf)\{[^{}]*\}/g, '').trim();
        const words = stripped.match(/[a-zA-Z]{4,}/g) || [];
        const nonCmdWords = words.filter(w => !['frac', 'sqrt', 'alpha', 'beta', 'rightleftharpoons', 'approx', 'times', 'cell'].includes(w));
        if (nonCmdWords.length >= 3) return match;
        return `$$${content}$$${suffix}`;
    });

    // 7. Fix attached unit exponents: e.g. m/s$$^2$ -> $\text{m/s}^2$
    s = s.replace(/\b([a-zA-Z\/]+)\$\$?\^\{?([0-9\-]+)\}?\$?/g, (m, u, exp) => `$\\text{${u}}^{${exp}}$`);

    // 8. Fix \command(content) -> \command{content} inside math delimiters
    s = s.replace(/(\$\$?)([\s\S]*?)(\$\$?)/g, (match, open, content, close) => {
        // Strip accidental internal dollars inside math mode
        const cleanContent = content.replace(/\$/g, '');
        return open + fixCommandParens(cleanContent) + close;
    });

    // 9. Wrap bare LaTeX commands in text segments outside of math delimiters
    const segments = s.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
    const bareLatexRegex = /\\(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Delta|Theta|Lambda|Xi|Pi|Sigma|Phi|Psi|Omega|vec|hat|sqrt|frac|pm|times|approx|degree)(?![a-zA-Z])(?:_\{?[0-9a-zA-Z]+\}?|\^\{?[0-9a-zA-Z]+\}?|\{[^{}]*\})*/g;

    for (let i = 0; i < segments.length; i++) {
        if (!segments[i].startsWith('$')) {
            const trimmed = segments[i].trim();
            // If the entire text segment is a bare formula (e.g. "-5744\text{ J}")
            if (/^[-+0-9.\s]*\\[a-zA-Z]/.test(trimmed)) {
                segments[i] = segments[i].replace(trimmed, `$${fixCommandParens(trimmed)}$`);
            } else {
                segments[i] = segments[i].replace(bareLatexRegex, (m) => `$${m}$`);
            }
        }
    }
    s = segments.join('');

    return s;
};

export const autoFormatText = canonicalizeLatex;

export function normalizeCorrectOption(ans, options = []) {
    if (ans === undefined || ans === null) return 'a';

    // If already a number
    if (typeof ans === 'number') {
        // Standard 0-indexed: 0 -> 'a', 1 -> 'b', 2 -> 'c', 3 -> 'd'
        if (ans >= 0 && ans <= 3 && Number.isInteger(ans)) {
            return String.fromCharCode(97 + ans);
        }
        if (ans === 4) return 'd'; // 1-based index 4 fallback
        return 'a';
    }

    if (typeof ans === 'string') {
        const trimmed = ans.trim();
        const lower = trimmed.toLowerCase();

        // Exact letter match: 'a', 'b', 'c', 'd'
        if (['a', 'b', 'c', 'd'].includes(lower)) return lower;

        // Matches like "Option A", "Option (B)", "(c)", "A.", "D)"
        const optLetterMatch = lower.match(/^(?:option\s*)?\(?([a-d])\)?\.?$/i);
        if (optLetterMatch) return optLetterMatch[1].toLowerCase();

        // Check if string matches text of one of options (e.g. "Iodide", "$-I$", "Surface tension", etc.)
        if (Array.isArray(options) && options.length > 0) {
            const optIdx = options.findIndex((opt) => {
                const optText = (typeof opt === 'string' ? opt : (opt?.text || opt?.value || '')).trim().toLowerCase();
                if (optText === lower) return true;
                const cleanOpt = optText.replace(/\$/g, '').replace(/\\text\{([^}]+)\}/g, '$1').replace(/\s+/g, '');
                const cleanAns = lower.replace(/\$/g, '').replace(/\\text\{([^}]+)\}/g, '$1').replace(/\s+/g, '');
                return cleanOpt.length > 0 && cleanOpt === cleanAns;
            });
            if (optIdx >= 0 && optIdx < 4) {
                return String.fromCharCode(97 + optIdx);
            }
        }

        // Numeric string digits: 0-indexed
        if (lower === '0') return 'a';
        if (lower === '1') return 'b';
        if (lower === '2') return 'c';
        if (lower === '3') return 'd';
        if (lower === '4') return 'd'; // 1-based index 4 fallback

        if (lower.length > 0 && ['a', 'b', 'c', 'd'].includes(lower[0])) {
            return lower[0];
        }
    }

    return 'a';
}

export const normalizeQuestion = (q) => {
    // Map synonyms
    const text = q.text || q.question || q.desc || q.title || '';
    const subject = q.subject || q.category || 'Physics';
    const explanation = q.explanation || q.solution || q.desc_exp || '';
    
    // Normalize question type
    const rawType = (q.type || q.questionType || 'MCQ').toString().toUpperCase();
    const isNumerical = rawType === 'NUMERICAL' || rawType === 'NUMERIC';
    const isSubjective = rawType === 'SUBJECTIVE';
    const isAssertion = rawType.includes('ASSERTION') || rawType === 'AR';
    const type = isNumerical ? 'NUMERICAL' : isSubjective ? 'SUBJECTIVE' : isAssertion ? 'ASSERTION_REASON' : 'MCQ';

    // Normalize Correct Option
    let correctOption = q.correctOption ?? q.correctAnswer ?? q.answer ?? q.correct_answer ?? '';
    if (isNumerical) {
        correctOption = String(correctOption).trim();
    } else {
        correctOption = normalizeCorrectOption(correctOption, q.options);
    }

    // Normalize Options
    let options = [];
    if (!isNumerical && !isSubjective) {
        if (Array.isArray(q.options)) {
            if (typeof q.options[0] === 'string') {
                options = q.options.map((opt, i) => ({
                    id: String.fromCharCode(97 + i),
                    text: canonicalizeLatex(opt),
                    image: ''
                }));
            } else {
                options = q.options.map((opt, i) => ({
                    id: (opt.id || opt.key || String.fromCharCode(97 + i)).toLowerCase(),
                    text: canonicalizeLatex(opt.text || opt.value || ''),
                    image: opt.image || opt.img || ''
                }));
            }
        } else if (typeof q.options === 'object' && q.options !== null) {
            options = Object.entries(q.options).map(([key, val]) => ({
                id: key.toLowerCase(),
                text: canonicalizeLatex(typeof val === 'string' ? val : (val.text || '')),
                image: typeof val === 'object' && val !== null ? (val.image || val.img || '') : ''
            }));
        }

        // Ensure we have at least 4 options for MCQ
        while (options.length < 4) {
            options.push({ id: String.fromCharCode(97 + options.length), text: 'N/A', image: '' });
        }
    }

    const chapter = q.chapter || '';
    const subtopic = q.subtopic || q.subTopic || '';

    return {
        id: q.id || undefined,
        _id: q._id || undefined,
        type,
        text: canonicalizeLatex(text),
        diagram: q.diagram || null,
        image: q.image || q.img || '',
        subject,
        chapter,
        subtopic,
        subTopic: subtopic,
        topic: q.topic || chapter,
        difficulty: q.difficulty || 'Moderate',
        questionType: q.questionType || (type === 'NUMERICAL' ? 'Numerical' : type === 'ASSERTION_REASON' ? 'Assertion–Reasoning' : 'MCQ (Multiple Choice Question)'),
        marks: q.marks ?? 1,
        negativeMarks: q.negativeMarks ?? 0,
        class: q.class || q.classGrade || 'Class 1',
        options: isNumerical || isSubjective ? [] : options.slice(0, 4),
        correctOption,
        explanation: canonicalizeLatex(explanation)
    };
};

export const formatQuestionToLegacy = (q, index = 1) => {
    if (!q) return null;

    const rawType = (q.questionType || q.type || 'MCQ').toString().toUpperCase();
    const isNumerical = rawType === 'NUMERICAL' || rawType === 'NUMERIC';
    const isAssertion = rawType.includes('ASSERTION') || rawType === 'AR';
    const isSubjective = rawType.includes('SUBJECTIVE');
    const legacyType = isNumerical ? 'NUMERICAL' : isAssertion ? 'ASSERTION_REASON' : isSubjective ? 'SUBJECTIVE' : 'MCQ';

    let legacyOptions = [];
    if (!isNumerical && !isSubjective) {
        if (Array.isArray(q.options)) {
            legacyOptions = q.options.map((opt, i) => {
                if (typeof opt === 'object' && opt !== null) {
                    return {
                        id: (opt.id || opt.key || String.fromCharCode(97 + i)).toLowerCase(),
                        text: canonicalizeLatex(opt.text || opt.option || opt.value || ''),
                        image: opt.image || opt.img || ''
                    };
                }
                return {
                    id: String.fromCharCode(97 + i),
                    text: canonicalizeLatex(String(opt ?? '')),
                    image: ''
                };
            });
        } else if (typeof q.options === 'object' && q.options !== null) {
            legacyOptions = Object.entries(q.options).map(([key, val], i) => ({
                id: (key || String.fromCharCode(97 + i)).toLowerCase(),
                text: canonicalizeLatex(typeof val === 'string' ? val : (val?.text || val?.option || val?.value || '')),
                image: typeof val === 'object' && val !== null ? (val.image || val.img || '') : ''
            }));
        }
    }

    let correctOption = 'a';
    if (isNumerical) {
        correctOption = String(q.correctAnswer ?? q.correctOption ?? q.answer ?? '').trim();
    } else {
        correctOption = normalizeCorrectOption(q.correctAnswer ?? q.correctOption ?? q.answer, legacyOptions);
    }

    return {
        _id: (q._id || q.questionId)?.toString(),
        id: q.id || index,
        type: legacyType,
        text: canonicalizeLatex(q.text || q.question || q.questionText || ''),
        diagram: q.diagram || null,
        image: q.image || q.img || '',
        options: legacyOptions,
        correctOption,
        explanation: canonicalizeLatex(q.explanation || q.solution || q.solutionText || ''),
        subject: q.subject || 'Mathematics',
        chapter: q.chapter || '',
        topic: q.topic || q.chapter || '',
        subTopic: q.subTopic || q.subtopic || '',
        difficulty: q.difficulty || 'Moderate',
        marks: q.marks ?? 1,
        negativeMarks: q.negativeMarks ?? 0,
        class: q.class || q.classGrade || 'Class 1',
        classGrade: q.classGrade || q.class || '1',
        assertion: q.assertion || '',
        reason: q.reason || '',
        audited: q.audited || false,
        auditedAt: q.auditedAt || null
    };
};

export const formatQuestionToCentralized = (q) => {
    if (!q) return null;

    const rawType = (q.questionType || q.type || 'MCQ').toString().toUpperCase();
    const isNumerical = rawType.includes('NUMERICAL') || rawType.includes('NUMERIC');
    const isAssertion = rawType.includes('ASSERTION') || rawType.includes('AR');
    const isSubjective = rawType.includes('SUBJECTIVE');

    let qType = 'MCQ (Multiple Choice Question)';
    let legacyType = 'MCQ';
    if (isNumerical) {
        qType = 'Numerical';
        legacyType = 'NUMERICAL';
    } else if (isAssertion) {
        qType = 'Assertion–Reasoning';
        legacyType = 'ASSERTION_REASON';
    } else if (isSubjective) {
        qType = 'Subjective';
        legacyType = 'SUBJECTIVE';
    }

    let diff = q.difficulty || 'Medium';
    if (diff === 'Hard') diff = 'Difficult';
    if (!['Easy', 'Medium', 'Difficult'].includes(diff)) diff = 'Medium';

    let centralOptions = [];
    if (!isNumerical && Array.isArray(q.options)) {
        centralOptions = q.options.map(opt => {
            if (typeof opt === 'object' && opt !== null) {
                // Keep image if present
                if (opt.image || opt.img) {
                    return { text: canonicalizeLatex(opt.text || ''), image: opt.image || opt.img };
                }
                return canonicalizeLatex(opt.text || '');
            }
            return typeof opt === 'string' ? canonicalizeLatex(opt) : '';
        });
    }

    let correctAnswer = 0;
    if (isNumerical) {
        correctAnswer = String(q.correctAnswer ?? q.correctOption ?? q.numericalAnswer ?? '').trim();
    } else if (typeof q.correctAnswer === 'number') {
        correctAnswer = q.correctAnswer;
    } else if (typeof q.correctOption === 'string') {
        const mapping = { a: 0, b: 1, c: 2, d: 3 };
        correctAnswer = mapping[q.correctOption.toLowerCase()] ?? 0;
    }

    let classGrade = q.class || (q.classGrade ? (q.classGrade.startsWith('Class') ? q.classGrade : `Class ${q.classGrade}`) : 'Class 12');

    return {
        subject: q.subject || 'Physics',
        class: classGrade,
        chapter: q.chapter || '',
        topic: q.topic || q.chapter || '',
        subTopic: q.subTopic || q.subtopic || '',
        questionType: qType,
        type: legacyType,
        difficulty: diff,
        question: canonicalizeLatex(q.text || q.question || ''),
        image: q.image || '',
        assertion: q.assertion || '',
        reason: q.reason || '',
        options: centralOptions,
        correctAnswer,
        explanation: canonicalizeLatex(q.explanation || ''),
        tags: q.tags || [q.subject, q.chapter].filter(Boolean),
        source: q.source || 'Question Bank',
        status: q.status || 'Active',
        createdAt: q.createdAt ? new Date(q.createdAt) : new Date(),
        updatedAt: new Date()
    };
};
