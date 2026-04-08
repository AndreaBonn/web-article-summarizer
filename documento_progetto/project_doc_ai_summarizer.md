# AI Article Summarizer - Documento di Progetto

## 1. Panoramica del Progetto

### 1.1 Descrizione
Estensione Chrome che rileva automaticamente articoli nelle pagine web, ne calcola la lunghezza e genera riassunti dettagliati utilizzando diversi modelli di intelligenza artificiale (Groq, OpenAI GPT, Claude).

### 1.2 Obiettivi Principali
- Estrarre contenuto principale da articoli web
- Calcolare lunghezza e tempo di lettura stimato
- Generare riassunti intelligenti tramite LLM
- Fornire elenco puntato dei temi fondamentali con riferimenti alla posizione nel testo
- Permettere all'utente di configurare le proprie API key
- Scegliere tra 3 provider LLM diversi

### 1.3 Target
Utenti che leggono molti articoli online e vogliono:
- Risparmiare tempo con riassunti di qualità
- Avere una panoramica rapida prima di leggere l'articolo completo
- Identificare rapidamente i punti chiave

---

## 2. Architettura Tecnica

### 2.1 Componenti dell'Estensione

```
ai-article-summarizer/
├── manifest.json
├── background.js (Service Worker)
├── content.js (Content Script)
├── popup.html
├── popup.js
├── popup.css
├── options.html
├── options.js
├── options.css
├── lib/
│   └── Readability.js
├── utils/
│   ├── api-client.js
│   ├── content-extractor.js
│   └── storage-manager.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### 2.2 Flusso di Lavoro

```
1. Utente apre un articolo web
2. Content Script rileva il contenuto della pagina
3. Utente clicca sull'icona dell'estensione
4. Popup richiede estrazione contenuto al Content Script
5. Content Script estrae articolo usando Readability.js
6. Popup invia contenuto al Background Script
7. Background Script chiama API LLM selezionata
8. Background Script riceve e formatta la risposta
9. Popup mostra riassunto e punti chiave
10. [Opzionale] Utente clicca su un punto chiave → highlight nella pagina
```

---

## 3. Specifiche Funzionali

### 3.1 Estrazione Contenuto

**Requisiti:**
- Utilizzare `@mozilla/readability` per estrarre contenuto pulito
- Rimuovere: navbar, sidebar, footer, ads, popup, commenti
- Preservare: titolo, autore, data pubblicazione, corpo dell'articolo
- Numerare i paragrafi per riferimenti successivi

**Output desiderato:**
```javascript
{
  title: "Titolo dell'articolo",
  author: "Nome Autore",
  publishedDate: "2024-01-15",
  content: "Contenuto pulito...",
  paragraphs: [
    { id: 1, text: "Primo paragrafo..." },
    { id: 2, text: "Secondo paragrafo..." }
  ],
  wordCount: 1523,
  readingTimeMinutes: 7
}
```

**Calcolo tempo di lettura:**
- Velocità media: 200-250 parole/minuto
- Formula: `Math.ceil(wordCount / 225)`

**Gestione edge cases:**
- Se Readability fallisce, estrarre tutto il `<body>` con pulizia manuale
- Se pagina è paywall, mostrare warning e estrarre solo contenuto visibile
- Per pagine SPA (Single Page App), aspettare 2 secondi prima di estrarre

### 3.2 Integrazione LLM

#### 3.2.1 Provider Supportati

**Groq**
- Endpoint: `https://api.groq.com/openai/v1/chat/completions`
- Header richiesto: `Authorization: Bearer {API_KEY}`
- Modelli consigliati: `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`
- Velocità: ~500 token/secondo (molto veloce)
- Costo: molto economico

**OpenAI**
- Endpoint: `https://api.openai.com/v1/chat/completions`
- Header richiesto: `Authorization: Bearer {API_KEY}`
- Modelli consigliati: `gpt-4o`, `gpt-4o-mini`
- Velocità: ~30-50 token/secondo
- Costo: medio-alto

**Anthropic Claude**
- Endpoint: `https://api.anthropic.com/v1/messages`
- Headers richiesti: 
  - `x-api-key: {API_KEY}`
  - `anthropic-version: 2023-06-01`
- Modelli consigliati: `claude-sonnet-4-20250514`, `claude-3-5-sonnet-20241022`
- Velocità: ~40-70 token/secondo
- Costo: medio

#### 3.2.2 Formato Richiesta Standardizzato

**Per Groq e OpenAI (compatibili OpenAI API):**
```javascript
{
  model: "llama-3.3-70b-versatile", // o gpt-4o
  messages: [
    {
      role: "system",
      content: "Sei un assistente esperto nel riassumere articoli..."
    },
    {
      role: "user",
      content: "ARTICOLO:\n[contenuto]\n\nISTRUZIONI:\n[prompt]"
    }
  ],
  temperature: 0.3,
  max_tokens: 2000
}
```

**Per Claude:**
```javascript
{
  model: "claude-sonnet-4-20250514",
  max_tokens: 2000,
  temperature: 0.3,
  system: "Sei un assistente esperto nel riassumere articoli...",
  messages: [
    {
      role: "user",
      content: "ARTICOLO:\n[contenuto]\n\nISTRUZIONI:\n[prompt]"
    }
  ]
}
```

#### 3.2.3 Prompt Engineering

**Sistema Prompt (uguale per tutti i provider):**
```
Sei un assistente esperto nel riassumere articoli e identificare informazioni chiave.
Devi essere preciso, obiettivo e mantenere il tono dell'articolo originale.
Quando menzioni informazioni specifiche, indica sempre il paragrafo di riferimento usando il formato §N.
```

**User Prompt:**
```
TITOLO: {title}

ARTICOLO (ogni paragrafo è numerato):
§1: {paragraph1}
§2: {paragraph2}
...

LUNGHEZZA: {wordCount} parole (~{readingTime} minuti di lettura)

ISTRUZIONI:
1. Crea un riassunto dettagliato di {summaryLength} parole che catturi:
   - Gli argomenti principali
   - Le conclusioni o messaggi chiave
   - Il contesto importante

2. Elenca 5-8 punti chiave nel formato:
   **[Titolo breve]** (§N o §N-M)
   Descrizione in 1-2 frasi del concetto

FORMATO OUTPUT RICHIESTO:

## RIASSUNTO
[Il tuo riassunto qui]

## PUNTI CHIAVE
1. **[Titolo]** (§N)
   [Descrizione]

2. **[Titolo]** (§N-M)
   [Descrizione]
...

Mantieni il tono {tone} e la lingua {language}.
```

**Parametri variabili:**
- `summaryLength`: 150 (breve), 300 (medio), 500 (dettagliato)
- `tone`: neutrale, semplificato, tecnico
- `language`: auto-rilevata dall'articolo

#### 3.2.4 Parsing della Risposta

**Obiettivo:** Estrarre riassunto e punti chiave in modo strutturato

```javascript
function parseResponse(responseText) {
  const parts = responseText.split('## PUNTI CHIAVE');
  
  const summary = parts[0]
    .replace('## RIASSUNTO', '')
    .trim();
  
  const keyPointsText = parts[1] || '';
  const keyPointsRegex = /\d+\.\s+\*\*(.+?)\*\*\s+\(§(\d+(?:-\d+)?)\)\s+(.+?)(?=\n\d+\.|$)/gs;
  
  const keyPoints = [];
  let match;
  
  while ((match = keyPointsRegex.exec(keyPointsText)) !== null) {
    keyPoints.push({
      title: match[1].trim(),
      paragraphs: match[2], // "3" o "3-5"
      description: match[3].trim()
    });
  }
  
  return { summary, keyPoints };
}
```

### 3.3 Storage e Gestione Dati

**Chrome Storage API:**
```javascript
// Salvare impostazioni
chrome.storage.local.set({
  apiKeys: {
    groq: 'encrypted_key',
    openai: 'encrypted_key',
    anthropic: 'encrypted_key'
  },
  settings: {
    selectedProvider: 'groq', // 'groq' | 'openai' | 'anthropic'
    summaryLength: 'medium', // 'short' | 'medium' | 'detailed'
    tone: 'neutral', // 'neutral' | 'simple' | 'technical'
    autoDetectLanguage: true,
    saveHistory: true
  }
});

// Cache riassunti (24 ore)
chrome.storage.local.set({
  summaryCache: {
    'https://example.com/article': {
      timestamp: Date.now(),
      summary: '...',
      keyPoints: [...],
      provider: 'groq'
    }
  }
});
```

**Encryption delle API Keys:**
- Usare Web Crypto API per cifrare le chiavi
- Non esporre mai le chiavi nel content script
- Validare formato chiavi prima del salvataggio

**Gestione Cache:**
- TTL: 24 ore
- Max size: 50 articoli
- LRU (Least Recently Used) eviction policy

### 3.4 Highlight nella Pagina

**Funzionalità:**
Quando l'utente clicca su un punto chiave nel popup, evidenziare la sezione corrispondente nella pagina.

**Implementazione:**
1. Content script mantiene mappa paragrafi → elementi DOM
2. Popup invia messaggio con numero paragrafo
3. Content script trova elemento e:
   - Scrolla alla vista
   - Aggiunge classe CSS per highlight (fade dopo 3 secondi)
   - Border colorato + background giallo trasparente

```javascript
// Nel content script
const paragraphMap = new Map(); // paragrafoId → DOMElement

function highlightParagraph(paragraphNumber) {
  const element = paragraphMap.get(paragraphNumber);
  if (!element) return;
  
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.classList.add('ai-summarizer-highlight');
  
  setTimeout(() => {
    element.classList.remove('ai-summarizer-highlight');
  }, 3000);
}
```

**CSS:**
```css
.ai-summarizer-highlight {
  background-color: rgba(255, 255, 0, 0.3) !important;
  border-left: 4px solid #ff6b00 !important;
  padding-left: 12px !important;
  transition: all 0.3s ease;
}
```

---

## 4. Interfaccia Utente

### 4.1 Popup (popup.html)

**Dimensioni:** 400px × 600px

**Layout:**
```
┌──────────────────────────────────┐
│ AI Article Summarizer       ⚙️   │
├──────────────────────────────────┤
│ 📄 Articolo: "Titolo..."         │
│ 📊 1,523 parole • 7 min lettura  │
│                                   │
│ Provider: [Groq ▼] [⚡ Genera]   │
├──────────────────────────────────┤
│ [Riassunto] [Punti Chiave]       │  ← Tabs
├──────────────────────────────────┤
│                                   │
│ [Contenuto del riassunto o       │
│  punti chiave in base al tab     │
│  selezionato]                     │
│                                   │
│                                   │
│                                   │
│                                   │
├──────────────────────────────────┤
│ [📋 Copia] [💾 Salva] [🗑️ Clear] │
└──────────────────────────────────┘
```

**Stati:**

1. **Iniziale** (prima dell'estrazione)
```
✋ Clicca "Analizza Pagina" per iniziare

[🔍 Analizza Pagina]
```

2. **Caricamento estrazione**
```
⏳ Estrazione contenuto in corso...
[Barra di progresso]
```

3. **Pronto per generare**
```
✅ Articolo estratto con successo
📊 1,523 parole • 7 min lettura

Provider: [Groq ▼]
Lunghezza: [○ Breve ⦿ Medio ○ Dettagliato]

[⚡ Genera Riassunto]
```

4. **Generazione in corso**
```
🤖 Generazione riassunto con Groq...
[Barra di progresso animata]
Tempo stimato: ~5 secondi
```

5. **Completato**
```
[Tabs: Riassunto | Punti Chiave]
[Contenuto]
[Pulsanti azione]
```

6. **Errore**
```
❌ Errore: Impossibile estrarre l'articolo
La pagina potrebbe non contenere un articolo
o potrebbe essere protetta da paywall.

[🔄 Riprova]
```

### 4.2 Pagina Impostazioni (options.html)

**Sezioni:**

**1. API Keys Configuration**
```
╔═══════════════════════════════════════╗
║ 🔑 API Keys                           ║
╠═══════════════════════════════════════╣
║                                       ║
║ Groq API Key                          ║
║ [gsk_xxxxxxxxxxxxx...] [🧪 Test]     ║
║ ✅ Connessione verificata             ║
║                                       ║
║ OpenAI API Key                        ║
║ [sk-xxxxxxxxxxxxx...] [🧪 Test]      ║
║ ⚠️ Non configurata                    ║
║                                       ║
║ Anthropic API Key                     ║
║ [sk-ant-xxxxxxxxxxxxx...] [🧪 Test]  ║
║ ✅ Connessione verificata             ║
║                                       ║
║ ℹ️ Le tue chiavi sono salvate        ║
║    localmente e criptate              ║
╚═══════════════════════════════════════╝
```

**2. Preferenze Generazione**
```
╔═══════════════════════════════════════╗
║ ⚙️ Preferenze                         ║
╠═══════════════════════════════════════╣
║                                       ║
║ Provider Predefinito                  ║
║ ○ Groq (veloce, economico)            ║
║ ⦿ OpenAI (qualità alta)               ║
║ ○ Claude (analisi dettagliata)        ║
║                                       ║
║ Lunghezza Riassunto                   ║
║ ○ Breve (~150 parole)                 ║
║ ⦿ Medio (~300 parole)                 ║
║ ○ Dettagliato (~500 parole)           ║
║                                       ║
║ Tono                                  ║
║ ⦿ Neutrale                            ║
║ ○ Semplificato (ELI5)                 ║
║ ○ Tecnico                             ║
║                                       ║
║ ☑ Rileva automaticamente lingua       ║
║ ☑ Salva riassunti nella cronologia    ║
║ ☑ Usa cache (24h)                     ║
║                                       ║
╚═══════════════════════════════════════╝
```

**3. Informazioni & Statistiche**
```
╔═══════════════════════════════════════╗
║ 📊 Statistiche                        ║
╠═══════════════════════════════════════╣
║                                       ║
║ Riassunti generati: 47                ║
║ Parole elaborate: ~71,250             ║
║ Provider più usato: Groq (89%)        ║
║ Tempo risparmiato: ~4.5 ore           ║
║                                       ║
║ [🗑️ Cancella Cronologia]              ║
║ [💾 Esporta Impostazioni]              ║
║ [📥 Importa Impostazioni]              ║
║                                       ║
╚═══════════════════════════════════════╝
```

**4. Guida**
```
╔═══════════════════════════════════════╗
║ ❓ Come Ottenere le API Keys          ║
╠═══════════════════════════════════════╣
║                                       ║
║ 🟢 Groq                               ║
║ 1. Visita console.groq.com            ║
║ 2. Registrati gratuitamente           ║
║ 3. Crea nuova API key                 ║
║ [➜ Vai a Groq Console]                ║
║                                       ║
║ 🔵 OpenAI                             ║
║ 1. Visita platform.openai.com         ║
║ 2. Registrati e aggiungi credito      ║
║ 3. Crea nuova API key                 ║
║ [➜ Vai a OpenAI Platform]             ║
║                                       ║
║ 🟣 Anthropic                          ║
║ 1. Visita console.anthropic.com       ║
║ 2. Registrati                         ║
║ 3. Crea nuova API key                 ║
║ [➜ Vai a Anthropic Console]           ║
║                                       ║
╚═══════════════════════════════════════╝
```

### 4.3 Design System

**Colori:**
- Primary: `#ff6b00` (arancione)
- Secondary: `#0066cc` (blu)
- Success: `#00b894` (verde)
- Warning: `#fdcb6e` (giallo)
- Error: `#d63031` (rosso)
- Background: `#ffffff`
- Surface: `#f8f9fa`
- Text: `#2d3436`
- Text Secondary: `#636e72`

**Typography:**
- Font: `system-ui, -apple-system, 'Segoe UI', sans-serif`
- Heading: 16px, bold
- Body: 14px, regular
- Small: 12px, regular

**Spacing:**
- XS: 4px
- SM: 8px
- MD: 16px
- LG: 24px
- XL: 32px

**Componenti Riutilizzabili:**
- Buttons (primary, secondary, ghost)
- Input fields
- Select dropdowns
- Loading spinners
- Progress bars
- Alert boxes (success, error, warning, info)
- Tabs
- Cards

---

## 5. Gestione Errori

### 5.1 Errori di Estrazione

| Errore | Causa | Soluzione |
|--------|-------|-----------|
| No article found | Pagina non contiene articolo | Mostrare messaggio: "Nessun articolo rilevato" |
| Paywall detected | Contenuto dietro paywall | Mostrare warning + estrarre preview |
| Page too short | Meno di 200 parole | Mostrare: "Articolo troppo breve per riassumere" |
| Loading timeout | SPA non caricata | Retry con delay maggiore |

### 5.2 Errori API

| Codice | Descrizione | Azione |
|--------|-------------|--------|
| 401 | API key invalida | Mostrare: "Configura API key nelle impostazioni" |
| 429 | Rate limit superato | Mostrare: "Troppi richieste, riprova tra X secondi" + retry |
| 500 | Errore server | Retry automatico (max 3 volte con backoff) |
| 503 | Servizio non disponibile | Suggerire provider alternativo |
| Network Error | Problemi connessione | Mostrare: "Verifica la connessione internet" |

### 5.3 Retry Logic

```javascript
async function callAPIWithRetry(provider, prompt, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callAPI(provider, prompt);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      if (error.status === 429) {
        // Rate limit: aspetta tempo indicato o default
        const waitTime = error.retryAfter || (2 ** i * 1000);
        await sleep(waitTime);
      } else if (error.status >= 500) {
        // Server error: backoff esponenziale
        await sleep(2 ** i * 1000);
      } else {
        // Altri errori: non fare retry
        throw error;
      }
    }
  }
}
```

---

## 6. Performance e Ottimizzazioni

### 6.1 Gestione Articoli Lunghi

**Problema:** Articoli molto lunghi (>10k parole) possono superare i limiti di token delle API.

**Soluzione:**
```javascript
const MAX_TOKENS = {
  groq: 32000,      // Context window Mixtral
  openai: 128000,   // GPT-4o
  anthropic: 200000 // Claude Sonnet
};

function truncateIfNeeded(content, provider) {
  const maxWords = Math.floor(MAX_TOKENS[provider] * 0.75); // 75% safety margin
  const words = content.split(/\s+/);
  
  if (words.length > maxWords) {
    return {
      content: words.slice(0, maxWords).join(' '),
      truncated: true,
      originalLength: words.length
    };
  }
  
  return { content, truncated: false };
}
```

**UI per articoli troncati:**
```
⚠️ Articolo molto lungo (15,234 parole)
   Analizzate le prime 10,000 parole.
```

### 6.2 Cache Intelligente

**Strategia:**
1. Hash dell'URL + provider + settings = cache key
2. Prima di chiamare API, controlla cache
3. Se cache hit e < 24h, usa cached result
4. Mostra badge "Da cache" nel popup

```javascript
function getCacheKey(url, provider, settings) {
  const str = `${url}:${provider}:${JSON.stringify(settings)}`;
  return hashString(str); // SHA-256
}
```

### 6.3 Lazy Loading

**Content Script:**
- Non estrarre contenuto finché popup non è aperto
- Usa IntersectionObserver per grandi articoli
- Carica Readability.js solo quando necessario

**Popup:**
- Rendering progressivo dei punti chiave
- Virtual scrolling per cronologia

### 6.4 Bundle Size

**Obiettivo:** < 500KB totale

- Minify tutto il codice JS/CSS
- Usa versione lite di Readability (se disponibile)
- Inline icons SVG piccoli, esterne quelle grandi
- Lazy load settings page

---

## 7. Testing

### 7.1 Unit Tests

**Moduli da testare:**
- `content-extractor.js`: estrazione e parsing
- `api-client.js`: formattazione richieste, parsing risposte
- `storage-manager.js`: encryption, cache management

**Framework:** Jest o Mocha

**Coverage target:** >80%

### 7.2 Integration Tests

**Scenari:**
1. Flusso completo: estrazione → API call → rendering
2. Gestione cache: hit e miss
3. Switching tra provider
4. Configurazione API keys

### 7.3 E2E Tests

**Tool:** Playwright o Puppeteer

**Test cases:**
1. Installa estensione
2. Configura API key
3. Apri articolo test
4. Genera riassunto
5. Verifica output
6. Testa highlight
7. Salva in cronologia

### 7.4 Test su Siti Reali

**Lista siti da testare:**
- Medium.com (articoli lunghi)
- Wikipedia (struttura complessa)
- Blog WordPress (vari temi)
- Siti news (CNN, BBC, Repubblica)
- Reddit long posts
- GitHub README
- Documentation pages

**Metriche:**
- Successo estrazione: >90%
- Tempo medio generazione: <10s
- Accuratezza riassunti: valutazione manuale

---

## 8. Sicurezza

### 8.1 API Keys Protection

**Requisiti:**
- ✅ Salvate in `chrome.storage.local` (non sync)
- ✅ Criptate con AES-256
- ✅ Mai esposte nel content script
- ✅ Mai loggare chiavi complete
- ✅ Validazione formato prima del salvataggio

**Implementazione encryption:**
```javascript
async function encryptKey(apiKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  
  // Deriva key da password dell'estensione + salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(EXTENSION_SECRET),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  return {
    encrypted: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt)
  };
}
```

### 8.2 Content Security Policy

**Nel manifest.json:**
```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
}
```

### 8.3 Permissions Minime

**Richieste solo:**
- `activeTab`: accesso tab corrente quando popup aperto
- `storage`: salvare settings e cache
- `scripting`: iniettare content script

**NON richiedere:**
- `<all_urls>` permanentemente
- `tabs`: accesso a tutti i tab
- `history`: cronologia browser

### 8.4 Input Sanitization

**Prima di inviare contenuto all'API:**
```javascript
function sanitizeContent(content) {
  // Rimuovi script tags
  content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Rimuovi HTML pericoloso
  content = content.replace(/<iframe[^>]*>/gi, '');
  content = content.replace(/javascript:/gi, '');
  
  // Limita lunghezza
  if (content.length > 500000) {
    content = content.substring(0, 500000);
  }
  
  return content;
}
```

---

## 9. Analytics e Monitoraggio

### 9.1 Metriche da Tracciare

**Uso:**
- Numero riassunti generati per provider
- Tempo medio di generazione
- Successo/fallimento rate
- Settings più usate (lunghezza, tono)

**Performance:**
- Tempo estrazione contenuto
- Tempo risposta API
- Cache hit rate
- Errori frequenti

**Privacy:**
- ❌ NO: URL degli articoli
- ❌ NO: Contenuto estratto
- ❌ NO: API keys
- ✅ SI: Metriche aggregate anonime

### 9.2 Error Logging

**Implementazione:**
```javascript
class ErrorLogger {
  static log(error, context) {
    const errorLog = {
      timestamp: Date.now(),
      type: error.name,
      message: error.message,
      context: context, // es: 'extraction', 'api_call', 'parsing'
      // NO: dati sensibili
    };
    
    // Salva in storage locale
    this.appendToLog(errorLog);
    
    // Opzionale: invia a servizio analytics anonimo
    if (userConsented) {
      this.sendAnonymousError(errorLog);
    }
  }
}
```

---

## 10. Distribuzione

### 10.1 Chrome Web Store

**Preparazione:**
1. Creare account sviluppatore ($5 una tantum)
2. Preparare assets:
   - Icon: 128×128px PNG
   - Screenshot: almeno 1, max 5 (1280×800 o 640×400)
   - Promo tile: 440×280px (opzionale)
   - Promo marquee: 1400×560px (opzionale)

**