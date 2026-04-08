# Code Roast Report — AI Article Summarizer (Chrome Extension)

## Panoramica

- **Linguaggi rilevati**: JavaScript (vanilla), HTML, CSS
- **File analizzati**: 28 file JS sorgente + manifest.json + HTML/CSS
- **Problemi totali**: 25 (CRITICAL 2 · MAJOR 8 · MINOR 9 · NITPICK 6)
- **Contesto rilevato**: progetto personale maturo, nessun linter/formatter configurato, nessun test runner, nessuna CI/CD. Manifest V3 corretto.
- **Giudizio complessivo**: un'estensione ambiziosa con buone idee architetturali seppellite sotto un accumulo di debito tecnico che cresce con ogni nuova feature — specialmente i file core che hanno già superato le 2000 righe.

---

## CRITICAL (2 problemi)

### [SICUREZZA] — Chiave di cifratura hardcoded in chiaro nel sorgente

**File**: `utils/storage-manager.js` (riga 2)

**Problema**: `const EXTENSION_SECRET = 'ai-summarizer-v1-secret-key-2024';` è la password usata per derivare la chiave AES-GCM con cui vengono cifrate le API key dell'utente. Il segreto è in chiaro nel sorgente, committato su Git. Il codice sorgente di un'estensione Chrome è leggibile da chiunque la installi (basta accedere alla directory dei profili).

**Perché è grave**: la cifratura esiste per proteggere le API key. Se il segreto è noto, la "cifratura" è un teatro: chiunque può decifrare i dati in `chrome.storage.local` con tre righe di script. L'utente che vede "API key criptata" è in realtà esposto. Le API key di OpenAI e Anthropic hanno valore economico diretto.

**Come fixare**: In un'estensione Chrome non esiste un "secret" genuinamente segreto lato client. Le opzioni realistiche: (a) non cifrare affatto e documentare che `chrome.storage.local` è già sandboxed per estensione (approccio onesto), oppure (b) derivare la chiave da un segreto che l'utente inserisce al primo avvio e non viene mai persistito. La soluzione attuale è peggio di entrambe, perché crea una falsa aspettativa di sicurezza.

---

### [SICUREZZA] — Gemini safety settings tutti a BLOCK_NONE

**File**: `utils/api-client.js` (righe 971-988)

**Problema**: tutte e quattro le categorie di sicurezza Gemini sono impostate a `BLOCK_NONE`. L'estensione passa il contenuto grezzo di qualsiasi pagina web all'API con filtri di sicurezza completamente rimossi.

**Perché è grave**: un utente che analizza un articolo contenente contenuto estremista o materiale esplicito lo vedrà rielaborato senza filtri. Per uso personale il rischio è limitato, ma viola le policy di utilizzo dell'API Gemini se l'estensione venisse pubblicata su Chrome Web Store.

**Come fixare**: usare `BLOCK_MEDIUM_AND_ABOVE` come default. Se l'utente ha necessità legittime di analizzare contenuti sensibili, esporre questa configurazione come opzione esplicita nelle impostazioni avanzate, non come comportamento silenzioso di default.

---

## MAJOR (8 problemi)

### [ARCHITETTURA] — God files: 4 file oltre le 1800 righe

**File**: `popup.js` (2092 righe), `reading-mode.js` (1989), `utils/api-client.js` (1912), `history.js` (1837)

`api-client.js` da solo contiene: rilevamento lingua, rilevamento tipo di contenuto, costruzione prompt, i prompt stessi (~20 combinazioni provider x contentType), chiamate HTTP ai 4 provider, parsing risposte, retry wrapper. Sono almeno 6 responsabilità distinte. Aggiungere un provider richiede modifiche sparse in 8-10 punti dello stesso file.

---

### [ARCHITETTURA] — Duplicazione massiva dei prompt: ogni testo esiste in 3-4 versioni quasi identiche

**File**: `utils/api-client.js` (righe 87-620)

I prompt per i 6 tipi di contenuto esistono in versione separata per Groq, OpenAI, Anthropic e Gemini. La differenza tra le versioni è stilistica, non strutturale. Si stima ~15.000 caratteri di prompt ripetuti. Una correzione va replicata a mano in 4 posti.

**Come fixare**: un prompt per tipo di contenuto con eventuali placeholder per differenze per-provider. La cartella `prompts/` è già presente nel repository ma usata solo per documentazione.

---

### [ARCHITETTURA] — Sistema di cache duplicato: StorageManager e CacheManager fanno la stessa cosa

**File**: `utils/storage-manager.js` (righe 176-294), `utils/cache-manager.js`

`StorageManager` ha `getCachedSummary`, `saveCachedSummary` con hashing e LRU. `CacheManager` ha gli stessi metodi con lo stesso algoritmo. I due sistemi scrivono sulla stessa chiave `summaryCache` ma con formato dati diverso e chiavi hash generate diversamente (`hashString` vs `hashObject`). Risultato: un valore scritto da `CacheManager.set()` non viene mai trovato da `StorageManager.getCachedSummary()` e viceversa. **La cache non funziona mai in modo cross-sistema.**

---

### [ARCHITETTURA] — Modal System duplicato letteralmente in popup.js e history.js

**File**: `popup.js` (righe 12-113), `history.js` (righe 12-100)

L'oggetto `Modal` con i metodi `show`, `alert`, `confirm`, `success`, `error`, `warning` è copiato parola per parola. La versione in `history.js` usa stringhe hardcoded in italiano invece di `I18n.t()`. Creare `utils/modal.js` risolve entrambi i file.

---

### [PERFORMANCE] — CacheManager istanziato due volte per ogni operazione

**File**: `background.js` (righe 83, 112)

In `handleGenerateSummary`, `new CacheManager()` viene chiamato due volte: una per la lettura, una per la scrittura. Lo stesso pattern in `handleExtractCitations`. Istanziare una volta e riusare.

---

### [ERROR HANDLING] — `error.message` grezzo esposto all'utente nel fallback

**File**: `utils/error-handler.js` (riga 79)

`getErrorMessage()` termina con `return message` dove `message = error.message`. Se nessun pattern fa match, il messaggio tecnico interno (SDK internals, endpoint path, model name) viene mostrato direttamente all'utente. Sostituire con `I18n.t('errors.generic')` e loggare il dettaglio solo internamente.

---

### [BUG] — `window.location.href` chiamato nel background service worker

**File**: `utils/error-handler.js` (riga 97)

`url: window.location.href` è in `ErrorHandler.logError()`, eseguita nel background service worker. In un service worker non esiste `window` — questa riga lancia `ReferenceError` ad ogni errore loggato dal background, rendendo il logging degli errori silenziosamente rotto nell'ambiente più critico.

**Come fixare**: `typeof window !== 'undefined' ? window.location.href : 'background-sw'`

---

### [MANUTENIBILITÀ] — Nessun test presente

Nessun file di test, nessun test runner. La logica più critica — `parseResponse()`, `generateCacheKey()`, `detectContentType()`, `detectLanguage()`, `escapePromptInjection()` — è priva di qualsiasi copertura. `parseResponse()` è il punto di fallimento più comune in produzione: qualsiasi variazione nel formato di output del modello rompe silenziosamente l'estrazione.

---

## MINOR (9 problemi)

### [ARCHITETTURA] — CompressionManager dipende da LZString non inclusa

`CompressionManager` dipende da LZString non inclusa nel progetto (`manifest.json` non la dichiara, `lib/lz-string.js` non esiste). La compressione è sempre silenziosamente disabilitata nonostante il setting "Abilita compressione" nelle opzioni.

### [ARCHITETTURA] — AutoMaintenance mai istanziata

`AutoMaintenance` è caricata nel service worker ma non viene mai istanziata né `initialize()` viene mai chiamata. La pulizia automatica della cache scaduta non avviene mai.

### [PERFORMANCE] — Cache write su ogni cache hit

`CacheManager.get()` esegue una scrittura su disco ad ogni cache hit per aggiornare `hits` e `lastAccessed`. Una lettura non dovrebbe richiedere una scrittura.

### [MANUTENIBILITÀ] — APIResilience manca Gemini nel rateLimits

`APIResilience` manca `gemini` nel `rateLimits` object (righe 6-10). Gemini bypassa silenziosamente il rate limiting.

### [BUG SILENZIOSO] — max_tokens troppo basso per i prompt richiesti

`max_tokens: 2000` per Groq, OpenAI, Anthropic (righe 849, 876, 900), ma i prompt puntano a riassunti da 300-3000 parole (~4000 token). I riassunti di articoli lunghi vengono troncati senza avviso. `finish_reason: "length"` non viene verificato.

### [MANUTENIBILITÀ] — File backup committato

`utils/i18n.js.backup` committato nel repository, non in `.gitignore`.

### [ARCHITETTURA] — Variabili globali mutabili come stato

Variabili globali mutabili come stato in `popup.js` (righe 1-9): `currentArticle`, `currentResults`, `selectedLanguage`, ecc. Funzionalmente accettabile per il ciclo di vita del popup, ma rende le dipendenze implicite.

### [BUG MINORE] — detectLanguage() non rileva parole a inizio/fine testo

`detectLanguage()` cerca `` ` ${word} ` `` con spazi: le parole a inizio o fine testo non vengono contate. Per testi brevi il rilevamento può essere errato.

### [PERFORMANCE] — Decifratura API key di tutti i provider ad ogni generazione

`handleGenerateSummary` decifra le API key di tutti e 4 i provider all'inizio di ogni generazione (righe 59-64), ma ne usa solo una. Tre decifrazioni AES-GCM su quattro sono sempre sprecate.

---

## NITPICK (6 problemi)

- `console.log` di debug non rimossi in produzione — decine di log in `content.js`, `popup.js`, `content-extractor.js`.
- Emoji nei `console.log` del service worker — pittoreschi, complicano il parsing automatico dei log.
- `hashString` (in `StorageManager`) e `hashObject` (in `CacheManager`) implementano lo stesso identico algoritmo djb2 in due file diversi.
- `testApiKey` in `background.js` costruisce un articolo test in inglese per un'estensione il cui default è italiano.
- `content-extractor.js` accede a `window.location.href` direttamente invece di riceverlo come parametro, accoppiando la classe all'ambiente browser e impedendo i test in isolamento.
- `CompressionManager.useIndexedDB = true` (riga 7) ma non c'è nessuna implementazione IndexedDB nel file. È una proprietà dichiarata e mai usata.

---

## Priorità di Refactoring Consigliate

1. **Risolvere la falsa cifratura delle API key** — decidere onestamente tra "non cifrare" (documentando che `chrome.storage` è sandboxed) o cifratura reale con chiave utente. Il teatro attuale è peggio di entrambe le alternative.

2. **Consolidare i due sistemi di cache** — la duplicazione tra `StorageManager` e `CacheManager` causa cache miss sistematici. Unificare in `CacheManager`, più completo.

3. **Estrarre e deduplicare i prompt** — eliminare le ~20 copie quasi identiche dei system prompt riduce `api-client.js` del 60% e rende la manutenzione dei prompt un'operazione isolata.

4. **Fixare `window.location.href` nel service worker** — bug che rompe silenziosamente il logging degli errori nell'ambiente primario.

5. **Aggiungere test minimali per `parseResponse` e `generateCacheKey`** — sono i due metodi con la maggior probabilità di regressione silenziosa.

---

## Verdict finale

Il progetto dimostra buona intenzione architetturale — c'è separazione in utility, retry, gestione errori, i18n — ma ogni feature nuova è stata sedimentata sui file esistenti invece di ristrutturarli. I file più importanti sono ormai oggetti da 2000 righe che fanno tutto. La cifratura delle API key, punto di forza comunicativo, si riduce a security theater con un segreto in chiaro nel sorgente. Con interventi mirati su cache, cifratura e duplicazione dei prompt, il codice tornerebbe gestibile in poche sessioni di lavoro.
