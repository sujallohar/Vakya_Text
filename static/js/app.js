/**
 * app.js — Main application controller
 * Vākya — Intelligent Writing Assistant
 *
 * Orchestrates all modules:
 *   api.js    → LanguageTool calls
 *   stats.js  → text metrics
 *   diff.js   → diff rendering + corrections
 *   voice.js  → microphone input
 *   ui.js     → DOM helpers
 *
 * All event listeners live here.
 */

// ── Application state ─────────────────────────────────────
let currentMatches = [];   // Latest LanguageTool matches
let correctedText = '';   // Fully-corrected version of input
let appliedFixes = new Set(); // Indices of matches already applied
let debounceTimer = null;
let isChecking = false;

// ── Main check function ───────────────────────────────────
async function runCheck() {
    const text = $('input-text').value;
    const lang = $('lang-select').value;

    if (!text.trim()) {
        showToast('Please enter some text first', 'info');
        return;
    }
    if (isChecking) return;

    isChecking = true;
    appliedFixes.clear();
    setStatus('Checking…', true);
    setCheckBtnLoading(true);

    try {
        const result = await checkWithLanguageTool(text, lang);
        if (!result) return;

        currentMatches = result.matches || [];
        const count = currentMatches.length;

        // Update error counts
        updateErrorCount(count);

        // Build and display diff
        const diffHtml = buildDiff(text, currentMatches);
        $('output-content').innerHTML = `<div class="diff-text">${diffHtml}</div>`;

        // Compute fully-corrected text for "Apply All"
        correctedText = applyAllCorrections(text, currentMatches);

        // Show/hide corrections UI
        toggleCorrectionsUI(count);

        // Render correction cards
        renderCorrections(currentMatches, text, appliedFixes, handleSingleFix);

        // Smart suggestions
        generateSuggestions(currentMatches, text);

        // Status message
        const msg = count === 0 ? 'Perfect — no issues found!' : `Found ${count} issue${count > 1 ? 's' : ''}`;
        showToast(msg, count === 0 ? 'success' : 'info');
        setStatus(count === 0 ? 'All clear' : `${count} issues`, false);

    } catch (err) {
        console.error('Check error:', err);
        showToast('Check failed — please try again', 'error');
        setStatus('Error', false);
    } finally {
        isChecking = false;
        setCheckBtnLoading(false);
    }
}

// ── Apply a single correction ─────────────────────────────
function handleSingleFix(match, idx, orig, replacement) {
    const ta = $('input-text');
    let text = ta.value;

    // Calculate cumulative offset shift from previously applied fixes
    let shift = 0;
    for (const fi of appliedFixes) {
        const fm = currentMatches[fi];
        if (fm.offset < match.offset) {
            const r = fm.replacements?.[0]?.value || '';
            shift += r.length - fm.length;
        }
    }

    const adjOffset = match.offset + shift;
    ta.value = text.slice(0, adjOffset) + replacement + text.slice(adjOffset + match.length);

    appliedFixes.add(idx);
    updateStats(ta.value);
    showToast(`Fixed: "${orig}" → "${replacement}"`, 'success');

    // Re-render corrections list with updated applied state
    renderCorrections(currentMatches, ta.value, appliedFixes, handleSingleFix);

    // Update diff to show remaining issues
    const remaining = currentMatches.filter((_, i) => !appliedFixes.has(i));
    $('output-content').innerHTML = `<div class="diff-text">${buildDiff(ta.value, remaining)}</div>`;
}

// ── Clear everything ──────────────────────────────────────
function clearAll() {
    $('input-text').value = '';
    updateStats('');
    resetOutput();
    toggleCorrectionsUI(0);
    updateErrorCount(0);
    $('m-errors').textContent = '—';
    $('m-errors-sub').textContent = 'Run a check to see issues';
    $('suggestions-list').innerHTML = '<div class="suggestions-empty">Suggestions appear after checking</div>';
    currentMatches = [];
    correctedText = '';
    appliedFixes.clear();
    setStatus('Ready', false);
    showToast('Cleared', 'info');
}

// ── Event listeners ───────────────────────────────────────

// Live check with debounce (fires 1.2s after user stops typing)
$('input-text').addEventListener('input', function () {
    updateStats(this.value);
    clearTimeout(debounceTimer);
    if (this.value.trim().length > 20) {
        debounceTimer = setTimeout(runCheck, 1200);
    }
});

// Check button
$('check-btn').addEventListener('click', runCheck);

// Clear button
$('clear-btn').addEventListener('click', clearAll);

// Paste from clipboard
$('paste-btn').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        $('input-text').value = text;
        updateStats(text);
        showToast('Pasted from clipboard', 'success');
    } catch {
        showToast('Clipboard access denied — paste manually with Ctrl+V', 'error');
    }
});

// Apply all corrections
$('apply-all-btn').addEventListener('click', () => {
    if (!correctedText) return;
    $('input-text').value = correctedText;
    updateStats(correctedText);
    currentMatches.forEach((_, i) => appliedFixes.add(i));
    $('output-content').innerHTML = `<div class="diff-text" style="color:var(--green)">${escapeHtml(correctedText)}</div>`;
    renderCorrections(currentMatches, correctedText, appliedFixes, handleSingleFix);
    showToast(`Applied ${currentMatches.length} corrections`, 'success');
    $('apply-all-btn').style.display = 'none';
});

// Copy input
$('copy-btn').addEventListener('click', async () => {
    const text = $('input-text').value;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    $('copy-btn').classList.add('copy-pop');
    setTimeout(() => $('copy-btn').classList.remove('copy-pop'), 200);
    showToast('Input text copied', 'success');
});

// Copy corrected output
$('copy-output-btn').addEventListener('click', async () => {
    const text = correctedText || $('input-text').value;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    showToast('Corrected text copied', 'success');
});

// Export as .txt
$('download-btn').addEventListener('click', () => {
    const text = correctedText || $('input-text').value;
    if (!text) { showToast('Nothing to export', 'info'); return; }
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vakya-corrected.txt';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Text exported as .txt', 'success');
});

// Voice toggle
$('voice-btn').addEventListener('click', () => {
    toggleRecording();
    if (isVoiceRecording()) {
        setStatus('Listening…', true);
    } else {
        setStatus('Ready', false);
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        runCheck();
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        $('copy-output-btn').click();
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'X') {
        e.preventDefault();
        clearAll();
    }
});

// ── Initialise ────────────────────────────────────────────
(async function init() {
    // Set up voice input
    initVoice(
        (transcript) => {
            $('input-text').value += transcript + ' ';
            updateStats($('input-text').value);
        },
        (err) => {
            showToast(`Voice error: ${err}`, 'error');
            setStatus('Ready', false);
        }
    );

    // Initial stats render
    updateStats('');

    // Verify LanguageTool connectivity
    setStatus('Connecting…', true);
    const online = await pingLanguageTool();
    if (online) {
        setStatus('Ready', false);
        showToast('Connected to LanguageTool', 'success');
    } else {
        setStatus('Offline', false);
        showToast('LanguageTool unreachable — check internet connection', 'error');
    }
})();