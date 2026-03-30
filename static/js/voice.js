/**
 * voice.js — Web Speech API voice input
 * Vākya — Intelligent Writing Assistant
 *
 * Provides microphone-based text input using the browser's
 * built-in SpeechRecognition API (Chrome, Edge, Safari).
 * Firefox does not support this API.
 */

let recognition = null;
let isRecording = false;

/**
 * Initialise the SpeechRecognition object.
 * Called once on page load.
 * @param {Function} onFinalResult - Called with finalised transcript string
 * @param {Function} onError       - Called on recognition error
 */
function initVoice(onFinalResult, onError) {
    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        const btn = document.getElementById('voice-btn');
        btn.title = 'Voice input not supported in this browser (use Chrome or Edge)';
        btn.style.opacity = '0.3';
        btn.style.cursor = 'not-allowed';
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;   // keep listening until stopped
    recognition.interimResults = true;   // show partial results

    recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }
        if (finalTranscript) {
            onFinalResult(finalTranscript);
        }
    };

    recognition.onerror = (event) => {
        stopRecording();
        onError(event.error || 'Unknown voice error');
    };

    recognition.onend = () => {
        // Auto-restart if we were supposed to be recording (handles silence cutoff)
        if (isRecording) {
            try { recognition.start(); } catch { }
        }
    };
}

/**
 * Start recording from the microphone.
 */
function startRecording() {
    if (!recognition || isRecording) return;
    try {
        recognition.start();
        isRecording = true;
        document.getElementById('voice-btn').classList.add('recording');
    } catch (e) {
        console.warn('Voice start error:', e);
    }
}

/**
 * Stop recording.
 */
function stopRecording() {
    if (!recognition) return;
    isRecording = false;
    try { recognition.stop(); } catch { }
    document.getElementById('voice-btn').classList.remove('recording');
}

/**
 * Toggle recording on/off.
 */
function toggleRecording() {
    if (isRecording) stopRecording();
    else startRecording();
}

/**
 * Check whether voice input is currently active.
 * @returns {boolean}
 */
function isVoiceRecording() {
    return isRecording;
}