import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Chrome APIs
global.chrome = {
  storage: { local: { get: vi.fn(), set: vi.fn() } },
  runtime: { id: 'test-id' },
};

// Mock APIClient to avoid real API calls
vi.mock('../src/utils/ai/api-client.js', () => ({
  APIClient: {
    generateCompletion: vi.fn(),
  },
}));

const { AdvancedAnalysis } = await import('../../src/utils/ai/advanced-analysis.js');

describe('AdvancedAnalysis', () => {
  const mockArticle = {
    title: 'Test Article',
    paragraphs: [
      { id: 1, text: 'First paragraph content.' },
      { id: 2, text: 'Second paragraph content.' },
      { id: 3, text: 'Third paragraph content.' },
    ],
  };
  const mockSummary = 'This is a test summary.';

  describe('buildQAPrompt', () => {
    it('test_buildQAPrompt_italian_contains_correct_labels', () => {
      const result = AdvancedAnalysis.buildQAPrompt('Domanda?', mockArticle, mockSummary, 'it');

      expect(result).toContain('# ARTICOLO');
      expect(result).toContain('# RIASSUNTO');
      expect(result).toContain('# DOMANDA');
      expect(result).toContain('Domanda?');
      expect(result).toContain('This is a test summary.');
    });

    it('test_buildQAPrompt_english_contains_correct_labels', () => {
      const result = AdvancedAnalysis.buildQAPrompt('Question?', mockArticle, mockSummary, 'en');

      expect(result).toContain('# ARTICLE');
      expect(result).toContain('# SUMMARY');
      expect(result).toContain('# QUESTION');
      expect(result).toContain('Question?');
    });

    it('test_buildQAPrompt_spanish_contains_correct_labels', () => {
      const result = AdvancedAnalysis.buildQAPrompt('Pregunta?', mockArticle, mockSummary, 'es');
      expect(result).toContain('# ARTÍCULO');
      expect(result).toContain('# RESUMEN');
    });

    it('test_buildQAPrompt_french_contains_correct_labels', () => {
      const result = AdvancedAnalysis.buildQAPrompt('Question?', mockArticle, mockSummary, 'fr');
      expect(result).toContain('# RÉSUMÉ');
    });

    it('test_buildQAPrompt_german_contains_correct_labels', () => {
      const result = AdvancedAnalysis.buildQAPrompt('Frage?', mockArticle, mockSummary, 'de');
      expect(result).toContain('# ARTIKEL');
      expect(result).toContain('# ZUSAMMENFASSUNG');
      expect(result).toContain('# FRAGE');
    });

    it('test_buildQAPrompt_unknown_language_falls_back_to_italian', () => {
      const result = AdvancedAnalysis.buildQAPrompt('Q?', mockArticle, mockSummary, 'zh');
      expect(result).toContain('# ARTICOLO');
      expect(result).toContain('# RIASSUNTO');
    });

    it('test_buildQAPrompt_includes_numbered_paragraphs', () => {
      const result = AdvancedAnalysis.buildQAPrompt('Q?', mockArticle, mockSummary, 'it');

      expect(result).toContain('§1: First paragraph content.');
      expect(result).toContain('§2: Second paragraph content.');
      expect(result).toContain('§3: Third paragraph content.');
    });

    it('test_buildQAPrompt_includes_article_title', () => {
      const result = AdvancedAnalysis.buildQAPrompt('Q?', mockArticle, mockSummary, 'it');
      expect(result).toContain('**Titolo:** Test Article');
    });

    it('test_buildQAPrompt_includes_instruction', () => {
      const result = AdvancedAnalysis.buildQAPrompt('Q?', mockArticle, mockSummary, 'en');
      expect(result).toContain('Answer the question based on the article content');
      expect(result).toContain('§N');
    });
  });

  describe('getQASystemPrompt', () => {
    it('test_getQASystemPrompt_returns_string_for_each_provider', () => {
      for (const provider of ['groq', 'openai', 'anthropic', 'gemini']) {
        const prompt = AdvancedAnalysis.getQASystemPrompt(provider, 'it');
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(100);
      }
    });

    it('test_getQASystemPrompt_italian_contains_italian_instructions', () => {
      const prompt = AdvancedAnalysis.getQASystemPrompt('groq', 'it');
      expect(prompt).toContain('italiano');
    });

    it('test_getQASystemPrompt_english_contains_english_instructions', () => {
      const prompt = AdvancedAnalysis.getQASystemPrompt('openai', 'en');
      expect(prompt).toContain('English');
    });

    it('test_getQASystemPrompt_unknown_provider_falls_back_to_groq', () => {
      const prompt = AdvancedAnalysis.getQASystemPrompt('unknown', 'it');
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(50);
    });

    it('test_getQASystemPrompt_generates_es_fr_de_from_en', () => {
      const esPrompt = AdvancedAnalysis.getQASystemPrompt('groq', 'es');
      expect(esPrompt).toContain('español');

      const frPrompt = AdvancedAnalysis.getQASystemPrompt('groq', 'fr');
      expect(frPrompt).toContain('français');

      const dePrompt = AdvancedAnalysis.getQASystemPrompt('groq', 'de');
      expect(dePrompt).toContain('Deutsch');
    });
  });
});
