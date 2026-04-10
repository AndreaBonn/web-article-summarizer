import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock delle dipendenze prima degli import del modulo sotto test
vi.mock('@utils/core/logger.js', () => ({
  Logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@utils/security/input-sanitizer.js', () => ({
  InputSanitizer: {
    sanitizeForAI: vi.fn((text) => text),
  },
}));

// Mock delle dipendenze non sotto test
vi.mock('@utils/ai/api-client.js', () => ({
  APIClient: {
    generateCompletion: vi.fn(),
    detectContentType: vi.fn(() => 'general'),
  },
}));

vi.mock('@utils/ai/prompt-registry.js', () => ({
  PromptRegistry: {
    getTranslationSystemPrompt: vi.fn(() => 'translation system prompt'),
  },
}));

import { Translator } from '@utils/core/translator.js';
import { InputSanitizer } from '@utils/security/input-sanitizer.js';

// ---------------------------------------------------------------------------
// Fixture comuni
// ---------------------------------------------------------------------------

const makeArticle = (overrides = {}) => ({
  title: 'Titolo articolo di test',
  paragraphs: [
    { text: 'Primo paragrafo con contenuto sufficiente.' },
    { text: 'Secondo paragrafo con ulteriori dettagli.' },
  ],
  ...overrides,
});

// ---------------------------------------------------------------------------
// buildUserPrompt — tipi di contenuto
// ---------------------------------------------------------------------------

describe('Translator.buildUserPrompt()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    InputSanitizer.sanitizeForAI.mockImplementation((text) => text);
  });

  describe('tipo general', () => {
    it('test_buildUserPrompt_tipoGeneral_contieneIstruzioniTraduzioneGenerale', () => {
      const prompt = Translator.buildUserPrompt(makeArticle(), 'it', 'general');

      expect(prompt).toContain('Traduci il seguente articolo in');
      expect(prompt).toContain('Traduci TUTTO il contenuto senza omettere nulla');
    });

    it('test_buildUserPrompt_tipoGeneral_contieneTitoloArticolo', () => {
      const article = makeArticle({ title: 'Mio Articolo Speciale' });
      const prompt = Translator.buildUserPrompt(article, 'en', 'general');

      expect(prompt).toContain('Mio Articolo Speciale');
    });

    it('test_buildUserPrompt_tipoGeneral_contieneParagrafiArticolo', () => {
      const article = makeArticle();
      const prompt = Translator.buildUserPrompt(article, 'en', 'general');

      expect(prompt).toContain('Primo paragrafo con contenuto sufficiente.');
      expect(prompt).toContain('Secondo paragrafo con ulteriori dettagli.');
    });
  });

  describe('tipo tutorial', () => {
    it('test_buildUserPrompt_tipoTutorial_contieneIstruzioniTutorial', () => {
      const prompt = Translator.buildUserPrompt(makeArticle(), 'en', 'tutorial');

      expect(prompt).toContain('tutorial/guida tecnica');
      expect(prompt).toContain('NON tradurre: codice, comandi');
    });

    it('test_buildUserPrompt_tipoTutorial_menzionePreservazioneCodice', () => {
      const prompt = Translator.buildUserPrompt(makeArticle(), 'fr', 'tutorial');

      expect(prompt).toContain('blocchi di codice');
    });
  });

  describe('tipo scientific', () => {
    it('test_buildUserPrompt_tipoScientific_contieneIstruzioniScientifiche', () => {
      const prompt = Translator.buildUserPrompt(makeArticle(), 'de', 'scientific');

      expect(prompt).toContain('articolo scientifico');
      expect(prompt).toContain('precisione terminologica');
    });

    it('test_buildUserPrompt_tipoScientific_menzionePreservazioneStatistiche', () => {
      const prompt = Translator.buildUserPrompt(makeArticle(), 'en', 'scientific');

      expect(prompt).toContain('dati numerici, statistiche');
    });
  });

  describe('tipo news', () => {
    it('test_buildUserPrompt_tipoNews_contieneIstruzioniGiornalistiche', () => {
      const prompt = Translator.buildUserPrompt(makeArticle(), 'es', 'news');

      expect(prompt).toContain('articolo giornalistico');
      expect(prompt).toContain('riferimenti temporali');
    });

    it('test_buildUserPrompt_tipoNews_menzioneNeutrality', () => {
      const prompt = Translator.buildUserPrompt(makeArticle(), 'fr', 'news');

      expect(prompt).toContain('obiettività e neutralità');
    });
  });

  describe('tipo business', () => {
    it('test_buildUserPrompt_tipoBusiness_contieneIstruzioniBusiness', () => {
      const prompt = Translator.buildUserPrompt(makeArticle(), 'en', 'business');

      expect(prompt).toContain('contenuto business');
      expect(prompt).toContain('terminologia business');
    });

    it('test_buildUserPrompt_tipoBusiness_menzionePreservazioneSigle', () => {
      const prompt = Translator.buildUserPrompt(makeArticle(), 'de', 'business');

      expect(prompt).toContain('KPI');
      expect(prompt).toContain('ROI');
      expect(prompt).toContain('EBITDA');
    });
  });

  describe('tipo opinion', () => {
    it('test_buildUserPrompt_tipoOpinion_contieneIstruzioniOpinione', () => {
      const prompt = Translator.buildUserPrompt(makeArticle(), 'it', 'opinion');

      expect(prompt).toContain('articolo di opinione');
      expect(prompt).toContain('stile personale e unico');
    });

    it('test_buildUserPrompt_tipoOpinion_menzioneTono', () => {
      const prompt = Translator.buildUserPrompt(makeArticle(), 'es', 'opinion');

      expect(prompt).toContain('ironico');
      expect(prompt).toContain('polemico');
    });
  });

  describe('nomi lingua dalla mappa LANGUAGE_NAMES', () => {
    it('test_buildUserPrompt_linguaIt_usaItaliano', () => {
      const prompt = Translator.buildUserPrompt(makeArticle(), 'it', 'general');

      expect(prompt).toContain('Italiano');
    });

    it('test_buildUserPrompt_linguaEn_usaEnglish', () => {
      const prompt = Translator.buildUserPrompt(makeArticle(), 'en', 'general');

      expect(prompt).toContain('English');
    });

    it('test_buildUserPrompt_linguaEs_usaEspanol', () => {
      const prompt = Translator.buildUserPrompt(makeArticle(), 'es', 'general');

      expect(prompt).toContain('Español');
    });

    it('test_buildUserPrompt_linguaFr_usaFrancais', () => {
      const prompt = Translator.buildUserPrompt(makeArticle(), 'fr', 'general');

      expect(prompt).toContain('Français');
    });

    it('test_buildUserPrompt_linguaDe_usaDeutsch', () => {
      const prompt = Translator.buildUserPrompt(makeArticle(), 'de', 'general');

      expect(prompt).toContain('Deutsch');
    });

    it('test_buildUserPrompt_linguaSconosciuta_usaCodiceLinguaAsIs', () => {
      // LANGUAGE_NAMES non ha 'ja', quindi usa il codice direttamente
      const prompt = Translator.buildUserPrompt(makeArticle(), 'ja', 'general');

      expect(prompt).toContain('ja');
    });
  });

  describe('sanitizzazione del titolo con InputSanitizer', () => {
    it('test_buildUserPrompt_titoloNormale_chiamaSanitizeForAI', () => {
      const article = makeArticle({ title: 'Titolo originale' });
      Translator.buildUserPrompt(article, 'en', 'general');

      expect(InputSanitizer.sanitizeForAI).toHaveBeenCalledWith(
        'Titolo originale',
        expect.objectContaining({ maxLength: 500, removeHTML: true }),
      );
    });

    it('test_buildUserPrompt_titolo_sanitizzeraHtmlTag', () => {
      InputSanitizer.sanitizeForAI.mockImplementation((text) =>
        text.replace(/<[^>]*>/g, ''),
      );
      const article = makeArticle({ title: '<b>Titolo</b> con tag HTML' });
      const prompt = Translator.buildUserPrompt(article, 'en', 'general');

      expect(prompt).toContain('Titolo con tag HTML');
      expect(prompt).not.toContain('<b>');
    });

    it('test_buildUserPrompt_sanitizeForAILanciaErrore_usaFallbackSubstring', () => {
      InputSanitizer.sanitizeForAI.mockImplementationOnce(() => {
        throw new Error('Input non valido');
      });
      const article = makeArticle({ title: 'Titolo fallback test' });

      // Non deve lanciare eccezione
      expect(() => Translator.buildUserPrompt(article, 'en', 'general')).not.toThrow();
      const prompt = Translator.buildUserPrompt(article, 'en', 'general');
      expect(prompt).toContain('Titolo fallback test');
    });
  });

  describe('paragraphs sanitizzati e inclusi', () => {
    it('test_buildUserPrompt_paragraphiMultipli_tuttiInclusiNelPrompt', () => {
      const article = makeArticle({
        paragraphs: [
          { text: 'Paragrafo Alpha con testo.' },
          { text: 'Paragrafo Beta con altri dati.' },
          { text: 'Paragrafo Gamma finale.' },
        ],
      });
      const prompt = Translator.buildUserPrompt(article, 'en', 'general');

      expect(prompt).toContain('Paragrafo Alpha');
      expect(prompt).toContain('Paragrafo Beta');
      expect(prompt).toContain('Paragrafo Gamma');
    });

    it('test_buildUserPrompt_paragraphiSanitizzati_chiamaSanitizePerOgniParagrafo', () => {
      const article = makeArticle({
        paragraphs: [{ text: 'Primo testo.' }, { text: 'Secondo testo.' }],
      });
      Translator.buildUserPrompt(article, 'en', 'general');

      // Una call per il titolo + una per ogni paragrafo = 3 totali
      expect(InputSanitizer.sanitizeForAI).toHaveBeenCalledTimes(3);
    });
  });

  describe('fallback a template general per contentType sconosciuto', () => {
    it('test_buildUserPrompt_contentTypeSconosciuto_usaTemplateGeneral', () => {
      const prompt = Translator.buildUserPrompt(makeArticle(), 'en', 'unknownType');
      const promptGeneral = Translator.buildUserPrompt(makeArticle(), 'en', 'general');

      expect(prompt).toBe(promptGeneral);
    });

    it('test_buildUserPrompt_contentTypeNull_usaTemplateGeneral', () => {
      const promptNull = Translator.buildUserPrompt(makeArticle(), 'en', null);
      const promptGeneral = Translator.buildUserPrompt(makeArticle(), 'en', 'general');

      expect(promptNull).toBe(promptGeneral);
    });

    it('test_buildUserPrompt_contentTypeUndefined_usaTemplateGeneral', () => {
      const promptUndefined = Translator.buildUserPrompt(makeArticle(), 'en', undefined);
      const promptGeneral = Translator.buildUserPrompt(makeArticle(), 'en', 'general');

      expect(promptUndefined).toBe(promptGeneral);
    });
  });
});
