import { describe, it, expect } from 'vitest';
import { getCitationPrompt } from '@utils/ai/prompts/citation-prompts.js';

const ALL_PROVIDERS = ['groq', 'openai', 'anthropic', 'gemini'];

describe('getCitationPrompt', () => {
  describe('return type and non-empty', () => {
    it.each(ALL_PROVIDERS)('returns a non-empty string for provider "%s"', (provider) => {
      const result = getCitationPrompt(provider);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('gemini provider — returns detailed prompt', () => {
    it('returns gemini-specific prompt with JSON format section', () => {
      const prompt = getCitationPrompt('gemini');
      expect(prompt).toContain('FORMATO OUTPUT JSON');
    });

    it('returns gemini prompt with citation types (direct_quote)', () => {
      const prompt = getCitationPrompt('gemini');
      expect(prompt).toContain('direct_quote');
    });

    it('returns gemini prompt with article_metadata field', () => {
      const prompt = getCitationPrompt('gemini');
      expect(prompt).toContain('article_metadata');
    });

    it('returns gemini prompt with citations_by_type field', () => {
      const prompt = getCitationPrompt('gemini');
      expect(prompt).toContain('citations_by_type');
    });

    it('returns gemini prompt with unique_sources field', () => {
      const prompt = getCitationPrompt('gemini');
      expect(prompt).toContain('unique_sources');
    });

    it('returns gemini prompt with all 8 citation types', () => {
      const prompt = getCitationPrompt('gemini');
      const expectedTypes = [
        'direct_quote',
        'indirect_quote',
        'study_reference',
        'statistic_with_source',
        'expert_reference',
        'work_reference',
        'organization_reference',
        'web_source',
      ];
      for (const type of expectedTypes) {
        expect(prompt).toContain(type);
      }
    });
  });

  describe('non-gemini providers — return default prompt', () => {
    it.each(['groq', 'openai', 'anthropic'])(
      'provider "%s" returns default prompt without FORMATO OUTPUT JSON',
      (provider) => {
        const prompt = getCitationPrompt(provider);
        expect(prompt).not.toContain('FORMATO OUTPUT JSON');
      }
    );

    it.each(['groq', 'openai', 'anthropic'])(
      'provider "%s" prompt contains quote_text field description',
      (provider) => {
        const prompt = getCitationPrompt(provider);
        expect(prompt).toContain('quote_text');
      }
    );

    it.each(['groq', 'openai', 'anthropic'])(
      'provider "%s" prompt instructs to identify bibliographic references',
      (provider) => {
        const prompt = getCitationPrompt(provider);
        expect(prompt).toContain('FONTI ESTERNE');
      }
    );
  });

  describe('lines 185-188 — branching logic', () => {
    it('gemini and groq return different prompts', () => {
      const gemini = getCitationPrompt('gemini');
      const groq = getCitationPrompt('groq');
      expect(gemini).not.toBe(groq);
    });

    it('groq, openai, anthropic all return the same default prompt', () => {
      const groq = getCitationPrompt('groq');
      const openai = getCitationPrompt('openai');
      const anthropic = getCitationPrompt('anthropic');
      expect(groq).toBe(openai);
      expect(groq).toBe(anthropic);
    });

    it('unknown provider falls back to default prompt', () => {
      const unknown = getCitationPrompt('unknown-provider');
      const groq = getCitationPrompt('groq');
      expect(unknown).toBe(groq);
    });

    it('undefined provider falls back to default prompt', () => {
      const undef = getCitationPrompt(undefined);
      const groq = getCitationPrompt('groq');
      expect(undef).toBe(groq);
    });

    it('null provider falls back to default prompt', () => {
      const nullResult = getCitationPrompt(null);
      const groq = getCitationPrompt('groq');
      expect(nullResult).toBe(groq);
    });

    it('empty string provider falls back to default prompt', () => {
      const empty = getCitationPrompt('');
      const groq = getCitationPrompt('groq');
      expect(empty).toBe(groq);
    });
  });
});
