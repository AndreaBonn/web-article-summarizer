import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock chrome.tts + chrome.storage.local + chrome.runtime
const store = {};
global.chrome = {
  tts: {
    speak: vi.fn((_text, _opts, cb) => cb && cb()),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    getVoices: vi.fn((cb) =>
      cb([
        { voiceName: 'Google italiano', lang: 'it-IT' },
        { voiceName: 'Google English', lang: 'en-US' },
      ]),
    ),
  },
  storage: {
    local: {
      get: vi.fn((keys) => {
        const result = {};
        for (const key of keys) {
          if (store[key] !== undefined) result[key] = store[key];
        }
        return Promise.resolve(result);
      }),
      set: vi.fn((data) => {
        Object.assign(store, JSON.parse(JSON.stringify(data)));
        return Promise.resolve();
      }),
    },
  },
  runtime: { lastError: null },
};

// Mock Logger
vi.mock('@utils/core/logger.js', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { TTSManager } from '@utils/voice/tts-manager.js';

describe('TTSManager', () => {
  let tts;

  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(store)) delete store[key];
    chrome.runtime.lastError = null;
    tts = new TTSManager();
  });

  // ─── Constructor & Init ───────────────────────────

  describe('constructor', () => {
    it('inizializza stato default', () => {
      expect(tts.isSpeaking).toBe(false);
      expect(tts.isPaused).toBe(false);
      expect(tts.currentUtterance).toBeNull();
      expect(tts.queue).toEqual([]);
    });

    it('config default con lingua it-IT', () => {
      expect(tts.config).toEqual({
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        lang: 'it-IT',
      });
    });
  });

  // ─── loadVoices ───────────────────────────────────

  describe('loadVoices', () => {
    it('carica voci disponibili da chrome.tts', async () => {
      const voices = await tts.loadVoices();
      expect(voices).toHaveLength(2);
      expect(tts.availableVoices).toHaveLength(2);
    });
  });

  // ─── loadPreferences / savePreferences ────────────

  describe('preferenze', () => {
    it('carica preferenze vuote se non salvate', async () => {
      await tts.loadPreferences();
      expect(tts.preferences).toEqual({});
    });

    it('carica preferenze salvate', async () => {
      store.ttsPreferences = { 'it-IT': 'Google italiano' };
      await tts.loadPreferences();
      expect(tts.preferences).toEqual({ 'it-IT': 'Google italiano' });
    });

    it('salva preferenze in chrome.storage', async () => {
      tts.preferences = { 'en-US': 'Google English' };
      await tts.savePreferences();
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        ttsPreferences: { 'en-US': 'Google English' },
      });
    });
  });

  // ─── setPreferredVoice / getPreferredVoice ────────

  describe('setPreferredVoice', () => {
    it('imposta e persiste voce preferita', async () => {
      tts.preferences = {};
      await tts.setPreferredVoice('it-IT', 'Google italiano');
      expect(tts.preferences['it-IT']).toBe('Google italiano');
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });
  });

  describe('getPreferredVoice', () => {
    it('ritorna voce se presente', () => {
      tts.preferences = { 'it-IT': 'Google italiano' };
      expect(tts.getPreferredVoice('it-IT')).toBe('Google italiano');
    });

    it('ritorna null se lingua non configurata', () => {
      tts.preferences = {};
      expect(tts.getPreferredVoice('fr-FR')).toBeNull();
    });
  });

  // ─── getVoicesForLanguage ─────────────────────────

  describe('getVoicesForLanguage', () => {
    it('filtra voci per lingua', () => {
      tts.availableVoices = [
        { voiceName: 'V1', lang: 'it-IT' },
        { voiceName: 'V2', lang: 'en-US' },
        { voiceName: 'V3', lang: 'it-CH' },
      ];
      const itVoices = tts.getVoicesForLanguage('it-IT');
      expect(itVoices).toHaveLength(2);
      expect(itVoices.map((v) => v.voiceName)).toEqual(['V1', 'V3']);
    });

    it('ritorna array vuoto se availableVoices è undefined', () => {
      tts.availableVoices = undefined;
      expect(tts.getVoicesForLanguage('it-IT')).toEqual([]);
    });
  });

  // ─── speak ────────────────────────────────────────

  describe('speak', () => {
    it('chiama chrome.tts.speak con testo pulito', () => {
      tts.speak('Ciao mondo');
      expect(chrome.tts.speak).toHaveBeenCalledWith(
        'Ciao mondo',
        expect.objectContaining({ lang: 'it-IT', rate: 1.0 }),
        expect.any(Function),
      );
      expect(tts.isSpeaking).toBe(true);
    });

    it('ignora testo vuoto', () => {
      tts.speak('');
      expect(chrome.tts.speak).not.toHaveBeenCalled();
    });

    it('ignora testo solo spazi', () => {
      tts.speak('   ');
      expect(chrome.tts.speak).not.toHaveBeenCalled();
    });

    it('usa lingua custom da options', () => {
      tts.speak('Hello', { lang: 'en-US' });
      expect(chrome.tts.speak).toHaveBeenCalledWith(
        'Hello',
        expect.objectContaining({ lang: 'en-US' }),
        expect.any(Function),
      );
    });

    it('usa voce specificata nelle options', () => {
      tts.speak('Test', { voiceName: 'CustomVoice' });
      expect(chrome.tts.speak).toHaveBeenCalledWith(
        'Test',
        expect.objectContaining({ voiceName: 'CustomVoice' }),
        expect.any(Function),
      );
    });

    it('usa voce preferita se non specificata', () => {
      tts.preferences = { 'it-IT': 'Google italiano' };
      tts.speak('Test');
      expect(chrome.tts.speak).toHaveBeenCalledWith(
        'Test',
        expect.objectContaining({ voiceName: 'Google italiano' }),
        expect.any(Function),
      );
    });

    it('dispatcha evento tts:started', () => {
      const handler = vi.fn();
      window.addEventListener('tts:started', handler);
      tts.speak('Ciao');
      expect(handler).toHaveBeenCalled();
      window.removeEventListener('tts:started', handler);
    });

    it('ferma lettura precedente prima di avviare nuova', () => {
      tts.isSpeaking = true;
      tts.speak('Nuovo testo');
      expect(chrome.tts.stop).toHaveBeenCalled();
    });

    it('gestisce chrome.runtime.lastError nel callback', () => {
      chrome.runtime.lastError = { message: 'TTS error' };
      chrome.tts.speak.mockImplementation((_t, _o, cb) => cb());
      tts.speak('Test');
      // handleError viene invocato, isSpeaking torna false
      expect(tts.isSpeaking).toBe(false);
    });
  });

  // ─── pause ────────────────────────────────────────

  describe('pause', () => {
    it('pausa se in riproduzione', () => {
      tts.isSpeaking = true;
      tts.isPaused = false;
      tts.pause();
      expect(chrome.tts.pause).toHaveBeenCalled();
      expect(tts.isPaused).toBe(true);
    });

    it('non fa nulla se non sta parlando', () => {
      tts.isSpeaking = false;
      tts.pause();
      expect(chrome.tts.pause).not.toHaveBeenCalled();
    });

    it('non fa nulla se già in pausa', () => {
      tts.isSpeaking = true;
      tts.isPaused = true;
      tts.pause();
      expect(chrome.tts.pause).not.toHaveBeenCalled();
    });
  });

  // ─── resume ───────────────────────────────────────

  describe('resume', () => {
    it('riprende se in pausa', () => {
      tts.isSpeaking = true;
      tts.isPaused = true;
      tts.resume();
      expect(chrome.tts.resume).toHaveBeenCalled();
      expect(tts.isPaused).toBe(false);
    });

    it('non fa nulla se non in pausa', () => {
      tts.isSpeaking = true;
      tts.isPaused = false;
      tts.resume();
      expect(chrome.tts.resume).not.toHaveBeenCalled();
    });
  });

  // ─── stop ─────────────────────────────────────────

  describe('stop', () => {
    it('ferma lettura e resetta stato', () => {
      tts.isSpeaking = true;
      tts.isPaused = true;
      tts.currentUtterance = { text: 'test' };
      tts.stop();
      expect(chrome.tts.stop).toHaveBeenCalled();
      expect(tts.isSpeaking).toBe(false);
      expect(tts.isPaused).toBe(false);
      expect(tts.currentUtterance).toBeNull();
    });

    it('dispatcha evento tts:stopped', () => {
      const handler = vi.fn();
      window.addEventListener('tts:stopped', handler);
      tts.isSpeaking = true;
      tts.stop();
      expect(handler).toHaveBeenCalled();
      window.removeEventListener('tts:stopped', handler);
    });

    it('non fa nulla se non sta parlando', () => {
      tts.isSpeaking = false;
      tts.stop();
      expect(chrome.tts.stop).not.toHaveBeenCalled();
    });
  });

  // ─── cleanText ────────────────────────────────────

  describe('cleanText', () => {
    it('rimuove tag HTML', () => {
      expect(tts.cleanText('<b>Bold</b> text')).toBe('Bold text');
    });

    it('converte &nbsp; in spazio', () => {
      expect(tts.cleanText('Hello&nbsp;World')).toBe('Hello World');
    });

    it('rimuove entità HTML', () => {
      expect(tts.cleanText('A &amp; B &lt; C')).toBe('A B C');
    });

    it('normalizza spazi multipli', () => {
      expect(tts.cleanText('Ciao    mondo')).toBe('Ciao mondo');
    });

    it('rimuove caratteri markdown', () => {
      expect(tts.cleanText('**bold** _italic_ ~strike~ `code`')).toBe('bold italic strike code');
    });

    it('fa trim del risultato', () => {
      expect(tts.cleanText('  spazi  ')).toBe('spazi');
    });
  });

  // ─── handleTTSEvent ───────────────────────────────

  describe('handleTTSEvent', () => {
    it('end: resetta stato e dispatcha tts:ended', () => {
      const handler = vi.fn();
      window.addEventListener('tts:ended', handler);
      tts.isSpeaking = true;
      tts.isPaused = true;
      tts.handleTTSEvent({ type: 'end' });
      expect(tts.isSpeaking).toBe(false);
      expect(tts.isPaused).toBe(false);
      expect(handler).toHaveBeenCalled();
      window.removeEventListener('tts:ended', handler);
    });

    it('error: invoca handleError', () => {
      const spy = vi.spyOn(tts, 'handleError');
      tts.handleTTSEvent({ type: 'error', message: 'fail' });
      expect(spy).toHaveBeenCalled();
    });
  });

  // ─── handleError ──────────────────────────────────

  describe('handleError', () => {
    it('resetta stato e dispatcha tts:error', () => {
      const handler = vi.fn();
      window.addEventListener('tts:error', handler);
      tts.isSpeaking = true;
      tts.isPaused = true;
      tts.handleError({ message: 'test error' });
      expect(tts.isSpeaking).toBe(false);
      expect(tts.isPaused).toBe(false);
      expect(handler).toHaveBeenCalled();
      window.removeEventListener('tts:error', handler);
    });
  });

  // ─── getState ─────────────────────────────────────

  describe('getState', () => {
    it('ritorna stato corrente', () => {
      expect(tts.getState()).toEqual({
        isSpeaking: false,
        isPaused: false,
        currentText: null,
      });
    });

    it('ritorna testo corrente se in lettura', () => {
      tts.isSpeaking = true;
      tts.currentUtterance = { text: 'Ciao' };
      expect(tts.getState().currentText).toBe('Ciao');
    });
  });

  // ─── updateConfig ─────────────────────────────────

  describe('updateConfig', () => {
    it('merge nuova config con esistente', () => {
      tts.updateConfig({ rate: 1.5, lang: 'en-US' });
      expect(tts.config.rate).toBe(1.5);
      expect(tts.config.lang).toBe('en-US');
      expect(tts.config.pitch).toBe(1.0); // non modificato
    });
  });

  // ─── getAvailableVoices ───────────────────────────

  describe('getAvailableVoices', () => {
    it('ritorna voci da chrome.tts.getVoices', async () => {
      const voices = await tts.getAvailableVoices();
      expect(voices).toHaveLength(2);
      expect(voices[0].voiceName).toBe('Google italiano');
    });
  });
});
