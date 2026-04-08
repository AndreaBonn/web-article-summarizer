# 🔤 Controlli Dimensione Font

## Panoramica
Sistema di controllo della dimensione del testo con 4 categorie predefinite (S, M, L, XL) e pulsanti per aumentare/ridurre il carattere.

## Funzionalità

### Categorie Dimensione
- **S (Small)**: 14px - Testo compatto
- **M (Medium)**: 16px - Dimensione predefinita
- **L (Large)**: 18px - Testo grande
- **XL (Extra Large)**: 20px - Testo molto grande

### Controlli UI
- **Pulsante A-**: Riduce la dimensione del font
- **Indicatore centrale**: Mostra la dimensione corrente (S, M, L, XL)
- **Pulsante A+**: Aumenta la dimensione del font

### Comportamento
- I pulsanti si disabilitano automaticamente ai limiti (S minimo, XL massimo)
- La preferenza viene salvata in localStorage
- Le dimensioni si applicano a tutto il contenuto testuale
- I titoli si adattano proporzionalmente

## Implementazione

### File Modificati

#### 1. reading-mode.html
```html
<div class="font-size-controls">
  <button id="fontDecreaseBtn" class="icon-btn" title="Riduci dimensione testo">
    A-
  </button>
  <span id="fontSizeLabel" class="font-size-label">M</span>
  <button id="fontIncreaseBtn" class="icon-btn" title="Aumenta dimensione testo">
    A+
  </button>
</div>
```

#### 2. reading-mode.css
```css
/* Font Size Controls */
.font-size-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.font-size-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-color);
  min-width: 24px;
  text-align: center;
}

/* Font Size Classes */
body[data-font-size="S"] .panel-content { font-size: 14px; }
body[data-font-size="M"] .panel-content { font-size: 16px; }
body[data-font-size="L"] .panel-content { font-size: 18px; }
body[data-font-size="XL"] .panel-content { font-size: 20px; }
```

#### 3. reading-mode.js
```javascript
// Font Size Management
const FONT_SIZES = ['S', 'M', 'L', 'XL'];
let currentFontSizeIndex = 1; // Default: M

function loadFontSize() {
  const savedSize = localStorage.getItem('readingModeFontSize') || 'M';
  const index = FONT_SIZES.indexOf(savedSize);
  currentFontSizeIndex = index >= 0 ? index : 1;
  applyFontSize();
}

function applyFontSize() {
  const size = FONT_SIZES[currentFontSizeIndex];
  document.body.setAttribute('data-font-size', size);
  elements.fontSizeLabel.textContent = size;
  
  // Update button states
  elements.fontDecreaseBtn.disabled = currentFontSizeIndex === 0;
  elements.fontIncreaseBtn.disabled = currentFontSizeIndex === FONT_SIZES.length - 1;
  
  localStorage.setItem('readingModeFontSize', size);
}

function increaseFontSize() {
  if (currentFontSizeIndex < FONT_SIZES.length - 1) {
    currentFontSizeIndex++;
    applyFontSize();
  }
}

function decreaseFontSize() {
  if (currentFontSizeIndex > 0) {
    currentFontSizeIndex--;
    applyFontSize();
  }
}
```

#### 4. pdf-analysis.html
Stessi controlli aggiunti nell'header della pagina di analisi PDF.

#### 5. pdf-analysis.css
Stessi stili applicati con selettori appropriati per il container PDF.

#### 6. pdf-analysis.js
Stesse funzioni con chiave localStorage separata: `pdfAnalysisFontSize`.

## Posizionamento

### Reading Mode
I controlli sono posizionati nell'header a destra, prima dei pulsanti tema/copia/export:
```
[← Indietro] [📖 Modalità Lettura] ... [A- M A+] [🌙] [📋] [📄 PDF]
```

### PDF Analysis
I controlli sono posizionati nell'header a destra, prima della selezione lingua:
```
[📄 Analisi PDF] ... [A- M A+] [🇮🇹 Italiano] [🌙] [← Indietro]
```

## Persistenza
- **Reading Mode**: `localStorage.readingModeFontSize`
- **PDF Analysis**: `localStorage.pdfAnalysisFontSize`
- Le preferenze sono separate per ogni modalità
- Valore predefinito: "M" (Medium)

## Accessibilità
- Pulsanti con tooltip descrittivi
- Indicatore visivo della dimensione corrente
- Disabilitazione automatica ai limiti
- Transizioni fluide tra dimensioni
- Supporto completo per temi chiaro/scuro

## Responsive
Le dimensioni del font si adattano anche su dispositivi mobili, mantenendo le proporzioni relative.

## Vantaggi
✅ Migliora l'accessibilità per utenti con problemi di vista
✅ Personalizzazione immediata senza menu complessi
✅ Feedback visivo chiaro della dimensione corrente
✅ Persistenza delle preferenze tra sessioni
✅ Integrazione perfetta con il design esistente
