import { describe, it, expect } from 'vitest';
import { getSummaryPrompt } from '@utils/ai/prompts/summary-prompts.js';

describe('getSummaryPrompt()', () => {
  const providers = ['gemini', 'groq', 'openai', 'anthropic'];
  const contentTypes = ['general', 'scientific', 'news', 'tutorial', 'business', 'opinion'];

  describe('provider validi — general', () => {
    it.each(providers)('test_getSummaryPrompt_%s_general_returnsNonEmptyString', (provider) => {
      const result = getSummaryPrompt(provider, 'general');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(100);
    });
  });

  describe('content type specifici', () => {
    it.each(contentTypes)(
      'test_getSummaryPrompt_openai_%s_returnsSpecificPrompt',
      (contentType) => {
        const result = getSummaryPrompt('openai', contentType);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(50);
      }
    );
  });

  describe('provider sconosciuto', () => {
    it('test_getSummaryPrompt_unknownProvider_fallsBackToOpenaiGeneral', () => {
      const result = getSummaryPrompt('unknown-provider', 'general');
      const openaiGeneral = getSummaryPrompt('openai', 'general');
      expect(result).toBe(openaiGeneral);
    });

    it('test_getSummaryPrompt_undefinedProvider_fallsBackToOpenaiGeneral', () => {
      const result = getSummaryPrompt(undefined, 'general');
      const openaiGeneral = getSummaryPrompt('openai', 'general');
      expect(result).toBe(openaiGeneral);
    });
  });

  describe('content type sconosciuto', () => {
    it.each(providers)(
      'test_getSummaryPrompt_%s_unknownContentType_fallsBackToGeneral',
      (provider) => {
        const result = getSummaryPrompt(provider, 'nonexistent-type');
        const generalResult = getSummaryPrompt(provider, 'general');
        expect(result).toBe(generalResult);
      }
    );
  });

  describe('differenziazione lingua per provider', () => {
    it('test_getSummaryPrompt_gemini_general_isInItalian', () => {
      const result = getSummaryPrompt('gemini', 'general');
      expect(result).toContain('esperto analista di contenuti');
    });

    it('test_getSummaryPrompt_groq_general_isInItalian', () => {
      const result = getSummaryPrompt('groq', 'general');
      expect(result).toContain('esperto analista di contenuti');
    });

    it('test_getSummaryPrompt_openai_general_isInEnglish', () => {
      const result = getSummaryPrompt('openai', 'general');
      expect(result).toContain('expert content analyst');
    });

    it('test_getSummaryPrompt_anthropic_general_isInEnglish', () => {
      const result = getSummaryPrompt('anthropic', 'general');
      expect(result).toContain('expert content analyst');
    });
  });

  describe('content type specifici — keyword check', () => {
    it('test_getSummaryPrompt_openai_scientific_containsMethodology', () => {
      const result = getSummaryPrompt('openai', 'scientific');
      expect(result).toContain('Methodology');
      expect(result).toContain('statistical significance');
    });

    it('test_getSummaryPrompt_gemini_news_contains5W1H', () => {
      const result = getSummaryPrompt('gemini', 'news');
      expect(result).toContain('5W1H');
      expect(result).toContain('obiettività giornalistica');
    });

    it('test_getSummaryPrompt_openai_tutorial_containsPrerequisites', () => {
      const result = getSummaryPrompt('openai', 'tutorial');
      expect(result).toContain('Prerequisites');
      expect(result).toContain('Step-by-step');
    });

    it('test_getSummaryPrompt_openai_business_containsKPI', () => {
      const result = getSummaryPrompt('openai', 'business');
      expect(result).toContain('KPI');
      expect(result).toContain('ROI');
    });

    it('test_getSummaryPrompt_openai_opinion_containsThesis', () => {
      const result = getSummaryPrompt('openai', 'opinion');
      expect(result).toContain('thesis');
      expect(result).toContain('Counter-arguments');
    });
  });

  describe('istruzione "inizia direttamente"', () => {
    it.each(providers)(
      'test_getSummaryPrompt_%s_scientific_containsDirectStartInstruction',
      (provider) => {
        const result = getSummaryPrompt(provider, 'scientific');
        const hasDirectStart =
          result.includes('Inizia DIRETTAMENTE') || result.includes('Start DIRECTLY');
        expect(hasDirectStart).toBe(true);
      }
    );
  });

  describe('ogni provider ha tutti i content type distinti', () => {
    it.each(providers)(
      'test_getSummaryPrompt_%s_allContentTypes_returnDistinctPrompts',
      (provider) => {
        const prompts = contentTypes.map((ct) => getSummaryPrompt(provider, ct));
        const uniquePrompts = new Set(prompts);
        expect(uniquePrompts.size).toBe(contentTypes.length);
      }
    );
  });
});
