# Guida UI Modalità Lettura

## 📜 Scroll Sincronizzato Automatico

### Come funziona?

Lo scroll tra articolo e riassunto è **sempre sincronizzato automaticamente** quando usi la vista "📄 Testo":
- Quando scorri l'articolo, il riassunto scorre automaticamente
- Quando scorri il riassunto, l'articolo scorre automaticamente
- Utile per seguire il contenuto in parallelo

### Quando è attivo?

- ✅ **Vista "📄 Testo"**: Scroll sincronizzato attivo
- ❌ **Vista "🌐 Originale"**: Scroll sincronizzato disattivato (limitazione tecnica iframe)

---

## 📄 Pulsante Esporta PDF

### Funzionalità

Il pulsante "📄 PDF" permette di esportare l'intera analisi in formato PDF, includendo:

- **Articolo**: titolo, metadata (parole, tempo lettura)
- **Riassunto**: testo completo del riassunto
- **Punti Chiave**: lista numerata con descrizioni
- **Traduzione**: se disponibile
- **Citazioni**: se estratte
- **Q&A**: domande e risposte se presenti

### Stati del pulsante:

1. **📄 PDF** - Stato normale, pronto per l'export
2. **⏳ Esportazione...** - Durante la generazione del PDF
3. **✓ Esportato!** - Successo (torna a normale dopo 2 secondi)

### Cosa fa quando lo clicchi?

1. Verifica che ci siano dati da esportare
2. Controlla che la libreria jsPDF sia caricata
3. Usa `PDFExporter` (se disponibile) per un export completo
4. Genera il PDF con formattazione professionale
5. Scarica automaticamente il file con nome: `[titolo-articolo]_reading-mode.pdf`

### Risoluzione problemi

**Problema**: "Libreria PDF non caricata"
- **Soluzione**: Ricarica la pagina (F5)
- **Causa**: Script jsPDF non caricato correttamente

**Problema**: "Nessun dato da esportare"
- **Soluzione**: Assicurati di aver generato un riassunto prima
- **Causa**: Modalità lettura aperta senza dati

**Problema**: "Errore durante l'esportazione PDF"
- **Soluzione**: Controlla la console per dettagli
- **Causa**: Possibile problema con i dati o la libreria

### Miglioramenti implementati

✅ Controllo robusto della libreria jsPDF
✅ Fallback a export semplice se PDFExporter non disponibile
✅ Gestione errori con messaggi chiari
✅ Feedback visivo durante l'esportazione
✅ Disabilitazione pulsante durante l'export (previene doppi click)

---

## 🎨 Altri Controlli UI

### Pulsanti Vista Articolo

- **🌐 Originale**: Mostra la pagina web originale in iframe
  - Pro: Layout originale, immagini, formattazione
  - Contro: Può essere bloccato da alcuni siti, no sync scroll
  
- **📄 Testo**: Mostra il testo estratto e pulito
  - Pro: Sempre disponibile, sync scroll, evidenziazione paragrafi
  - Contro: Perde formattazione originale e immagini

### Tab Analisi

- **📝 Riassunto**: Testo del riassunto AI
- **🔑 Punti Chiave**: Lista cliccabile (evidenzia paragrafi)
- **🌍 Traduzione**: Traduzione articolo (se generata)
- **📚 Citazioni**: Citazioni estratte con formattazione migliorata
  - Icone per tipo di citazione (💬 diretta, 🔬 studio, 📊 statistica, etc.)
  - Testo citato in evidenza
  - Autore e fonte chiaramente visibili
  - Contesto della citazione
  - Riferimento al paragrafo (§N)
- **💬 Q&A**: Domande e risposte sull'articolo

### Pulsanti Header

- **← Indietro**: Chiude la modalità lettura
- **🌙/☀️**: Cambia tema (dark/light)
- **📋**: Copia tutto il contenuto (articolo + riassunto + punti chiave)
- **📄 PDF**: Esporta l'analisi completa in PDF

---

## 💡 Suggerimenti d'uso

### Per la lettura parallela sincronizzata:
1. Usa vista "📄 Testo"
2. Lo scroll è automaticamente sincronizzato
3. Scorri per seguire articolo e riassunto insieme

### Per vedere la pagina originale:
1. Usa vista "🌐 Originale"
2. Vedi il layout originale con immagini
3. Lo scroll è indipendente

### Per l'export completo:
1. Genera tutte le analisi che ti servono (traduzione, citazioni, Q&A)
2. Clicca "📄 PDF"
3. Ottieni un documento completo con tutto

### Per evidenziare paragrafi:
1. Passa a vista "📄 Testo"
2. Vai al tab "🔑 Punti Chiave"
3. Clicca su un punto chiave
4. Il paragrafo corrispondente viene evidenziato nell'articolo

---

## 🔧 Note Tecniche

### Librerie utilizzate:
- **jsPDF 2.5.1**: Generazione PDF
- **PDFExporter**: Modulo custom per export avanzato
- **Chrome Storage API**: Persistenza dati

### File coinvolti:
- `reading-mode.html`: Struttura UI
- `reading-mode.js`: Logica principale
- `reading-mode.css`: Stili
- `utils/pdf-exporter.js`: Export PDF avanzato
- `lib/jspdf.umd.min.js`: Libreria jsPDF

### Compatibilità:
- ✅ Chrome/Edge (Chromium)
- ✅ Brave
- ⚠️ Firefox (richiede adattamenti per WebExtensions)
- ❌ Safari (API diverse)


---

## 📚 Citazioni - Guida Dettagliata

### Struttura Citazione

Ogni citazione mostra:

1. **Header**:
   - 🔬 Icona tipo citazione
   - #N Numero progressivo
   - Nome autore (se disponibile)
   - §N Riferimento paragrafo

2. **Testo Citato**:
   - Testo in corsivo con sfondo evidenziato
   - Massimo 300 caratteri (troncato se più lungo)
   - Se non disponibile: "Riferimento senza testo citato"

3. **Contesto**:
   - Spiegazione del perché viene citata
   - Sfondo grigio chiaro per distinguerlo

4. **Metadata**:
   - Tipo citazione (es: "Riferimento Studio")
   - 📚 Fonte (pubblicazione/organizzazione)
   - 📅 Anno (se disponibile)

### Tipi di Citazioni

| Icona | Tipo | Descrizione |
|-------|------|-------------|
| 💬 | Citazione Diretta | Frase esatta tra virgolette |
| 💭 | Citazione Indiretta | Parafrasi di una fonte |
| 🔬 | Riferimento Studio | Paper scientifico, ricerca |
| 📊 | Statistica | Dati numerici con fonte |
| 👤 | Opinione Esperto | Dichiarazione di esperto |
| 📖 | Riferimento Libro | Citazione da libro |
| 📄 | Riferimento Articolo | Citazione da articolo |
| 📋 | Riferimento Report | Citazione da report |
| 🏢 | Dati Organizzazione | Dati ufficiali |
| 🌐 | Fonte Web | Fonte online |

### Miglioramenti Implementati

✅ **Gestione valori null/undefined**
- Nessun "undefined" visibile
- Campi mancanti vengono nascosti automaticamente
- Fallback intelligenti per dati incompleti

✅ **Formattazione migliorata**
- Testo citato in evidenza con sfondo
- Spaziatura e padding ottimizzati
- Hover effect per migliore interattività
- Colori e icone per identificazione rapida

✅ **Validazione dati**
- Citazioni vuote vengono saltate
- Log di warning per citazioni problematiche
- Controllo qualità prima della visualizzazione

### Risoluzione Problemi

**Problema**: Vedo "undefined" nelle citazioni
- **Soluzione**: Aggiornato! Ora i campi null/undefined vengono gestiti correttamente

**Problema**: Citazioni poco leggibili
- **Soluzione**: Formattazione migliorata con sfondo, padding e colori

**Problema**: Non capisco il tipo di citazione
- **Soluzione**: Icone e label chiari per ogni tipo

**Problema**: Citazione senza testo
- **Soluzione**: Mostra "Riferimento senza testo citato" invece di campo vuoto
