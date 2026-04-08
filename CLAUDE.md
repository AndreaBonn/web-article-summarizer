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

### Project Structure
```
├── src/
│   ├── background/service-worker.js    — Service worker (ES module)
│   ├── content/content-script.js       — Content script (bundled as IIFE)
│   ├── pages/                          — Each page = HTML + controller JS + CSS + modules
│   │   ├── popup/                      — Extension popup (main entry point)
│   │   ├── reading-mode/               — Full-page reading mode
│   │   ├── history/                    — History management
│   │   ├── options/                    — Settings
│   │   ├── multi-analysis/             — Multi-article comparison
│   │   └── pdf-analysis/               — PDF analysis
│   ├── shared/styles/                  — Shared CSS (voice-controls.css)
│   └── utils/                          — Shared utilities by domain
│       ├── ai/                         — API client, prompts, classification, citations
│       ├── storage/                    — Chrome storage, cache, compression, history
│       ├── export/                     — PDF, Markdown, email export
│       ├── pdf/                        — PDF parsing and caching
│       ├── i18n/                       — Internationalization
│       ├── voice/                      — TTS/STT controllers
│       ├── security/                   — HTML/input sanitization
│       └── core/                       — Modal, theme, translator, error handling, etc.
├── public/
│   ├── icons/                          — Extension icons and backgrounds
│   └── workers/                        — PDF.js web worker
├── manifest.json                       — Manifest V3 config
├── vite.config.js                      — Build config with path aliases
└── package.json
```

### Page Structure
Each complex page has a `state.js` shared state module + focused modules:
- `src/pages/popup/` — state, analysis, export, features, citations, voice
- `src/pages/reading-mode/` — state, display, features, export, pdf, voice
- `src/pages/history/` — state, detail, collections, io, voice

Modules use ES `import`/`export`. Each page controller is the entry point
and imports its modules + utils.

### Third-Party (npm)
- `@mozilla/readability` — Article content extraction
- `jspdf` — PDF export
- `pdfjs-dist` — PDF parsing (worker in `public/workers/pdf.worker.min.js`)
- `lz-string` — Compression for storage

## Key Patterns

### Module Import Order
```
src/utils/{domain}/ → src/pages/{page}/state.js → src/pages/{page}/*.js → src/pages/{page}/{page}.js (controller)
```
The controller is the ES module entry point (`<script type="module">`).

### Shared State Pattern
Each complex page uses a `state.js` module exporting a mutable state object:
```js
import { state, elements } from './state.js';
state.currentArticle = article; // Mutate properties, not rebind
```

### Prompt System
All AI prompts are in `src/utils/ai/prompt-registry.js`. Four public methods:
- `PromptRegistry.getSummarySystemPrompt(provider, contentType)`
- `PromptRegistry.getKeyPointsSystemPrompt(provider, contentType)`
- `PromptRegistry.getTranslationSystemPrompt(provider, contentType)`
- `PromptRegistry.getCitationSystemPrompt(provider)`

### API Calls
All LLM calls go through `APIClient.generateCompletion()` in `src/utils/ai/api-client.js`.
Provider-specific methods: `callGroqCompletion`, `callOpenAICompletion`,
`callAnthropicCompletion`, `callGeminiCompletion`.

### Vite Path Aliases
```js
'@utils' → 'src/utils'
'@pages' → 'src/pages'
'@shared' → 'src/shared'
```

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
- Chrome page URLs use extension-root-relative paths: `src/pages/{page}/{page}.html`
