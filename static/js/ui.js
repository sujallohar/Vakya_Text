/**
 * ui.js — UI helpers: toasts, status, DOM utilities
 * Vākya — Intelligent Writing Assistant
 */

/* ── Short selector helper ── */
const $ = id => document.getElementById(id);

/**
 * Show a toast notification.
 * Auto-dismisses after 3 seconds.
 *
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 */
function showToast(message, type = 'info') {
    const container = $('toast-container');
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.innerHTML = `<span class="toast-icon"></span><span>${escapeHtml(message)}</span>`;
    container.appendChild(div);

    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateX(20px)';
        div.style.transition = 'all 0.3s';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

/**
 * Update the header status indicator.
 *
 * @param {string}  text    - Status label
 * @param {boolean} loading - True = show amber pulsing dot
 */
function setStatus(text, loading) {
    $('status-text').textContent = text;
    const dot = $('status-dot');

    if (loading) {
        dot.style.background = 'var(--gold2)';
        dot.style.boxShadow = '0 0 8px rgba(232,201,106,0.5)';
    } else if (text === 'Ready' || text.includes('clear') || text.includes('All clear')) {
        dot.style.background = 'var(--green)';
        dot.style.boxShadow = '0 0 8px rgba(92,196,138,0.5)';
    } else if (text.includes('Error') || text.includes('Offline')) {
        dot.style.background = 'var(--red)';
        dot.style.boxShadow = '';
    } else {
        dot.style.background = 'var(--gold)';
        dot.style.boxShadow = '';
    }
}

/**
 * Reset the output area to its empty placeholder state.
 */
function resetOutput() {
    $('output-content').innerHTML = `
    <div class="output-empty">
      <div class="output-empty-icon">◈</div>
      <div class="output-empty-text">Corrected text appears here</div>
    </div>`;
}

/**
 * Show or hide the corrections card and related elements.
 * @param {number} count - Number of corrections (0 = hide all)
 */
function toggleCorrectionsUI(count) {
    const show = count > 0;

    $('corrections-card').style.display = show ? 'block' : 'none';
    $('apply-all-btn').style.display = show ? '' : 'none';
    $('correction-badge').style.display = show ? '' : 'none';

    if (show) {
        $('correction-badge').textContent = count;
        $('corrections-count').textContent = `${count} issue${count > 1 ? 's' : ''} found`;
    }
}

/**
 * Update error count displays.
 * @param {number} count
 */
function updateErrorCount(count) {
    $('error-count').textContent = count;
    $('m-errors').textContent = count;
    $('m-errors-sub').textContent = count === 0
        ? 'No issues found!'
        : `${count} issue${count > 1 ? 's' : ''} to fix`;
}

/**
 * Set the check button into loading state.
 * @param {boolean} loading
 */
function setCheckBtnLoading(loading) {
    const btn = $('check-btn');
    const spinner = $('check-spinner');
    const label = $('check-btn-text');

    btn.disabled = loading;
    spinner.classList.toggle('show', loading);
    label.textContent = loading ? 'Checking…' : 'Check Writing';
}