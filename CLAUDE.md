# AI Article Summarizer — Chrome Extension

## Overview
Chrome Extension (Manifest V3) per riassumere articoli web con AI.
Supporta 4 provider LLM: Groq, OpenAI, Anthropic (Claude), Google Gemini.

## Architecture

### Entry Points (root)
- `manifest.json` — Manifest V3 config
- `background.js` — Service worker (API calls, cache, maintenance)
- `content.js` — Content script (article extraction via Readability.js)
- `popup.html/js` — Extension popup (main UI controller)
- `reading-mode.html/js` — Full-page reading mode (side-by-side)
- `history.html/js` — History management page
- `options.html/js` — Settings page
- `multi-analysis.html/js` — Multi-article comparison
- `pdf-analysis.html/js` — PDF analysis

### Page Modules (`src/`)
Each page controller has been decomposed into focused modules:
- `src/popup/` — analysis, export, features (Q&A + translation), citations, voice
- `src/reading-mode/` — display, features, export, pdf, voice
- `src/history/` — detail, collections, io, voice

Modules are loaded via `<script>` tags BEFORE their controller.
All functions are global (no ES Modules).

### Shared Utilities (`utils/`)
- `prompt-registry.js` — Centralized AI prompts (single source of truth)
- `api-client.js` — LLM API calls (Groq, OpenAI, Anthropic, Gemini)
- `storage-manager.js` — Chrome storage abstraction
- `cache-manager.js` — Response caching with content hashing
- `history-manager.js` — Summary history CRUD
- `i18n.js` / `i18n-extended.js` — Internationalization (inline dictionaries)
- `input-sanitizer.js` — Input validation for AI prompts
- `html-sanitizer.js` — XSS prevention for DOM output
- `modal.js` — Shared modal component
- `translator.js` — Article translation (delegates to APIClient)
- `citation-extractor.js` — Citation extraction via AI
- `content-classifier.js` — AI-based content type classification
- `voice-controller.js` / `tts-manager.js` / `stt-manager.js` — Voice I/O

### Third-Party (`lib/`)
- Readability.js (Mozilla) — Article content extraction
- jsPDF — PDF export
- pdf.js (Mozilla) — PDF parsing
- lz-string — Compression for storage

## Key Patterns

### Script Loading Order
```
utils/ (shared) → src/{page}/ (modules) → {page}.js (controller)
```
The controller runs last and initializes everything.

### Prompt System
All AI prompts are in `utils/prompt-registry.js`. Four public methods:
- `PromptRegistry.getSummarySystemPrompt(provider, contentType)`
- `PromptRegistry.getKeyPointsSystemPrompt(provider, contentType)`
- `PromptRegistry.getTranslationSystemPrompt(provider, contentType)`
- `PromptRegistry.getCitationSystemPrompt(provider)`

### API Calls
All LLM calls go through `APIClient.generateCompletion()`.
Provider-specific methods: `callGroqCompletion`, `callOpenAICompletion`,
`callAnthropicCompletion`, `callGeminiCompletion`.

### State Management
Global variables per page (no centralized store):
- `currentArticle`, `currentResults`, `currentQA` (popup)
- `currentData` (reading-mode)
- `currentEntry` (history)

## Build & Deploy
No build system. Load extension unpacked from this directory in Chrome:
1. `chrome://extensions/` → Developer mode → Load unpacked
2. Select this directory

## Conventions
- No ES Modules — everything in global scope
- CSS class `.hidden { display: none !important; }` required in every page CSS
- HTML sanitization via `HtmlSanitizer.escape()` for all DOM output
- Input sanitization via `InputSanitizer.sanitizeForAI()` for all AI inputs
