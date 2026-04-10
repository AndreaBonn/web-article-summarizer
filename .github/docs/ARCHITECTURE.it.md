# Documentazione Architettura

<p align="right">
  <strong>🇮🇹 Italiano</strong> · <a href="ARCHITECTURE.md">🇺🇸 English</a>
</p>

---

## Indice

- [Panoramica](#panoramica)
- [Architettura di Sistema](#architettura-di-sistema)
- [Componenti Principali](#componenti-principali)
- [Flusso dei Dati](#flusso-dei-dati)
- [Integrazione AI](#integrazione-ai)
- [Strategia di Storage](#strategia-di-storage)
- [Architettura di Sicurezza](#architettura-di-sicurezza)
- [Ottimizzazioni delle Prestazioni](#ottimizzazioni-delle-prestazioni)

---

## Panoramica

Web Article Summarizer è un'estensione Chrome (Manifest V3) che sfrutta più provider AI per analizzare articoli web e PDF. L'architettura segue un design modulare a livelli con chiara separazione delle responsabilità.

### Principi Architetturali Chiave

- **Modularità**: Ogni funzionalità è isolata nel proprio modulo con interfacce ben definite
- **Agnosticismo del Provider**: La logica dei provider AI è astratta attraverso livelli di orchestrazione
- **Resilienza**: Meccanismi integrati di retry, fallback e rate limiting
- **Security-First**: Prevenzione XSS multi-livello e difesa da prompt injection
- **Performance**: Caching intelligente, compressione e lazy loading

---

## Architettura di Sistema

### Architettura di Alto Livello

```
┌─────────────────────────────────────────────────────────────┐
│                  Estensione Chrome                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Content    │  │   Popup      │  │   Reading    │      │
│  │   Script     │  │   Interface  │  │   Mode       │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┼──────────────────┘               │
│                            │                                  │
│                   ┌────────▼────────┐                        │
│                   │  Service Worker │                        │
│                   │   (Background)  │                        │
│                   └────────┬────────┘                        │
│                            │                                  │
│         ┌──────────────────┼──────────────────┐              │
│         │                  │                  │              │
│    ┌────▼─────┐    ┌──────▼──────┐    ┌─────▼─────┐       │
│    │   AI     │    │   Storage   │    │  Security │       │
│    │ Orchestr.│    │   Manager   │    │  Sanitizer│       │
│    └────┬─────┘    └──────┬──────┘    └───────────┘       │
│         │                  │                                 │
└─────────┼──────────────────┼─────────────────────────────────┘
          │                  │
          │                  │
     ┌────▼────┐      ┌──────▼──────┐
     │   AI    │      │   Chrome    │
     │ Provider│      │   Storage   │
     └─────────┘      └─────────────┘
```

### Livelli dei Componenti

1. **Livello Presentazione**: Componenti UI (popup, reading mode, history, options)
2. **Livello Business Logic**: Utility core, orchestrazione AI, elaborazione contenuti
3. **Livello Dati**: Gestione storage, caching, compressione
4. **Livello Integrazione**: Client provider AI, API Chrome

---

## Componenti Principali

### 1. Background Service Worker

**Posizione**: `src/background/service-worker.js`

Il service worker è il centro nevralgico per tutte le comunicazioni API e task in background.

**Responsabilità**:
- Gestire messaggi da content script e pagine UI
- Coordinare chiamate API AI attraverso l'orchestratore
- Gestire manutenzione automatica cache via alarms
- Validare e sanitizzare tutte le richieste in ingresso

**Caratteristiche Chiave**:
- Conforme a Manifest V3 (listener eventi persistenti)
- Validazione provider prima dell'elaborazione
- Gestione errori centralizzata
- Schedulazione manutenzione automatica

### 2. Content Script

**Posizione**: `src/content/content-script.js`

Iniettato nelle pagine web per estrarre il contenuto degli articoli.

**Responsabilità**:
- Estrarre testo articolo usando Mozilla Readability
- Analizzare struttura articolo (titolo, paragrafi, metadata)
- Calcolare tempo di lettura e conteggio parole
- Inviare dati estratti al service worker

**Sicurezza**:
- Esegue in contesto isolato
- Nessun accesso diretto alle API
- Tutti i dati sanitizzati prima della trasmissione

### 3. Sistema di Orchestrazione AI

**Posizione**: `src/utils/ai/`

Sistema multi-livello per gestire le interazioni con i provider AI.

#### APIOrchestrator (`api-orchestrator.js`)

Coordinatore centrale per tutte le operazioni AI.

```javascript
// Punto di ingresso unico per chiamate AI
APIOrchestrator.generateCompletion(provider, apiKey, systemPrompt, userPrompt, options)
```

**Funzionalità**:
- Interfaccia agnostica rispetto al provider
- Selezione automatica modello per provider
- Gestione formato risposta (JSON, testo)
- Gestione temperatura e limite token

#### ProviderCaller (`provider-caller.js`)

Client HTTP di basso livello per ogni provider AI.

**Provider Supportati**:
- **Groq**: Llama 3.3 70B (veloce, tier gratuito)
- **OpenAI**: GPT-4o (alta qualità)
- **Anthropic**: Claude Sonnet 4.5 (miglior ragionamento)
- **Gemini**: Gemini 2.5 Pro (contesto ampio)

**Funzionalità**:
- Protezione timeout fetch (60s)
- Validazione risposta JSON
- Gestione errori specifica per provider
- Rilevamento rate limit

#### PromptBuilder (`prompt-builder.js`)

Costruisce prompt ottimizzati per ogni provider e tipo di contenuto.

**Capacità**:
- Prompt specifici per tipo di contenuto (news, scientifico, tutorial, business, opinione)
- Supporto multi-lingua (5 lingue)
- Difesa da prompt injection (integrata nei system prompt)
- Numerazione paragrafi per matching citazioni

#### ContentDetector (`content-detector.js`)

Analizza il contenuto dell'articolo per determinare tipo e lingua.

**Metodi di Rilevamento**:
- **Tipo Contenuto**: Algoritmo basato su scoring che analizza parole chiave e pattern
- **Lingua**: Pattern matching su parole comuni (supporta 5 lingue)

**Tipi di Contenuto**:
- `scientific`: Paper accademici, articoli di ricerca
- `news`: Articoli di notizie, breaking news
- `tutorial`: Guide how-to, documentazione tecnica
- `business`: Analisi business, report di mercato
- `opinion`: Editoriali, pezzi di opinione
- `general`: Fallback predefinito

### 4. Sistema di Resilienza

**Posizione**: `src/utils/ai/`

Architettura di resilienza a tre livelli per affidabilità API.

#### APIResilience (`api-resilience.js`)

Facade che combina strategie di retry e fallback.

```javascript
await APIResilience.callWithRetryAndFallback({
  primaryProvider: 'groq',
  apiKeys: { groq: 'key1', openai: 'key2' },
  article,
  settings,
  enableFallback: true
})
```

#### RetryStrategy (`retry-strategy.js`)

Logica di retry con exponential backoff.

**Configurazione**:
- Max retry: 3
- Delay iniziale: 1000ms
- Delay massimo: 8000ms
- Moltiplicatore backoff: 2x

**Classificazione Errori**:
- **Temporanei** (retry): 429, 500, 502, 503, 504
- **Permanenti** (fail fast): 400, 401, 403, 404

#### FallbackStrategy (`fallback-strategy.js`)

Cambio automatico provider in caso di fallimento.

**Ordine Fallback** (ottimizzato per qualità):
- Primario: `groq` → Fallback: `openai` → `anthropic` → `gemini`
- Primario: `openai` → Fallback: `anthropic` → `groq` → `gemini`
- Primario: `anthropic` → Fallback: `openai` → `groq` → `gemini`
- Primario: `gemini` → Fallback: `openai` → `anthropic` → `groq`

**Funzionalità**:
- Usa solo provider con API key configurate
- Tentativi di retry ridotti per provider di fallback (2 vs 3)
- Logging telemetria per eventi di fallback

#### RateLimiter (`rate-limiter.js`)

Algoritmo token bucket per rate limiting.

**Limiti** (richieste al minuto):
- Groq: 30 RPM
- OpenAI: 60 RPM
- Anthropic: 50 RPM
- Gemini: 60 RPM

**Funzionalità**:
- Accodamento richieste
- Reset automatico token ogni 60 secondi
- Callback posizione coda per aggiornamenti UI

### 5. Sistema di Storage

**Posizione**: `src/utils/storage/`

Gestione storage completa con caching e compressione.

#### StorageManager (`storage-manager.js`)

Interfaccia principale per operazioni Chrome storage.

**Dati Memorizzati**:
- API key (per provider)
- Impostazioni utente (provider, lingua, tipo contenuto)
- Preferenza lingua UI
- Statistiche utilizzo

**Nota Sicurezza**: Le API key sono memorizzate in `chrome.storage.local` che è sandboxed per estensione. Non viene usata cifratura custom perché il codice sorgente dell'estensione è sempre leggibile in Chrome.

#### CacheManager (`cache-manager.js`)

Caching risposte con TTL e statistiche.

**Strategia Cache**:
- Chiave: `${url}_${provider}_${language}_${contentType}`
- TTL: 24 ore (configurabile)
- Scadenza automatica
- Eviction LRU quando storage è pieno

**Statistiche Tracciate**:
- Rapporto hit/miss
- Dimensione cache
- Età entry
- Log operazioni

#### CompressionManager (`compression-manager.js`)

Compressione LZ-String per dati testuali grandi.

**Target Compressione**:
- Riassunti articoli
- Punti chiave
- Traduzioni
- Testo estratto PDF

**Benefici**:
- Riduzione dimensione 60-70%
- Operazioni storage più veloci
- Più entry nella quota Chrome storage (10MB)

**Manutenzione Automatica**:
- Schedulata via Chrome alarms
- Comprime vecchie entry non compresse
- Rimuove entry cache scadute
- Esegue ogni 24 ore

#### HistoryManager (`history-manager.js`)

Facade per tre repository storici specializzati.

**Repository**:
1. **ArticleHistory**: Analisi articoli web
2. **PDFHistory**: Analisi documenti PDF
3. **MultiAnalysisHistory**: Confronti multi-articolo

**Funzionalità**:
- Ricerca e filtraggio
- Sistema preferiti
- Note e annotazioni
- Export/import (backup JSON)

### 6. Sistema di Sicurezza

**Posizione**: `src/utils/security/`

Architettura di sicurezza multi-livello.

#### HtmlSanitizer (`html-sanitizer.js`)

Previene XSS sanitizzando tutto il contenuto prima dell'inserimento nel DOM.

**Metodi**:
- `escape()`: Escapa caratteri speciali HTML
- `renderText()`: Rendering testo sicuro con preservazione paragrafi
- `renderList()`: Rendering lista sicuro per punti chiave, citazioni, Q&A

**Utilizzo**:
```javascript
// MAI usare innerHTML direttamente con contenuto AI
element.innerHTML = aiResponse; // ❌ PERICOLOSO

// SEMPRE usare HtmlSanitizer
HtmlSanitizer.renderText(aiResponse, element); // ✅ SICURO
```

#### InputSanitizer (`input-sanitizer.js`)

Pulisce e valida testo prima dell'invio alle API AI.

**Passaggi Sanitizzazione**:
1. Rimuovi tag HTML e script
2. Rimuovi URL (opzionale)
3. Rimuovi citazioni (opzionale)
4. Normalizza spazi bianchi
5. Rimuovi caratteri di controllo
6. Escapa tentativi prompt injection
7. Valida lunghezza (min/max)
8. Tronca se necessario

**Difesa Prompt Injection**:
- Rileva pattern injection comuni
- Escapa terminatori system prompt
- Valida struttura input

#### Content Security Policy

**CSP Manifest**:
```json
{
  "content_security_policy": {
    "extension_pages": "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; ..."
  }
}
```

**Restrizioni**:
- Nessuno script inline
- Nessun eval()
- Solo connessioni HTTPS
- Solo endpoint API whitelisted

### 7. Sistema di Export

**Posizione**: `src/utils/export/`

Capacità di export multi-formato.

#### PDFExporter (`pdf-exporter.js`)

Genera documenti PDF formattati usando jsPDF.

**Sezioni**:
- Header con metadata
- Titolo articolo e statistiche
- Riassunto
- Punti chiave (lista formattata)
- Traduzione (se disponibile)
- Q&A (se disponibile)
- Citazioni (formato APA)

#### MarkdownExporter (`markdown-exporter.js`)

Export in formato Markdown.

**Funzionalità**:
- Gerarchia heading corretta
- Liste formattate
- Blocchi codice per citazioni
- Frontmatter metadata

#### EmailManager (`email-manager.js`)

Apre client email predefinito con contenuto pre-compilato.

**Formato**:
- Oggetto: Titolo articolo
- Corpo: Analisi formattata
- Allegati: Non supportati (limitazione browser)

### 8. Sistema PDF

**Posizione**: `src/utils/pdf/`

Pipeline parsing e analisi PDF.

#### PDFAnalyzer (`pdf-analyzer.js`)

Coordinatore principale elaborazione PDF.

**Pipeline**:
1. Validazione file (dimensione, tipo, protezione password)
2. Controllo cache (per hash file)
3. Estrazione testo (pdfjs-dist)
4. Analisi AI (come articoli)
5. Storage cache

**Funzionalità**:
- Limite dimensione file 20MB
- Hashing file SHA-256 per chiavi cache
- Callback progresso per aggiornamenti UI
- Gestione cache automatica

#### PDFCacheManager (`pdf-cache-manager.js`)

Cache specializzata per analisi PDF.

**Chiave Cache**: Hash SHA-256 del contenuto file

**Benefici**:
- Stesso PDF analizzato una volta (anche con nome file diverso)
- Risultati istantanei per ri-upload
- Pulizia automatica vecchie entry

### 9. Internazionalizzazione (i18n)

**Posizione**: `src/utils/i18n/`

Sistema i18n completo con 5 lingue.

#### I18n (`i18n.js`)

Manager i18n principale.

**Lingue Supportate**:
- Italiano (it) - Predefinito
- Inglese (en)
- Spagnolo (es)
- Francese (fr)
- Tedesco (de)

**Funzionalità**:
- Traduzioni basate su JSON (`locales/*.json`)
- Aggiornamenti UI automatici al cambio lingua
- Sostituzione placeholder (`{variabile}`)
- Lingua UI e lingua output AI separate

**Utilizzo**:
```javascript
// Traduzione semplice
I18n.t('chiave')

// Con placeholder
I18n.tf('saluto', { nome: 'Andrea' })

// Aggiorna tutti gli elementi UI
I18n.updateUI()
```

**Integrazione HTML**:
```html
<button data-i18n="analyze_button">Analizza</button>
<input data-i18n="search_placeholder" placeholder="Cerca...">
<span data-i18n-title="tooltip_text" title="Tooltip">Icona</span>
```

### 10. Sistema Vocale

**Posizione**: `src/utils/voice/`

Integrazione Text-to-Speech e Speech-to-Text.

#### VoiceController (`voice-controller.js`)

Coordina manager TTS e STT.

**Funzionalità**:
- Supporto voce multi-lingua
- Controlli play/pause/stop
- Input vocale per Q&A
- Mappatura codici lingua (output → voce)

#### TTSManager (`tts-manager.js`)

Wrapper API TTS Chrome.

**Funzionalità**:
- Selezione voce per lingua
- Controllo velocità e tono
- Gestione stato riproduzione
- Notifiche basate su eventi

#### STTManager (`stt-manager.js`)

Wrapper Web Speech API.

**Funzionalità**:
- Riconoscimento continuo
- Risultati intermedi
- Cambio lingua
- Gestione errori

---

## Flusso dei Dati

### Flusso Analisi Articolo

```
1. Utente clicca icona estensione su pagina articolo
   ↓
2. Content script estrae articolo usando Readability
   ↓
3. Content script invia dati articolo al service worker
   ↓
4. Service worker valida e sanitizza input
   ↓
5. APIOrchestrator controlla cache
   ↓
6. Se cache miss:
   a. ContentDetector analizza tipo articolo e lingua
   b. PromptBuilder costruisce prompt ottimizzato
   c. APIResilience chiama provider con retry/fallback
   d. ResponseParser estrae riassunto e punti chiave
   e. CacheManager memorizza risultato
   ↓
7. Service worker invia risultato al popup
   ↓
8. Popup renderizza con HtmlSanitizer
   ↓
9. HistoryManager salva nello storico
```

### Flusso Analisi PDF

```
1. Utente carica PDF nella pagina PDF Analysis
   ↓
2. PDFAnalyzer valida file (dimensione, tipo, password)
   ↓
3. PDFCacheManager controlla cache per hash file
   ↓
4. Se cache miss:
   a. pdfjs-dist estrae testo da tutte le pagine
   b. Testo viene validato (minimo 100 caratteri)
   c. APIOrchestrator analizza testo (come articoli)
   d. PDFCacheManager memorizza risultato con hash file
   ↓
5. Risultato visualizzato nella pagina PDF Analysis
   ↓
6. PDFHistory salva nello storico
```

### Flusso Analisi Multi-Articolo

```
1. Utente seleziona 2+ articoli dallo storico
   ↓
2. MultiAnalysisManager valida selezione
   ↓
3. Prompt costruito combinando tutti i riassunti articoli
   ↓
4. APIOrchestrator genera analisi comparativa
   ↓
5. Risultato visualizzato nella pagina Multi-Analysis
   ↓
6. MultiAnalysisHistory salva nello storico
```

---

## Integrazione AI

### Architettura Provider

Ogni provider ha un metodo caller dedicato in `ProviderCaller`:

```javascript
// Compatibile OpenAI (Groq, OpenAI)
callOpenAICompatible(apiKey, systemPrompt, userPrompt, options, url, providerName)

// Anthropic (Claude)
callAnthropicCompletion(apiKey, systemPrompt, userPrompt, options)

// Google Gemini
callGeminiCompletion(apiKey, systemPrompt, userPrompt, options)
```

### Prompt Engineering

**Struttura System Prompt**:
1. Definizione ruolo
2. Descrizione task
3. Specifica formato output
4. Istruzioni specifiche tipo contenuto
5. Enforcement lingua
6. Difesa prompt injection

**Struttura User Prompt**:
1. Metadata articolo (titolo, URL, conteggio parole)
2. Paragrafi numerati per matching citazioni
3. Istruzioni specifiche basate su task

### Parsing Risposta

**Formato Atteso**:
```
## RIASSUNTO
[Testo riassunto]

## PUNTI CHIAVE
1. **Titolo** (§1-3) Descrizione
2. **Titolo** (§5) Descrizione
...
```

**Parser** (`response-parser.js`):
- Divide su marker `## PUNTI CHIAVE`
- Estrae riassunto dalla prima sezione
- Estrazione punti chiave basata su regex
- Valida lunghezza minima contenuto

---

## Strategia di Storage

### Quota Chrome Storage

- **Totale**: 10MB per estensione
- **Strategia**: Compressione + caching + pulizia automatica

### Allocazione Storage

```
├── apiKeys (< 1KB)
├── settings (< 1KB)
├── summaryHistory (2-4MB, compresso)
├── summaryCache (1-2MB, TTL 24h)
├── pdfHistory (1-2MB, compresso)
├── pdfCache (1-2MB, TTL 24h)
├── multiAnalysisHistory (1-2MB)
└── stats (< 1KB)
```

### Strategia Compressione

**Quando Comprimere**:
- Testo riassunto > 500 caratteri
- Punti chiave > 5 elementi
- Testo traduzione > 500 caratteri
- Testo estratto PDF > 1000 caratteri

**Rapporto Compressione**: Riduzione dimensione 60-70%

**Manutenzione Automatica**:
- Esegue ogni 24 ore via Chrome alarms
- Comprime vecchie entry non compresse
- Rimuove entry cache scadute
- Logga operazioni per debugging

---

## Architettura di Sicurezza

### Livelli di Difesa

1. **Validazione Input**: Tutto l'input utente sanitizzato prima dell'elaborazione
2. **Sanitizzazione Output**: Tutte le risposte AI sanitizzate prima dell'inserimento DOM
3. **CSP**: Content Security Policy stretta previene script inline
4. **Difesa Prompt Injection**: Rilevamento e escaping multi-lingua
5. **Protezione API Key**: Memorizzate in Chrome storage sandboxed
6. **Solo HTTPS**: Tutte le chiamate API su HTTPS
7. **Validazione Origine**: Messaggi validati per ID mittente

### Modello di Minaccia

**Minacce Mitigate**:
- XSS via risposte AI
- Attacchi prompt injection
- Furto API key
- Content script malevoli
- Attacchi CSRF

**Minacce Non Mitigate**:
- Utente installa estensione malevola
- Profilo Chrome utente compromesso
- Provider API compromesso

---

## Ottimizzazioni delle Prestazioni

### Strategia Caching

- **Chiave Cache**: `${url}_${provider}_${language}_${contentType}`
- **TTL**: 24 ore
- **Eviction**: LRU quando storage è pieno
- **Hit Rate**: ~40-60% per utilizzo tipico

### Compressione

- **Algoritmo**: LZ-String (ottimizzato per testo)
- **Rapporto Compressione**: 60-70%
- **Performance**: < 50ms per riassunti tipici

### Lazy Loading

- **Pagina Storico**: Carica entry in batch di 20
- **Anteprima PDF**: Renderizza on-demand
- **Voce**: Carica voci solo quando necessario

### Debouncing

- **Ricerca**: 300ms debounce
- **Auto-save**: 1000ms debounce
- **Resize**: 150ms debounce

### Ottimizzazione Richieste

- **Batching**: Richieste multiple accodate ed elaborate sequenzialmente
- **Rate Limiting**: Algoritmo token bucket previene throttling API
- **Timeout**: Timeout 60s previene richieste bloccate

---

## Punti di Estensione

### Aggiungere un Nuovo Provider AI

1. Aggiungi provider a `DEFAULT_MODELS` in `api-orchestrator.js`
2. Implementa metodo caller in `provider-caller.js`
3. Aggiungi config rate limit in `rate-limiter.js`
4. Aggiungi ordine fallback in `fallback-strategy.js`
5. Aggiorna `host_permissions` nel manifest
6. Aggiungi opzione UI nelle impostazioni

### Aggiungere una Nuova Lingua

1. Crea `locales/{lang}.json` con traduzioni
2. Importa in `i18n.js`
3. Aggiungi a `LANGUAGE_CONFIGS` in `prompt-builder.js`
4. Aggiungi a `LANGUAGE_TEMPLATES` in `prompt-builder.js`
5. Aggiungi pattern rilevamento in `content-detector.js`
6. Aggiorna selettore lingua UI

### Aggiungere un Nuovo Tipo di Contenuto

1. Aggiungi logica rilevamento in `content-detector.js`
2. Crea system prompt in `prompts/summary-prompts.js`
3. Aggiungi a `PromptRegistry` in `prompt-registry.js`
4. Aggiorna selettore tipo contenuto UI

---

## Strategia di Testing

### Test Unitari

**Framework**: Vitest + jsdom

**Copertura**:
- Utility AI (costruzione prompt, parsing, rilevamento)
- Manager storage (cache, compressione, storico)
- Sicurezza (sanitizer, validator)
- Formatter export

**Esegui Test**:
```bash
npm run test        # Esecuzione singola
npm run test:watch  # Modalità watch
```

### Test Manuali

**Scenari di Test**:
1. Analisi articolo su vari tipi di contenuto
2. Upload e analisi PDF
3. Confronto multi-articolo
4. Estrazione traduzione e citazioni
5. Export in PDF/Markdown/Email
6. Controlli vocali (TTS/STT)
7. Ricerca e filtraggio storico
8. Persistenza impostazioni
9. Gestione errori e fallback
10. Cache e compressione

---

## Deployment

### Processo di Build

```bash
npm run build
```

**Output**: Cartella `dist/` con:
- JavaScript minificato
- CSS ottimizzato
- Asset copiati
- Manifest aggiornato

### Chrome Web Store

1. Costruisci versione produzione
2. Comprimi cartella `dist/`
3. Carica su Chrome Web Store Developer Dashboard
4. Compila listing store (descrizione, screenshot, privacy policy)
5. Invia per revisione

### Gestione Versioni

**Semantic Versioning**: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: Nuove funzionalità
- **PATCH**: Bug fix

**Processo Aggiornamento**:
1. Aggiorna versione in `package.json` e `manifest.json`
2. Aggiorna `CHANGELOG.md`
3. Build e test
4. Commit e tag
5. Carica su Chrome Web Store

---

## Monitoraggio e Debugging

### Logging

**Logger** (`src/utils/core/logger.js`):
- Logging strutturato con livelli (info, warn, error)
- Timestamp automatico
- Output console color-coded
- Modalità produzione disabilita log debug

### Telemetria

**Metriche Tracciate**:
- Tassi successo/fallimento chiamate API
- Rapporti hit/miss cache
- Statistiche compressione
- Distribuzione utilizzo provider
- Tempo medio generazione

**Storage**: `chrome.storage.local.stats`

### Debugging

**Chrome DevTools**:
- Service Worker: `chrome://extensions` → Ispeziona service worker
- Popup: Click destro icona estensione → Ispeziona popup
- Content Script: Ispeziona pagina → Console → Filtra per ID estensione

**Problemi Comuni**:
- Errori API key: Controlla pagina impostazioni
- Problemi cache: Pulisci cache nella pagina storico
- Storage pieno: Elimina vecchie entry o pulisci storico
- Timeout provider: Controlla connessione rete

---

## Miglioramenti Futuri

### Funzionalità Pianificate

1. **Modalità Offline**: Supporto LLM locale (WebLLM)
2. **Annotazioni Collaborative**: Condividi analisi con team
3. **Browser Sync**: Sincronizza storico tra dispositivi
4. **Prompt Personalizzati**: Template prompt definiti dall'utente
5. **Analytics Avanzate**: Pattern di lettura e insights
6. **Estensione Browser**: Supporto Firefox ed Edge

### Debito Tecnico

1. **Copertura Test**: Aumentare a 80%+
2. **Migrazione TypeScript**: Aggiungere type safety
3. **Performance**: Ottimizzare gestione PDF grandi
4. **Accessibilità**: Conformità WCAG 2.1 AA
5. **Documentazione**: Docs riferimento API

---

## Contribuire

Vedi [CONTRIBUTING.md](CONTRIBUTING.md) per linee guida sviluppo.

---

## Licenza

Apache License 2.0 - Vedi [LICENSE](../../LICENSE) per dettagli.
