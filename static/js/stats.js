/**
 * stats.js — Text statistics and readability analysis
 * Vākya — Intelligent Writing Assistant
 *
 * Provides:
 *  - Word / character / sentence / reading-time counts
 *  - Flesch Reading Ease score
 *  - Unique word count, average word length
 */

/**
 * Count syllables in a single English word.
 * Uses a simplified vowel-group heuristic.
 * @param {string} word
 * @returns {number}
 */
function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!word) return 0;
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
}

/**
 * Compute Flesch Reading Ease score (0–100).
 * Higher = easier to read.
 *  90–100: Very Easy (5th grade)
 *  70–90:  Easy
 *  60–70:  Standard
 *  50–60:  Fairly Difficult
 *  30–50:  Difficult
 *  0–30:   Very Difficult
 *
 * Formula: 206.835 − 1.015(words/sentences) − 84.6(syllables/words)
 * @param {string[]} words
 * @param {string[]} sentences
 * @returns {number} Score clamped to [0, 100]
 */
function fleschReadingEase(words, sentences) {
    if (!words.length || !sentences.length) return 0;
    const totalSyllables = words.reduce((n, w) => n + countSyllables(w), 0);
    const score = 206.835
        - 1.015 * (words.length / sentences.length)
        - 84.6 * (totalSyllables / words.length);
    return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get readability grade label and colour for a Flesch score.
 * @param {number} score
 * @returns {{ color: string, grade: string }}
 */
function readabilityMeta(score) {
    if (score >= 90) return { color: 'var(--green)', grade: 'Very Easy (5th grade)' };
    if (score >= 70) return { color: '#8bc34a', grade: 'Easy (6th grade)' };
    if (score >= 60) return { color: 'var(--gold2)', grade: 'Standard (8th grade)' };
    if (score >= 50) return { color: '#ff9800', grade: 'Fairly Difficult' };
    if (score >= 30) return { color: 'var(--red)', grade: 'Difficult' };
    return { color: '#9c27b0', grade: 'Very Difficult' };
}

/**
 * Compute all statistics for a text string.
 * @param {string} text
 * @returns {Object} All metrics
 */
function computeStats(text) {
    const words = text.trim() ? text.trim().split(/\s+/).filter(w => w.length > 0) : [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chars = text.length;
    const readMin = Math.max(1, Math.round(words.length / 200));
    const unique = new Set(words.map(w => w.toLowerCase())).size;
    const avgWLen = words.length
        ? (words.join('').replace(/[^a-zA-Z]/g, '').length / words.length).toFixed(1)
        : 0;
    const flesch = fleschReadingEase(words, sentences);

    return {
        words: words.length,
        sentences: sentences.length,
        chars,
        readMin,
        unique,
        avgWLen,
        flesch,
        meta: readabilityMeta(flesch),
    };
}

/**
 * Update all statistics display elements in the DOM.
 * @param {string} text
 */
function updateStats(text) {
    const s = computeStats(text);

    // Stats bar
    document.getElementById('word-count').textContent = s.words;
    document.getElementById('char-count').textContent = s.chars;
    document.getElementById('sent-count').textContent = s.sentences;
    document.getElementById('read-time').textContent = s.readMin;

    // Metrics panel
    document.getElementById('m-words').textContent = s.words || '—';
    document.getElementById('m-sentences').textContent = s.sentences || '—';
    document.getElementById('m-avg-word').textContent = s.avgWLen || '—';
    document.getElementById('m-unique').textContent = s.unique || '—';

    // Readability bar
    const bar = document.getElementById('read-bar');
    const score = document.getElementById('read-score');
    const grade = document.getElementById('read-grade');

    bar.style.width = (s.flesch || 0) + '%';
    bar.style.background = s.words ? s.meta.color : 'var(--dim)';
    score.textContent = s.words ? s.flesch : '—';
    grade.textContent = s.words ? s.meta.grade : 'Enter some text';
}