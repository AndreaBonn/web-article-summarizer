import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@utils/core/logger.js', () => ({
  Logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { ProviderCaller } from '@utils/ai/provider-caller.js';

// Helper to create a mock Response
function mockResponse({ status = 200, body = {}, contentType = 'application/json', ok } = {}) {
  return {
    ok: ok ?? (status >= 200 && status < 300),
    status,
    statusText: 'OK',
    headers: {
      get: (name) => (name === 'content-type' ? contentType : null),
    },
    json: vi.fn().mockResolvedValue(body),
  };
}

describe('ProviderCaller', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('_parseJsonResponse', () => {
    it('parses valid JSON response with application/json', async () => {
      const response = mockResponse({ body: { key: 'value' } });
      const result = await ProviderCaller._parseJsonResponse(response, 'Test');
      expect(result).toEqual({ key: 'value' });
    });

    it('parses response with text/json content type', async () => {
      const response = mockResponse({ body: { ok: true }, contentType: 'text/json; charset=utf-8' });
      const result = await ProviderCaller._parseJsonResponse(response, 'Test');
      expect(result).toEqual({ ok: true });
    });

    it('throws on non-JSON content type', async () => {
      const response = mockResponse({ contentType: 'text/html' });
      await expect(ProviderCaller._parseJsonResponse(response, 'Groq')).rejects.toThrow(
        'Groq: risposta non JSON',
      );
    });

    it('throws on empty content type', async () => {
      const response = mockResponse({ contentType: '' });
      await expect(ProviderCaller._parseJsonResponse(response, 'OpenAI')).rejects.toThrow(
        'OpenAI: risposta non JSON',
      );
    });
  });

  describe('_validateChoicesResponse', () => {
    it('extracts text from valid choices response', () => {
      const data = {
        choices: [{ message: { content: 'Hello world' } }],
      };
      expect(ProviderCaller._validateChoicesResponse(data, 'Groq')).toBe('Hello world');
    });

    it('throws on empty choices array', () => {
      const data = { choices: [] };
      expect(() => ProviderCaller._validateChoicesResponse(data, 'OpenAI')).toThrow(
        'risposta vuota',
      );
    });

    it('throws on missing choices', () => {
      const data = {};
      expect(() => ProviderCaller._validateChoicesResponse(data, 'Groq')).toThrow(
        'risposta vuota',
      );
    });

    it('throws on empty content', () => {
      const data = {
        choices: [{ message: { content: '   ' } }],
      };
      expect(() => ProviderCaller._validateChoicesResponse(data, 'OpenAI')).toThrow(
        'risposta vuota',
      );
    });

    it('includes finish_reason in error when available', () => {
      const data = {
        choices: [{ finish_reason: 'length' }],
      };
      // choices exists but no message.content
      expect(() => ProviderCaller._validateChoicesResponse(data, 'Groq')).toThrow('risposta vuota');
    });

    it('includes error message when available', () => {
      const data = {
        choices: [],
        error: { message: 'quota exceeded' },
      };
      expect(() => ProviderCaller._validateChoicesResponse(data, 'OpenAI')).toThrow(
        'risposta vuota',
      );
    });
  });

  describe('extractGeminiText', () => {
    it('extracts text from valid Gemini response', () => {
      const data = {
        candidates: [
          {
            content: { parts: [{ text: 'Gemini response' }] },
            finishReason: 'STOP',
          },
        ],
      };
      expect(ProviderCaller.extractGeminiText(data)).toBe('Gemini response');
    });

    it('throws on empty candidates', () => {
      expect(() => ProviderCaller.extractGeminiText({ candidates: [] })).toThrow(
        'Risposta Gemini non valida',
      );
    });

    it('throws on missing candidates', () => {
      expect(() => ProviderCaller.extractGeminiText({})).toThrow('Risposta Gemini non valida');
    });

    it('throws on SAFETY finish reason', () => {
      const data = {
        candidates: [{ finishReason: 'SAFETY', content: { parts: [{ text: 'x' }] } }],
      };
      expect(() => ProviderCaller.extractGeminiText(data)).toThrow('Contenuto bloccato');
    });

    it('throws on RECITATION finish reason', () => {
      const data = {
        candidates: [{ finishReason: 'RECITATION', content: { parts: [{ text: 'x' }] } }],
      };
      expect(() => ProviderCaller.extractGeminiText(data)).toThrow('Contenuto bloccato');
    });

    it('throws on MAX_TOKENS finish reason', () => {
      const data = {
        candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: 'x' }] } }],
      };
      expect(() => ProviderCaller.extractGeminiText(data)).toThrow('limite di token');
    });

    it('throws on empty parts', () => {
      const data = {
        candidates: [{ content: { parts: [] }, finishReason: 'STOP' }],
      };
      expect(() => ProviderCaller.extractGeminiText(data)).toThrow('nessun contenuto');
    });

    it('throws on empty text', () => {
      const data = {
        candidates: [{ content: { parts: [{ text: '  ' }] }, finishReason: 'STOP' }],
      };
      expect(() => ProviderCaller.extractGeminiText(data)).toThrow('Risposta Gemini vuota');
    });

    it('includes blockReason in error', () => {
      const data = {
        candidates: [],
        promptFeedback: { blockReason: 'SAFETY' },
      };
      expect(() => ProviderCaller.extractGeminiText(data)).toThrow('SAFETY');
    });

    it('includes API error message', () => {
      const data = {
        candidates: [],
        error: { message: 'Invalid API key' },
      };
      expect(() => ProviderCaller.extractGeminiText(data)).toThrow('Invalid API key');
    });
  });

  describe('_fetchWithTimeout', () => {
    it('returns response on successful fetch', async () => {
      const mockResp = { ok: true };
      global.fetch = vi.fn().mockResolvedValue(mockResp);
      const result = await ProviderCaller._fetchWithTimeout('https://api.test.com', {});
      expect(result).toBe(mockResp);
    });

    it('throws timeout error on abort', async () => {
      global.fetch = vi.fn().mockImplementation(
        () => new Promise((_, reject) => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        }),
      );
      await expect(
        ProviderCaller._fetchWithTimeout('https://api.test.com', {}, 100),
      ).rejects.toThrow('Timeout');
    });

    it('passes abort signal to fetch', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true });
      await ProviderCaller._fetchWithTimeout('https://api.test.com', { method: 'POST' });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com',
        expect.objectContaining({
          method: 'POST',
          signal: expect.any(AbortSignal),
        }),
      );
    });
  });

  describe('callGroqCompletion', () => {
    it('throws rate limit error on 429', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        mockResponse({ status: 429, ok: false }),
      );
      await expect(
        ProviderCaller.callGroqCompletion('key', 'sys', 'user', { model: 'test', temperature: 0.5, maxTokens: 100 }),
      ).rejects.toThrow('[RATE_LIMIT:Groq]');
    });

    it('returns content on success', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        mockResponse({
          body: { choices: [{ message: { content: 'summary result' } }] },
        }),
      );
      const result = await ProviderCaller.callGroqCompletion('key', 'sys', 'user', {
        model: 'llama-3.3-70b',
        temperature: 0.3,
        maxTokens: 4096,
      });
      expect(result).toBe('summary result');
    });
  });

  describe('callGeminiCompletion', () => {
    it('throws rate limit error on 429', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        mockResponse({ status: 429, ok: false }),
      );
      await expect(
        ProviderCaller.callGeminiCompletion('key', 'sys', 'user', { model: 'gemini-2.5-pro', temperature: 0.5, maxTokens: 100 }),
      ).rejects.toThrow('[RATE_LIMIT:Gemini]');
    });

    it('sends correct request format', async () => {
      global.fetch = vi.fn().mockResolvedValue(
        mockResponse({
          body: {
            candidates: [{ content: { parts: [{ text: 'gemini result' }] }, finishReason: 'STOP' }],
          },
        }),
      );
      await ProviderCaller.callGeminiCompletion('mykey', 'system', 'user prompt', {
        model: 'gemini-2.5-pro',
        temperature: 0.3,
        maxTokens: 8000,
      });
      const [url, opts] = global.fetch.mock.calls[0];
      expect(url).toContain('gemini-2.5-pro');
      expect(url).toContain('generateContent');
      const body = JSON.parse(opts.body);
      expect(body.contents[0].parts[0].text).toContain('system');
      expect(body.generationConfig.temperature).toBe(0.3);
    });
  });
});
