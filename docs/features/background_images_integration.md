# Integrazione Immagini di Sfondo

## 📋 Panoramica

Tutte le pagine web dell'estensione ora utilizzano immagini di sfondo personalizzate che si adattano automaticamente al tema (light/dark).

## 🎨 Immagini Utilizzate

### Light Mode
- **File**: `icons/BackgroundArticleSummarize_light.png`
- **Utilizzo**: Sfondo per tema chiaro
- **Overlay**: Gradiente viola semi-trasparente (95% opacità)

### Dark Mode
- **File**: `icons/BackgroundArticleSummarize_dark.png`
- **Utilizzo**: Sfondo per tema scuro
- **Overlay**: Gradiente viola semi-trasparente (85% opacità)

## 📄 Pagine Modificate

### 1. Cronologia (history.css)
```css
body {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%),
              url('icons/BackgroundArticleSummarize_light.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

body.dark-mode {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.85) 0%, rgba(118, 75, 162, 0.85) 100%),
              url('icons/BackgroundArticleSummarize_dark.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}
```

### 2. Analisi Multi Articolo (multi-analysis.css)
- Stesso stile della cronologia
- Gradiente viola con overlay 95% (light) / 85% (dark)

### 3. Analisi PDF (pdf-analysis.css)
- Stesso stile della cronologia
- Gradiente viola con overlay 95% (light) / 85% (dark)

### 4. Modalità Lettura (reading-mode.css)
- **Overlay più leggero** per non distrarre dalla lettura
- Gradiente viola con overlay 5% (light) / 8% (dark)
```css
body {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%),
              url('icons/BackgroundArticleSummarize_light.png');
}

[data-theme="dark"] body {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%),
              url('icons/BackgroundArticleSummarize_dark.png');
}
```

### 5. Opzioni (options.css)
- Stesso stile della cronologia
- Gradiente viola con overlay 95% (light) / 85% (dark)

## 🎯 Caratteristiche Implementate

### Background Properties
- **background-size: cover** - L'immagine copre tutto lo schermo
- **background-position: center** - Centrata
- **background-attachment: fixed** - Rimane fissa durante lo scroll (effetto parallax)

### Transizioni
- **transition: background 0.3s** - Cambio fluido tra light/dark mode

### Overlay Gradient
- **Gradiente viola** - Mantiene l'identità visiva dell'estensione
- **Semi-trasparente** - Permette di vedere l'immagine sottostante
- **Opacità variabile** - Più forte nelle pagine di navigazione, più leggera nella modalità lettura

## 🎨 Design Rationale

### Perché Overlay Gradient?
1. **Leggibilità**: Il gradiente garantisce contrasto sufficiente per il testo
2. **Branding**: Mantiene i colori caratteristici dell'estensione (viola)
3. **Coerenza**: Tutte le pagine hanno lo stesso look & feel

### Perché Opacità Diverse?
- **95%/85% (Cronologia, Multi-Analisi, PDF, Opzioni)**: Pagine di navigazione dove l'immagine è decorativa
- **5%/8% (Modalità Lettura)**: Pagina di lettura dove l'immagine non deve distrarre

### Perché Fixed Attachment?
- Crea un effetto parallax elegante
- L'immagine rimane stabile mentre il contenuto scorre
- Migliora la percezione di profondità

## 📱 Responsive Design

Le immagini si adattano automaticamente a tutte le dimensioni dello schermo:
- **Desktop**: Immagine a piena risoluzione
- **Tablet**: Immagine scalata proporzionalmente
- **Mobile**: Immagine centrata e coperta

## 🔄 Cambio Tema

Il cambio tra light e dark mode è gestito automaticamente:

### Cronologia, Multi-Analisi, PDF, Opzioni
```javascript
// Classe body.dark-mode attivata da theme-manager.js
body.classList.toggle('dark-mode');
```

### Modalità Lettura
```javascript
// Attributo data-theme gestito da reading-mode.js
document.documentElement.setAttribute('data-theme', 'dark');
```

## 🎨 Personalizzazione

### Modificare l'Opacità del Gradiente

**Per pagine di navigazione**:
```css
/* Light mode - aumenta/diminuisci 0.95 */
background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%),
            url('icons/BackgroundArticleSummarize_light.png');

/* Dark mode - aumenta/diminuisci 0.85 */
background: linear-gradient(135deg, rgba(102, 126, 234, 0.85) 0%, rgba(118, 75, 162, 0.85) 100%),
            url('icons/BackgroundArticleSummarize_dark.png');
```

**Per modalità lettura**:
```css
/* Light mode - aumenta/diminuisci 0.05 */
background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%),
            url('icons/BackgroundArticleSummarize_light.png');

/* Dark mode - aumenta/diminuisci 0.08 */
background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%),
            url('icons/BackgroundArticleSummarize_dark.png');
```

### Modificare i Colori del Gradiente

Cambia i valori RGB in `rgba()`:
- **Viola chiaro**: `rgba(102, 126, 234, ...)` → `#667eea`
- **Viola scuro**: `rgba(118, 75, 162, ...)` → `#764ba2`

### Rimuovere il Gradiente

Per vedere solo l'immagine senza overlay:
```css
body {
  background: url('icons/BackgroundArticleSummarize_light.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}
```

## 🐛 Troubleshooting

### L'immagine non si vede
1. Verifica che i file esistano in `icons/`
2. Controlla il percorso relativo nel CSS
3. Verifica i permessi del file

### L'immagine è troppo visibile/invisibile
- Modifica l'opacità del gradiente (vedi sezione Personalizzazione)

### L'immagine non cambia con il tema
- Verifica che la classe `dark-mode` o l'attributo `data-theme` siano applicati correttamente
- Controlla la console per errori JavaScript

### Performance Issues
- Le immagini sono ottimizzate per il web
- Se necessario, riduci la risoluzione delle immagini
- Considera di usare formati più leggeri (WebP)

## 📊 Performance

### Dimensioni File
- `BackgroundArticleSummarize_light.png`: ~XXX KB
- `BackgroundArticleSummarize_dark.png`: ~XXX KB

### Ottimizzazioni
- Immagini caricate una sola volta (cached dal browser)
- `background-attachment: fixed` può impattare performance su mobile (considerare `scroll` se necessario)
- Gradiente overlay renderizzato via CSS (zero overhead)

## ✅ Checklist Implementazione

- [x] Cronologia (history.css)
- [x] Analisi Multi Articolo (multi-analysis.css)
- [x] Analisi PDF (pdf-analysis.css)
- [x] Modalità Lettura (reading-mode.css)
- [x] Opzioni (options.css)
- [x] Transizioni smooth tra temi
- [x] Responsive design
- [x] Documentazione completa

## 🔮 Miglioramenti Futuri

- [ ] Permettere all'utente di scegliere immagini personalizzate
- [ ] Aggiungere più varianti di sfondo
- [ ] Implementare blur effect sull'immagine
- [ ] Animazioni di transizione più elaborate
- [ ] Supporto per immagini animate (GIF/WebP animato)

---

**Versione**: 1.0  
**Data**: Novembre 2025  
**Autore**: AI Article Summarizer Team
