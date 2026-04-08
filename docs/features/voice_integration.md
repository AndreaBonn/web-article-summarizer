# 📄 Specifica Tecnica - Integrazione Funzionalità Vocali (TTS & STT)

**Versione:** 1.0  
**Data:** Novembre 2025  
**Progetto:** Chrome Extension - Analisi Articoli Web con AI

---

## 📋 Indice

1. [Obiettivo del Progetto](#obiettivo)
2. [Panoramica Tecnica](#panoramica)
3. [Architettura del Sistema](#architettura)
4. [Implementazione TTS](#implementazione-tts)
5. [Implementazione STT](#implementazione-stt)
6. [Flusso Q&A Vocale Completo](#flusso-qa)
7. [Interfaccia Utente](#interfaccia)
8. [Gestione Multilingua](#multilingua)
9. [Testing e Quality Assurance](#testing)
10. [Timeline e Milestone](#timeline)
11. [Checklist Implementazione](#checklist)

---

## 🎯 <a name="obiettivo"></a>Obiettivo del Progetto

Integrare funzionalità vocali avanzate nell'estensione Chrome esistente che analizza articoli web e genera contenuti attraverso AI.

### Funzionalità da Implementare

#### Text-to-Speech (TTS)
Lettura ad alta voce di:
- ✅ Riassunti generati dall'AI
- ✅ Traduzioni
- ✅ Citazioni estratte
- ✅ Punti chiave
- ✅ Risposte Q&A generate dall'AI
- ✅ Testo completo dell'articolo
- ✅ **Modalità Lettura**: Lettura di tutti i contenuti analizzati

#### Speech-to-Text (STT)
- ✅ Riconoscimento vocale per porre domande nella sezione Q&A
- ✅ Trascrizione in tempo reale
- ✅ Integrazione automatica con il motore AI

### Vincoli Tecnici
- **Costo:** 0€ - Solo API native del browser
- **Compatibilità:** Chrome 70+, Edge 79+
- **Performance:** Risposta STT < 2s, latenza TTS < 500ms

---

## 🛠️ <a name="panoramica"></a>Panoramica Tecnica

### Stack Tecnologico

| Funzionalità | API/Tecnologia | Costo | Browser Support |
|--------------|----------------|-------|-----------------|
| Text-to-Speech | `chrome.tts` API | **Gratuita** | Chrome, Edge |
| Speech-to-Text | `Web Speech API` (`webkitSpeechRecognition`) | **Gratuita** | Chrome, Edge, Safari |
| UI Controls | HTML5 + CSS3 + Vanilla JS | - | Tutti i browser |
| State Management | Event-driven architecture | - | Tutti i browser |

### Permessi Necessari

Aggiornare `manifest.json` (Manifest V3):

```json
{
  "manifest_version": 3,
  "name": "AI Article Analyzer with Voice",
  "version": "2.0.0",
  "permissions": [
    "tts",
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "<all_urls>"
  ]
}
```

### Dipendenze Esterne
**Nessuna** - Tutto gestito con API native del browser.

---

## 🏗️ <a name="architettura"></a>Architettura del Sistema

### Struttura Directory Consigliata

```
chrome-extension/
├── manifest.json
├── background.js
├── popup.html
├── popup.js
├── src/
│   ├── ui/
│   │   ├── components/
│   │   │   ├── VoiceButton.js
│   │   │   ├── TTSControls.js
│   │   │   └── STTIndicator.js
│   │   ├── styles/
│   │   │   ├── voice-controls.css
│   │   │   └── animations.css
│   │   └── index.js
│   ├── voice/
│   │   ├── tts/
│   │   │   ├── TTSManager.js
│   │   │   ├── VoiceSelector.js
│   │   │   └── TTSConfig.js
│   │   ├── stt/
│   │   │   ├── STTManager.js
│   │   │   ├── RecognitionHandler.js
│   │   │   └── STTConfig.js
│   │   └── VoiceController.js
│   ├── core/
│   │   ├── aiClient.js
│   │   ├── articleParser.js
│   │   └── eventBus.js
│   └── utils/
│       ├── textCleaner.js
│       ├── languageDetector.js
│       └── errorHandler.js
├── assets/
│   ├── icons/
│   │   ├── microphone.svg
│   │   ├── speaker.svg
│   │   ├── pause.svg
│   │   └── stop.svg
│   └── sounds/
│       ├── start-listening.mp3
│       └── end-listening.mp3
└── tests/
    ├── tts.test.js
    ├── stt.test.js
    └── integration.test.js
```

### Diagramma Architetturale

```
┌─────────────────────────────────────────────────┐
│              USER INTERFACE                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ TTS Btn  │  │ STT Btn  │  │ Controls │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
└───────┼─────────────┼─────────────┼────────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────┐
│           VOICE CONTROLLER                      │
│  ┌──────────────┐      ┌──────────────┐        │
│  │ TTSManager   │      │ STTManager   │        │
│  └──────┬───────┘      └──────┬───────┘        │
└─────────┼──────────────────────┼─────────────────┘
          │                      │
          ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│  chrome.tts API │    │ Web Speech API  │
└─────────────────┘    └─────────────────┘
          │                      │
          └──────────┬───────────┘
                     ▼
          ┌─────────────────────┐
          │   AI Client         │
          │   (Q&A Engine)      │
          └─────────────────────┘
```

---

## 🔊 <a name="implementazione-tts"></a>Implementazione TTS (Text-to-Speech)

### 1. TTSManager.js - Core Module

```javascript
/**
 * TTSManager - Gestisce la sintesi vocale
 * @module voice/tts/TTSManager
 */

class TTSManager {
  constructor() {
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.queue = [];
    this.config = {
      rate: 1.0,      // Velocità (0.1 - 10)
      pitch: 1.0,     // Tono (0 - 2)
      volume: 1.0,    // Volume (0 - 1)
      lang: 'it-IT'   // Lingua di default
    };
    
    this.initializeEventListeners();
  }

  /**
   * Inizializza i listener per gli eventi TTS
   */
  initializeEventListeners() {
    chrome.tts.getVoices((voices) => {
      this.availableVoices = voices;
      console.log('Voci disponibili:', voices);
    });
  }

  /**
   * Parla il testo fornito
   * @param {string} text - Testo da leggere
   * @param {Object} options - Opzioni aggiuntive
   */
  speak(text, options = {}) {
    if (!text || text.trim().length === 0) {
      console.warn('Testo vuoto fornito a TTS');
      return;
    }

    // Pulisci il testo da HTML e caratteri speciali
    const cleanText = this.cleanText(text);
    
    // Interrompi eventuali letture in corso
    this.stop();

    const ttsOptions = {
      lang: options.lang || this.config.lang,
      rate: options.rate || this.config.rate,
      pitch: options.pitch || this.config.pitch,
      volume: options.volume || this.config.volume,
      onEvent: (event) => this.handleTTSEvent(event)
    };

    // Selezione voce specifica se disponibile
    if (options.voiceName) {
      ttsOptions.voiceName = options.voiceName;
    }

    this.isSpeaking = true;
    this.currentUtterance = { text: cleanText, options: ttsOptions };

    chrome.tts.speak(cleanText, ttsOptions, () => {
      if (chrome.runtime.lastError) {
        console.error('Errore TTS:', chrome.runtime.lastError);
        this.handleError(chrome.runtime.lastError);
      }
    });

    // Dispatch evento custom
    window.dispatchEvent(new CustomEvent('tts:started', { 
      detail: { text: cleanText } 
    }));
  }

  /**
   * Metti in pausa la lettura
   */
  pause() {
    if (this.isSpeaking && !this.isPaused) {
      chrome.tts.pause();
      this.isPaused = true;
      window.dispatchEvent(new CustomEvent('tts:paused'));
    }
  }

  /**
   * Riprendi la lettura
   */
  resume() {
    if (this.isSpeaking && this.isPaused) {
      chrome.tts.resume();
      this.isPaused = false;
      window.dispatchEvent(new CustomEvent('tts:resumed'));
    }
  }

  /**
   * Ferma la lettura
   */
  stop() {
    if (this.isSpeaking) {
      chrome.tts.stop();
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      window.dispatchEvent(new CustomEvent('tts:stopped'));
    }
  }

  /**
   * Pulisce il testo da HTML e caratteri speciali
   * @param {string} text - Testo da pulire
   * @returns {string} Testo pulito
   */
  cleanText(text) {
    return text
      .replace(/<[^>]+>/g, '')           // Rimuovi tag HTML
      .replace(/&nbsp;/g, ' ')           // Converti &nbsp;
      .replace(/&[a-z]+;/gi, '')         // Rimuovi entità HTML
      .replace(/\s+/g, ' ')              // Normalizza spazi
      .replace(/[*_~`]/g, '')            // Rimuovi markdown
      .trim();
  }

  /**
   * Gestisce gli eventi TTS
   * @param {Object} event - Evento TTS
   */
  handleTTSEvent(event) {
    switch(event.type) {
      case 'start':
        console.log('TTS iniziato');
        break;
      case 'end':
        this.isSpeaking = false;
        this.isPaused = false;
        window.dispatchEvent(new CustomEvent('tts:ended'));
        break;
      case 'error':
        this.handleError(event);
        break;
      case 'pause':
        console.log('TTS in pausa');
        break;
      case 'resume':
        console.log('TTS ripreso');
        break;
    }
  }

  /**
   * Gestisce gli errori TTS
   * @param {Object} error - Oggetto errore
   */
  handleError(error) {
    console.error('Errore TTS:', error);
    this.isSpeaking = false;
    this.isPaused = false;
    
    window.dispatchEvent(new CustomEvent('tts:error', { 
      detail: { error } 
    }));
    
    // Mostra notifica all'utente
    this.showErrorNotification('Errore nella sintesi vocale. Riprova.');
  }

  /**
   * Mostra notifica di errore
   * @param {string} message - Messaggio di errore
   */
  showErrorNotification(message) {
    // Implementazione della notifica UI
    console.error(message);
  }

  /**
   * Ottieni lo stato corrente
   * @returns {Object} Stato TTS
   */
  getState() {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      currentText: this.currentUtterance?.text || null
    };
  }

  /**
   * Aggiorna la configurazione
   * @param {Object} newConfig - Nuova configurazione
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Ottieni le voci disponibili
   * @returns {Promise<Array>} Lista delle voci
   */
  async getAvailableVoices() {
    return new Promise((resolve) => {
      chrome.tts.getVoices((voices) => {
        resolve(voices);
      });
    });
  }
}

export default TTSManager;
```

### 2. Integrazione nei Componenti UI

```javascript
// Esempio di utilizzo in popup.js o nei componenti

import TTSManager from './src/voice/tts/TTSManager.js';

// Inizializza il manager
const ttsManager = new TTSManager();

// Aggiungi pulsanti TTS a ogni sezione
function addTTSButton(element, text, lang = 'it-IT') {
  const button = document.createElement('button');
  button.className = 'tts-button';
  button.innerHTML = `
    <svg class="icon-speaker" width="20" height="20">
      <use href="#icon-speaker"></use>
    </svg>
    <span>Leggi</span>
  `;
  
  button.addEventListener('click', () => {
    if (ttsManager.isSpeaking) {
      ttsManager.stop();
      button.classList.remove('active');
    } else {
      ttsManager.speak(text, { lang });
      button.classList.add('active');
    }
  });
  
  element.appendChild(button);
  
  // Listener per aggiornare UI quando TTS termina
  window.addEventListener('tts:ended', () => {
    button.classList.remove('active');
  });
}

// Esempio: Aggiungi TTS al riassunto
const summaryContainer = document.querySelector('.summary-content');
const summaryText = summaryContainer.textContent;
addTTSButton(summaryContainer.parentElement, summaryText);
```

### 3. CSS per Controlli TTS

```css
/* voice-controls.css */

.tts-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.tts-button:hover {
  background: #3367d6;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.tts-button.active {
  background: #ea4335;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.tts-controls {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.tts-control-btn {
  padding: 6px 12px;
  background: #f1f3f4;
  border: 1px solid #dadce0;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.tts-control-btn:hover {
  background: #e8eaed;
}

.tts-control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## 🎤 <a name="implementazione-stt"></a>Implementazione STT (Speech-to-Text)

### 1. STTManager.js - Core Module

```javascript
/**
 * STTManager - Gestisce il riconoscimento vocale
 * @module voice/stt/STTManager
 */

class STTManager {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.transcript = '';
    this.config = {
      lang: 'it-IT',
      continuous: false,
      interimResults: true,
      maxAlternatives: 1
    };
    
    this.initializeRecognition();
  }

  /**
   * Inizializza Web Speech API
   */
  initializeRecognition() {
    const SpeechRecognition = window.SpeechRecognition || 
                              window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech Recognition non supportato in questo browser');
      this.showErrorNotification(
        'Riconoscimento vocale non supportato. Usa Chrome o Edge.'
      );
      return;
    }

    this.recognition = new SpeechRecognition();
    this.applyConfig();
    this.setupEventListeners();
  }

  /**
   * Applica la configurazione al recognizer
   */
  applyConfig() {
    if (!this.recognition) return;
    
    this.recognition.lang = this.config.lang;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;
  }

  /**
   * Configura i listener per gli eventi di riconoscimento
   */
  setupEventListeners() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('Riconoscimento vocale avviato');
      window.dispatchEvent(new CustomEvent('stt:started'));
    };

    this.recognition.onresult = (event) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      
      if (lastResult.isFinal) {
        this.transcript = lastResult[0].transcript;
        console.log('Trascrizione finale:', this.transcript);
        
        window.dispatchEvent(new CustomEvent('stt:result', {
          detail: { 
            transcript: this.transcript,
            confidence: lastResult[0].confidence 
          }
        }));
      } else {
        // Risultato provvisorio
        const interimTranscript = lastResult[0].transcript;
        window.dispatchEvent(new CustomEvent('stt:interim', {
          detail: { transcript: interimTranscript }
        }));
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Errore STT:', event.error);
      this.handleError(event);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('Riconoscimento vocale terminato');
      window.dispatchEvent(new CustomEvent('stt:ended'));
    };

    this.recognition.onnomatch = () => {
      console.warn('Nessuna corrispondenza trovata');
      window.dispatchEvent(new CustomEvent('stt:nomatch'));
    };

    this.recognition.onspeechend = () => {
      console.log('Discorso terminato');
    };
  }

  /**
   * Avvia il riconoscimento vocale
   */
  start() {
    if (!this.recognition) {
      console.error('Speech Recognition non inizializzato');
      return;
    }

    if (this.isListening) {
      console.warn('Riconoscimento già in corso');
      return;
    }

    try {
      this.transcript = '';
      this.recognition.start();
    } catch (error) {
      console.error('Errore avvio riconoscimento:', error);
      this.handleError(error);
    }
  }

  /**
   * Ferma il riconoscimento vocale
   */
  stop() {
    if (!this.recognition || !this.isListening) return;
    
    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Errore stop riconoscimento:', error);
    }
  }

  /**
   * Annulla il riconoscimento vocale
   */
  abort() {
    if (!this.recognition) return;
    
    try {
      this.recognition.abort();
      this.isListening = false;
      this.transcript = '';
    } catch (error) {
      console.error('Errore abort riconoscimento:', error);
    }
  }

  /**
   * Gestisce gli errori STT
   * @param {Object} error - Oggetto errore
   */
  handleError(error) {
    this.isListening = false;
    
    let errorMessage = 'Errore nel riconoscimento vocale';
    
    switch (error.error) {
      case 'no-speech':
        errorMessage = 'Nessun parlato rilevato. Riprova.';
        break;
      case 'audio-capture':
        errorMessage = 'Microfono non accessibile. Controlla i permessi.';
        break;
      case 'not-allowed':
        errorMessage = 'Permesso microfono negato. Abilita nelle impostazioni.';
        break;
      case 'network':
        errorMessage = 'Errore di rete. Controlla la connessione.';
        break;
      case 'aborted':
        errorMessage = 'Riconoscimento annullato.';
        break;
    }

    window.dispatchEvent(new CustomEvent('stt:error', {
      detail: { error: error.error, message: errorMessage }
    }));

    this.showErrorNotification(errorMessage);
  }

  /**
   * Mostra notifica di errore
   * @param {string} message - Messaggio di errore
   */
  showErrorNotification(message) {
    console.error(message);
    // Implementa UI notification
  }

  /**
   * Aggiorna la configurazione
   * @param {Object} newConfig - Nuova configurazione
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.applyConfig();
  }

  /**
   * Verifica supporto browser
   * @returns {boolean} True se supportato
   */
  static isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Ottieni lo stato corrente
   * @returns {Object} Stato STT
   */
  getState() {
    return {
      isListening: this.isListening,
      transcript: this.transcript,
      isSupported: STTManager.isSupported()
    };
  }
}

export default STTManager;
```

### 2. Integrazione Q&A con STT

```javascript
// Integrazione nel sistema Q&A

import STTManager from './src/voice/stt/STTManager.js';
import TTSManager from './src/voice/tts/TTSManager.js';

class VoiceQAController {
  constructor(aiClient) {
    this.sttManager = new STTManager();
    this.ttsManager = new TTSManager();
    this.aiClient = aiClient;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Quando STT produce un risultato finale
    window.addEventListener('stt:result', async (event) => {
      const question = event.detail.transcript;
      await this.handleVoiceQuestion(question);
    });

    // Aggiorna UI durante il riconoscimento
    window.addEventListener('stt:interim', (event) => {
      this.updateInterimTranscript(event.detail.transcript);
    });

    // Gestisci errori
    window.addEventListener('stt:error', (event) => {
      this.showError(event.detail.message);
    });
  }

  /**
   * Gestisce una domanda vocale
   * @param {string} question - Domanda trascritta
   */
  async handleVoiceQuestion(question) {
    try {
      // 1. Mostra la domanda nell'UI
      this.displayQuestion(question);
      
      // 2. Mostra loader
      this.showLoader();
      
      // 3. Invia domanda all'AI
      const answer = await this.aiClient.askQuestion(question);
      
      // 4. Mostra risposta
      this.displayAnswer(answer);
      
      // 5. Leggi risposta ad alta voce
      this.ttsManager.speak(answer);
      
    } catch (error) {
      console.error('Errore elaborazione domanda:', error);
      this.showError('Errore nell\'elaborazione della domanda.');
    } finally {
      this.hideLoader();
    }
  }

  /**
   * Avvia ascolto vocale
   */
  startListening() {
    if (!STTManager.isSupported()) {
      this.showError('Riconoscimento vocale non supportato');
      return;
    }

    this.sttManager.start();
    this.showListeningIndicator();
  }

  /**
   * Ferma ascolto
   */
  stopListening() {
    this.sttManager.stop();
    this.hideListeningIndicator();
  }

  // Metodi UI helper
  displayQuestion(question) {
    const questionEl = document.createElement('div');
    questionEl.className = 'qa-question';
    questionEl.textContent = `Tu: ${question}`;
    document.querySelector('.qa-container').appendChild(questionEl);
  }

  displayAnswer(answer) {
    const answerEl = document.createElement('div');
    answerEl.className = 'qa-answer';
    answerEl.textContent = `AI: ${answer}`;
    document.querySelector('.qa-container').appendChild(answerEl);
  }

  updateInterimTranscript(text) {
    let interimEl = document.querySelector('.interim-transcript');
    if (!interimEl) {
      interimEl = document.createElement('div');
      interimEl.className = 'interim-transcript';
      document.querySelector('.qa-container').appendChild(interimEl);
    }
    interimEl.textContent = text;
  }

  showListeningIndicator() {
    const indicator = document.querySelector('.listening-indicator');
    if (indicator) {
      indicator.classList.add('active');
    }
  }

  hideListeningIndicator() {
    const indicator = document.querySelector('.listening-indicator');
    if (indicator) {
      indicator.classList.remove('active');
    }
    
    // Rimuovi trascrizione provvisoria
    const interim = document.querySelector('.interim-transcript');
    if (interim) interim.remove();
  }

  showLoader() {
    document.querySelector('.qa-loader')?.classList.add('visible');
  }

  hideLoader() {
    document.querySelector('.qa-loader')?.classList.remove('visible');
  }

  showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-notification';
    errorEl.textContent = message;
    document.body.appendChild(errorEl);
    
    setTimeout(() => errorEl.remove(), 5000);
  }
}

export default VoiceQAController;
```

---

## 📊 <a name="flusso-qa"></a>Flusso Q&A Vocale Completo

### Diagramma di Sequenza

```
Utente          UI              STTManager      AIClient        TTSManager
  │              │                   │              │               │
  │─Click mic───>│                   │              │               │
  │              │──start()────────>│              │               │
  │              │<──stt:started────│              │               │
  │              │                   │              │               │
  │──speaks──────────────────────────>│              │               │
  │              │<──stt:interim────│              │               │
  │              │ (update UI)       │              │               │
  │              │                   │              │               │
  │──stops───────────────────────────>│              │               │
  │              │<──stt:result─────│              │               │
  │              │                   │              │               │
  │              │──askQuestion()─────────────────>│               │
  │              │                   │              │               │
  │              │<──answer─────────────────────────│               │
  │              │                   │              │               │
  │              │──speak(answer)──────────────────────────────────>│
  │              │                   │              │               │
  │<─hears answer────────────────────────────────────────────────────│
  │              │                   │              │               │
```

### Pseudocodice Completo

```javascript
async function handleVoiceQA() {
  // 1. Setup
  const stt = new STTManager();
  const tts = new TTSManager();
  const ai = new AIClient();
  
  // 2. User clicks microphone
  document.querySelector('.mic-button').addEventListener('click', async () => {
    
    // 3. Start listening
    stt.start();
    showListeningAnimation();
    
    // 4. Wait for speech result
    const question = await new Promise((resolve) => {
      window.addEventListener('stt:result', (e) => {
        resolve(e.detail.transcript);
      }, { once: true });
    });
    
    // 5. Display question
    addToChat('user', question);
    


---

## 📖 Integrazione Modalità Lettura

### Panoramica

I controlli vocali sono stati integrati anche nella **Modalità Lettura** (reading-mode.html), offrendo un'esperienza di lettura immersiva e accessibile.

### Funzionalità Implementate

#### 1. Lettura Vocale (TTS)

**Posizione**: Header del pannello "Analisi Articolo"

**Controlli**:
- 🔊 **Play**: Avvia la lettura del contenuto del tab attivo
- ⏸️ **Pausa**: Mette in pausa la lettura (può essere ripresa)
- ⏹️ **Stop**: Ferma completamente la lettura

**Tab Supportati**:
- **Riassunto**: Legge il riassunto completo
- **Punti Chiave**: Legge tutti i punti chiave in sequenza
- **Traduzione**: Legge il testo tradotto
- **Citazioni**: Legge tutte le citazioni estratte
- **Q&A**: Legge domande e risposte

**Lingua Automatica**: La lingua di lettura viene rilevata automaticamente dai metadati dell'articolo/PDF.

#### 2. Input Vocale Q&A (STT)

**Posizione**: Sezione Q&A, accanto al campo di input

**Funzionalità**:
- Clicca sul pulsante 🎤 per iniziare a parlare
- Trascrizione in tempo reale nel campo input
- Trascrizione provvisoria in corsivo
- Trascrizione finale in testo normale
- Clicca di nuovo per fermare l'ascolto

**Feedback Visivo**:
- **Ascolto attivo**: Pulsante diventa 🎙️ con animazione pulsante
- **Trascrizione provvisoria**: Testo in corsivo e grigio
- **Trascrizione finale**: Testo normale e nero

### Implementazione Tecnica

#### File Modificati

**reading-mode.html**:
```html
<!-- Voice Controls in header -->
<div class="voice-controls">
  <button id="ttsPlayBtn" class="voice-btn" title="Leggi ad alta voce">🔊</button>
  <button id="ttsPauseBtn" class="voice-btn" title="Pausa" style="display: none;">⏸️</button>
  <button id="ttsStopBtn" class="voice-btn" title="Stop" style="display: none;">⏹️</button>
</div>

<!-- Voice input in Q&A -->
<div class="qa-input-group">
  <input type="text" id="qaInput" placeholder="Fai una domanda sull'articolo..." />
  <button id="qaVoiceBtn" class="btn btn-voice" title="Domanda vocale">🎤</button>
  <button id="qaAskBtn" class="btn btn-primary">Chiedi</button>
</div>
```

**reading-mode.css**:
```css
/* Voice Controls */
.voice-controls {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.voice-btn {
  padding: 6px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.voice-btn.active {
  background: var(--accent-color);
  border-color: var(--accent-color);
  animation: pulse 1.5s infinite;
}

.btn-voice.listening {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
  animation: pulse 1.5s infinite;
}
```

**reading-mode.js**:
```javascript
// Initialize voice controller
let voiceController = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize voice controller
  voiceController = new VoiceController();
  await voiceController.initialize();
  
  // Setup voice event listeners
  setupVoiceEventListeners();
  
  // ... rest of initialization
});

// TTS handlers
function handleTTSPlay() {
  const textToRead = getCurrentTabText();
  const lang = currentData?.metadata?.language || 'it';
  const voiceLang = VoiceController.mapLanguageCode(lang);
  voiceController.speak(textToRead, voiceLang);
}

function handleTTSPause() {
  voiceController.pauseSpeaking();
}

function handleTTSStop() {
  voiceController.stopSpeaking();
}

// STT handler
async function handleVoiceInput() {
  const lang = currentData?.metadata?.language || 'it';
  const voiceLang = VoiceController.mapLanguageCode(lang);
  const transcript = await voiceController.startListening(voiceLang);
  // Transcript is set in input by event listener
}

// Get text from current active tab
function getCurrentTabText() {
  const activeTab = document.querySelector('.summary-tab.active');
  const tabName = activeTab.dataset.tab;
  
  switch (tabName) {
    case 'summary':
      return currentData?.summary || null;
    case 'keypoints':
      return currentData.keyPoints
        .map((point, index) => `${index + 1}. ${point.title}. ${point.description}`)
        .join('. ');
    // ... other tabs
  }
}
```

### Gestione Stati

#### Stati TTS
```
stopped → playing → paused → playing → stopped
   ↓                   ↓
   └─────────────────→ stopped
```

**Stopped**:
- Visibile: 🔊 Play
- Nascosti: ⏸️ Pausa, ⏹️ Stop

**Playing**:
- Nascosto: 🔊 Play
- Visibili: ⏸️ Pausa (con animazione), ⏹️ Stop

**Paused**:
- Visibile: ▶️ Riprendi, ⏹️ Stop
- Nascosto: ⏸️ Pausa

#### Stati STT
```
idle → listening → transcribing → idle
  ↓                      ↓
  └──────────────────────┘
```

**Idle**:
- Pulsante: 🎤 "Domanda vocale"
- Input: Vuoto o con testo precedente

**Listening**:
- Pulsante: 🎙️ "Ascolto in corso..." (con animazione pulse)
- Input: Trascrizione provvisoria in corsivo grigio

**Transcribing**:
- Pulsante: 🎤 (torna a idle)
- Input: Trascrizione finale in testo normale nero

### Eventi Custom

#### TTS Events
```javascript
window.addEventListener('tts:started', () => {
  updateTTSButtons('playing');
});

window.addEventListener('tts:paused', () => {
  updateTTSButtons('paused');
});

window.addEventListener('tts:stopped', () => {
  updateTTSButtons('stopped');
});

window.addEventListener('tts:error', (event) => {
  alert('Errore nella lettura vocale: ' + event.detail.error);
});
```

#### STT Events
```javascript
window.addEventListener('stt:started', () => {
  qaVoiceBtn.classList.add('listening');
  qaVoiceBtn.textContent = '🎙️';
});

window.addEventListener('stt:interim', (event) => {
  qaInput.value = event.detail.transcript;
  qaInput.style.fontStyle = 'italic';
  qaInput.style.color = 'var(--text-secondary)';
});

window.addEventListener('stt:result', (event) => {
  qaInput.value = event.detail.transcript;
  qaInput.style.fontStyle = 'normal';
  qaInput.style.color = 'var(--text-primary)';
  qaVoiceBtn.classList.remove('listening');
});

window.addEventListener('stt:error', (event) => {
  alert(event.detail.message);
  qaVoiceBtn.classList.remove('listening');
});
```

### Casi d'Uso

#### 1. Lettura Accessibile
- Utenti con disabilità visive possono ascoltare il riassunto
- Utenti in movimento possono ascoltare mentre fanno altro
- Apprendimento multimodale (lettura + ascolto)

#### 2. Input Mani Libere
- Fare domande senza digitare
- Utile durante la guida o altre attività
- Più veloce per domande complesse

#### 3. Multitasking
- Ascoltare il riassunto mentre si legge l'articolo originale
- Passare tra tab e continuare l'ascolto
- Pausa/riprendi per prendere appunti

### Compatibilità Browser

| Browser | TTS | STT | Note |
|---------|-----|-----|------|
| Chrome | ✅ | ✅ | Supporto completo |
| Edge | ✅ | ✅ | Supporto completo |
| Safari | ✅ | ✅ | Supporto completo |
| Firefox | ✅ | ❌ | Solo TTS, STT non supportato |

### Cronologia (history.html)

I controlli vocali sono stati integrati anche nella **Cronologia** per permettere l'ascolto delle analisi salvate.

#### Posizione
- Controlli TTS nell'header del modal di dettaglio

#### Funzionalità
- **Play 🔊**: Legge il contenuto del tab attivo nel modal
- **Pausa ⏸️**: Mette in pausa la lettura
- **Stop ⏹️**: Ferma la lettura
- **Stop automatico**: La lettura si ferma automaticamente alla chiusura del modal

#### Tab Supportati
- Riassunto
- Punti Chiave
- Traduzione
- Citazioni
- Q&A
- Note

#### Implementazione

**history.html**:
```html
<div class="modal-header">
  <h2 id="modalTitle"></h2>
  <div class="modal-header-actions">
    <!-- Voice Controls -->
    <div class="voice-controls-modal">
      <button id="modalTtsPlayBtn" class="voice-btn-modal">🔊</button>
      <button id="modalTtsPauseBtn" class="voice-btn-modal" style="display: none;">⏸️</button>
      <button id="modalTtsStopBtn" class="voice-btn-modal" style="display: none;">⏹️</button>
    </div>
    <button id="closeModal" class="btn-close">×</button>
  </div>
</div>
```

**history.css**:
```css
.voice-controls-modal {
  display: flex;
  gap: 6px;
  align-items: center;
}

.voice-btn-modal {
  padding: 6px 12px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.voice-btn-modal.active {
  background: #667eea;
  border-color: #667eea;
  animation: pulse 1.5s infinite;
}
```

**history.js**:
```javascript
// Initialize voice controller
let voiceController = null;

document.addEventListener('DOMContentLoaded', async () => {
  voiceController = new VoiceController();
  await voiceController.initialize();
  setupVoiceEventListeners();
  // ... rest of initialization
});

// TTS handlers
function handleModalTTSPlay() {
  const textToRead = getCurrentModalTabText();
  const lang = currentEntry?.metadata?.language || 'it';
  const voiceLang = VoiceController.mapLanguageCode(lang);
  voiceController.speak(textToRead, voiceLang);
}

function handleModalTTSPause() {
  voiceController.pauseSpeaking();
}

function handleModalTTSStop() {
  voiceController.stopSpeaking();
}

// Get text from active modal tab
function getCurrentModalTabText() {
  const activeTab = document.querySelector('.modal-tab.active');
  const tabName = activeTab.dataset.tab;
  
  switch (tabName) {
    case 'summary':
      return currentEntry.summary;
    case 'keypoints':
      return currentEntry.keyPoints
        .map((point, index) => `${index + 1}. ${point.title}. ${point.description}`)
        .join('. ');
    // ... other tabs
  }
}

// Stop TTS when modal closes
function closeModal() {
  if (voiceController) {
    voiceController.stopSpeaking();
  }
  document.getElementById('detailModal').classList.add('hidden');
}
```

### Documentazione Completa

Per maggiori dettagli sull'implementazione, vedere:
- `documento_progetto/reading_mode_voice_integration.md` - Documentazione dettagliata
- `tests/reading-mode-voice.test.md` - Piano di test completo

---
