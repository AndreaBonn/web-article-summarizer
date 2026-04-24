import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Logger
vi.mock('@utils/core/logger.js', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock SpeechRecognition — usa class reale per supportare `new`
class MockSpeechRecognition {
  constructor() {
    this.start = vi.fn();
    this.stop = vi.fn();
    this.abort = vi.fn();
    this.continuous = false;
    this.interimResults = false;
    this.maxAlternatives = 1;
    this.lang = '';
    this.onstart = null;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    this.onnomatch = null;
    this.onspeechend = null;
  }
}

global.window.webkitSpeechRecognition = MockSpeechRecognition;
global.window.SpeechRecognition = undefined;

import { STTManager } from '@utils/voice/stt-manager.js';

describe('STTManager', () => {
  let stt;

  beforeEach(() => {
    vi.clearAllMocks();
    global.window.webkitSpeechRecognition = MockSpeechRecognition;
    stt = new STTManager();
  });

  // Helper: accede al recognition mock tramite stt.recognition
  function rec() {
    return stt.recognition;
  }

  // ─── Constructor ──────────────────────────────────

  describe('constructor', () => {
    it('inizializza stato default', () => {
      expect(stt.isListening).toBe(false);
      expect(stt.transcript).toBe('');
    });

    it('config default con lingua it-IT', () => {
      expect(stt.config).toEqual({
        lang: 'it-IT',
        continuous: false,
        interimResults: true,
        maxAlternatives: 1,
      });
    });

    it('crea recognition instance se supportato', () => {
      expect(rec()).not.toBeNull();
      expect(rec()).toBeInstanceOf(MockSpeechRecognition);
    });

    it('recognition è null se API non disponibile', () => {
      global.window.webkitSpeechRecognition = undefined;
      global.window.SpeechRecognition = undefined;
      const sttNoSupport = new STTManager();
      expect(sttNoSupport.recognition).toBeNull();
    });
  });

  // ─── applyConfig ──────────────────────────────────

  describe('applyConfig', () => {
    it('applica config al recognition', () => {
      expect(rec().lang).toBe('it-IT');
      expect(rec().continuous).toBe(false);
      expect(rec().interimResults).toBe(true);
      expect(rec().maxAlternatives).toBe(1);
    });

    it('non crasha se recognition è null', () => {
      stt.recognition = null;
      expect(() => stt.applyConfig()).not.toThrow();
    });
  });

  // ─── setupEventListeners ──────────────────────────

  describe('setupEventListeners - onstart', () => {
    it('setta isListening a true e dispatcha stt:started', () => {
      const handler = vi.fn();
      window.addEventListener('stt:started', handler);
      rec().onstart();
      expect(stt.isListening).toBe(true);
      expect(handler).toHaveBeenCalled();
      window.removeEventListener('stt:started', handler);
    });
  });

  describe('setupEventListeners - onresult final', () => {
    it('salva transcript finale e dispatcha stt:result', () => {
      const handler = vi.fn();
      window.addEventListener('stt:result', handler);

      rec().onresult({
        results: [{ 0: { transcript: 'ciao mondo', confidence: 0.95 }, isFinal: true }],
      });

      expect(stt.transcript).toBe('ciao mondo');
      expect(handler).toHaveBeenCalled();
      const detail = handler.mock.calls[0][0].detail;
      expect(detail.transcript).toBe('ciao mondo');
      expect(detail.confidence).toBe(0.95);
      window.removeEventListener('stt:result', handler);
    });
  });

  describe('setupEventListeners - onresult interim', () => {
    it('dispatcha stt:interim per risultati provvisori', () => {
      const handler = vi.fn();
      window.addEventListener('stt:interim', handler);

      rec().onresult({
        results: [{ 0: { transcript: 'cia' }, isFinal: false }],
      });

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].detail.transcript).toBe('cia');
      window.removeEventListener('stt:interim', handler);
    });
  });

  describe('setupEventListeners - onerror', () => {
    it('dispatcha stt:error con messaggio appropriato', () => {
      const handler = vi.fn();
      window.addEventListener('stt:error', handler);
      rec().onerror({ error: 'no-speech' });
      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].detail.message).toBe('Nessun parlato rilevato. Riprova.');
      window.removeEventListener('stt:error', handler);
    });
  });

  describe('setupEventListeners - onend', () => {
    it('setta isListening a false e dispatcha stt:ended', () => {
      const handler = vi.fn();
      window.addEventListener('stt:ended', handler);
      stt.isListening = true;
      rec().onend();
      expect(stt.isListening).toBe(false);
      expect(handler).toHaveBeenCalled();
      window.removeEventListener('stt:ended', handler);
    });
  });

  describe('setupEventListeners - onnomatch', () => {
    it('dispatcha stt:nomatch', () => {
      const handler = vi.fn();
      window.addEventListener('stt:nomatch', handler);
      rec().onnomatch();
      expect(handler).toHaveBeenCalled();
      window.removeEventListener('stt:nomatch', handler);
    });
  });

  // ─── start ────────────────────────────────────────

  describe('start', () => {
    it('avvia recognition e resetta transcript', () => {
      stt.transcript = 'old text';
      stt.start();
      expect(stt.transcript).toBe('');
      expect(rec().start).toHaveBeenCalled();
    });

    it('non avvia se recognition è null', () => {
      stt.recognition = null;
      stt.start();
      // Nessun crash
    });

    it('non avvia se già in ascolto', () => {
      stt.isListening = true;
      stt.start();
      expect(rec().start).not.toHaveBeenCalled();
    });

    it('gestisce eccezione da recognition.start()', () => {
      rec().start.mockImplementation(() => {
        throw new Error('Already started');
      });
      const errorHandler = vi.fn();
      window.addEventListener('stt:error', errorHandler);
      stt.start();
      expect(errorHandler).toHaveBeenCalled();
      window.removeEventListener('stt:error', errorHandler);
    });
  });

  // ─── stop ─────────────────────────────────────────

  describe('stop', () => {
    it('ferma recognition se in ascolto', () => {
      stt.isListening = true;
      stt.stop();
      expect(rec().stop).toHaveBeenCalled();
    });

    it('non fa nulla se non in ascolto', () => {
      stt.isListening = false;
      stt.stop();
      expect(rec().stop).not.toHaveBeenCalled();
    });

    it('non crasha se recognition è null', () => {
      stt.recognition = null;
      expect(() => stt.stop()).not.toThrow();
    });
  });

  // ─── abort ────────────────────────────────────────

  describe('abort', () => {
    it('annulla recognition e resetta stato', () => {
      stt.isListening = true;
      stt.transcript = 'qualcosa';
      stt.abort();
      expect(rec().abort).toHaveBeenCalled();
      expect(stt.isListening).toBe(false);
      expect(stt.transcript).toBe('');
    });

    it('non crasha se recognition è null', () => {
      stt.recognition = null;
      expect(() => stt.abort()).not.toThrow();
    });
  });

  // ─── handleError ──────────────────────────────────

  describe('handleError', () => {
    it('mappa errore no-speech correttamente', () => {
      const handler = vi.fn();
      window.addEventListener('stt:error', handler);
      stt.handleError({ error: 'no-speech' });
      expect(handler.mock.calls[0][0].detail.message).toBe('Nessun parlato rilevato. Riprova.');
      window.removeEventListener('stt:error', handler);
    });

    it('mappa errore audio-capture', () => {
      const handler = vi.fn();
      window.addEventListener('stt:error', handler);
      stt.handleError({ error: 'audio-capture' });
      expect(handler.mock.calls[0][0].detail.message).toContain('Microfono non accessibile');
      window.removeEventListener('stt:error', handler);
    });

    it('mappa errore not-allowed', () => {
      const handler = vi.fn();
      window.addEventListener('stt:error', handler);
      stt.handleError({ error: 'not-allowed' });
      expect(handler.mock.calls[0][0].detail.message).toContain('Permesso microfono negato');
      window.removeEventListener('stt:error', handler);
    });

    it('mappa errore network', () => {
      const handler = vi.fn();
      window.addEventListener('stt:error', handler);
      stt.handleError({ error: 'network' });
      expect(handler.mock.calls[0][0].detail.message).toContain('Errore di rete');
      window.removeEventListener('stt:error', handler);
    });

    it('mappa errore aborted', () => {
      const handler = vi.fn();
      window.addEventListener('stt:error', handler);
      stt.handleError({ error: 'aborted' });
      expect(handler.mock.calls[0][0].detail.message).toBe('Riconoscimento annullato.');
      window.removeEventListener('stt:error', handler);
    });

    it('usa messaggio generico per errore sconosciuto', () => {
      const handler = vi.fn();
      window.addEventListener('stt:error', handler);
      stt.handleError({ error: 'unknown-error' });
      expect(handler.mock.calls[0][0].detail.message).toBe('Errore nel riconoscimento vocale');
      window.removeEventListener('stt:error', handler);
    });

    it('resetta isListening', () => {
      stt.isListening = true;
      stt.handleError({ error: 'network' });
      expect(stt.isListening).toBe(false);
    });
  });

  // ─── updateConfig ─────────────────────────────────

  describe('updateConfig', () => {
    it('merge config e riapplica', () => {
      stt.updateConfig({ lang: 'en-US', continuous: true });
      expect(stt.config.lang).toBe('en-US');
      expect(stt.config.continuous).toBe(true);
      expect(stt.config.interimResults).toBe(true);
      expect(rec().lang).toBe('en-US');
      expect(rec().continuous).toBe(true);
    });
  });

  // ─── isSupported ──────────────────────────────────

  describe('isSupported', () => {
    it('ritorna true se webkitSpeechRecognition disponibile', () => {
      expect(STTManager.isSupported()).toBe(true);
    });

    it('ritorna false se nessuna API disponibile', () => {
      const backup = global.window.webkitSpeechRecognition;
      global.window.webkitSpeechRecognition = undefined;
      global.window.SpeechRecognition = undefined;
      expect(STTManager.isSupported()).toBe(false);
      global.window.webkitSpeechRecognition = backup;
    });
  });

  // ─── getState ─────────────────────────────────────

  describe('getState', () => {
    it('ritorna stato corrente', () => {
      expect(stt.getState()).toEqual({
        isListening: false,
        transcript: '',
        isSupported: true,
      });
    });

    it('riflette stato aggiornato', () => {
      stt.isListening = true;
      stt.transcript = 'test transcript';
      const state = stt.getState();
      expect(state.isListening).toBe(true);
      expect(state.transcript).toBe('test transcript');
    });
  });
});
