# Integrazione Controlli Vocali nella Modalità Lettura

## 📋 Panoramica

I controlli vocali (TTS e STT) sono stati integrati nella **Modalità Lettura** per offrire un'esperienza più accessibile e interattiva.

## ✨ Funzionalità Implementate

### 1. **Lettura Vocale (TTS - Text-to-Speech)**

#### Posizione
- Controlli TTS posizionati nell'header del pannello "Analisi Articolo" (pannello destro)
- Tre pulsanti: Play 🔊, Pausa ⏸️, Stop ⏹️

#### Funzionalità
- **Play/Riprendi**: Legge ad alta voce il contenuto del tab attivo
- **Pausa**: Mette in pausa la lettura (può essere ripresa)
- **Stop**: Ferma completamente la lettura

#### Tab Supportati
La lettura vocale funziona su tutti i tab:
- **Riassunto**: Legge il riassunto completo
- **Punti Chiave**: Legge tutti i punti chiave in sequenza
- **Traduzione**: Legge il testo tradotto
- **Citazioni**: Legge tutte le citazioni estratte
- **Q&A**: Legge domande e risposte

#### Lingua Automatica
- La lingua di lettura viene rilevata automaticamente dai metadati dell'articolo/PDF
- Supporta: Italiano, Inglese, Spagnolo, Francese, Tedesco

### 2. **Input Vocale per Q&A (STT - Speech-to-Text)**

#### Posizione
- Pulsante microfono 🎤 nella sezione Q&A, accanto al campo di input

#### Funzionalità
- Clicca sul pulsante microfono per iniziare a parlare
- Il testo viene trascritto in tempo reale nel campo input
- La trascrizione provvisoria appare in corsivo
- La trascrizione finale appare in testo normale
- Clicca di nuovo per fermare l'ascolto

#### Feedback Visivo
- **Ascolto attivo**: Pulsante diventa 🎙️ con animazione pulsante
- **Trascrizione provvisoria**: Testo in corsivo e grigio
- **Trascrizione finale**: Testo normale e nero

#### Compatibilità Browser
- ✅ Chrome/Edge: Supporto completo
- ✅ Safari: Supporto completo
- ❌ Firefox: Non supportato (Web Speech API limitata)

## 🎨 Design e UX

### Controlli TTS
```
┌─────────────────────────────────────┐
│ ✨ Analisi Articolo                 │
│ AI • Italiano                       │
│ 🔊 ⏸️ ⏹️                            │
└─────────────────────────────────────┘
```

### Input Q&A con Voce
```
┌─────────────────────────────────────┐
│ [Input domanda...] 🎤 [Chiedi]     │
└─────────────────────────────────────┘
```

### Stati dei Pulsanti

#### TTS Play Button
- **Stopped**: 🔊 "Leggi ad alta voce"
- **Paused**: ▶️ "Riprendi"
- **Playing**: Nascosto (mostra Pausa e Stop)

#### TTS Pause Button
- **Hidden**: Quando non sta leggendo
- **Visible + Active**: Durante la lettura (con animazione pulse)

#### TTS Stop Button
- **Hidden**: Quando non sta leggendo
- **Visible**: Durante lettura o pausa

#### STT Voice Button
- **Idle**: 🎤 "Domanda vocale"
- **Listening**: 🎙️ "Ascolto in corso..." (con animazione pulse)

## 🔧 Implementazione Tecnica

### File Modificati

#### 1. `reading-mode.html`
- Aggiunto div `.voice-controls` nell'header del pannello analisi
- Aggiunti pulsanti TTS: `ttsPlayBtn`, `ttsPauseBtn`, `ttsStopBtn`
- Aggiunto pulsante STT: `qaVoiceBtn` nella sezione Q&A
- Importati script: `tts-manager.js`, `stt-manager.js`, `voice-controller.js`

#### 2. `reading-mode.css`
- Stili per `.voice-controls` e `.voice-btn`
- Animazione `pulse` per stati attivi
- Stili per `.btn-voice` e stato `.listening`
- Responsive design per controlli vocali

#### 3. `reading-mode.js`
- Inizializzazione `VoiceController` al caricamento
- Funzioni handler: `handleTTSPlay()`, `handleTTSPause()`, `handleTTSStop()`
- Funzione `handleVoiceInput()` per input vocale Q&A
- Funzione `getCurrentTabText()` per estrarre testo dal tab attivo
- Event listeners per eventi TTS/STT
- Funzione `updateTTSButtons()` per gestire stati pulsanti

### Dipendenze
- `utils/voice-controller.js` - Coordinatore TTS/STT
- `utils/tts-manager.js` - Gestione Text-to-Speech
- `utils/stt-manager.js` - Gestione Speech-to-Text

### Eventi Custom

#### TTS Events
- `tts:started` - Lettura iniziata
- `tts:paused` - Lettura in pausa
- `tts:resumed` - Lettura ripresa
- `tts:stopped` - Lettura fermata
- `tts:ended` - Lettura completata
- `tts:error` - Errore TTS

#### STT Events
- `stt:started` - Ascolto iniziato
- `stt:interim` - Trascrizione provvisoria
- `stt:result` - Trascrizione finale
- `stt:ended` - Ascolto terminato
- `stt:error` - Errore STT

## 📱 Supporto Multi-Piattaforma

### Desktop
- ✅ Chrome/Edge: Supporto completo TTS + STT
- ✅ Safari: Supporto completo TTS + STT
- ⚠️ Firefox: Solo TTS (STT non supportato)

### Mobile
- ✅ Chrome Android: Supporto completo
- ✅ Safari iOS: Supporto completo
- ⚠️ Firefox Mobile: Solo TTS

## 🎯 Casi d'Uso

### 1. Lettura Accessibile
- Utenti con disabilità visive possono ascoltare il riassunto
- Utenti in movimento possono ascoltare mentre fanno altro
- Apprendimento multimodale (lettura + ascolto)

### 2. Input Mani Libere
- Fare domande senza digitare
- Utile durante la guida o altre attività
- Più veloce per domande complesse

### 3. Multitasking
- Ascoltare il riassunto mentre si legge l'articolo originale
- Passare tra tab e continuare l'ascolto
- Pausa/riprendi per prendere appunti

## 📚 Integrazione Cronologia

I controlli vocali sono stati estesi anche alla **Cronologia** (history.html), permettendo agli utenti di ascoltare le analisi salvate.

### Funzionalità
- Controlli TTS nell'header del modal di dettaglio
- Lettura di tutti i tab: Riassunto, Punti Chiave, Traduzione, Citazioni, Q&A, Note
- Stop automatico alla chiusura del modal
- Stessi controlli della modalità lettura (Play, Pausa, Stop)

### Differenze con Modalità Lettura
- **Cronologia**: Solo TTS (lettura), nessun input vocale STT
- **Modalità Lettura**: TTS + STT (lettura + input vocale per Q&A)

### Implementazione
Vedere `documento_progetto/voice_integration.md` sezione "Cronologia" per dettagli tecnici completi.

## 🔮 Miglioramenti Futuri

### Funzionalità Avanzate
- [ ] Selezione voce TTS personalizzata
- [ ] Controllo velocità di lettura
- [ ] Evidenziazione sincronizzata del testo durante la lettura
- [ ] Lettura automatica delle risposte Q&A
- [ ] Scorciatoie da tastiera per controlli vocali
- [ ] Salvataggio preferenze vocali per lingua
- [ ] Input vocale STT anche nella cronologia (per aggiungere note vocali)

### UX Enhancements
- [ ] Indicatore di progresso durante la lettura
- [ ] Visualizzazione forma d'onda durante l'ascolto STT
- [ ] Feedback tattile su mobile
- [ ] Tooltip con istruzioni per nuovi utenti

### Accessibilità
- [ ] Supporto screen reader completo
- [ ] Navigazione da tastiera ottimizzata
- [ ] Contrasto colori per ipovedenti
- [ ] Sottotitoli in tempo reale

## 📊 Metriche di Successo

### KPI da Monitorare
- Percentuale utenti che usano TTS
- Percentuale utenti che usano STT per Q&A
- Tempo medio di ascolto
- Tasso di completamento lettura vocale
- Errori STT vs successi

### Feedback Utenti
- Soddisfazione funzionalità vocali
- Qualità trascrizione STT
- Qualità voce TTS
- Facilità d'uso controlli

## 🐛 Problemi Noti

### Limitazioni Browser
- Firefox non supporta Web Speech API per STT
- Alcune voci TTS potrebbero non essere disponibili su tutti i sistemi
- La qualità STT dipende dal microfono e dal rumore ambientale

### Workaround
- Mostrare messaggio chiaro quando STT non è supportato
- Fallback a input testuale sempre disponibile
- Gestione errori robusta con messaggi user-friendly

## 📚 Riferimenti

### API Utilizzate
- [Web Speech API - Speech Synthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- [Web Speech API - Speech Recognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [Chrome TTS API](https://developer.chrome.com/docs/extensions/reference/tts/)

### Best Practices
- [W3C Speech API Specification](https://w3c.github.io/speech-api/)
- [Accessibility Guidelines for Voice Interfaces](https://www.w3.org/WAI/WCAG21/Understanding/)

---

**Versione**: 1.0  
**Data**: 2024  
**Autore**: AI Article Summarizer Team
