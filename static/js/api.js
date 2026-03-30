/**
 * api.js — LanguageTool API integration
 * Vākya — Intelligent Writing Assistant
 *
 * Uses the free public LanguageTool API (no API key required).
 * Rate limit: ~20 requests/min on free tier.
 * Docs: https://languagetool.org/http-api/
 */

const LT_API = 'https://api.languagetool.org/v2/check';

/**
 * Send text to LanguageTool for grammar/spell checking.
 * @param {string} text     - The text to check
 * @param {string} language - Language code e.g. "en-US", "de-DE"
 * @returns {Promise<Object>} - LanguageTool response with matches array
 */
async function checkWithLanguageTool(text, language) {
    if (!text || text.trim().length < 3) return null;

    const params = new URLSearchParams({
        text: text,
        language: language,
        enabledOnly: 'false',
    });

    const response = await fetch(LT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });

    if (!response.ok) {
        throw new Error(`LanguageTool API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

/**
 * Ping LanguageTool to verify connectivity on page load.
 * @returns {Promise<boolean>}
 */
async function pingLanguageTool() {
    try {
        const params = new URLSearchParams({ text: 'test', language: 'en-US' });
        const res = await fetch(LT_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Map LanguageTool rule category to our internal type.
 * @param {string} category - Category ID from LanguageTool
 * @returns {string} - 'spelling' | 'grammar' | 'punctuation' | 'style'
 */
function getCorrectionType(category) {
    const c = (category || '').toUpperCase();
    if (c.includes('SPELL') || c.includes('TYPO')) return 'spelling';
    if (c.includes('GRAMMAR') || c.includes('AGREEMENT') || c.includes('VERB')) return 'grammar';
    if (c.includes('PUNCT')) return 'punctuation';
    return 'style';
}