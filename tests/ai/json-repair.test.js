import { describe, it, expect, vi } from 'vitest';

vi.mock('@utils/core/logger.js', () => ({
  Logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { parseLLMJson } from '@utils/ai/json-repair.js';

describe('parseLLMJson', () => {
  describe('valid JSON', () => {
    it('parses a plain JSON object', () => {
      const result = parseLLMJson('{"key": "value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('parses a plain JSON array', () => {
      const result = parseLLMJson('[1, 2, 3]');
      expect(result).toEqual([1, 2, 3]);
    });

    it('parses nested objects', () => {
      const result = parseLLMJson('{"a": {"b": [1, 2]}}');
      expect(result).toEqual({ a: { b: [1, 2] } });
    });
  });

  describe('markdown code fences', () => {
    it('strips ```json fences', () => {
      const input = '```json\n{"key": "value"}\n```';
      expect(parseLLMJson(input)).toEqual({ key: 'value' });
    });

    it('strips bare ``` fences', () => {
      const input = '```\n{"key": "value"}\n```';
      expect(parseLLMJson(input)).toEqual({ key: 'value' });
    });

    it('strips fences with surrounding text', () => {
      const input = 'Here is the result:\n```json\n{"data": true}\n```\nEnd.';
      expect(parseLLMJson(input)).toEqual({ data: true });
    });
  });

  describe('surrounding text extraction', () => {
    it('extracts JSON from prose text', () => {
      const input = 'The result is: {"category": "news"} as expected.';
      expect(parseLLMJson(input)).toEqual({ category: 'news' });
    });

    it('extracts array from prose text', () => {
      const input = 'Here are the items: [{"q": "why?"}, {"q": "how?"}]';
      expect(parseLLMJson(input)).toEqual([{ q: 'why?' }, { q: 'how?' }]);
    });
  });

  describe('repair: unbalanced brackets', () => {
    it('adds missing closing brace', () => {
      const input = '{"key": "value"';
      expect(parseLLMJson(input)).toEqual({ key: 'value' });
    });

    it('adds missing closing bracket', () => {
      const input = '[1, 2, 3';
      expect(parseLLMJson(input)).toEqual([1, 2, 3]);
    });

    it('adds multiple missing closers', () => {
      const input = '{"a": {"b": [1, 2';
      expect(parseLLMJson(input)).toEqual({ a: { b: [1, 2] } });
    });
  });

  describe('repair: trailing commas', () => {
    it('removes trailing comma before }', () => {
      const input = '{"a": 1, "b": 2,}';
      expect(parseLLMJson(input)).toEqual({ a: 1, b: 2 });
    });

    it('removes trailing comma before ]', () => {
      const input = '[1, 2, 3,]';
      expect(parseLLMJson(input)).toEqual([1, 2, 3]);
    });
  });

  describe('error cases', () => {
    it('throws on empty string', () => {
      expect(() => parseLLMJson('')).toThrow('No valid JSON found');
    });

    it('throws on text without JSON', () => {
      expect(() => parseLLMJson('This is just plain text')).toThrow('No valid JSON found');
    });

    it('throws on completely broken JSON', () => {
      expect(() => parseLLMJson('{{{invalid: broken')).toThrow();
    });
  });

  describe('real-world LLM responses', () => {
    it('parses a typical citation response', () => {
      const input = `Here are the citations I found:
\`\`\`json
{
  "citations": [
    {"id": 1, "type": "direct_quote", "text": "Hello world"},
    {"id": 2, "type": "reference", "text": "Some ref"}
  ],
  "total_citations": 2
}
\`\`\``;
      const result = parseLLMJson(input);
      expect(result.citations).toHaveLength(2);
      expect(result.total_citations).toBe(2);
    });

    it('parses a truncated LLM response with missing closers', () => {
      const input = '{"correlati": true, "motivazione": "same topic", "temi_comuni": ["AI", "ML"';
      const result = parseLLMJson(input);
      expect(result.correlati).toBe(true);
      expect(result.temi_comuni).toEqual(['AI', 'ML']);
    });

    it('parses Q&A array response', () => {
      const input = `[{"question": "What?", "answer": "This."}, {"question": "Why?", "answer": "Because."}]`;
      const result = parseLLMJson(input);
      expect(result).toHaveLength(2);
      expect(result[0].question).toBe('What?');
    });
  });
});
