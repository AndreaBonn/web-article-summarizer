import { describe, it, expect } from 'vitest';
import {
  getClassificationSystemPrompt,
  getClassificationUserPrompt,
} from '@utils/ai/prompts/classification-prompts.js';

describe('getClassificationSystemPrompt', () => {
  it('returns a non-empty string', () => {
    const result = getClassificationSystemPrompt();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains all 6 category names', () => {
    const prompt = getClassificationSystemPrompt();
    const categories = ['SCIENTIFIC', 'NEWS', 'TUTORIAL', 'BUSINESS', 'OPINION', 'GENERAL'];
    for (const category of categories) {
      expect(prompt).toContain(category);
    }
  });

  it('instructs to respond only with category name in lowercase', () => {
    const prompt = getClassificationSystemPrompt();
    expect(prompt).toMatch(/minuscolo|senza spiegazioni/i);
  });

  it('mentions analysing first 500 words', () => {
    const prompt = getClassificationSystemPrompt();
    expect(prompt).toContain('500');
  });

  it('is deterministic — returns same string on repeated calls', () => {
    const first = getClassificationSystemPrompt();
    const second = getClassificationSystemPrompt();
    expect(first).toBe(second);
  });
});

describe('getClassificationUserPrompt', () => {
  const baseArticle = {
    title: 'Test Article Title',
    author: 'John Doe',
    siteName: 'Example News',
  };
  const contentSample = 'This is the first 500 words of the article content.';

  it('returns a non-empty string', () => {
    const result = getClassificationUserPrompt(baseArticle, contentSample);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes article title in output', () => {
    const result = getClassificationUserPrompt(baseArticle, contentSample);
    expect(result).toContain('Test Article Title');
  });

  it('includes author when provided', () => {
    const result = getClassificationUserPrompt(baseArticle, contentSample);
    expect(result).toContain('John Doe');
  });

  it('includes siteName when provided', () => {
    const result = getClassificationUserPrompt(baseArticle, contentSample);
    expect(result).toContain('Example News');
  });

  it('includes content sample in output', () => {
    const result = getClassificationUserPrompt(baseArticle, contentSample);
    expect(result).toContain(contentSample);
  });

  it('includes all 6 category options in instructions', () => {
    const result = getClassificationUserPrompt(baseArticle, contentSample);
    const categories = ['scientific', 'news', 'tutorial', 'business', 'opinion', 'general'];
    for (const category of categories) {
      expect(result).toContain(category);
    }
  });

  describe('lines 342-344 — optional fields', () => {
    it('omits author line when article.author is falsy', () => {
      const article = { title: 'No Author Article', author: null, siteName: 'Site' };
      const result = getClassificationUserPrompt(article, contentSample);
      expect(result).not.toContain('Autore');
    });

    it('omits siteName line when article.siteName is falsy', () => {
      const article = { title: 'No Site Article', author: 'Author', siteName: null };
      const result = getClassificationUserPrompt(article, contentSample);
      expect(result).not.toContain('Pubblicazione');
    });

    it('includes both author and siteName lines when both are provided', () => {
      const result = getClassificationUserPrompt(baseArticle, contentSample);
      expect(result).toContain('Autore');
      expect(result).toContain('Pubblicazione');
    });

    it('shows N/A when title is missing', () => {
      const article = { title: null, author: 'Author', siteName: 'Site' };
      const result = getClassificationUserPrompt(article, contentSample);
      expect(result).toContain('N/A');
    });

    it('handles empty string author as falsy — omits Autore line', () => {
      const article = { title: 'Title', author: '', siteName: 'Site' };
      const result = getClassificationUserPrompt(article, contentSample);
      expect(result).not.toContain('Autore');
    });

    it('handles empty string siteName as falsy — omits Pubblicazione line', () => {
      const article = { title: 'Title', author: 'Author', siteName: '' };
      const result = getClassificationUserPrompt(article, contentSample);
      expect(result).not.toContain('Pubblicazione');
    });
  });

  describe('edge cases', () => {
    it('handles undefined contentSample gracefully', () => {
      const result = getClassificationUserPrompt(baseArticle, undefined);
      expect(typeof result).toBe('string');
    });

    it('handles empty contentSample', () => {
      const result = getClassificationUserPrompt(baseArticle, '');
      expect(typeof result).toBe('string');
      expect(result).toContain('Test Article Title');
    });

    it('handles article with only title (no author, no siteName)', () => {
      const minimalArticle = { title: 'Only Title' };
      const result = getClassificationUserPrompt(minimalArticle, contentSample);
      expect(result).toContain('Only Title');
      expect(result).not.toContain('Autore');
      expect(result).not.toContain('Pubblicazione');
    });
  });
});
