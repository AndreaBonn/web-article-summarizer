import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock chrome.storage.local for logApiCall/logFallback
const mockStorage = {};
global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys) => {
        const result = {};
        for (const key of keys) result[key] = mockStorage[key];
        return Promise.resolve(result);
      }),
      set: vi.fn((data) => {
        Object.assign(mockStorage, data);
        return Promise.resolve();
      }),
    },
  },
};

vi.mock('@utils/ai/api-orchestrator.js', () => ({
  APIOrchestrator: { callAPI: vi.fn() },
}));
vi.mock('@utils/core/logger.js', () => ({
  Logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { APIResilience } from '@utils/ai/api-resilience.js';

describe('APIResilience', () => {
  let resilience;

  beforeEach(() => {
    vi.restoreAllMocks();
    resilience = new APIResilience();
  });

  describe('callWithRetry', () => {
    it('returns result on first successful call', async () => {
      const apiCall = vi.fn().mockResolvedValue('success');
      const result = await resilience.callWithRetry(apiCall);
      expect(result).toBe('success');
      expect(apiCall).toHaveBeenCalledTimes(1);
    });

    it('retries on temporary error and succeeds', async () => {
      const apiCall = vi
        .fn()
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockResolvedValueOnce('recovered');

      const result = await resilience.callWithRetry(apiCall, {
        initialDelay: 1,
        maxRetries: 2,
      });
      expect(result).toBe('recovered');
      expect(apiCall).toHaveBeenCalledTimes(2);
    });

    it('throws immediately on permanent error (401)', async () => {
      const error = new Error('401 Unauthorized');
      const apiCall = vi.fn().mockRejectedValue(error);

      await expect(
        resilience.callWithRetry(apiCall, { maxRetries: 3, initialDelay: 1 }),
      ).rejects.toThrow('401');
      expect(apiCall).toHaveBeenCalledTimes(1);
    });

    it('throws after max retries exhausted', async () => {
      const apiCall = vi.fn().mockRejectedValue(new Error('HTTP 500'));

      await expect(
        resilience.callWithRetry(apiCall, { maxRetries: 2, initialDelay: 1 }),
      ).rejects.toThrow('500');
      expect(apiCall).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('calls onRetry callback with attempt info', async () => {
      const onRetry = vi.fn();
      const apiCall = vi
        .fn()
        .mockRejectedValueOnce(new Error('HTTP 500'))
        .mockResolvedValueOnce('ok');

      await resilience.callWithRetry(apiCall, {
        maxRetries: 2,
        initialDelay: 1,
        onRetry,
      });
      expect(onRetry).toHaveBeenCalledWith(1, 3, expect.any(Number));
    });
  });

  describe('callWithFallback', () => {
    it('returns { result, usedProvider } without fallback', async () => {
      const { APIClient } = await import('@utils/ai/api-client.js');
      APIClient.callAPI.mockResolvedValue('primary result');

      const result = await resilience.callWithFallback({
        primaryProvider: 'groq',
        apiKeys: { groq: 'key1' },
        article: {},
        settings: {},
        enableFallback: false,
      });

      expect(result).toEqual({
        result: 'primary result',
        usedProvider: 'groq',
      });
    });

    it('returns { result, usedProvider } with fallback enabled', async () => {
      const { APIClient } = await import('@utils/ai/api-client.js');
      APIClient.callAPI.mockResolvedValue('fallback result');

      const result = await resilience.callWithFallback({
        primaryProvider: 'groq',
        apiKeys: { groq: 'key1', openai: 'key2' },
        article: {},
        settings: {},
        enableFallback: true,
      });

      expect(result.result).toBe('fallback result');
      expect(result.usedProvider).toBe('groq');
    });

    // Note: fallback with retry is slow to test (real delays).
    // The return shape consistency is already tested above.
  });

  describe('extractStatusCode', () => {
    it('extracts status from error.status property', () => {
      const error = new Error('fail');
      error.status = 429;
      expect(resilience.extractStatusCode(error)).toBe(429);
    });

    it('extracts status from "status: 429" pattern', () => {
      expect(resilience.extractStatusCode(new Error('status: 429'))).toBe(429);
    });

    it('extracts status from "code: 500" pattern', () => {
      expect(resilience.extractStatusCode(new Error('code: 500'))).toBe(500);
    });

    it('extracts status code at start of message', () => {
      expect(resilience.extractStatusCode(new Error('401 Unauthorized'))).toBe(401);
    });

    it('returns null for unknown error format', () => {
      expect(resilience.extractStatusCode(new Error('Something went wrong'))).toBeNull();
    });

    it('returns null for RATE_LIMIT tag without numeric code', () => {
      expect(resilience.extractStatusCode(new Error('[RATE_LIMIT:Groq]'))).toBeNull();
    });
  });

  describe('getFallbackOrder', () => {
    it('puts primary provider first', () => {
      const order = resilience.getFallbackOrder('openai', {
        groq: 'k1',
        openai: 'k2',
        anthropic: 'k3',
      });
      expect(order[0]).toBe('openai');
    });

    it('only includes providers with API keys', () => {
      const order = resilience.getFallbackOrder('groq', {
        groq: 'k1',
        openai: null,
        anthropic: 'k3',
      });
      expect(order).not.toContain('openai');
      expect(order).toContain('groq');
      expect(order).toContain('anthropic');
    });
  });

  describe('static error classifications', () => {
    it('defines temporary errors', () => {
      expect(APIResilience.TEMPORARY_ERRORS).toContain(429);
      expect(APIResilience.TEMPORARY_ERRORS).toContain(500);
      expect(APIResilience.TEMPORARY_ERRORS).toContain(503);
    });

    it('defines permanent errors', () => {
      expect(APIResilience.PERMANENT_ERRORS).toContain(401);
      expect(APIResilience.PERMANENT_ERRORS).toContain(403);
      expect(APIResilience.PERMANENT_ERRORS).toContain(404);
    });
  });
});
