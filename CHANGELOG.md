# Changelog

All notable changes to AI Article Summarizer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2026-04-09

### Fixed
- Resolved 3 remaining audit issues from deep security review
- Resolved 17 issues from deep audit (3 critical, 7 major, 7 minor)
- Resolved 4 issues found during deep review

### Added
- 10 new test suites for previously untested modules

### Changed
- Centralized PDF API calls in service worker for security

## [2.1.0] - 2026-04-08

### Fixed
- Applied 12 remaining fixes from multi-agent audit
- Applied 17 fixes from multi-agent audit (security, robustness, bugs)
- Preserved error cause chain across all catch blocks
- Logger uses correct console methods (debug/info instead of log)

### Added
- 82 tests for 5 previously untested modules
- 139 tests for 7 previously untested modules
- 84 tests for BaseHistoryRepository, HistoryManager, ErrorHandler

### Changed
- Split HistoryManager, unified providers, extracted export formatters
- Decomposed 3 oversized modules and eliminated APIClient facade
- Decomposed 6 oversized files into focused modules

## [2.0.0] - 2026-04-07

### Fixed
- Hardened XSS prevention, input validation, CSP and error exposure
- Applied 15 fixes from security audit and code quality review

### Added
- Bilingual README (English + Italian)
- i18n system with 5 locales (1454 lines extracted from inline translations)
- 44 tests for provider-caller and api-resilience modules
- 17 tests for citation-extractor and StorageManager

### Changed
- Complete UI redesign with centralized design system
- Extracted BaseHistoryRepository, eliminated CRUD triplication
- Extracted shared ExportModal component, deduplicated ~290 lines
- Extracted multi-analysis prompts and TranslationCache
- Decomposed citation-extractor and StorageManager into focused modules

## [1.0.0] - 2026-04-05

### Added
- Initial release with Manifest V3 support
- 4 LLM provider support: Groq, OpenAI, Anthropic (Claude), Google Gemini
- Article summarization with key points extraction
- Reading mode with side-by-side view
- PDF analysis and summarization
- Multi-article comparison
- Translation support
- Citation extraction
- Q&A on articles
- Voice controls (TTS/STT)
- Export to PDF, Markdown, Email
- History management with search and collections
- Dark mode support
- Cache system with compression
