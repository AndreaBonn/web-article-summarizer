import { describe, it, expect } from 'vitest';
import {
  getGlobalSummaryPrompt,
  getComparisonPrompt,
  getQAPrompt,
} from '@utils/ai/prompts/multi-analysis-prompts.js';

const ALL_PROVIDERS = ['groq', 'openai', 'anthropic', 'gemini'];

// ---------------------------------------------------------------------------
// getGlobalSummaryPrompt
// ---------------------------------------------------------------------------

describe('getGlobalSummaryPrompt', () => {
  it('returns a non-empty string for gemini', () => {
    const result = getGlobalSummaryPrompt('gemini');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns a non-empty string for non-gemini providers', () => {
    for (const provider of ['groq', 'openai', 'anthropic']) {
      const result = getGlobalSummaryPrompt(provider);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    }
  });

  describe('line 49 — gemini branch', () => {
    it('gemini returns different prompt than non-gemini providers', () => {
      const gemini = getGlobalSummaryPrompt('gemini');
      const groq = getGlobalSummaryPrompt('groq');
      expect(gemini).not.toBe(groq);
    });

    it('gemini prompt contains direct-start instruction', () => {
      const prompt = getGlobalSummaryPrompt('gemini');
      expect(prompt).toContain('Inizia DIRETTAMENTE con il riassunto');
    });

    it('non-gemini prompt also contains direct-start instruction (DEFAULT)', () => {
      const prompt = getGlobalSummaryPrompt('groq');
      expect(prompt).toContain('IMPORTANTE: Inizia DIRETTAMENTE');
    });

    it('groq, openai, anthropic all return same default prompt', () => {
      const groq = getGlobalSummaryPrompt('groq');
      const openai = getGlobalSummaryPrompt('openai');
      const anthropic = getGlobalSummaryPrompt('anthropic');
      expect(groq).toBe(openai);
      expect(groq).toBe(anthropic);
    });

    it('unknown provider returns default (non-gemini) prompt', () => {
      const unknown = getGlobalSummaryPrompt('unknown');
      const groq = getGlobalSummaryPrompt('groq');
      expect(unknown).toBe(groq);
    });

    it('undefined provider returns default prompt', () => {
      const undef = getGlobalSummaryPrompt(undefined);
      const groq = getGlobalSummaryPrompt('groq');
      expect(undef).toBe(groq);
    });
  });

  it('all prompts mention synthesis/integration of multiple articles', () => {
    for (const provider of ALL_PROVIDERS) {
      const prompt = getGlobalSummaryPrompt(provider);
      expect(prompt).toMatch(/articoli|articles|sintesi|riassunto/i);
    }
  });

  it('all prompts write in Italian', () => {
    for (const provider of ALL_PROVIDERS) {
      const prompt = getGlobalSummaryPrompt(provider);
      expect(prompt).toMatch(/italiano|in italiano/i);
    }
  });
});

// ---------------------------------------------------------------------------
// getComparisonPrompt
// ---------------------------------------------------------------------------

describe('getComparisonPrompt', () => {
  it.each(ALL_PROVIDERS)('returns a non-empty string for provider "%s"', (provider) => {
    const result = getComparisonPrompt(provider);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  describe('line 187 — provider-specific prompts', () => {
    it('each known provider returns a unique prompt', () => {
      const prompts = ALL_PROVIDERS.map((p) => getComparisonPrompt(p));
      const unique = new Set(prompts);
      expect(unique.size).toBe(ALL_PROVIDERS.length);
    });

    it('unknown provider falls back to COMPARISON_FALLBACK', () => {
      const unknown = getComparisonPrompt('unknown-provider');
      // Fallback is different from all known providers
      for (const provider of ALL_PROVIDERS) {
        expect(unknown).not.toBe(getComparisonPrompt(provider));
      }
    });

    it('undefined provider falls back to COMPARISON_FALLBACK', () => {
      const undef = getComparisonPrompt(undefined);
      const unknown = getComparisonPrompt('unknown-provider');
      expect(undef).toBe(unknown);
    });

    it('null provider falls back to COMPARISON_FALLBACK', () => {
      const nullResult = getComparisonPrompt(null);
      const unknown = getComparisonPrompt('unknown-provider');
      expect(nullResult).toBe(unknown);
    });

    it('empty string provider falls back to COMPARISON_FALLBACK', () => {
      const empty = getComparisonPrompt('');
      const unknown = getComparisonPrompt('unknown-provider');
      expect(empty).toBe(unknown);
    });
  });

  describe('provider-specific content validation', () => {
    it('gemini prompt contains IMPORTANTE direct-start directive', () => {
      const prompt = getComparisonPrompt('gemini');
      expect(prompt).toContain('IMPORTANTE: Inizia DIRETTAMENTE');
    });

    it('groq prompt contains ANALISI COMPARATIVA COMPLETA', () => {
      const prompt = getComparisonPrompt('groq');
      expect(prompt).toContain('ANALISI COMPARATIVA COMPLETA');
    });

    it('openai prompt is in English', () => {
      const prompt = getComparisonPrompt('openai');
      expect(prompt).toMatch(/COMPREHENSIVE COMPARATIVE ANALYSIS|analyst/i);
    });

    it('anthropic prompt mentions RIGOROUS', () => {
      const prompt = getComparisonPrompt('anthropic');
      expect(prompt).toContain('RIGOROUS COMPARATIVE ANALYSIS');
    });

    it('openai prompt instructs to write in Italian', () => {
      const prompt = getComparisonPrompt('openai');
      expect(prompt).toContain('Write the analysis in Italian');
    });

    it('anthropic prompt instructs to write in Italian', () => {
      const prompt = getComparisonPrompt('anthropic');
      expect(prompt).toContain('Write the analysis in Italian');
    });
  });

  it('all prompts mention convergences and divergences', () => {
    for (const provider of ALL_PROVIDERS) {
      const prompt = getComparisonPrompt(provider);
      expect(prompt).toMatch(/convergenz|divergenz|Convergence|Divergence/i);
    }
  });
});

// ---------------------------------------------------------------------------
// getQAPrompt
// ---------------------------------------------------------------------------

describe('getQAPrompt', () => {
  it.each(ALL_PROVIDERS)('returns a non-empty string for provider "%s"', (provider) => {
    const result = getQAPrompt(provider);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  describe('line 248 — gemini branch', () => {
    it('gemini returns different prompt than non-gemini providers', () => {
      const gemini = getQAPrompt('gemini');
      const groq = getQAPrompt('groq');
      expect(gemini).not.toBe(groq);
    });

    it('groq, openai, anthropic all return same QA_DEFAULT prompt', () => {
      const groq = getQAPrompt('groq');
      const openai = getQAPrompt('openai');
      const anthropic = getQAPrompt('anthropic');
      expect(groq).toBe(openai);
      expect(groq).toBe(anthropic);
    });

    it('unknown provider returns QA_DEFAULT', () => {
      const unknown = getQAPrompt('unknown-provider');
      const groq = getQAPrompt('groq');
      expect(unknown).toBe(groq);
    });

    it('undefined provider returns QA_DEFAULT', () => {
      const undef = getQAPrompt(undefined);
      const groq = getQAPrompt('groq');
      expect(undef).toBe(groq);
    });

    it('null provider returns QA_DEFAULT', () => {
      const nullResult = getQAPrompt(null);
      const groq = getQAPrompt('groq');
      expect(nullResult).toBe(groq);
    });
  });

  describe('prompt content validation', () => {
    it('gemini prompt specifies IMPORTANT: valid JSON without markdown', () => {
      const prompt = getQAPrompt('gemini');
      expect(prompt).toContain('IMPORTANTE PER GEMINI');
    });

    it('gemini prompt asks for 8-10 Q&A pairs', () => {
      const prompt = getQAPrompt('gemini');
      expect(prompt).toContain('8-10');
    });

    it('default prompt instructs JSON-only output', () => {
      const prompt = getQAPrompt('groq');
      expect(prompt).toMatch(/SOLO.+JSON|JSON.+senza testo/i);
    });

    it('both prompts include JSON structure with question and answer keys', () => {
      for (const provider of ALL_PROVIDERS) {
        const prompt = getQAPrompt(provider);
        expect(prompt).toContain('"question"');
        expect(prompt).toContain('"answer"');
      }
    });

    it('all prompts mention covering main themes of articles', () => {
      for (const provider of ALL_PROVIDERS) {
        const prompt = getQAPrompt(provider);
        expect(prompt).toMatch(/temi principali|articoli/i);
      }
    });
  });
});
