/**
 * STTManager - Gestisce il riconoscimento vocale (Speech-to-Text)
 * @module utils/stt-manager
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
      console.error('❌ Speech Recognition non supportato in questo browser');
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
      console.log('🎤 Riconoscimento vocale avviato');
      window.dispatchEvent(new CustomEvent('stt:started'));
    };

    this.recognition.onresult = (event) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      
      if (lastResult.isFinal) {
        this.transcript = lastResult[0].transcript;
        console.log('✅ Trascrizione finale:', this.transcript);
        
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
      console.error('❌ Errore STT:', event.error);
      this.handleError(event);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('⏹️ Riconoscimento vocale terminato');
      window.dispatchEvent(new CustomEvent('stt:ended'));
    };

    this.recognition.onnomatch = () => {
      console.warn('⚠️ Nessuna corrispondenza trovata');
      window.dispatchEvent(new CustomEvent('stt:nomatch'));
    };

    this.recognition.onspeechend = () => {
      console.log('🔇 Discorso terminato');
    };
  }

  /**
   * Avvia il riconoscimento vocale
   */
  start() {
    if (!this.recognition) {
      console.error('❌ Speech Recognition non inizializzato');
      return;
    }

    if (this.isListening) {
      console.warn('⚠️ Riconoscimento già in corso');
      return;
    }

    try {
      this.transcript = '';
      this.recognition.start();
    } catch (error) {
      console.error('❌ Errore avvio riconoscimento:', error);
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
      console.error('❌ Errore stop riconoscimento:', error);
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
      console.error('❌ Errore abort riconoscimento:', error);
    }
  }

  /**
   * Gestisce gli errori STT
   * @param {Object} error - Oggetto errore
   */
  handleError(error) {
    this.isListening = false;
    
    let errorMessage = 'Errore nel riconoscimento vocale';
    
    const errorType = error.error || error.message;
    
    switch (errorType) {
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
      detail: { error: errorType, message: errorMessage }
    }));
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
