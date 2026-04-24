import { describe, it, expect } from 'vitest';
import { getKeyPointsPrompt } from '@utils/ai/prompts/keypoints-prompts.js';

describe('getKeyPointsPrompt()', () => {
  const providers = ['gemini', 'groq', 'openai', 'anthropic'];
  const contentTypes = ['general', 'scientific', 'news', 'tutorial', 'business', 'opinion'];

  describe('provider validi — general', () => {
    it.each(providers)('test_getKeyPointsPrompt_%s_general_returnsNonEmptyString', (provider) => {
      const result = getKeyPointsPrompt(provider, 'general');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(100);
    });
  });

  describe('content type specifici', () => {
    it.each(contentTypes)(
      'test_getKeyPointsPrompt_gemini_%s_returnsSpecificPrompt',
      (contentType) => {
        const result = getKeyPointsPrompt('gemini', contentType);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(50);
      }
    );
  });

  describe('provider sconosciuto', () => {
    it('test_getKeyPointsPrompt_unknownProvider_fallsBackToOpenaiGeneral', () => {
      const result = getKeyPointsPrompt('unknown-provider', 'general');
      const openaiGeneral = getKeyPointsPrompt('openai', 'general');
      expect(result).toBe(openaiGeneral);
    });

    it('test_getKeyPointsPrompt_nullProvider_fallsBackToOpenaiGeneral', () => {
      const result = getKeyPointsPrompt(null, 'general');
      const openaiGeneral = getKeyPointsPrompt('openai', 'general');
      expect(result).toBe(openaiGeneral);
    });
  });

  describe('content type sconosciuto', () => {
    it.each(providers)(
      'test_getKeyPointsPrompt_%s_unknownContentType_fallsBackToGeneral',
      (provider) => {
        const result = getKeyPointsPrompt(provider, 'nonexistent-type');
        const generalResult = getKeyPointsPrompt(provider, 'general');
        expect(result).toBe(generalResult);
      }
    );
  });

  describe('differenziazione lingua per provider', () => {
    it('test_getKeyPointsPrompt_gemini_scientific_isInItalian', () => {
      const result = getKeyPointsPrompt('gemini', 'scientific');
      expect(result).toContain('esperto analista');
    });

    it('test_getKeyPointsPrompt_groq_scientific_isInItalian', () => {
      const result = getKeyPointsPrompt('groq', 'scientific');
      expect(result).toContain('esperto analista');
    });

    it('test_getKeyPointsPrompt_openai_scientific_isInEnglish', () => {
      const result = getKeyPointsPrompt('openai', 'scientific');
      expect(result).toContain('expert scientific literature analyst');
    });

    it('test_getKeyPointsPrompt_anthropic_scientific_isInEnglish', () => {
      const result = getKeyPointsPrompt('anthropic', 'scientific');
      expect(result).toContain('expert scientific literature analyst');
    });
  });

  describe('anthropic news ha suffix extra', () => {
    it('test_getKeyPointsPrompt_anthropic_news_containsDirectStartInstruction', () => {
      const result = getKeyPointsPrompt('anthropic', 'news');
      expect(result).toContain('Start DIRECTLY with the key points');
    });

    it('test_getKeyPointsPrompt_openai_news_doesNotContainDirectStartInstruction', () => {
      const result = getKeyPointsPrompt('openai', 'news');
      expect(result).not.toContain('Start DIRECTLY with the key points');
    });
  });

  describe('ogni provider ha tutti i content type', () => {
    it.each(providers)(
      'test_getKeyPointsPrompt_%s_allContentTypes_returnDistinctPrompts',
      (provider) => {
        const prompts = contentTypes.map((ct) => getKeyPointsPrompt(provider, ct));
        const uniquePrompts = new Set(prompts);
        expect(uniquePrompts.size).toBe(contentTypes.length);
      }
    );
  });
});
