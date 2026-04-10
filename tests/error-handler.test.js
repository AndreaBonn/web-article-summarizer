import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock chrome.storage.local — simula serializzazione reale (JSON round-trip)
const store = {};
global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys) => {
        const result = {};
        for (const key of keys) {
          if (store[key] !== undefined) result[key] = JSON.parse(JSON.stringify(store[key]));
        }
        return Promise.resolve(result);
      }),
      set: vi.fn((data) => {
        for (const [key, value] of Object.entries(data)) {
          store[key] = JSON.parse(JSON.stringify(value));
        }
        return Promise.resolve();
      }),
    },
  },
};

// Mock Modal (not available in test env)
vi.mock('@utils/core/modal.js', () => ({
  Modal: { error: vi.fn().mockResolvedValue(undefined) },
}));

import { ErrorHandler } from '@utils/core/error-handler.js';

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(store)) delete store[key];
  });

  describe('getErrorMessage', () => {
    it('maps "No article found" to user-friendly message', () => {
      const msg = ErrorHandler.getErrorMessage(new Error('No article found on page'));
      expect(msg).toContain('Nessun articolo rilevato');
    });

    it('maps "Article too short" to user-friendly message', () => {
      const msg = ErrorHandler.getErrorMessage(new Error('Article too short'));
      expect(msg).toContain('troppo breve');
    });

    it('maps "API key non configurata" correctly', () => {
      const msg = ErrorHandler.getErrorMessage(new Error('API key non configurata'));
      expect(msg).toContain('API key non configurata');
    });

    it('maps 401/Unauthorized to API key error', () => {
      expect(ErrorHandler.getErrorMessage(new Error('401 Unauthorized'))).toContain(
        'API key non valida',
      );
    });

    it('maps 429/rate limit to rate limit message', () => {
      const msg = ErrorHandler.getErrorMessage(new Error('429 Too Many Requests'));
      expect(msg).toContain('Rate limit');
    });

    it('maps provider-specific rate limit [RATE_LIMIT:groq]', () => {
      const msg = ErrorHandler.getErrorMessage(new Error('[RATE_LIMIT:groq]'));
      expect(msg).toContain('groq');
      expect(msg).toContain('Rate limit');
    });

    it('maps 403/Forbidden to access denied', () => {
      expect(ErrorHandler.getErrorMessage(new Error('403 Forbidden'))).toContain('Accesso negato');
    });

    it('maps 500 to server error', () => {
      expect(ErrorHandler.getErrorMessage(new Error('500 Internal Server Error'))).toContain(
        'Errore del server API',
      );
    });

    it('maps 503 to service unavailable', () => {
      expect(ErrorHandler.getErrorMessage(new Error('503 Service Unavailable'))).toContain(
        'non disponibile',
      );
    });

    it('maps Network error to connection error', () => {
      expect(ErrorHandler.getErrorMessage(new Error('Network request failed'))).toContain(
        'connessione',
      );
    });

    it('maps timeout to timeout message', () => {
      expect(ErrorHandler.getErrorMessage(new Error('Request timeout exceeded'))).toContain(
        'scaduta',
      );
    });

    it('maps chrome:// URLs to internal page error', () => {
      expect(ErrorHandler.getErrorMessage(new Error('chrome://extensions'))).toContain(
        'pagine interne di Chrome',
      );
    });

    it('maps connection errors to reload message', () => {
      expect(ErrorHandler.getErrorMessage(new Error('Could not establish connection'))).toContain(
        'Ricarica la pagina',
      );
    });

    it('maps QUOTA_BYTES to storage full message', () => {
      expect(ErrorHandler.getErrorMessage(new Error('QUOTA_BYTES exceeded'))).toContain(
        'archiviazione esaurito',
      );
    });

    it('returns generic message for unrecognized errors', () => {
      const msg = ErrorHandler.getErrorMessage(new Error('Something completely unknown'));
      expect(msg).toContain('errore imprevisto');
    });

    it('handles non-Error objects gracefully', () => {
      const msg = ErrorHandler.getErrorMessage('just a string error');
      expect(msg).toBeTypeOf('string');
    });
  });

  describe('logError', () => {
    it('persists error to chrome storage', async () => {
      await ErrorHandler.logError(new Error('Test error'), 'testContext');

      expect(store.errorLogs).toHaveLength(1);
      expect(store.errorLogs[0].context).toBe('testContext');
      expect(store.errorLogs[0].timestamp).toBeTypeOf('number');
    });

    it('uses getErrorMessage for stored message (no raw leak)', async () => {
      await ErrorHandler.logError(new Error('429 Too Many Requests'), 'api');

      expect(store.errorLogs[0].message).toContain('Rate limit');
      expect(store.errorLogs[0].message).not.toContain('429');
    });

    it('enforces max 50 error logs by shifting oldest', async () => {
      // Pre-fill with 50 entries — index 0 is "Error-0" (first inserted)
      store.errorLogs = Array.from({ length: 50 }, (_, i) => ({
        message: `Error-${i}`,
        timestamp: Date.now() - (50 - i) * 1000,
      }));

      await ErrorHandler.logError(new Error('New error'));

      expect(store.errorLogs).toHaveLength(50);
      // "Error-0" was at position 0 and should have been shifted out
      const allMessages = store.errorLogs.map((l) => l.message);
      expect(allMessages).not.toContain('Error-0');
      // New entry is at the end (pushed)
      expect(allMessages[49]).toContain('errore imprevisto'); // getErrorMessage('New error')
      // "Error-1" should now be at position 0
      expect(allMessages[0]).toBe('Error-1');
    });

    it('survives chrome storage failures gracefully', async () => {
      chrome.storage.local.get.mockRejectedValueOnce(new Error('Storage failed'));

      // Should not throw
      await expect(ErrorHandler.logError(new Error('Test'))).resolves.not.toThrow();
    });
  });
});
