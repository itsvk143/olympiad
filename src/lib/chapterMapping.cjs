/**
 * Canonical Chapter Mapping Service (CommonJS & ESM compatible)
 * Generic normalizer for Olympiad Mathematics, Science, and English.
 */

function getCanonicalChapter(subject, syllabusChapter) {
    const raw = (syllabusChapter || '').trim();
    if (!raw) return { subject: subject || '', chapter: '' };

    return {
        subject: subject || '',
        chapter: raw,
        topic: raw
    };
}

module.exports = { getCanonicalChapter };
