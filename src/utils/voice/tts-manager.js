/**
 * TTSManager - Gestisce la sintesi vocale (Text-to-Speech)
 * @module utils/tts-manager
 */
import { Logger } from '../core/logger.js';

export class TTSManager {
  constructor() {
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.queue = [];
    this.config = {
      rate: 1.0, // Velocità (0.1 - 10)
      pitch: 1.0, // Tono (0 - 2)
      volume: 1.0, // Volume (0 - 1)
      lang: 'it-IT', // Lingua di default
    };

    this.initializeEventListeners().catch((err) => Logger.warn('TTS init fallita:', err));
  }

  /**
   * Inizializza i listener per gli eventi TTS
   */
  async initializeEventListeners() {
    await this.loadVoices();
    await this.loadPreferences();
  }

  /**
   * Carica le voci disponibili
   */
  async loadVoices() {
    return new Promise((resolve) => {
      chrome.tts.getVoices((voices) => {
        this.availableVoices = voices;
        Logger.info('🔊 Voci TTS disponibili:', voices.length);
        resolve(voices);
      });
    });
  }

  /**
   * Carica le preferenze vocali salvate
   */
  async loadPreferences() {
    const result = await chrome.storage.local.get(['ttsPreferences']);
    if (result.ttsPreferences) {
      this.preferences = result.ttsPreferences;
    } else {
      this.preferences = {};
    }
  }

  /**
   * Salva le preferenze vocali
   */
  async savePreferences() {
    await chrome.storage.local.set({ ttsPreferences: this.preferences });
  }

  /**
   * Imposta la voce preferita per una lingua
   */
  async setPreferredVoice(lang, voiceName) {
    this.preferences[lang] = voiceName;
    await this.savePreferences();
  }

  /**
   * Ottieni la voce preferita per una lingua
   */
  getPreferredVoice(lang) {
    return this.preferences[lang] || null;
  }

  /**
   * Ottieni le voci disponibili per una lingua specifica
   */
  getVoicesForLanguage(lang) {
    if (!this.availableVoices) return [];

    return this.availableVoices.filter((voice) => {
      // Controlla se la voce supporta la lingua
      return voice.lang && voice.lang.startsWith(lang.split('-')[0]);
    });
  }

  /**
   * Parla il testo fornito
   * @param {string} text - Testo da leggere
   * @param {Object} options - Opzioni aggiuntive
   */
  speak(text, options = {}) {
    if (!text || text.trim().length === 0) {
      Logger.warn('⚠️ Testo vuoto fornito a TTS');
      return;
    }

    // Pulisci il testo da HTML e caratteri speciali
    const cleanText = this.cleanText(text);

    // Interrompi eventuali letture in corso
    this.stop();

    const lang = options.lang || this.config.lang;

    const ttsOptions = {
      lang: lang,
      rate: options.rate || this.config.rate,
      pitch: options.pitch || this.config.pitch,
      volume: options.volume || this.config.volume,
      onEvent: (event) => this.handleTTSEvent(event),
    };

    // Selezione voce: priorità a quella specificata, poi preferita, poi default
    if (options.voiceName) {
      ttsOptions.voiceName = options.voiceName;
    } else {
      const preferredVoice = this.getPreferredVoice(lang);
      if (preferredVoice) {
        ttsOptions.voiceName = preferredVoice;
      }
    }

    this.isSpeaking = true;
    this.currentUtterance = { text: cleanText, options: ttsOptions };

    chrome.tts.speak(cleanText, ttsOptions, () => {
      if (chrome.runtime.lastError) {
        Logger.error('❌ Errore TTS:', chrome.runtime.lastError);
        this.handleError(chrome.runtime.lastError);
      }
    });

    // Dispatch evento custom
    window.dispatchEvent(
      new CustomEvent('tts:started', {
        detail: { text: cleanText },
      }),
    );
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
      .replace(/<[^>]+>/g, '') // Rimuovi tag HTML
      .replace(/&nbsp;/g, ' ') // Converti &nbsp;
      .replace(/&[a-z]+;/gi, '') // Rimuovi entità HTML
      .replace(/\s+/g, ' ') // Normalizza spazi
      .replace(/[*_~`]/g, '') // Rimuovi markdown
      .trim();
  }

  /**
   * Gestisce gli eventi TTS
   * @param {Object} event - Evento TTS
   */
  handleTTSEvent(event) {
    switch (event.type) {
      case 'start':
        Logger.debug('▶️ TTS iniziato');
        break;
      case 'end':
        this.isSpeaking = false;
        this.isPaused = false;
        Logger.debug('⏹️ TTS terminato');
        window.dispatchEvent(new CustomEvent('tts:ended'));
        break;
      case 'error':
        this.handleError(event);
        break;
      case 'pause':
        Logger.debug('⏸️ TTS in pausa');
        break;
      case 'resume':
        Logger.debug('▶️ TTS ripreso');
        break;
    }
  }

  /**
   * Gestisce gli errori TTS
   * @param {Object} error - Oggetto errore
   */
  handleError(error) {
    Logger.error('❌ Errore TTS:', error);
    this.isSpeaking = false;
    this.isPaused = false;

    window.dispatchEvent(
      new CustomEvent('tts:error', {
        detail: { error },
      }),
    );
  }

  /**
   * Ottieni lo stato corrente
   * @returns {Object} Stato TTS
   */
  getState() {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      currentText: this.currentUtterance?.text || null,
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
