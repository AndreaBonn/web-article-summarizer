# AI Article Summarizer

A Chrome Extension that summarizes web articles using large language models.
Supports four AI providers, five output languages, and multiple export formats.

Version 2.2.0 — Manifest V3 — No build step required

---

## Features

- **Article summarization** — generates a structured summary from any web page
- **Key points extraction** — 7–12 bullet points with paragraph references
- **Full article translation** — into Italian, English, Spanish, French, or German
- **Interactive Q&A** — ask follow-up questions grounded in the article content
- **Multi-article analysis** — compare and cross-reference up to N articles
- **PDF and PDF-specific analysis** — summarize PDFs directly from the browser
- **Export** — PDF and Markdown with per-section selection
- **Email sharing** — send summaries with saved recipient management
- **Voice I/O** — Text-to-Speech playback and Speech-to-Text input
- **History** — searchable and filterable archive of past summaries
- **Smart cache** — instant reload for previously analyzed articles
- **Content-type detection** — auto-classifies articles as General, Scientific, News,
  Tutorial, Business, or Opinion and applies specialized prompts accordingly
- **Dark mode** — system-aware, with manual toggle

---

## Supported AI Providers

| Provider | Model | Notes |
|---|---|---|
| Groq | Llama 3.3 70B | Fast inference, free tier available |
| OpenAI | GPT-4o mini | Balanced quality and cost |
| Anthropic | Claude 3.5 Sonnet | Strong reasoning on long articles |
| Google | Gemini 2.5 Pro | Multimodal, large context window |

Each provider requires a separate API key, configured via the Options page.
The extension calls provider APIs directly from the browser — no backend involved.

---

## Quick Start

1. Open `chrome://extensions/` and enable **Developer mode**
2. Click **Load unpacked** and select this repository folder
3. Open the extension Options and enter your API key for at least one provider
4. Navigate to any article and click the extension icon

---

## Architecture

```
ai-article-summarizer/
├── manifest.json           # Extension manifest (V3)
├── background.js           # Service worker — cache, storage, message routing
├── content.js              # Content script — DOM extraction
│
├── popup.html/.css/.js     # Main summarizer UI
├── reading-mode.html/.css/.js
├── history.html/.css/.js
├── options.html/.css/.js
├── multi-analysis.html/.css/.js
├── pdf-analysis.html/.css/.js
│
├── src/                    # Page-specific ES modules
│   ├── popup/              # Popup UI modules (5 files)
│   ├── reading-mode/       # Reading mode modules (5 files)
│   └── history/            # History modules (4 files)
│
├── utils/                  # Shared utilities (36 files)
│   ├── prompt-registry.js  # Centralized AI prompts for all providers and content types
│   ├── api-client.js       # LLM API calls, provider abstraction
│   ├── api-resilience.js   # Rate limiting and retry logic
│   ├── storage-manager.js  # chrome.storage wrapper
│   ├── cache-manager.js    # Article cache with LZ compression
│   ├── html-sanitizer.js   # XSS prevention
│   ├── input-sanitizer.js  # User input validation
│   ├── i18n.js             # UI internationalization
│   └── ...                 # Other shared utilities
│
├── lib/                    # Vendored libraries
│   ├── Readability.js      # Mozilla article extraction
│   ├── jsPDF               # PDF export
│   ├── pdf.js              # PDF parsing (Mozilla)
│   └── lz-string.min.js    # Cache compression
│
├── icons/
└── docs/                   # Architecture notes, audit reports, prompt docs
```

---

## Tech Stack

- JavaScript (ES6+), HTML5, CSS3
- Chrome Extension Manifest V3 (service worker architecture)
- Mozilla Readability — article text extraction
- jsPDF — client-side PDF generation
- Mozilla pdf.js — in-browser PDF parsing
- lz-string — cache compression
- No framework, no build system, no transpilation

---

## Security Notes

- API keys are stored exclusively in `chrome.storage.local` (sandboxed per-extension)
- All user input is sanitized before being inserted into AI prompts (`input-sanitizer.js`)
- All HTML rendered from AI responses is sanitized before DOM insertion (`html-sanitizer.js`)
- Rate limiting is applied per provider to prevent accidental quota exhaustion
- No telemetry, no analytics, no external calls except to the configured AI provider

---

## License

MIT License — Copyright (c) 2024–2025 Andrea Bonn
