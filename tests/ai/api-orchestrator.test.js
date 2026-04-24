import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all external dependencies before importing the module under test
vi.mock('@utils/ai/provider-caller.js', () => ({
  ProviderCaller: {
    callGroqCompletion: vi.fn(),
    callOpenAICompletion: vi.fn(),
    callAnthropicCompletion: vi.fn(),
    callGeminiCompletion: vi.fn(),
  },
}));

vi.mock('@utils/ai/prompt-builder.js', () => ({
  PromptBuilder: {
    buildPrompt: vi.fn(),
    buildKeyPointsPrompt: vi.fn(),
  },
}));

vi.mock('@utils/ai/content-detector.js', () => ({
  ContentDetector: {
    detectContentType: vi.fn().mockReturnValue('general'),
    detectLanguage: vi.fn().mockReturnValue('it'),
  },
}));

vi.mock('@utils/ai/response-parser.js', () => ({
  ResponseParser: {
    parseResponse: vi.fn((text) => ({ parsed: text })),
  },
}));

import { APIOrchestrator, DEFAULT_MODELS } from '@utils/ai/api-orchestrator.js';
import { ProviderCaller } from '@utils/ai/provider-caller.js';
import { PromptBuilder } from '@utils/ai/prompt-builder.js';
import { ResponseParser } from '@utils/ai/response-parser.js';

describe('APIOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // DEFAULT_MODELS
  // ---------------------------------------------------------------------------

  describe('DEFAULT_MODELS', () => {
    it('exports default models for all four providers', () => {
      expect(DEFAULT_MODELS).toHaveProperty('groq');
      expect(DEFAULT_MODELS).toHaveProperty('openai');
      expect(DEFAULT_MODELS).toHaveProperty('anthropic');
      expect(DEFAULT_MODELS).toHaveProperty('gemini');
    });

    it('groq default model is a non-empty string', () => {
      expect(typeof DEFAULT_MODELS.groq).toBe('string');
      expect(DEFAULT_MODELS.groq.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // generateCompletion — provider routing
  // ---------------------------------------------------------------------------

  describe('generateCompletion', () => {
    it('routes groq provider to ProviderCaller.callGroqCompletion', async () => {
      ProviderCaller.callGroqCompletion.mockResolvedValue('groq result');

      const result = await APIOrchestrator.generateCompletion('groq', 'key', 'sys', 'user');

      expect(ProviderCaller.callGroqCompletion).toHaveBeenCalledOnce();
      expect(result).toBe('groq result');
    });

    it('routes openai provider to ProviderCaller.callOpenAICompletion', async () => {
      ProviderCaller.callOpenAICompletion.mockResolvedValue('openai result');

      const result = await APIOrchestrator.generateCompletion('openai', 'key', 'sys', 'user');

      expect(ProviderCaller.callOpenAICompletion).toHaveBeenCalledOnce();
      expect(result).toBe('openai result');
    });

    it('routes anthropic provider to ProviderCaller.callAnthropicCompletion', async () => {
      ProviderCaller.callAnthropicCompletion.mockResolvedValue('anthropic result');

      const result = await APIOrchestrator.generateCompletion('anthropic', 'key', 'sys', 'user');

      expect(ProviderCaller.callAnthropicCompletion).toHaveBeenCalledOnce();
      expect(result).toBe('anthropic result');
    });

    it('routes gemini provider to ProviderCaller.callGeminiCompletion', async () => {
      ProviderCaller.callGeminiCompletion.mockResolvedValue('gemini result');

      const result = await APIOrchestrator.generateCompletion('gemini', 'key', 'sys', 'user');

      expect(ProviderCaller.callGeminiCompletion).toHaveBeenCalledOnce();
      expect(result).toBe('gemini result');
    });

    it('throws on unsupported provider', async () => {
      await expect(
        APIOrchestrator.generateCompletion('unknown', 'key', 'sys', 'user'),
      ).rejects.toThrow('Provider non supportato');
    });

    it('uses DEFAULT_MODELS.groq when no model option provided', async () => {
      ProviderCaller.callGroqCompletion.mockResolvedValue('ok');

      await APIOrchestrator.generateCompletion('groq', 'key', 'sys', 'user');

      const [, , , opts] = ProviderCaller.callGroqCompletion.mock.calls[0];
      expect(opts.model).toBe(DEFAULT_MODELS.groq);
    });

    it('uses custom model when provided via options', async () => {
      ProviderCaller.callGroqCompletion.mockResolvedValue('ok');

      await APIOrchestrator.generateCompletion('groq', 'key', 'sys', 'user', {
        model: 'custom-model-xyz',
      });

      const [, , , opts] = ProviderCaller.callGroqCompletion.mock.calls[0];
      expect(opts.model).toBe('custom-model-xyz');
    });

    it('passes temperature and maxTokens options to provider caller', async () => {
      ProviderCaller.callOpenAICompletion.mockResolvedValue('ok');

      await APIOrchestrator.generateCompletion('openai', 'key', 'sys', 'user', {
        temperature: 0.7,
        maxTokens: 2048,
      });

      const [, , , opts] = ProviderCaller.callOpenAICompletion.mock.calls[0];
      expect(opts.temperature).toBe(0.7);
      expect(opts.maxTokens).toBe(2048);
    });

    it('passes responseFormat option to provider caller', async () => {
      ProviderCaller.callGroqCompletion.mockResolvedValue('ok');

      await APIOrchestrator.generateCompletion('groq', 'key', 'sys', 'user', {
        responseFormat: 'json',
      });

      const [, , , opts] = ProviderCaller.callGroqCompletion.mock.calls[0];
      expect(opts.responseFormat).toBe('json');
    });

    it('uses default temperature 0.3 when not specified', async () => {
      ProviderCaller.callGroqCompletion.mockResolvedValue('ok');

      await APIOrchestrator.generateCompletion('groq', 'key', 'sys', 'user');

      const [, , , opts] = ProviderCaller.callGroqCompletion.mock.calls[0];
      expect(opts.temperature).toBe(0.3);
    });

    it('uses default maxTokens 4096 when not specified', async () => {
      ProviderCaller.callGroqCompletion.mockResolvedValue('ok');

      await APIOrchestrator.generateCompletion('groq', 'key', 'sys', 'user');

      const [, , , opts] = ProviderCaller.callGroqCompletion.mock.calls[0];
      expect(opts.maxTokens).toBe(4096);
    });

    it('propagates provider caller errors', async () => {
      ProviderCaller.callAnthropicCompletion.mockRejectedValue(new Error('API error'));

      await expect(
        APIOrchestrator.generateCompletion('anthropic', 'key', 'sys', 'user'),
      ).rejects.toThrow('API error');
    });

    it('uses DEFAULT_MODELS.gemini when no model option provided for gemini', async () => {
      ProviderCaller.callGeminiCompletion.mockResolvedValue('ok');

      await APIOrchestrator.generateCompletion('gemini', 'key', 'sys', 'user');

      const [, , , opts] = ProviderCaller.callGeminiCompletion.mock.calls[0];
      expect(opts.model).toBe(DEFAULT_MODELS.gemini);
    });
  });

  // ---------------------------------------------------------------------------
  // callAPI
  // ---------------------------------------------------------------------------

  describe('callAPI', () => {
    beforeEach(() => {
      PromptBuilder.buildPrompt.mockReturnValue({
        systemPrompt: 'built-sys',
        userPrompt: 'built-user',
      });
      ProviderCaller.callGroqCompletion.mockResolvedValue('api result');
    });

    it('delegates prompt building to PromptBuilder.buildPrompt', async () => {
      const article = { title: 'Test', content: 'content' };
      const settings = { outputLanguage: 'it' };

      await APIOrchestrator.callAPI('groq', 'key', article, settings);

      expect(PromptBuilder.buildPrompt).toHaveBeenCalledOnce();
      const [provider, art, sett] = PromptBuilder.buildPrompt.mock.calls[0];
      expect(provider).toBe('groq');
      expect(art).toBe(article);
      expect(sett).toBe(settings);
    });

    it('passes built prompts to generateCompletion', async () => {
      await APIOrchestrator.callAPI('groq', 'key', {}, {});

      expect(ProviderCaller.callGroqCompletion).toHaveBeenCalledOnce();
      const [, sys, user] = ProviderCaller.callGroqCompletion.mock.calls[0];
      expect(sys).toBe('built-sys');
      expect(user).toBe('built-user');
    });

    it('uses maxTokens 8000 for gemini provider', async () => {
      PromptBuilder.buildPrompt.mockReturnValue({ systemPrompt: 'sys', userPrompt: 'usr' });
      ProviderCaller.callGeminiCompletion.mockResolvedValue('gemini out');

      await APIOrchestrator.callAPI('gemini', 'key', {}, {});

      const [, , , opts] = ProviderCaller.callGeminiCompletion.mock.calls[0];
      expect(opts.maxTokens).toBe(8000);
    });

    it('uses maxTokens 4096 for non-gemini providers', async () => {
      await APIOrchestrator.callAPI('groq', 'key', {}, {});

      const [, , , opts] = ProviderCaller.callGroqCompletion.mock.calls[0];
      expect(opts.maxTokens).toBe(4096);
    });

    it('returns result from generateCompletion', async () => {
      const result = await APIOrchestrator.callAPI('groq', 'key', {}, {});
      expect(result).toBe('api result');
    });
  });

  // ---------------------------------------------------------------------------
  // extractKeyPoints
  // ---------------------------------------------------------------------------

  describe('extractKeyPoints', () => {
    beforeEach(() => {
      PromptBuilder.buildKeyPointsPrompt.mockReturnValue({
        systemPrompt: 'kp-sys',
        userPrompt: 'kp-user',
      });
      ProviderCaller.callGroqCompletion.mockResolvedValue('key points result');
    });

    it('delegates prompt building to PromptBuilder.buildKeyPointsPrompt', async () => {
      const article = { title: 'KP', content: 'some content' };
      const settings = {};

      await APIOrchestrator.extractKeyPoints('groq', 'key', article, settings);

      expect(PromptBuilder.buildKeyPointsPrompt).toHaveBeenCalledOnce();
    });

    it('returns extracted key points', async () => {
      const result = await APIOrchestrator.extractKeyPoints('groq', 'key', {}, {});
      expect(result).toBe('key points result');
    });

    it('uses maxTokens 8000 for gemini', async () => {
      PromptBuilder.buildKeyPointsPrompt.mockReturnValue({
        systemPrompt: 'sys',
        userPrompt: 'usr',
      });
      ProviderCaller.callGeminiCompletion.mockResolvedValue('gemini kp');

      await APIOrchestrator.extractKeyPoints('gemini', 'key', {}, {});

      const [, , , opts] = ProviderCaller.callGeminiCompletion.mock.calls[0];
      expect(opts.maxTokens).toBe(8000);
    });
  });

  // ---------------------------------------------------------------------------
  // parseResponse
  // ---------------------------------------------------------------------------

  describe('parseResponse', () => {
    it('delegates to ResponseParser.parseResponse', () => {
      const result = APIOrchestrator.parseResponse('some text');
      expect(ResponseParser.parseResponse).toHaveBeenCalledWith('some text');
      expect(result).toEqual({ parsed: 'some text' });
    });

    it('passes through empty string', () => {
      APIOrchestrator.parseResponse('');
      expect(ResponseParser.parseResponse).toHaveBeenCalledWith('');
    });
  });

  // ---------------------------------------------------------------------------
  // callAPI — content detection callbacks
  // ---------------------------------------------------------------------------

  describe('callAPI — content detection', () => {
    beforeEach(() => {
      PromptBuilder.buildPrompt.mockReturnValue({
        systemPrompt: 'sys',
        userPrompt: 'usr',
      });
      ProviderCaller.callGroqCompletion.mockResolvedValue('result');
    });

    it('passes ContentDetector.detectContentType as callback to PromptBuilder', async () => {
      await APIOrchestrator.callAPI('groq', 'key', {}, {});

      const [, , , detectContentTypeCb, detectLanguageCb] = PromptBuilder.buildPrompt.mock.calls[0];
      expect(typeof detectContentTypeCb).toBe('function');
      expect(typeof detectLanguageCb).toBe('function');
    });

    it('callAPI detectContentType callback delegates to ContentDetector', async () => {
      await APIOrchestrator.callAPI('groq', 'key', {}, {});

      const [, , , detectContentTypeCb, detectLanguageCb] = PromptBuilder.buildPrompt.mock.calls[0];
      const contentResult = detectContentTypeCb({ title: 'Test' });
      expect(contentResult).toBe('general');

      const langResult = detectLanguageCb('testo in italiano');
      expect(langResult).toBe('it');
    });
  });

  // ---------------------------------------------------------------------------
  // extractKeyPoints — content detection callbacks
  // ---------------------------------------------------------------------------

  describe('extractKeyPoints — content detection', () => {
    beforeEach(() => {
      PromptBuilder.buildKeyPointsPrompt.mockReturnValue({
        systemPrompt: 'kp-sys',
        userPrompt: 'kp-usr',
      });
      ProviderCaller.callOpenAICompletion.mockResolvedValue('kp result');
    });

    it('passes ContentDetector callbacks to PromptBuilder.buildKeyPointsPrompt', async () => {
      await APIOrchestrator.extractKeyPoints('openai', 'key', {}, {});

      const [, , , detectContentTypeCb, detectLanguageCb] =
        PromptBuilder.buildKeyPointsPrompt.mock.calls[0];
      expect(typeof detectContentTypeCb).toBe('function');
      expect(typeof detectLanguageCb).toBe('function');

      // Invoke callbacks to cover arrow functions at lines 72-73
      const contentResult = detectContentTypeCb({ title: 'KP' });
      expect(contentResult).toBe('general');

      const langResult = detectLanguageCb('english text');
      expect(langResult).toBe('it');
    });

    it('extractKeyPoints uses maxTokens 4096 for non-gemini', async () => {
      await APIOrchestrator.extractKeyPoints('openai', 'key', {}, {});

      const [, , , opts] = ProviderCaller.callOpenAICompletion.mock.calls[0];
      expect(opts.maxTokens).toBe(4096);
    });
  });
});
