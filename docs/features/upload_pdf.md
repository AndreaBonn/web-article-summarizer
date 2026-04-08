# Progetto: Integrazione Analisi PDF nell'Estensione Chrome

## 📋 Panoramica

Estendere l'estensione Chrome esistente per supportare l'analisi di documenti PDF con le stesse funzionalità già disponibili per le pagine web (riassunto, punti chiave, citazioni, traduzione).

---

## 🎯 Obiettivi

### Obiettivi Principali
- Permettere agli utenti di caricare file PDF e analizzarli con le stesse API (Groq, Claude, OpenAI)
- Implementare sistema di cache intelligente per evitare rianalisi di PDF già processati
- Creare modalità lettura split-view con visualizzazione PDF/testo affiancata alle analisi
- Integrare PDF nella cronologia esistente senza occupare troppo storage

### Non-Obiettivi
- OCR per PDF scansionati (fase futura)
- Backend server (manteniamo architettura client-only)
- Modifica o annotazione dei PDF

---

## 🏗️ Architettura Tecnica

### Stack Tecnologico

```
- PDF.js (Mozilla) - parsing PDF lato client
- Crypto API (native) - hashing file per cache
- Chrome Storage API - salvataggio cronologia
- API esistenti (Groq/Claude/OpenAI) - analisi testo
```

### Flusso Dati

```
┌─────────────┐
│ Upload PDF  │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Calcola Hash     │ ◄───────┐
└──────┬───────────┘         │
       │                     │
       ▼                     │
┌──────────────────┐         │
│ Check Cache      │         │
└──────┬───────────┘         │
       │                     │
  ┌────┴────┐                │
  │ Trovato?│                │
  └────┬────┘                │
       │                     │
   NO  │  SÌ                 │
       │  └─────────────────┐│
       ▼                    ▼│
┌──────────────────┐  ┌──────────────┐
│ Estrai Testo     │  │ Carica Cache │
│ (PDF.js)         │  └──────┬───────┘
└──────┬───────────┘         │
       │                     │
       ▼                     │
┌──────────────────┐         │
│ Analizza (API)   │         │
└──────┬───────────┘         │
       │                     │
       ▼                     │
┌──────────────────┐         │
│ Salva Cronologia │         │
└──────┬───────────┘         │
       │                     │
       └─────────┬───────────┘
                 │
                 ▼
       ┌─────────────────┐
       │ Modalità Lettura│
       │   Split-View    │
       └─────────────────┘
```

---

## 💾 Struttura Dati

### Oggetto Analisi PDF in Storage

```javascript
{
  // Identificazione
  "id": "pdf_1732369200000",
  "type": "pdf",
  "fileHash": "a3f5e8d9c2b1...", // SHA-256 del file
  "filename": "documento.pdf",
  "fileSize": 2500000, // bytes
  "pageCount": 25,
  
  // Contenuto
  "extractedText": "Testo completo estratto dal PDF...",
  
  // Analisi (struttura identica a pagine web)
  "analysis": {
    "summary": "Riassunto del documento...",
    "keyPoints": [
      "Punto chiave 1",
      "Punto chiave 2"
    ],
    "quotes": [
      "Citazione importante 1",
      "Citazione importante 2"
    ],
    "translation": "Traduzione (se richiesta)..."
  },
  
  // Metadata
  "timestamp": 1732369200000,
  "apiProvider": "claude", // groq | openai | claude
  
  // Flags
  "hasLivePreview": false // true durante analisi, false dalla cronologia
}
```

### Storage Key

```javascript
chrome.storage.local: {
  "pdf_analysis_history": [
    { /* analisi 1 */ },
    { /* analisi 2 */ },
    // ...max 50 elementi
  ]
}
```

---

## 🔧 Componenti da Implementare

### 1. PDFCacheManager Class

**File**: `src/utils/pdfCacheManager.js`

**Responsabilità**:
- Calcolare hash SHA-256 dei file PDF
- Verificare esistenza in cache
- Salvare/recuperare/eliminare analisi dalla cronologia
- Pulizia elementi vecchi (>30 giorni)

**Metodi Principali**:

```javascript
class PDFCacheManager {
  async calculateFileHash(file)
  // Input: File object
  // Output: String (hash hex)
  // Usa crypto.subtle.digest('SHA-256', arrayBuffer)
  
  async checkCache(file)
  // Input: File object
  // Output: { found: boolean, data?: object, fileHash?: string }
  // Cerca in cronologia match per fileHash
  
  async saveAnalysis(file, extractedText, analysis, apiProvider)
  // Input: file, testo, analisi, provider
  // Output: Entry salvato
  // Salva in chrome.storage.local, limita a 50 elementi
  
  async getHistory()
  // Output: Array di analisi
  
  async deleteEntry(entryId)
  // Elimina singolo elemento
  
  async cleanOldEntries(daysToKeep = 30)
  // Pulisce elementi più vecchi di N giorni
}
```

### 2. PDFAnalyzer Class

**File**: `src/utils/pdfAnalyzer.js`

**Responsabilità**:
- Estrarre testo da PDF usando PDF.js
- Coordinare flusso analisi (cache check → estrazione → API call)
- Gestire errori (PDF protetti, scansionati, corrotti)

**Metodi Principali**:

```javascript
class PDFAnalyzer {
  async analyzePDF(file, apiProvider = 'claude')
  // Flow completo: cache check → estrazione → analisi → salvataggio
  // Output: { ...analisi, hasLivePreview: true, isFromCache: boolean, pdfFile?: File }
  
  async extractTextFromPDF(file)
  // Input: File object
  // Output: String (testo estratto con markers "--- Pagina N ---")
  // Usa PDF.js: pdfjsLib.getDocument()
  
  async callAnalysisAPI(text, provider)
  // RIUSA LOGICA ESISTENTE delle pagine web
  // Input: testo, provider
  // Output: { summary, keyPoints, quotes, translation, pageCount }
  
  async loadFromHistory(entryId)
  // Carica analisi esistente dalla cronologia
  // Output: { ...analisi, hasLivePreview: false }
}
```

### 3. UI Components

#### a) Tab PDF nel Popup

**File**: `src/popup/pdfTab.html` + `src/popup/pdfTab.js`

**Struttura HTML**:

```html
<div id="pdfTab" class="tab-content">
  <div class="pdf-upload-area">
    <!-- Drop zone -->
    <div class="drop-zone" id="pdfDropZone">
      <div class="drop-zone-icon">📄</div>
      <div class="drop-zone-text">
        Trascina il PDF qui<br>
        oppure
      </div>
      <input type="file" id="pdfFileInput" accept=".pdf" style="display:none">
      <button class="browse-button" id="pdfBrowseBtn">Sfoglia file...</button>
    </div>
    
    <!-- File selezionato -->
    <div class="selected-file" id="selectedFileInfo" style="display:none">
      <div class="file-icon">📄</div>
      <div class="file-details">
        <div class="file-name"></div>
        <div class="file-size"></div>
      </div>
      <button class="remove-file" id="removeFileBtn">✕</button>
    </div>
    
    <!-- Pulsante analisi -->
    <button class="analyze-button" id="analyzePdfBtn" disabled>
      Analizza PDF
    </button>
    
    <!-- Progress -->
    <div class="progress-container" id="analysisProgress" style="display:none">
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill"></div>
      </div>
      <div class="progress-text" id="progressText">
        Preparazione...
      </div>
    </div>
  </div>
  
  <!-- Avvisi -->
  <div class="info-box">
    ℹ️ Il contenuto del PDF sarà inviato a <span id="currentProvider">Claude</span> per l'analisi.
    Non caricare documenti confidenziali.
  </div>
</div>
```

**Funzionalità JS**:

```javascript
// Gestione drag & drop
dropZone.addEventListener('drop', handleDrop);
dropZone.addEventListener('dragover', handleDragOver);

// File selection
fileInput.addEventListener('change', handleFileSelect);

// Validazione file
function validateFile(file) {
  // Check: tipo PDF, size < 20MB
  const maxSize = 20 * 1024 * 1024;
  if (file.type !== 'application/pdf') {
    showError('File non valido. Carica un PDF.');
    return false;
  }
  if (file.size > maxSize) {
    showError('File troppo grande. Max 20MB.');
    return false;
  }
  return true;
}

// Analisi
async function startAnalysis() {
  try {
    showProgress('📄 Lettura PDF...', 20);
    
    const analyzer = new PDFAnalyzer();
    const result = await analyzer.analyzePDF(selectedFile, currentProvider);
    
    showProgress('✅ Completato!', 100);
    
    // Apri modalità lettura
    openReadingMode(result);
    
  } catch (error) {
    showError(error.message);
  }
}
```

#### b) Modalità Lettura Split-View

**File**: `src/readingMode/readingMode.html` + `src/readingMode/readingMode.js`

**Layout**:

```html
<div class="reading-mode-container">
  <!-- Pannello Sinistro -->
  <div class="left-panel">
    <!-- Badge tipo visualizzazione -->
    <div class="view-type-badge" id="viewBadge">
      <!-- "🔴 Vista Live" o "📚 Dalla Cronologia" -->
    </div>
    
    <!-- Container dinamico -->
    <div id="leftContent">
      <!-- CASO 1: Vista Live - PDF Viewer -->
      <div class="pdf-viewer" id="pdfViewer">
        <iframe id="pdfFrame"></iframe>
      </div>
      
      <!-- CASO 2: Cronologia - Testo estratto -->
      <div class="extracted-text" id="extractedText">
        <div class="text-metadata">
          <!-- Info file -->
        </div>
        <h2>Testo Estratto</h2>
        <div id="textContent"></div>
      </div>
    </div>
  </div>
  
  <!-- Pannello Destro - IDENTICO A PAGINE WEB -->
  <div class="right-panel">
    <div class="analysis-header">
      <h1>Analisi Documento</h1>
      <div class="filename" id="docFilename"></div>
    </div>
    
    <div class="analysis-tabs">
      <button class="tab-button active" data-tab="summary">Riassunto</button>
      <button class="tab-button" data-tab="keypoints">Punti Chiave</button>
      <button class="tab-button" data-tab="quotes">Citazioni</button>
      <button class="tab-button" data-tab="translation">Traduzione</button>
    </div>
    
    <div class="analysis-content">
      <!-- Sezioni come per pagine web -->
    </div>
    
    <div class="actions-bar">
      <button class="action-button primary">📋 Copia Tutto</button>
      <button class="action-button">📝 Esporta Markdown</button>
      <button class="action-button">📄 Esporta PDF</button>
    </div>
  </div>
</div>
```

**Logica Rendering**:

```javascript
function renderReadingMode(analysisData) {
  const { hasLivePreview, filename, extractedText, analysis, pdfFile } = analysisData;
  
  // Aggiorna badge
  const badge = document.getElementById('viewBadge');
  if (hasLivePreview) {
    badge.innerHTML = '🔴 Vista Live';
    badge.classList.add('live');
    
    // Mostra PDF viewer
    loadPDFViewer(pdfFile);
  } else {
    badge.innerHTML = '📚 Dalla Cronologia';
    badge.classList.add('history');
    
    // Mostra testo estratto
    displayExtractedText(extractedText, filename);
  }
  
  // Pannello destro - RIUSA FUNZIONE ESISTENTE
  renderAnalysis(analysis);
}
```

### 4. Integrazione nella Cronologia

**File**: `src/history/history.js` (estensione esistente)

**Modifiche**:

```javascript
// Rendering elementi cronologia
function renderHistoryItem(item) {
  const listItem = document.createElement('div');
  listItem.className = 'history-item';
  
  // Icona diversa per PDF
  const icon = item.type === 'pdf' ? '📄' : '🌐';
  
  listItem.innerHTML = `
    <div class="history-icon">${icon}</div>
    <div class="history-details">
      <div class="history-title">${item.type === 'pdf' ? item.filename : item.title}</div>
      <div class="history-meta">
        ${formatDate(item.timestamp)} • ${item.apiProvider}
        ${item.type === 'pdf' ? ` • ${item.pageCount} pagine` : ''}
      </div>
    </div>
    <button class="history-action" data-id="${item.id}">Apri</button>
    <button class="history-delete" data-id="${item.id}">🗑️</button>
  `;
  
  return listItem;
}

// Click su elemento
async function openHistoryItem(itemId) {
  const history = await getHistory();
  const item = history.find(h => h.id === itemId);
  
  if (item.type === 'pdf') {
    // Apri modalità lettura PDF (senza live preview)
    const analyzer = new PDFAnalyzer();
    const data = await analyzer.loadFromHistory(itemId);
    openReadingMode(data);
  } else {
    // Logica esistente per pagine web
    openWebPageReadingMode(item);
  }
}
```

---

## 📦 Dipendenze

### Nuove Dipendenze da Aggiungere

```json
{
  "dependencies": {
    "pdfjs-dist": "^3.11.174"
  }
}
```

### Setup PDF.js

**File**: `src/lib/pdfjs-setup.js`

```javascript
import * as pdfjsLib from 'pdfjs-dist';

// Configura worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  chrome.runtime.getURL('lib/pdf.worker.min.js');

export default pdfjsLib;
```

**manifest.json** - aggiungere:

```json
{
  "web_accessible_resources": [
    {
      "resources": ["lib/pdf.worker.min.js"],
      "matches": ["<all_urls>"]
    }
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
  }
}
```

---

## 🧪 Testing

### Test Case Principali

#### 1. Upload e Analisi

```
✓ Upload PDF valido (< 20MB)
✓ Rifiuta file non-PDF
✓ Rifiuta file > 20MB
✓ Mostra progress durante analisi
✓ Gestisce PDF con molte pagine (50+)
✓ Estrazione testo corretta con markers pagine
```

#### 2. Sistema Cache

```
✓ Primo upload → analizza e salva
✓ Secondo upload stesso file → carica da cache
✓ Hash identico per stesso file
✓ Hash diverso per file diverso (anche stesso nome)
✓ Pulizia elementi vecchi funziona
```

#### 3. Modalità Lettura

```
✓ Vista Live: PDF viewer a sinistra, analisi a destra
✓ Dalla cronologia: testo estratto a sinistra, analisi a destra
✓ Tab navigazione funziona
✓ Export (copia, markdown, PDF) funziona
✓ Responsive su schermi piccoli
```

#### 4. Cronologia

```
✓ PDF salvati in cronologia con icona corretta
✓ Riapertura da cronologia mostra testo estratto
✓ Eliminazione funziona
✓ Limite 50 elementi rispettato
```

#### 5. Edge Cases

```
✓ PDF protetto da password → errore chiaro
✓ PDF scansionato (solo immagini) → warning
✓ PDF corrotto → errore gestito
✓ PDF con encoding strani → warning se caratteri corrotti
✓ Testo estratto minimo (< 100 char) → warning
```

### Test File Suggeriti

```
- small.pdf (1 pagina, 100KB) - caso base
- medium.pdf (25 pagine, 2MB) - caso comune
- large.pdf (100 pagine, 10MB) - limite superiore
- scanned.pdf (PDF immagine) - caso errore
- protected.pdf (con password) - caso errore
- weird-encoding.pdf (caratteri speciali) - edge case
```

---

## 🚀 Piano di Implementazione

### Phase 1: Core Functionality (Settimana 1)

**Priorità Alta**

- [ ] Setup PDF.js e configurazione worker
- [ ] Implementa `PDFCacheManager` class
- [ ] Implementa `PDFAnalyzer.extractTextFromPDF()`
- [ ] Connetti estrazione testo alle API esistenti
- [ ] Test base: upload → estrazione → analisi

**Deliverable**: Analisi PDF funzionante in background

### Phase 2: UI Upload (Settimana 2)

**Priorità Alta**

- [ ] Crea tab PDF nel popup
- [ ] Implementa drag & drop
- [ ] Validazione file e gestione errori
- [ ] Progress indicator durante analisi
- [ ] Info box avvisi privacy

**Deliverable**: UI upload completa e funzionale

### Phase 3: Modalità Lettura (Settimana 2-3)

**Priorità Alta**

- [ ] Layout split-view
- [ ] PDF viewer per vista live (integra PDF.js viewer)
- [ ] Visualizzazione testo estratto per cronologia
- [ ] Rendering analisi (riusa componente esistente)
- [ ] Badge vista live/cronologia

**Deliverable**: Reading mode completa

### Phase 4: Integrazione Cronologia (Settimana 3)

**Priorità Alta**

- [ ] Modifica rendering cronologia per supportare PDF
- [ ] Implementa apertura da cronologia
- [ ] Storage management (limite 50, pulizia vecchi)
- [ ] Testing cache/hash

**Deliverable**: Cronologia unificata web + PDF

### Phase 5: Polish & Testing (Settimana 4)

**Priorità Media**

- [ ] Responsive design
- [ ] Error handling robusto
- [ ] Loading states e animazioni
- [ ] Tooltip e help text
- [ ] Testing completo tutti i casi
- [ ] Performance optimization

**Deliverable**: Feature production-ready

### Phase 6: Nice-to-Have (Backlog Futuro)

**Priorità Bassa**

- [ ] Preview PDF prima dell'analisi
- [ ] Selezione pagine specifiche da analizzare
- [ ] Metadata extraction (autore, data, ecc.)
- [ ] Stima costo token prima analisi
- [ ] OCR per PDF scansionati (richiede backend)

---

## ⚠️ Considerazioni Importanti

### Limiti Tecnici

1. **Context Window API**
   - GPT-4: ~128k token (≈50-100 pagine PDF)
   - Claude: ~200k token (≈100-200 pagine)
   - Groq Llama: ~32k-128k token (varia per modello)
   - **Azione**: Mostra warning per PDF > 50 pagine

2. **Storage Browser**
   - chrome.storage.local: ~10MB quota
   - Con testo estratto: ~50 analisi PDF possibili
   - **Azione**: Limite 50 elementi + auto-pulizia

3. **Performance**
   - PDF 100 pagine = ~5-10s estrazione + 20-30s API
   - **Azione**: Progress indicator dettagliato

### Sicurezza e Privacy

1. **Dati Sensibili**
   - PDF inviati a API esterne (Groq/Claude/OpenAI)
   - **Azione**: Disclaimer chiaro nel UI
   - **Testo suggerito**: *"⚠️ Il contenuto sarà inviato a [provider] per l'analisi. Non caricare documenti confidenziali."*

2. **Storage Locale**
   - Testo estratto salvato in chrome.storage
   - **Azione**: Non salvare file originale, solo testo
   - **Future**: Opzione crittografia storage

### UX Critical

1. **Feedback Utente**
   - Progress dettagliato (non solo spinner)
   - Errori chiari e actionable
   - Success states evidenti

2. **Edge Cases**
   ```
   PDF Scansionato → "PDF sembra scansionato. Impossibile estrarre testo."
   PDF Protetto → "PDF protetto da password. Rimuovi protezione."
   File Troppo Grande → "File supera 20MB. Comprimi o dividi PDF."
   Testo Insufficiente → "Testo estratto minimo. PDF potrebbe essere scansionato."
   ```

---

## 📊 Metriche di Successo

### KPI Tecnici

- Tempo medio estrazione testo: < 5s (per PDF 25 pagine)
- Tempo medio analisi completa: < 30s
- Tasso successo cache hit: > 30% (utenti caricano stesso file)
- Storage utilizzato: < 8MB per 50 analisi

### KPI UX

- % upload completati con successo: > 95%
- % utenti che usano cronologia PDF: > 40%
- Tempo medio da upload a risultato visualizzato: < 45s

---

## 🐛 Gestione Errori - Reference

### Codici Errore Comuni

```javascript
const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File troppo grande. Massimo 20MB.',
  INVALID_FILE_TYPE: 'File non valido. Carica un file PDF.',
  PASSWORD_PROTECTED: 'PDF protetto da password. Rimuovi la protezione e riprova.',
  EXTRACTION_FAILED: 'Impossibile estrarre testo. Il PDF potrebbe essere scansionato o corrotto.',
  INSUFFICIENT_TEXT: 'Testo estratto insufficiente. Il PDF potrebbe essere scansionato.',
  API_ERROR: 'Errore durante l\'analisi. Riprova più tardi.',
  STORAGE_FULL: 'Storage pieno. Elimina alcune analisi dalla cronologia.',
  NETWORK_ERROR: 'Errore di rete. Controlla la connessione.',
};
```

### Error Handling Pattern

```javascript
try {
  // Operazione
} catch (error) {
  if (error.name === 'PasswordException') {
    showError(ERROR_MESSAGES.PASSWORD_PROTECTED);
  } else if (error.message.includes('extraction')) {
    showError(ERROR_MESSAGES.EXTRACTION_FAILED);
  } else {
    showError(`Errore: ${error.message}`);
    console.error('Dettagli:', error);
  }
  
  // Log per debugging
  logError({
    type: 'pdf_analysis',
    error: error.message,
    file: filename,
    timestamp: Date.now()
  });
}
```

---

## 📚 Risorse e Riferimenti

### Documentazione

- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

### Esempi Codice

- PDF.js examples: https://github.com/mozilla/pdf.js/tree/master/examples
- Chrome Extension samples: https://github.com/GoogleChrome/chrome-extensions-samples

### Tools Testing

- PDF test files: https://github.com/mozilla/pdf.js/tree/master/test/pdfs
- Chrome Extension debugger: chrome://extensions

---

## 📞 Supporto e Domande

Per domande durante l'implementazione:

1. **Problemi PDF.js**: Controllare console per errori worker, verificare CSP in manifest
2. **Storage limits**: Testare con `chrome.storage.local.getBytesInUse()`
3. **Performance**: Usare Chrome DevTools Performance profiler
4. **API errors**: Verificare rate limits e token count

---

## ✅ Checklist Pre-Release

Prima del deploy in produzione:

- [ ] Tutti i test case passano
- [ ] Performance accettabile su PDF 50+ pagine
- [ ] Error handling robusto
- [ ] UI responsive
- [ ] Documentazione utente creata
- [ ] Privacy disclaimer visibile
- [ ] Storage cleanup funziona
- [ ] Cache hash funziona correttamente
- [ ] Export (copia/markdown/PDF) funziona
- [ ] Cronologia unificata funziona
- [ ] Testing cross-browser (Chrome, Edge, Brave)

---

**Documento Versione**: 1.0  
**Data**: 23 Novembre 2024  
**Autore**: Team Product  
**Review**: Pending

---

## 🔄 Changelog

### v1.0 - 23/11/2024
- Documento iniziale
- Architettura completa
- Piano implementazione 4 settimane