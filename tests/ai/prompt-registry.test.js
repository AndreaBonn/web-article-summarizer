import { describe, it, expect, vi } from 'vitest';

// Mock sub-modules — they return strings that depend on provider/contentType
vi.mock('@utils/ai/prompts/summary-prompts.js', () => ({
  getSummaryPrompt: vi.fn((provider, contentType) => `summary:${provider}:${contentType}`),
}));

vi.mock('@utils/ai/prompts/keypoints-prompts.js', () => ({
  getKeyPointsPrompt: vi.fn((provider, contentType) => `keypoints:${provider}:${contentType}`),
}));

vi.mock('@utils/ai/prompts/translation-prompts.js', () => ({
  getTranslationPrompt: vi.fn((provider, contentType) => `translation:${provider}:${contentType}`),
}));

vi.mock('@utils/ai/prompts/citation-prompts.js', () => ({
  getCitationPrompt: vi.fn((provider) => `citation:${provider}`),
}));

vi.mock('@utils/ai/prompts/classification-prompts.js', () => ({
  getClassificationSystemPrompt: vi.fn(() => 'classification-system'),
  getClassificationUserPrompt: vi.fn((article, sample) => `classification-user:${article.title}:${sample}`),
}));

import { PromptRegistry } from '@utils/ai/prompt-registry.js';
import { getSummaryPrompt } from '@utils/ai/prompts/summary-prompts.js';
import { getKeyPointsPrompt } from '@utils/ai/prompts/keypoints-prompts.js';
import { getTranslationPrompt } from '@utils/ai/prompts/translation-prompts.js';
import { getCitationPrompt } from '@utils/ai/prompts/citation-prompts.js';
import {
  getClassificationSystemPrompt,
  getClassificationUserPrompt,
} from '@utils/ai/prompts/classification-prompts.js';

const PROVIDERS = ['groq', 'openai', 'anthropic', 'gemini'];
const CONTENT_TYPES = ['general', 'scientific', 'news', 'tutorial', 'business', 'opinion'];

describe('PromptRegistry', () => {
  // ---------------------------------------------------------------------------
  // getSummarySystemPrompt
  // ---------------------------------------------------------------------------

  describe('getSummarySystemPrompt', () => {
    it('delegates to getSummaryPrompt with provider and contentType', () => {
      const result = PromptRegistry.getSummarySystemPrompt('groq', 'scientific');
      expect(getSummaryPrompt).toHaveBeenCalledWith('groq', 'scientific');
      expect(result).toBe('summary:groq:scientific');
    });

    it.each(PROVIDERS)('works for provider %s', (provider) => {
      const result = PromptRegistry.getSummarySystemPrompt(provider, 'general');
      expect(result).toBe(`summary:${provider}:general`);
    });

    it.each(CONTENT_TYPES)('works for contentType %s', (contentType) => {
      const result = PromptRegistry.getSummarySystemPrompt('groq', contentType);
      expect(result).toBe(`summary:groq:${contentType}`);
    });

    it('returns a string', () => {
      const result = PromptRegistry.getSummarySystemPrompt('openai', 'news');
      expect(typeof result).toBe('string');
    });

    it('passes through undefined contentType', () => {
      PromptRegistry.getSummarySystemPrompt('groq', undefined);
      expect(getSummaryPrompt).toHaveBeenCalledWith('groq', undefined);
    });
  });

  // ---------------------------------------------------------------------------
  // getKeyPointsSystemPrompt
  // ---------------------------------------------------------------------------

  describe('getKeyPointsSystemPrompt', () => {
    it('delegates to getKeyPointsPrompt with provider and contentType', () => {
      const result = PromptRegistry.getKeyPointsSystemPrompt('anthropic', 'tutorial');
      expect(getKeyPointsPrompt).toHaveBeenCalledWith('anthropic', 'tutorial');
      expect(result).toBe('keypoints:anthropic:tutorial');
    });

    it.each(PROVIDERS)('works for provider %s', (provider) => {
      const result = PromptRegistry.getKeyPointsSystemPrompt(provider, 'business');
      expect(result).toBe(`keypoints:${provider}:business`);
    });

    it('returns a string', () => {
      const result = PromptRegistry.getKeyPointsSystemPrompt('gemini', 'opinion');
      expect(typeof result).toBe('string');
    });
  });

  // ---------------------------------------------------------------------------
  // getTranslationSystemPrompt
  // ---------------------------------------------------------------------------

  describe('getTranslationSystemPrompt', () => {
    it('delegates to getTranslationPrompt with provider and contentType', () => {
      const result = PromptRegistry.getTranslationSystemPrompt('gemini', 'news');
      expect(getTranslationPrompt).toHaveBeenCalledWith('gemini', 'news');
      expect(result).toBe('translation:gemini:news');
    });

    it.each(PROVIDERS)('works for provider %s', (provider) => {
      const result = PromptRegistry.getTranslationSystemPrompt(provider, 'general');
      expect(result).toBe(`translation:${provider}:general`);
    });

    it.each(CONTENT_TYPES)('works for contentType %s', (contentType) => {
      const result = PromptRegistry.getTranslationSystemPrompt('openai', contentType);
      expect(result).toBe(`translation:openai:${contentType}`);
    });

    it('returns a string', () => {
      const result = PromptRegistry.getTranslationSystemPrompt('anthropic', 'scientific');
      expect(typeof result).toBe('string');
    });
  });

  // ---------------------------------------------------------------------------
  // getCitationSystemPrompt
  // ---------------------------------------------------------------------------

  describe('getCitationSystemPrompt', () => {
    it('delegates to getCitationPrompt with provider only', () => {
      const result = PromptRegistry.getCitationSystemPrompt('groq');
      expect(getCitationPrompt).toHaveBeenCalledWith('groq');
      expect(result).toBe('citation:groq');
    });

    it.each(PROVIDERS)('works for provider %s', (provider) => {
      const result = PromptRegistry.getCitationSystemPrompt(provider);
      expect(result).toBe(`citation:${provider}`);
    });

    it('returns a string', () => {
      const result = PromptRegistry.getCitationSystemPrompt('openai');
      expect(typeof result).toBe('string');
    });

    it('does not require contentType argument', () => {
      expect(() => PromptRegistry.getCitationSystemPrompt('anthropic')).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // getClassificationSystemPrompt
  // ---------------------------------------------------------------------------

  describe('getClassificationSystemPrompt', () => {
    it('delegates to getClassificationSystemPrompt module function', () => {
      const result = PromptRegistry.getClassificationSystemPrompt();
      expect(getClassificationSystemPrompt).toHaveBeenCalledOnce();
      expect(result).toBe('classification-system');
    });

    it('returns a string', () => {
      const result = PromptRegistry.getClassificationSystemPrompt();
      expect(typeof result).toBe('string');
    });
  });

  // ---------------------------------------------------------------------------
  // getClassificationUserPrompt
  // ---------------------------------------------------------------------------

  describe('getClassificationUserPrompt', () => {
    it('delegates to getClassificationUserPrompt module function with article and sample', () => {
      const article = { title: 'My Article' };
      const sample = 'first 500 words...';

      const result = PromptRegistry.getClassificationUserPrompt(article, sample);

      expect(getClassificationUserPrompt).toHaveBeenCalledWith(article, sample);
      expect(result).toBe('classification-user:My Article:first 500 words...');
    });

    it('returns a string', () => {
      const result = PromptRegistry.getClassificationUserPrompt({ title: 'T' }, 'sample');
      expect(typeof result).toBe('string');
    });
  });
});
