/**
 * diff.js — Diff rendering and correction application
 * Vākya — Intelligent Writing Assistant
 *
 * Handles:
 *  - Building coloured diff HTML from LanguageTool matches
 *  - Applying corrections to text (single and bulk)
 *  - Rendering correction cards in the sidebar
 *  - Generating smart suggestions
 */

/**
 * Safely escape HTML special characters.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Build diff HTML from original text and LanguageTool matches.
 * Red strikethrough = original error, green highlight = correction.
 *
 * @param {string}   text    - Original input text
 * @param {Object[]} matches - LanguageTool matches array
 * @returns {string} HTML string
 */
function buildDiff(text, matches) {
    if (!matches.length) return escapeHtml(text);

    let result = '';
    let lastIdx = 0;

    // Sort by offset to process left-to-right
    const sorted = [...matches].sort((a, b) => a.offset - b.offset);

    for (const m of sorted) {
        const off = m.offset;
        const len = m.length;
        if (off < lastIdx) continue; // skip overlapping matches

        // Text before this match
        result += escapeHtml(text.slice(lastIdx, off));

        const wrong = escapeHtml(text.slice(off, off + len));
        const best = m.replacements?.[0]?.value;

        if (best !== undefined && best !== text.slice(off, off + len)) {
            result += `<span class="diff-original">${wrong}</span>`;
            result += `<span class="diff-corrected">${escapeHtml(best)}</span>`;
        } else {
            // No replacement — just underline the problematic word
            result += `<span style="text-decoration:underline wavy var(--red);text-underline-offset:3px">${wrong}</span>`;
        }

        lastIdx = off + len;
    }

    result += escapeHtml(text.slice(lastIdx));
    return result;
}

/**
 * Apply ALL corrections to a text string.
 * Adjusts offsets as text length changes with each replacement.
 *
 * @param {string}   text    - Original text
 * @param {Object[]} matches - LanguageTool matches
 * @returns {string} Fully corrected text
 */
function applyAllCorrections(text, matches) {
    let result = text;
    let offset = 0;

    const sorted = [...matches]
        .filter(m => m.replacements?.[0]?.value !== undefined)
        .sort((a, b) => a.offset - b.offset);

    for (const m of sorted) {
        const adj = m.offset + offset;
        const best = m.replacements[0].value;
        const orig = result.slice(adj, adj + m.length);
        if (orig === best) continue;
        result = result.slice(0, adj) + best + result.slice(adj + m.length);
        offset += best.length - m.length;
    }

    return result;
}

/**
 * Render correction cards into the #corrections-list container.
 *
 * @param {Object[]} matches      - LanguageTool matches
 * @param {string}   text         - Current text (for context)
 * @param {Set}      appliedFixes - Set of already-applied match indices
 * @param {Function} onApply      - Callback(match, index, orig, replacement)
 */
function renderCorrections(matches, text, appliedFixes, onApply) {
    const list = document.getElementById('corrections-list');

    if (!matches.length) {
        list.innerHTML = `
      <div class="no-corrections">
        <div class="no-corrections-icon">◈</div>
        <span>No issues found — great writing!</span>
      </div>`;
        return;
    }

    list.innerHTML = '';

    matches.forEach((m, idx) => {
        const best = m.replacements?.[0]?.value;
        const orig = text.slice(m.offset, m.offset + m.length);
        const type = getCorrectionType(m.rule?.category?.id);
        const conf = Math.min(100, Math.round((m.replacements?.length || 1) * 20 + 40));
        const applied = appliedFixes.has(idx);

        const item = document.createElement('div');
        item.className = `correction-item${applied ? ' applied' : ''}`;
        item.style.animationDelay = `${idx * 0.05}s`;

        item.innerHTML = `
      <div class="correction-header">
        <div class="correction-words">
          <span class="word-wrong">${escapeHtml(orig)}</span>
          <span class="word-arrow">→</span>
          <span class="word-right">
            ${best !== undefined
                ? escapeHtml(best)
                : '<em style="opacity:0.5">no suggestion</em>'}
          </span>
        </div>
        <span class="correction-type type-${type}">${type}</span>
      </div>
      <div class="correction-message">${escapeHtml(m.message || 'Possible issue detected')}</div>
      <div class="correction-confidence">
        <div class="conf-bar-track">
          <div class="conf-bar-fill" style="width:${conf}%"></div>
        </div>
        <span class="conf-label">${conf}%</span>
      </div>
      ${applied ? '<div class="applied-tag">✓ APPLIED</div>' : ''}
    `;

        if (!applied && best !== undefined) {
            item.title = 'Click to apply this fix';
            item.addEventListener('click', () => onApply(m, idx, orig, best));
        }

        list.appendChild(item);
    });
}

/**
 * Generate and render smart suggestions based on the match analysis.
 *
 * @param {Object[]} matches - LanguageTool matches
 * @param {string}   text    - Current text
 */
function generateSuggestions(matches, text) {
    const list = document.getElementById('suggestions-list');
    const items = [];

    // Count by type
    const spelling = matches.filter(m => getCorrectionType(m.rule?.category?.id) === 'spelling').length;
    const grammar = matches.filter(m => getCorrectionType(m.rule?.category?.id) === 'grammar').length;
    const style = matches.filter(m => getCorrectionType(m.rule?.category?.id) === 'style').length;

    if (spelling > 0) items.push({ icon: '⚡', text: `${spelling} spelling issue${spelling > 1 ? 's' : ''} detected` });
    if (grammar > 0) items.push({ icon: '📐', text: `${grammar} grammar error${grammar > 1 ? 's' : ''} to fix` });
    if (style > 0) items.push({ icon: '✨', text: `${style} style suggestion${style > 1 ? 's' : ''} available` });

    // Sentence length advice
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const sents = text.split(/[.!?]+/).filter(s => s.trim());
    const avgWords = words.length / Math.max(1, sents.length);

    if (words.length > 0) {
        if (avgWords > 25) items.push({ icon: '✂️', text: 'Consider shorter sentences for clarity' });
        if (avgWords < 5 && words.length > 20) items.push({ icon: '🔗', text: 'Try combining short sentences' });
    }

    if (!items.length) {
        list.innerHTML = `<div style="padding:12px 0;text-align:center;color:var(--green);font-size:12px">✓ Writing looks great!</div>`;
        return;
    }

    list.innerHTML = items.map((it, i) => `
    <div class="suggestion-chip" style="animation-delay:${i * 0.08}s">
      <span class="suggestion-icon">${it.icon}</span>
      <span>${it.text}</span>
    </div>
  `).join('');
}