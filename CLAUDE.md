# AI Article Summarizer — Chrome Extension

## Overview
Chrome Extension (Manifest V3) per riassumere articoli web con AI.
Supporta 4 provider LLM: Groq, OpenAI, Anthropic (Claude), Google Gemini.

## Architecture

### Build System
**Vite + @crxjs/vite-plugin** — ES Modules, tree-shaking, HMR in development.
- `npm run dev` — Development server with HMR
- `npm run build` — Production build → `dist/`
- Chrome loads from `dist/` (not root)

### Entry Points (root)
- `manifest.json` — Manifest V3 config (read by CRXJS at build time)
- `background.js` — Service worker (ES module, `type: "module"` in manifest)
- `content.js` — Content script (bundled as IIFE by CRXJS)
- `popup.html` → `popup.js` — Extension popup
- `reading-mode.html` → `reading-mode.js` — Full-page reading mode
- `history.html` → `history.js` — History management
- `options.html` → `options.js` — Settings
- `multi-analysis.html` → `multi-analysis.js` — Multi-article comparison
- `pdf-analysis.html` → `pdf-analysis.js` — PDF analysis

### Page Modules (`src/`)
Each complex page has a `state.js` shared state module + focused modules:
- `src/popup/` — state, analysis, export, features, citations, voice
- `src/reading-mode/` — state, display, features, export, pdf, voice
- `src/history/` — state, detail, collections, io, voice

Modules use ES `import`/`export`. Each page controller is the entry point
and imports its modules + utils.

### Shared Utilities (`utils/`)
All utilities use ES module exports.
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

### Third-Party (npm)
- `@mozilla/readability` — Article content extraction
- `jspdf` — PDF export
- `pdfjs-dist` — PDF parsing (worker in `lib/pdf.worker.min.js`)
- `lz-string` — Compression for storage

### Legacy (`lib/`)
- `pdf.worker.min.js` — PDF.js worker (web accessible resource)

## Key Patterns

### Module Import Order
```
utils/ (shared) → src/{page}/state.js → src/{page}/*.js (modules) → {page}.js (controller)
```
The controller is the ES module entry point (`<script type="module">`).

### Shared State Pattern
Each complex page uses a `state.js` module exporting a mutable state object:
```js
import { state, elements } from './state.js';
state.currentArticle = article; // Mutate properties, not rebind
```

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

## Build & Deploy
1. `npm install`
2. `npm run build`
3. `chrome://extensions/` → Developer mode → Load unpacked → Select `dist/`

For development with HMR: `npm run dev`

## Conventions
- ES Modules with named exports (`export class X`, `import { X } from`)
- CSS class `.hidden { display: none !important; }` required in every page CSS
- HTML sanitization via `HtmlSanitizer.escape()` for all DOM output
- Input sanitization via `InputSanitizer.sanitizeForAI()` for all AI inputs

# currentDate
Today's date is 2026-04-08.

      IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.
