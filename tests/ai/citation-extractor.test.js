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

vi.mock('@utils/ai/json-repair.js', () => ({
  parseLLMJson: vi.fn(),
}));

vi.mock('@utils/ai/citation-matcher.js', () => ({
  CitationMatcher: {
    findParagraphForCitation: vi.fn(),
  },
}));

// Mock delle dipendenze non sotto test
vi.mock('@utils/ai/prompt-registry.js', () => ({
  PromptRegistry: {
    getCitationSystemPrompt: vi.fn(() => 'system prompt'),
  },
}));

vi.mock('@utils/ai/api-orchestrator.js', () => ({
  APIOrchestrator: {
    generateCompletion: vi.fn(),
  },
}));

vi.mock('@utils/ai/citation-formatter.js', () => ({
  CitationFormatter: {
    formatCitation: vi.fn(),
    generateBibliography: vi.fn(),
    getCitationTypeLabel: vi.fn(),
  },
}));

import { CitationExtractor } from '@utils/ai/citation-extractor.js';
import { parseLLMJson } from '@utils/ai/json-repair.js';
import { CitationMatcher } from '@utils/ai/citation-matcher.js';

// ---------------------------------------------------------------------------
// Fixture comuni
// ---------------------------------------------------------------------------

const ARTICLE_COMPLETO = {
  title: 'Intelligenza Artificiale nel 2024',
  author: 'Mario Rossi',
  siteName: 'TechNews',
  publishedDate: '2024-01-15',
  content:
    'Primo paragrafo sul tema.\n\nSecondo paragrafo con dati.\n\nTerzo paragrafo conclusivo.',
};

const ARTICLE_CON_PARAGRAPHS = {
  title: 'Studio sui Modelli LLM',
  author: 'Giulia Bianchi',
  paragraphs: [{ text: 'Introduzione allo studio.' }, { text: 'Metodologia della ricerca.' }],
};

// ---------------------------------------------------------------------------
// getUserPrompt
// ---------------------------------------------------------------------------

describe('CitationExtractor.getUserPrompt()', () => {
  describe('article valido con content', () => {
    it('test_getUserPrompt_articleConContent_contieneParagrafiNumerati', () => {
      const prompt = CitationExtractor.getUserPrompt(ARTICLE_COMPLETO);

      expect(prompt).toContain('§1:');
      expect(prompt).toContain('§2:');
      expect(prompt).toContain('§3:');
    });

    it('test_getUserPrompt_articleConContent_contieneMetadatiArticolo', () => {
      const prompt = CitationExtractor.getUserPrompt(ARTICLE_COMPLETO);

      expect(prompt).toContain('Intelligenza Artificiale nel 2024');
      expect(prompt).toContain('Mario Rossi');
      expect(prompt).toContain('TechNews');
      expect(prompt).toContain('2024-01-15');
    });

    it('test_getUserPrompt_articleConContent_contieneSezioneTitoloAnalisi', () => {
      const prompt = CitationExtractor.getUserPrompt(ARTICLE_COMPLETO);

      expect(prompt).toContain('ARTICOLO DA ANALIZZARE PER CITAZIONI');
    });

    it('test_getUserPrompt_articleConContent_contieneFormatoJSONRichiesto', () => {
      const prompt = CitationExtractor.getUserPrompt(ARTICLE_COMPLETO);

      expect(prompt).toContain('"citations"');
      expect(prompt).toContain('"article_metadata"');
      expect(prompt).toContain('"total_citations"');
    });

    it('test_getUserPrompt_articleConContent_contieneTipiCitazioneValidi', () => {
      const prompt = CitationExtractor.getUserPrompt(ARTICLE_COMPLETO);

      expect(prompt).toContain('direct_quote');
      expect(prompt).toContain('study_reference');
      expect(prompt).toContain('statistic');
    });

    it('test_getUserPrompt_articleConParagraphs_generaPromptDaArray', () => {
      const prompt = CitationExtractor.getUserPrompt(ARTICLE_CON_PARAGRAPHS);

      expect(prompt).toContain('§1:');
      expect(prompt).toContain('Introduzione allo studio.');
      expect(prompt).toContain('§2:');
      expect(prompt).toContain('Metodologia della ricerca.');
    });

    it('test_getUserPrompt_articleSenzaAutore_usaFallbackNA', () => {
      const article = { ...ARTICLE_COMPLETO, author: undefined };
      const prompt = CitationExtractor.getUserPrompt(article);

      expect(prompt).toContain('**Autore:** N/A');
    });

    it('test_getUserPrompt_articleConByline_usaBylineComeFallback', () => {
      const article = { ...ARTICLE_COMPLETO, author: undefined, byline: 'Luca Verdi' };
      const prompt = CitationExtractor.getUserPrompt(article);

      expect(prompt).toContain('Luca Verdi');
    });

    it('test_getUserPrompt_articleSenzaSiteName_usaFallbackNA', () => {
      const article = {
        title: 'Test',
        content: 'Contenuto paragrafo unico.',
      };
      const prompt = CitationExtractor.getUserPrompt(article);

      expect(prompt).toContain('**Pubblicazione:** N/A');
    });
  });

  describe('article senza content', () => {
    it('test_getUserPrompt_articleSenzaContentNeParagraphs_lanciaErrore', () => {
      const article = { title: 'Titolo', author: 'Autore' };

      expect(() => CitationExtractor.getUserPrompt(article)).toThrow(
        "Nessun contenuto trovato nell'articolo",
      );
    });

    it('test_getUserPrompt_articleNull_lanciaErrore', () => {
      expect(() => CitationExtractor.getUserPrompt(null)).toThrow('Oggetto article non valido');
    });

    it('test_getUserPrompt_articleNonOggetto_lanciaErrore', () => {
      expect(() => CitationExtractor.getUserPrompt('stringa')).toThrow(
        'Oggetto article non valido',
      );
    });

    it('test_getUserPrompt_articleContentVuoto_filtratoParagrafiVuoti', () => {
      // Content con soli separatori, nessun paragrafo reale
      const article = { title: 'Test', content: '\n\n\n\n' };

      expect(() => CitationExtractor.getUserPrompt(article)).not.toThrow();
      const prompt = CitationExtractor.getUserPrompt(article);
      // Nessun paragrafo numerato dato che tutto è whitespace
      expect(prompt).not.toContain('§1:');
    });
  });
});

// ---------------------------------------------------------------------------
// parseCitations
// ---------------------------------------------------------------------------

describe('CitationExtractor.parseCitations()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: findParagraphForCitation restituisce il paragrafo originale
    CitationMatcher.findParagraphForCitation.mockImplementation((citation) => citation.paragraph);
  });

  describe('risposta JSON valida', () => {
    it('test_parseCitations_jsonValido_restituisceStrutturaCorretta', () => {
      const citazione = {
        id: 1,
        type: 'study_reference',
        quote_text: 'Studio sulla AI di OpenAI',
        author: 'Altman, Sam',
        source: 'OpenAI Blog',
        year: '2024',
        context: 'Citato per dati sui modelli',
        paragraph: '2',
      };
      parseLLMJson.mockReturnValue({
        article_metadata: { title: 'Test', author: 'Autore', publication: 'Sito', date: '2024' },
        total_citations: 1,
        citations: [citazione],
      });

      const result = CitationExtractor.parseCitations('{"raw": "response"}', ARTICLE_COMPLETO);

      expect(result).toHaveProperty('article_metadata');
      expect(result).toHaveProperty('total_citations', 1);
      expect(result).toHaveProperty('citations');
      expect(result).toHaveProperty('extractedAt');
      expect(result.citations).toHaveLength(1);
    });

    it('test_parseCitations_jsonValido_aggiungeExtractedAt', () => {
      parseLLMJson.mockReturnValue({ citations: [], total_citations: 0 });

      const result = CitationExtractor.parseCitations('{}', ARTICLE_COMPLETO);

      expect(result.extractedAt).toBeDefined();
      // Verifica che sia una stringa ISO valida
      expect(() => new Date(result.extractedAt)).not.toThrow();
      expect(new Date(result.extractedAt).toISOString()).toBe(result.extractedAt);
    });

    it('test_parseCitations_citazioniConParagrafo_chiamaFindParagraphPerOgniCitazione', () => {
      const citazioni = [
        { id: 1, quote_text: 'Prima citazione', paragraph: '1' },
        { id: 2, quote_text: 'Seconda citazione', paragraph: '3' },
      ];
      parseLLMJson.mockReturnValue({ citations: citazioni, total_citations: 2 });

      CitationExtractor.parseCitations('{}', ARTICLE_COMPLETO);

      expect(CitationMatcher.findParagraphForCitation).toHaveBeenCalledTimes(2);
    });

    it('test_parseCitations_paragrafoCitazioneCorretto_aggiornaIlParagrafo', () => {
      const citazione = { id: 1, quote_text: 'Testo citazione', paragraph: '1' };
      parseLLMJson.mockReturnValue({ citations: [citazione], total_citations: 1 });
      CitationMatcher.findParagraphForCitation.mockReturnValue('3');

      const result = CitationExtractor.parseCitations('{}', ARTICLE_COMPLETO);

      expect(result.citations[0].paragraph).toBe('3');
      // Conserva il paragrafo originale per debug
      expect(result.citations[0].originalParagraph).toBe('1');
    });
  });

  describe('citazioni vuote', () => {
    it('test_parseCitations_citazioniVuote_restituisceArrayVuoto', () => {
      parseLLMJson.mockReturnValue({
        article_metadata: { title: 'Test' },
        total_citations: 0,
        citations: [],
      });

      const result = CitationExtractor.parseCitations('{}', ARTICLE_COMPLETO);

      expect(result.citations).toEqual([]);
      expect(result.total_citations).toBe(0);
    });

    it('test_parseCitations_rispostaJsonSenzaCitations_inizializzaArrayVuoto', () => {
      // parseLLMJson restituisce oggetto senza campo citations
      parseLLMJson.mockReturnValue({ total_citations: 0 });

      const result = CitationExtractor.parseCitations('{}', ARTICLE_COMPLETO);

      expect(result.citations).toEqual([]);
    });
  });

  describe('normalizzazione quote_text', () => {
    it('test_parseCitations_citazioneSenzaQuoteText_usaContextComeFallback', () => {
      const citazione = {
        id: 1,
        type: 'study_reference',
        context: 'Studio di riferimento importante',
        source: 'Nature',
        paragraph: '2',
        // quote_text mancante
      };
      parseLLMJson.mockReturnValue({ citations: [citazione] });

      const result = CitationExtractor.parseCitations('{}', ARTICLE_COMPLETO);

      expect(result.citations[0].quote_text).toBe('Studio di riferimento importante');
    });

    it('test_parseCitations_citazioneSenzaQuoteTextNéContext_usaFallbackConSource', () => {
      const citazione = {
        id: 1,
        source: 'Nature',
        author: 'Darwin, C.',
        paragraph: '1',
        // quote_text e context mancanti
      };
      parseLLMJson.mockReturnValue({ citations: [citazione] });

      const result = CitationExtractor.parseCitations('{}', ARTICLE_COMPLETO);

      expect(result.citations[0].quote_text).toContain('Nature');
    });

    it('test_parseCitations_citazioneConSoloCampoText_normalizzaInQuoteText', () => {
      const citazione = {
        id: 1,
        text: 'Testo nel campo text',
        paragraph: '2',
        // quote_text assente, ma text presente
      };
      parseLLMJson.mockReturnValue({ citations: [citazione] });

      const result = CitationExtractor.parseCitations('{}', ARTICLE_COMPLETO);

      expect(result.citations[0].quote_text).toBe('Testo nel campo text');
    });
  });

  describe('metadati articolo fallback', () => {
    it('test_parseCitations_senzaArticleMetadata_usaMetadatiDaArticle', () => {
      parseLLMJson.mockReturnValue({ citations: [] });
      // Nessun article_metadata nella risposta parsata

      const result = CitationExtractor.parseCitations('{}', ARTICLE_COMPLETO);

      expect(result.article_metadata.title).toBe(ARTICLE_COMPLETO.title);
      expect(result.article_metadata.author).toBe(ARTICLE_COMPLETO.author);
    });
  });

  describe('JSON malformato', () => {
    it('test_parseCitations_jsonMalformato_lanciaErrore', () => {
      parseLLMJson.mockImplementation(() => {
        throw new Error('No valid JSON found');
      });

      expect(() => CitationExtractor.parseCitations('testo non json', ARTICLE_COMPLETO)).toThrow(
        'Errore nel parsing delle citazioni',
      );
    });

    it('test_parseCitations_erroreParseLLMJson_messaggioErroreIncludeOriginale', () => {
      parseLLMJson.mockImplementation(() => {
        throw new Error('Unbalanced brackets');
      });

      expect(() => CitationExtractor.parseCitations('{{malformed', ARTICLE_COMPLETO)).toThrow(
        'Unbalanced brackets',
      );
    });
  });
});
