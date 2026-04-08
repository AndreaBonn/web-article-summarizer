# Security Audit Report — AI Article Summarizer (Chrome Extension)

**Data audit**: 2026-04-08
**Versione estensione**: 2.2.0
**Auditor**: Senior Security Engineering (code-reviewer agent)
**Perimetro**: Analisi statica completa — manifest.json, background.js, content.js, popup.js, reading-mode.js, options.js, utils/storage-manager.js, utils/api-client.js, utils/input-sanitizer.js, utils/error-handler.js

---

## Panoramica

| Categoria | Conteggio |
|-----------|-----------|
| CRITICAL | 1 |
| HIGH | 3 |
| MEDIUM | 4 |
| LOW | 3 |
| **Totale** | **11** |

**Giudizio complessivo**: L'estensione dimostra attenzione alla sicurezza in alcune aree (cifratura API key con AES-GCM, sanitizzazione input prima dell'invio alle AI, CSP correttamente configurata), ma presenta una vulnerabilità XSS HIGH-severity nell'UI principale e un problema architetturale critico nella gestione del segreto di cifratura. Il codice è quello di un progetto personale maturo ma non ancora production-hardened per un pubblico allargato.

---

## CRITICAL (1 problema)

### [SEC-01] Segreto di cifratura hardcoded nel sorgente — Protezione API Key illusoria

**File**: `utils/storage-manager.js` riga 2
**Problema**:

```javascript
const EXTENSION_SECRET = 'ai-summarizer-v1-secret-key-2024';
```

L'intera struttura di cifratura AES-GCM delle API key (righe 6–81) si basa su questo segreto statico e pubblicamente leggibile nel codice sorgente distribuito con l'estensione. Chiunque installi l'estensione può estrarre `EXTENSION_SECRET` dal file JS nella cartella del profilo Chrome e decifrare tutte le API key salvate in `chrome.storage.local`.

**Perché è grave**: La cifratura delle API key è la principale misura di protezione dell'estensione contro il furto di credenziali. Con la chiave hardcoded, la "cifratura" non offre alcuna protezione reale rispetto al salvataggio in chiaro. Un malware locale, un'altra estensione con permesso `storage`, o chiunque abbia accesso fisico al profilo Chrome può recuperare le API key di tutti i provider (Groq, OpenAI, Anthropic, Gemini).

**Impatto concreto**: Le API key rubate possono essere usate per generare costi a carico dell'utente, accedere a dati di utilizzo, o impersonare l'utente verso i provider AI.

**Come fixare**: In un contesto di estensione Chrome, non è possibile avere un segreto genuinamente sicuro lato client. Le opzioni praticabili sono:

1. **Soluzione minima**: usare `chrome.identity.getAuthToken` per derivare un segreto dall'identità Google dell'utente, rendendo la chiave legata a quel profilo specifico (non portabile tra profili/macchine).
2. **Soluzione raccomandata**: rimuovere la cifratura, salvare le API key in `chrome.storage.local` senza pretesa di cifratura, e aggiungere una nota utente chiara che le key sono salvate localmente. La sicurezza reale è già garantita dalla sandboxing di Chrome — `chrome.storage.local` non è accessibile ad altri siti web.
3. **Soluzione avanzata**: usare `chrome.storage.session` (in-memory, si cancella alla chiusura del browser) per le API key attive, richiederle all'utente a ogni sessione.

L'attuale implementazione crea una **falsa sensazione di sicurezza** più pericolosa del salvataggio in chiaro, perché induce l'utente a credere che le sue credenziali siano protette.

---

## HIGH (3 problemi)

### [SEC-02] XSS — Contenuto AI inserito nel DOM senza escaping

**File**: `popup.js` righe 516, 520, 529, 531, 534–535 e `reading-mode.js` righe 276–282, 342–358, 371–375

**Problema**: Il contenuto generato dalle API AI (summary, keypoints, citazioni, Q&A) viene inserito direttamente nell'HTML via `innerHTML` senza sanitizzazione:

```javascript
// popup.js riga 516–520
let summaryHtml = `<p>${currentResults.summary}</p>`;
elements.summaryContent.innerHTML = summaryHtml;

// popup.js riga 529, 531
keypointsHtml += `...${point.title}...${point.description}...`;
elements.keypointsContent.innerHTML = keypointsHtml;

// reading-mode.js riga 276–282
elements.translationTabContent.innerHTML = `
  <div class="translation-content">
    <h3>${article.title}</h3>
    <div class="translation-text">${currentData.translation}</div>
  </div>
`;

// reading-mode.js riga 342–358 (citazioni)
html += `...<span class="citation-author-badge">${author}</span>...`;
elements.citationsTabContent.innerHTML = html;

// reading-mode.js riga 371–375 (Q&A)
qaItem.innerHTML = `
  <div class="qa-question">Q: ${item.question}</div>
  <div class="qa-answer">A: ${item.answer}</div>
`;
```

**Perché è grave**: Un provider AI compromesso (o un attacco MITM sulle API calls, possibile se il certificato di un provider viene bypassato) potrebbe restituire HTML/JavaScript malevolo che verrebbe eseguito nel contesto dell'estensione. Inoltre, l'`article.title` proviene direttamente dal DOM della pagina visitata — un sito malevolo potrebbe includere tag HTML nel titolo e farli renderizzare nell'estensione.

Nelle estensioni Chrome, il contesto del popup e delle extension pages ha accesso a `chrome.storage`, `chrome.tabs`, `chrome.runtime` e può inviare messaggi al background. Un XSS in questo contesto è più grave di un XSS su una pagina web normale.

**Come fixare**:

```javascript
// Opzione 1: textContent per testo puro
element.textContent = currentResults.summary;

// Opzione 2: escaping manuale per HTML con markup intenzionale
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Opzione 3: DOMPurify (libreria dedicata)
elements.summaryContent.innerHTML = DOMPurify.sanitize(currentResults.summary);
```

Usare `textContent` per tutto il contenuto AI che non richiede formatting HTML. Se si vuole supportare markdown, parsarlo esplicitamente con una libreria sicura.

---

### [SEC-03] Stack trace e URL utente salvati nel log errori accessibile

**File**: `utils/error-handler.js` righe 90–96

```javascript
logs.push({
  message: error.message || error.toString(),
  context,
  stack: error.stack,        // Stack trace completo
  timestamp: Date.now(),
  url: window.location.href  // URL della pagina corrente
});
```

**Problema**: Il log errori persistente in `chrome.storage.local` include il full stack trace e l'URL della pagina corrente al momento dell'errore. Questo log è accessibile a qualsiasi estensione che abbia permesso `storage` (non `chrome.storage` ma indirettamente tramite cross-extension messaging). Più rilevante: se il log errori è mai esportato o visualizzato in una pagina dell'estensione senza escaping, l'URL (che può contenere token, parametri di sessione, query string sensibili) viene esposto.

**Come fixare**:

```javascript
logs.push({
  message: ErrorHandler.sanitizeErrorMessage(error.message),
  context,
  // Omettere stack in produzione, o mascherare path
  timestamp: Date.now(),
  // Salvare solo origin + pathname, mai query string o hash
  url: (() => {
    try {
      const u = new URL(window.location.href);
      return u.origin + u.pathname;
    } catch { return 'unknown'; }
  })()
});
```

---

### [SEC-04] API key esposta in chiaro nell'input DOM durante il test

**File**: `options.js` righe 67–76

```javascript
async function loadApiKeys() {
  const providers = ['groq', 'openai', 'anthropic', 'gemini'];
  for (const provider of providers) {
    const key = await StorageManager.getApiKey(provider);
    if (key) {
      document.getElementById(`${provider}Key`).value = key;  // API key in chiaro nel DOM
    }
  }
}
```

**Problema**: La API key decifrata viene inserita nel campo `<input>` della pagina `options.html`. Questo significa:

1. La key è leggibile da qualsiasi script con accesso al DOM della pagina options (in teoria limitato dalla sandboxing di Chrome, ma è una superficie di attacco).
2. Se l'utente fa screenshot della pagina opzioni, la key è visibile.
3. Strumenti di accessibility o screen reader possono leggere il contenuto degli input.

**Come fixare**: Mostrare un placeholder mascherato invece della chiave completa:

```javascript
if (key) {
  // Mostra solo gli ultimi 4 caratteri
  const masked = '•'.repeat(key.length - 4) + key.slice(-4);
  document.getElementById(`${provider}Key`).value = masked;
  // Aggiungere un flag per sapere se il campo è stato modificato dall'utente
  document.getElementById(`${provider}Key`).dataset.ismasked = 'true';
}
```

Salvare solo se il campo è stato modificato (non re-salvare il placeholder mascherato).

---

## MEDIUM (4 problemi)

### [SEC-05] `content_scripts` con `matches: ["<all_urls>"]` — Superficie di attacco massima

**File**: `manifest.json` righe 30–35

```json
"content_scripts": [
  {
    "matches": ["<all_urls>"],
    "js": ["lib/Readability.js", "utils/content-extractor.js", "content.js"],
    "run_at": "document_idle"
  }
]
```

**Problema**: Il content script viene iniettato in OGNI pagina visitata dall'utente, incluse pagine di banking online, portali sanitari, dashboard aziendali e qualsiasi altro sito sensibile. Sebbene il content script sia sandboxed e non possa accedere direttamente al DOM JavaScript della pagina ospite, può leggere il contenuto HTML della pagina tramite `document.querySelectorAll`, `document.body.textContent` e simili.

Il content script attuale esegue `ContentExtractor.extract(document)` solo su richiesta (tramite messaggio), il che mitiga parzialmente il rischio. Tuttavia, la sola presenza del content script su tutte le pagine aumenta la superficie di attacco: un bug nel content script potrebbe essere sfruttato da una pagina malevola tramite `window.postMessage` o manipulation del DOM.

**Mitigazione**: Limitare `matches` ai siti su cui l'estensione è realisticamente utile, oppure usare `"activeTab"` permission (già presente) con iniezione programmatica invece di content scripts dichiarativi. Rimuovere `lib/Readability.js` e `utils/content-extractor.js` dal content script se possono essere caricati solo quando necessario.

---

### [SEC-06] `escapePromptInjection` in `InputSanitizer` — Protezione incompleta

**File**: `utils/input-sanitizer.js` righe 182–201

La funzione `escapePromptInjection` usa pattern di regex per rimuovere frasi di injection note:

```javascript
const dangerousPatterns = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/gi,
  /disregard\s+(all\s+)?(previous|above|prior)\s+instructions?/gi,
  // ...
];
```

**Problema**: Questo approccio blocklist è fondamentalmente inadeguato come difesa contro prompt injection. Le varianti di attacco sono infinite:
- Testo in Unicode omoglifi (es. `ɪɢɴᴏʀᴇ previous instructions`)
- Splitting del testo con caratteri zero-width
- Traduzioni in altre lingue
- Riformulazioni semantiche equivalenti
- Character substitution (l33t speak, emoji)

La rimozione di `system :` e `assistant :` (righe 188–190) potrebbe anche rimuovere testo legittimo in articoli accademici o tecnici che discutono di architetture LLM.

**Come fixare**: La difesa principale contro prompt injection deve essere architetturale, non lessicale:
1. Wrappare sempre il contenuto utente con delimitatori chiari che l'LLM sia istruito a trattare come dato, non come istruzioni (`<article>...</article>`).
2. Il system prompt dovrebbe includere istruzioni esplicite di ignorare comandi nel contenuto dell'articolo.
3. Non fare affidamento sulla sanitizzazione per la sicurezza — usarla solo come layer di riduzione del rumore.

---

### [SEC-07] `web_accessible_resources` espone `pdf.worker.min.js` a tutti i siti

**File**: `manifest.json` righe 45–50

```json
"web_accessible_resources": [
  {
    "resources": ["lib/pdf.worker.min.js"],
    "matches": ["<all_urls>"]
  }
]
```

**Problema**: Qualsiasi pagina web può caricare `lib/pdf.worker.min.js` tramite URL `chrome-extension://[ID]/lib/pdf.worker.min.js`. Questo è necessario per il funzionamento di pdf.js ma espone il contenuto della libreria al web. Se `pdf.worker.min.js` contenesse vulnerabilità (es. CVE noti in versioni vecchie di pdf.js), potrebbe essere sfruttato da siti malevoli.

**Come fixare**: Restringere `matches` alla sola extension page se tecnicamente possibile, o verificare che la versione di pdf.js inclusa sia aggiornata e non presenti CVE noti.

---

### [SEC-08] `getErrorMessage` fallback restituisce `error.message` grezzo — CWE-209

**File**: `utils/error-handler.js` riga 79

```javascript
// Errore generico
return message;
```

**Problema**: Quando nessun pattern specifico corrisponde, la funzione restituisce il messaggio di errore originale non filtrato. I messaggi di errore delle API esterne possono contenere:
- URL interni dei provider con parametri
- Dettagli tecnici sull'infrastruttura
- Parti della request originale (inclusi potenzialmente token parziali)

**Come fixare**:

```javascript
// Errore non riconosciuto — messaggio generico all'utente
console.error('Errore non classificato:', message); // log interno
return 'Si è verificato un errore imprevisto. Riprova.';
```

---

## LOW (3 problemi)

### [SEC-09] `testApiKey` nel background service espone la chiave nel log

**File**: `background.js` righe 39–49

```javascript
if (request.action === 'testApiKey') {
  testApiKey(request.provider, request.apiKey)
    .then(() => { sendResponse({ success: true }); })
    .catch(error => {
      console.error('Errore test API:', error);  // Potenziale log di dettagli sensibili
      sendResponse({ success: false, error: error.message });
    });
```

L'API key viene passata in chiaro come `request.apiKey` nel messaggio Chrome runtime. Sebbene i messaggi runtime siano isolati tra estensioni, il log `console.error` nel service worker è accessibile tramite DevTools. In scenari di debugging, uno sviluppatore potrebbe inadvertitamente esporre la chiave nei log.

**Mitigazione**: Evitare di loggare l'oggetto error completo quando potrebbe contenere riferimenti al payload originale.

---

### [SEC-10] `hashString` non crittograficamente sicura usata per cache key

**File**: `utils/storage-manager.js` righe 192–200

```javascript
static hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}
```

Questa è una variante del djb2 hash — non crittografica, con alta probabilità di collisioni e output a 32 bit. Usata per generare cache key da URL + provider + settings, teoricamente potrebbe causare cache poisoning: due URL diversi con lo stesso hash si sovrascrivono a vicenda in cache. Impatto limitato (solo dati di cache, non credenziali).

**Mitigazione**: Usare `crypto.subtle.digest('SHA-256', ...)` già disponibile nel contesto dell'estensione per generare hash robusti.

---

### [SEC-11] `options.js` riga 165 — errore esposto direttamente all'utente con `error.message`

**File**: `options.js` riga 167–169

```javascript
} catch (error) {
  showStatus(provider, 'error', `❌ ${error.message}`);
}
```

Il messaggio di errore grezzo del provider API viene mostrato all'utente. Per provider come Anthropic o OpenAI, i messaggi di errore possono includere dettagli tecnici (limiti di quota, versione API non supportata, ecc.) che non dovrebbero essere esposti in chiaro. Impatto basso perché l'utente è il proprietario delle proprie credenziali.

---

## Raccomandazioni Generali di Hardening

### Priorità 1 — Architettura di storage API key

Rimuovere la falsa cifratura con segreto hardcoded. Opzione raccomandata: salvare le key in `chrome.storage.local` senza cifratura (la sandboxing di Chrome è la vera protezione) e documentare questo chiaramente. In alternativa, valutare `chrome.storage.session` per key in-memory che non persistono al riavvio del browser.

### Priorità 2 — Sanitizzazione output AI nel DOM

Definire una funzione `renderAIContent(text, element)` centralizzata che usi `textContent` per default e DOMPurify per i casi in cui sia necessario HTML. Eliminare tutti i pattern `element.innerHTML = userDerivedString` sparsi nei vari file.

### Priorità 3 — Contenuto scripts: ridurre la surface

Valutare se `content.js` può essere iniettato programmaticamente solo quando l'utente clicca sull'estensione (tramite `chrome.scripting.executeScript`) invece di essere caricato su ogni pagina. Questo riduce la superficie di attacco e migliora le performance di navigazione.

### Priorità 4 — Gestione errori

Centralizzare tutti i messaggi di errore verso l'utente in `ErrorHandler` con un blocco `default` che mostri un messaggio generico. Loggare i dettagli solo internamente.

### Priorità 5 — Audit dipendenza pdf.js

Verificare la versione di `lib/pdf.worker.min.js` e confrontarla con il database CVE (https://www.cve.org/CVESearch/SearchByCPEName) per `pdf.js`. Versioni precedenti alla 3.x hanno vulnerabilità note.

---

## Note sul Modello di Minaccia

L'estensione è progettata come tool personale single-user. In questo contesto:

- Il vettore di attacco principale non è un utente malevolo che usa l'estensione, ma **malware locale** e **pagine web malevole** che tentano di estrarre dati dall'estensione.
- Il **XSS** (SEC-02) è il rischio più concreto: una pagina web malevola potrebbe costruire un titolo o contenuto che, una volta riassunto dall'AI, ritorni HTML malevolo per l'estensione.
- La **falsa cifratura** (SEC-01) è il rischio più insidioso per una distribuzione più ampia: crea aspettative di sicurezza non rispettate.
- I permessi `host_permissions` sono appropriati e minimi per le API AI supportate.
- La CSP `script-src 'self' 'wasm-unsafe-eval'` è corretta e non permette script inline nelle extension pages (ma non protegge dall'XSS via `innerHTML`).
