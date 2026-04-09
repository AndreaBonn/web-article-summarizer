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
│       │   └── prompts/                — Split prompt modules (summary, keypoints, translation, citation)
│       ├── storage/                    — Chrome storage, cache, compression, history
│       ├── export/                     — PDF, Markdown, email export
│       ├── pdf/                        — PDF parsing and caching
│       ├── i18n/                       — Internationalization (I18n.initPage() for page setup)
│       ├── voice/                      — TTS/STT controllers
│       ├── security/                   — HTML/input sanitization
│       └── core/                       — Modal, theme, translator, error handling, logger
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

`PromptRegistry` (facade) delegates to split modules in `src/utils/ai/prompts/`:

- `summary-prompts.js`, `keypoints-prompts.js`, `translation-prompts.js`, `citation-prompts.js`

Four public methods (backward-compatible):

- `PromptRegistry.getSummarySystemPrompt(provider, contentType)`
- `PromptRegistry.getKeyPointsSystemPrompt(provider, contentType)`
- `PromptRegistry.getTranslationSystemPrompt(provider, contentType)`
- `PromptRegistry.getCitationSystemPrompt(provider)`

### API Calls

`APIClient` (facade) in `src/utils/ai/api-client.js` orchestrates:

- All LLM calls go through `APIClient.generateCompletion()`
- 60s timeout via `AbortController` on all fetch calls
- Response validation for all 4 providers (empty response detection)
- Language map generation via shared `buildLanguageMap()` factory

### Logging

`Logger` in `src/utils/core/logger.js` — level-gated logging:

```js
import { Logger } from '@utils/core/logger.js';
Logger.debug('verbose'); // suppressed when Logger.level = 'warn'
Logger.error('always'); // always shown unless level = 'silent'
```

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

## Quality Tools

- `npm run lint` — ESLint (flat config, Chrome Extension globals)
- `npm run format` — Prettier (single quotes, trailing commas, 100 char)
- `npm run test` — vitest with jsdom environment
- `npm run test:watch` — vitest in watch mode
- CI: GitHub Actions runs lint + test + build on push/PR to main

## Conventions

- ES Modules with named exports (`export class X`, `import { X } from`)
- CSS class `.hidden { display: none !important; }` required in every page CSS
- HTML sanitization via `HtmlSanitizer.escape()` for all DOM output
- Input sanitization via `InputSanitizer.sanitizeForAI()` for all AI inputs
- Chrome page URLs use extension-root-relative paths: `src/pages/{page}/{page}.html`
