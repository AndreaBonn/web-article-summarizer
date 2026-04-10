import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from '@utils/ai/rate-limiter.js';

describe('RateLimiter', () => {
  let limiter;

  beforeEach(() => {
    vi.useFakeTimers();
    limiter = new RateLimiter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── canMakeRequest ───────────────────────────────────────────────────────

  describe('canMakeRequest', () => {
    it('test_canMakeRequest_withTokensAvailable_returnsTrue', () => {
      // Arrange — groq starts with 30 tokens
      // Act
      const result = limiter.canMakeRequest('groq');
      // Assert
      expect(result).toBe(true);
    });

    it('test_canMakeRequest_withNoTokens_returnsFalse', () => {
      // Arrange — drain all groq tokens
      limiter.rateLimits.groq.tokens = 0;
      // Act
      const result = limiter.canMakeRequest('groq');
      // Assert
      expect(result).toBe(false);
    });

    it('test_canMakeRequest_afterMinuteReset_resetsTokens', () => {
      // Arrange — drain tokens then advance time past 60 s
      limiter.rateLimits.groq.tokens = 0;
      vi.advanceTimersByTime(60001);
      // Act
      const result = limiter.canMakeRequest('groq');
      // Assert
      expect(result).toBe(true);
      expect(limiter.rateLimits.groq.tokens).toBe(limiter.rateLimits.groq.requestsPerMinute);
    });

    it('test_canMakeRequest_unknownProvider_returnsTrue', () => {
      // Arrange — 'unknown-provider' not in rateLimits
      // Act
      const result = limiter.canMakeRequest('unknown-provider');
      // Assert
      expect(result).toBe(true);
    });
  });

  // ─── consumeToken ─────────────────────────────────────────────────────────

  describe('consumeToken', () => {
    it('test_consumeToken_decrementsTokenCount', () => {
      // Arrange
      const initialTokens = limiter.rateLimits.openai.tokens;
      // Act
      limiter.consumeToken('openai');
      // Assert
      expect(limiter.rateLimits.openai.tokens).toBe(initialTokens - 1);
    });

    it('test_consumeToken_atZero_doesNotGoNegative', () => {
      // Arrange
      limiter.rateLimits.openai.tokens = 0;
      // Act
      limiter.consumeToken('openai');
      // Assert
      expect(limiter.rateLimits.openai.tokens).toBe(0);
    });
  });

  // ─── getWaitTime ──────────────────────────────────────────────────────────

  describe('getWaitTime', () => {
    it('test_getWaitTime_unknownProvider_returnsZero', () => {
      // Arrange / Act
      const waitTime = limiter.getWaitTime('unknown-provider');
      // Assert
      expect(waitTime).toBe(0);
    });

    it('test_getWaitTime_knownProvider_returnsPositive', () => {
      // Arrange — tokens exhausted, reset was just now
      limiter.rateLimits.groq.tokens = 0;
      limiter.rateLimits.groq.lastReset = Date.now();
      // Act
      const waitTime = limiter.getWaitTime('groq');
      // Assert
      expect(waitTime).toBeGreaterThan(0);
    });
  });

  // ─── enqueueRequest ───────────────────────────────────────────────────────

  describe('enqueueRequest', () => {
    it('test_enqueueRequest_successfulCall_resolvesWithResult', async () => {
      // Arrange
      const apiCall = vi.fn().mockResolvedValue('result-ok');
      // Act
      const promise = limiter.enqueueRequest('groq', apiCall);
      await vi.runAllTimersAsync();
      const result = await promise;
      // Assert
      expect(result).toBe('result-ok');
    });

    it('test_enqueueRequest_failedCall_rejectsWithError', async () => {
      // Arrange
      const err = new Error('API failure');
      const apiCall = vi.fn().mockRejectedValue(err);
      // Act — attach catch BEFORE advancing timers to avoid unhandled rejection
      const promise = limiter.enqueueRequest('groq', apiCall);
      const caught = promise.catch((e) => e);
      await vi.runAllTimersAsync();
      // Assert
      const result = await caught;
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('API failure');
    });

    it('test_enqueueRequest_callsOnQueueUpdate', async () => {
      // Arrange
      const apiCall = vi.fn().mockResolvedValue('ok');
      const onQueueUpdate = vi.fn();
      // Act
      const promise = limiter.enqueueRequest('groq', apiCall, onQueueUpdate);
      await vi.runAllTimersAsync();
      await promise;
      // Assert — called at least once when request is added (length = 1) and once
      // when it is dequeued (length = 0)
      expect(onQueueUpdate).toHaveBeenCalled();
      expect(onQueueUpdate).toHaveBeenCalledWith(1); // item added
    });
  });

  // ─── processQueue ─────────────────────────────────────────────────────────

  describe('processQueue', () => {
    it('test_processQueue_alreadyProcessing_skips', async () => {
      // Arrange — set flag before calling
      limiter.isProcessing = true;
      const apiCall = vi.fn().mockResolvedValue('x');
      limiter.requestQueue.push({ provider: 'groq', apiCall, resolve: vi.fn(), reject: vi.fn(), timestamp: Date.now() });
      // Act
      await limiter.processQueue();
      // Assert — apiCall never executed because queue processing was skipped
      expect(apiCall).not.toHaveBeenCalled();
      // Cleanup
      limiter.requestQueue = [];
      limiter.isProcessing = false;
    });

    it('test_processQueue_emptyQueue_skips', async () => {
      // Arrange — queue is empty by default
      const spy = vi.spyOn(limiter, 'sleep');
      // Act
      await limiter.processQueue();
      // Assert
      expect(spy).not.toHaveBeenCalled();
    });

    it('test_processQueue_resetsIsProcessingAfterCompletion', async () => {
      // Arrange
      const apiCall = vi.fn().mockResolvedValue('done');
      const promise = limiter.enqueueRequest('groq', apiCall);
      // Act
      await vi.runAllTimersAsync();
      await promise;
      // Assert
      expect(limiter.isProcessing).toBe(false);
    });

    it('test_processQueue_resetsIsProcessingAfterError', async () => {
      // Arrange
      const apiCall = vi.fn().mockRejectedValue(new Error('boom'));
      // Attach catch immediately to suppress unhandled rejection
      const promise = limiter.enqueueRequest('groq', apiCall).catch(() => {});
      // Act
      await vi.runAllTimersAsync();
      await promise;
      // Assert
      expect(limiter.isProcessing).toBe(false);
    });
  });
});
