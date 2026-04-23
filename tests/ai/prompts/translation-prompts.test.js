import { describe, it, expect } from 'vitest';
import { getTranslationPrompt } from '@utils/ai/prompts/translation-prompts.js';

const ALL_PROVIDERS = ['groq', 'openai', 'anthropic', 'gemini'];
const CONTENT_TYPES = ['general', 'scientific', 'news', 'tutorial', 'business', 'opinion'];

describe('getTranslationPrompt', () => {
  describe('return type and non-empty', () => {
    for (const provider of ALL_PROVIDERS) {
      for (const contentType of CONTENT_TYPES) {
        it(`returns a non-empty string for provider="${provider}" contentType="${contentType}"`, () => {
          const result = getTranslationPrompt(provider, contentType);
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        });
      }
    }
  });

  describe('provider-language separation', () => {
    it('groq general prompt is in Italian', () => {
      const prompt = getTranslationPrompt('groq', 'general');
      expect(prompt).toMatch(/traduttore|traduzione|italiano/i);
    });

    it('gemini general prompt is in Italian', () => {
      const prompt = getTranslationPrompt('gemini', 'general');
      expect(prompt).toMatch(/traduttore|traduzione|italiano/i);
    });

    it('openai general prompt is in English', () => {
      const prompt = getTranslationPrompt('openai', 'general');
      expect(prompt).toMatch(/translator|translation|translate/i);
    });

    it('anthropic general prompt is in English', () => {
      const prompt = getTranslationPrompt('anthropic', 'general');
      expect(prompt).toMatch(/translator|translation|translate/i);
    });
  });

  describe('gemini general prompt — unique directive', () => {
    it('contains direct-start instruction (no preamble)', () => {
      const prompt = getTranslationPrompt('gemini', 'general');
      expect(prompt).toContain('Inizia DIRETTAMENTE con la traduzione');
    });

    it('groq general prompt does not contain gemini direct-start', () => {
      const prompt = getTranslationPrompt('groq', 'general');
      expect(prompt).not.toContain('Inizia DIRETTAMENTE con la traduzione');
    });
  });

  describe('scientific content type', () => {
    it.each(['groq', 'gemini'])('provider "%s" scientific prompt mentions terminologia tecnica', (p) => {
      const prompt = getTranslationPrompt(p, 'scientific');
      expect(prompt).toMatch(/terminologia tecnica|tecnici standard/i);
    });

    it.each(['openai', 'anthropic'])(
      'provider "%s" scientific prompt mentions technical terminology in English',
      (p) => {
        const prompt = getTranslationPrompt(p, 'scientific');
        expect(prompt).toMatch(/technical terminology|scientific/i);
      }
    );
  });

  describe('news content type', () => {
    it.each(['groq', 'gemini'])('provider "%s" news prompt mentions giornalistico', (p) => {
      const prompt = getTranslationPrompt(p, 'news');
      expect(prompt).toMatch(/giornalistico|notizie/i);
    });

    it.each(['openai', 'anthropic'])('provider "%s" news prompt mentions journalistic', (p) => {
      const prompt = getTranslationPrompt(p, 'news');
      expect(prompt).toMatch(/journalistic|news/i);
    });
  });

  describe('tutorial content type', () => {
    it.each(['groq', 'gemini'])('provider "%s" tutorial prompt says NOT to translate code', (p) => {
      const prompt = getTranslationPrompt(p, 'tutorial');
      expect(prompt).toMatch(/NON tradurre|non tradurre/i);
    });

    it.each(['openai', 'anthropic'])('provider "%s" tutorial prompt says DO NOT translate code', (p) => {
      const prompt = getTranslationPrompt(p, 'tutorial');
      expect(prompt).toMatch(/DO NOT TRANSLATE|not translate/i);
    });
  });

  describe('business content type', () => {
    it.each(['groq', 'gemini'])('provider "%s" business prompt mentions KPI/ROI', (p) => {
      const prompt = getTranslationPrompt(p, 'business');
      expect(prompt).toMatch(/KPI|ROI|EBITDA/);
    });

    it.each(['openai', 'anthropic'])('provider "%s" business prompt mentions KPI/ROI', (p) => {
      const prompt = getTranslationPrompt(p, 'business');
      expect(prompt).toMatch(/KPI|ROI|EBITDA/);
    });
  });

  describe('opinion content type', () => {
    it.each(['groq', 'gemini'])('provider "%s" opinion prompt mentions voce autoriale', (p) => {
      const prompt = getTranslationPrompt(p, 'opinion');
      expect(prompt).toMatch(/voce|stile personale|persuasivo/i);
    });

    it.each(['openai', 'anthropic'])('provider "%s" opinion prompt mentions authorial voice', (p) => {
      const prompt = getTranslationPrompt(p, 'opinion');
      expect(prompt).toMatch(/authorial voice|persuasive/i);
    });
  });

  describe('lines 95-108 — fallback logic', () => {
    it('unknown provider falls back to openai general', () => {
      const result = getTranslationPrompt('unknown-provider', 'general');
      const openaiGeneral = getTranslationPrompt('openai', 'general');
      expect(result).toBe(openaiGeneral);
    });

    it('undefined provider falls back to openai general', () => {
      const result = getTranslationPrompt(undefined, 'general');
      const openaiGeneral = getTranslationPrompt('openai', 'general');
      expect(result).toBe(openaiGeneral);
    });

    it('null provider falls back to openai general', () => {
      const result = getTranslationPrompt(null, 'scientific');
      const openaiGeneral = getTranslationPrompt('openai', 'general');
      expect(result).toBe(openaiGeneral);
    });

    it('empty string provider falls back to openai general', () => {
      const result = getTranslationPrompt('', 'scientific');
      const openaiGeneral = getTranslationPrompt('openai', 'general');
      expect(result).toBe(openaiGeneral);
    });

    it('unknown contentType falls back to provider general', () => {
      const result = getTranslationPrompt('groq', 'unknown-type');
      const groqGeneral = getTranslationPrompt('groq', 'general');
      expect(result).toBe(groqGeneral);
    });

    it('undefined contentType falls back to provider general', () => {
      const result = getTranslationPrompt('openai', undefined);
      const openaiGeneral = getTranslationPrompt('openai', 'general');
      expect(result).toBe(openaiGeneral);
    });

    it('null contentType falls back to provider general', () => {
      const result = getTranslationPrompt('anthropic', null);
      const anthropicGeneral = getTranslationPrompt('anthropic', 'general');
      expect(result).toBe(anthropicGeneral);
    });

    it('each provider has a distinct general prompt', () => {
      const prompts = ALL_PROVIDERS.map((p) => getTranslationPrompt(p, 'general'));
      const unique = new Set(prompts);
      expect(unique.size).toBe(ALL_PROVIDERS.length);
    });

    it('IT providers (groq, gemini) share content-type prompts with each other', () => {
      for (const ct of ['scientific', 'news', 'tutorial', 'business', 'opinion']) {
        const groq = getTranslationPrompt('groq', ct);
        const gemini = getTranslationPrompt('gemini', ct);
        expect(groq).toBe(gemini);
      }
    });

    it('EN providers (openai, anthropic) share content-type prompts with each other', () => {
      for (const ct of ['scientific', 'news', 'tutorial', 'business', 'opinion']) {
        const openai = getTranslationPrompt('openai', ct);
        const anthropic = getTranslationPrompt('anthropic', ct);
        expect(openai).toBe(anthropic);
      }
    });
  });
});
