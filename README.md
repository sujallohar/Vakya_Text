# Vākya — वाक्य · Intelligent Writing Assistant

A world-class grammar and spell-checking web app powered by **Google's LanguageTool API**.


## How to Run

### Option 1 — Flask server (recommended)
```bash
pip install flask
python server.py
```
Open: **http://localhost:8080**

### Option 2 — Python simple server (no install)
```bash
python3 -m http.server 8080
```
Open: **http://localhost:8080/templates/index.html**

> **Note:** Must use `http://localhost` — not `file://`.
> Voice input and clipboard API require a secure context (http://localhost qualifies).

---

## Features

| Feature | Description |
|---|---|
| Real-time checking | Auto-checks 1.2s after you stop typing |
| Diff view | Red strikethrough = error, green = correction |
| Correction cards | Click any card to apply that single fix |
| Apply All | Fix every issue in one click |
| Voice input | Speak instead of type (Chrome/Edge) |
| 30+ languages | English, German, French, Spanish, and more |
| Flesch score | Live readability score with grade label |
| Writing metrics | Words, sentences, unique words, reading time |
| Smart suggestions | Sentence length advice, issue type breakdown |
| Export | Download corrected text as `.txt` |
| Keyboard shortcuts | Ctrl+Enter to check, Ctrl+Shift+C to copy result |

---

## JavaScript Module Responsibilities

| File | Responsibility |
|---|---|
| `api.js` | All network calls to LanguageTool API |
| `stats.js` | Syllable counting, Flesch formula, DOM stat updates |
| `diff.js` | HTML diff building, correction application, card rendering |
| `voice.js` | SpeechRecognition setup, start/stop recording |
| `ui.js` | Toasts, status dot, DOM helpers, button states |
| `app.js` | State management, event listeners, module orchestration |

---

## Technologies

- **Frontend:** Vanilla HTML + CSS + JavaScript (no framework)
- **Server:** Python Flask (development only — can deploy as static site)
- **AI/NLP:** LanguageTool public API (free, no key required)
- **Fonts:** Cormorant Garamond + JetBrains Mono + Outfit (Google Fonts)
- **Voice:** Web Speech API (browser-native)

---

## Resume Entry

```latex
\resumeProjectHeading
    {\textbf{Vākya — Intelligent Writing Assistant} $|$
     \emph{HTML, CSS, JS, Python Flask, LanguageTool API}}{}
    \resumeItemListStart
        \resumeItem{Built a modular grammar and spell-checking web app integrating
          \textbf{Google's LanguageTool API} (30+ languages) with real-time diff
          highlighting, per-rule correction cards, and confidence scoring.}
        \resumeItem{Implemented \textbf{Flesch readability scoring}, voice input via
          Web Speech API, live writing metrics, and one-click apply-all corrections
          across a clean 6-file JavaScript module architecture.}
    \resumeItemListEnd
```