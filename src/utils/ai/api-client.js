// API Client - Facade che orchestra content-detector, prompt-builder, provider-caller, response-parser
import { APIResilience } from './api-resilience.js';
import { CacheManager } from '../storage/cache-manager.js';
import { ContentDetector } from './content-detector.js';
import { PromptBuilder } from './prompt-builder.js';
import { ProviderCaller } from './provider-caller.js';
import { ResponseParser } from './response-parser.js';

// Default models per provider — single source of truth
export const DEFAULT_MODELS = {
  groq: 'llama-3.3-70b-versatile',
  openai: 'gpt-4o',
  anthropic: 'claude-3-5-sonnet-20241022',
  gemini: 'gemini-2.5-pro',
};

export class APIClient {
  // --- Deleghe a ContentDetector ---

  static detectContentType(article) {
    return ContentDetector.detectContentType(article);
  }

  static detectLanguage(text) {
    return ContentDetector.detectLanguage(text);
  }

  // --- Deleghe a PromptBuilder ---

  static getSystemPrompt(provider, contentType) {
    return PromptBuilder.getSystemPrompt(provider, contentType);
  }

  static getKeyPointsSystemPrompt(provider, contentType) {
    return PromptBuilder.getKeyPointsSystemPrompt(provider, contentType);
  }

  static formatArticleForPrompt(article) {
    return PromptBuilder.formatArticleForPrompt(article);
  }

  static buildPrompt(provider, article, settings) {
    return PromptBuilder.buildPrompt(
      provider,
      article,
      settings,
      (a) => ContentDetector.detectContentType(a),
      (t) => ContentDetector.detectLanguage(t),
    );
  }

  static buildKeyPointsPrompt(provider, article, settings) {
    return PromptBuilder.buildKeyPointsPrompt(
      provider,
      article,
      settings,
      (a) => ContentDetector.detectContentType(a),
      (t) => ContentDetector.detectLanguage(t),
    );
  }

  static buildKeyPointsUserPrompt(contentType, formattedArticle, article, outputLang) {
    return PromptBuilder.buildKeyPointsUserPrompt(
      contentType,
      formattedArticle,
      article,
      outputLang,
    );
  }

  // --- Deleghe a ResponseParser ---

  static parseResponse(responseText) {
    return ResponseParser.parseResponse(responseText);
  }

  static parseKeyPointsResponse(responseText) {
    return ResponseParser.parseKeyPointsResponse(responseText);
  }

  // --- Deleghe a ProviderCaller ---

  static async _fetchWithTimeout(url, options, timeoutMs = 60000) {
    return ProviderCaller._fetchWithTimeout(url, options, timeoutMs);
  }

  static _validateChoicesResponse(data, provider) {
    return ProviderCaller._validateChoicesResponse(data, provider);
  }

  static async callGroqCompletion(apiKey, systemPrompt, userPrompt, options) {
    return ProviderCaller.callGroqCompletion(apiKey, systemPrompt, userPrompt, options);
  }

  static async callOpenAICompletion(apiKey, systemPrompt, userPrompt, options) {
    return ProviderCaller.callOpenAICompletion(apiKey, systemPrompt, userPrompt, options);
  }

  static async callAnthropicCompletion(apiKey, systemPrompt, userPrompt, options) {
    return ProviderCaller.callAnthropicCompletion(apiKey, systemPrompt, userPrompt, options);
  }

  static extractGeminiText(data) {
    return ProviderCaller.extractGeminiText(data);
  }

  static async callGeminiCompletion(apiKey, systemPrompt, userPrompt, options) {
    return ProviderCaller.callGeminiCompletion(apiKey, systemPrompt, userPrompt, options);
  }

  // --- Orchestrazione principale ---

  static async generateCompletion(provider, apiKey, systemPrompt, userPrompt, options = {}) {
    const { temperature = 0.3, maxTokens = 4096, model = null, responseFormat = null } = options;

    switch (provider) {
      case 'groq':
        return await this.callGroqCompletion(apiKey, systemPrompt, userPrompt, {
          temperature,
          maxTokens,
          model: model || DEFAULT_MODELS.groq,
          responseFormat,
        });
      case 'openai':
        return await this.callOpenAICompletion(apiKey, systemPrompt, userPrompt, {
          temperature,
          maxTokens,
          model: model || DEFAULT_MODELS.openai,
          responseFormat,
        });
      case 'anthropic':
        return await this.callAnthropicCompletion(apiKey, systemPrompt, userPrompt, {
          temperature,
          maxTokens,
          model: model || DEFAULT_MODELS.anthropic,
          responseFormat,
        });
      case 'gemini':
        return await this.callGeminiCompletion(apiKey, systemPrompt, userPrompt, {
          temperature,
          maxTokens,
          model: model || DEFAULT_MODELS.gemini,
          responseFormat,
        });
      default:
        throw new Error('Provider non supportato');
    }
  }

  static async callAPI(provider, apiKey, article, settings) {
    const prompt = this.buildPrompt(provider, article, settings);
    return await this.generateCompletion(provider, apiKey, prompt.systemPrompt, prompt.userPrompt, {
      temperature: 0.3,
      maxTokens: provider === 'gemini' ? 8000 : 4096,
    });
  }

  static async extractKeyPoints(provider, apiKey, article, settings) {
    const prompt = this.buildKeyPointsPrompt(provider, article, settings);
    return await this.generateCompletion(provider, apiKey, prompt.systemPrompt, prompt.userPrompt, {
      temperature: 0.3,
      maxTokens: provider === 'gemini' ? 8000 : 4096,
    });
  }

  /**
   * Chiama API con resilienza completa (retry, fallback, cache, rate limiting)
   * @param {Object} params - Parametri della chiamata
   * @returns {Promise} Risultato con metadata
   */
  static async callAPIResilient(params) {
    const {
      provider,
      apiKeys,
      article,
      settings,
      enableCache = true,
      enableFallback = false,
      onProgress = null,
    } = params;

    // Inizializza manager
    const resilience = new APIResilience();
    const cacheManager = new CacheManager();

    // 1. Controlla cache
    if (enableCache) {
      if (onProgress) onProgress({ stage: 'cache', message: 'Controllo cache...' });

      const cached = await cacheManager.get(article.url, provider, settings);
      if (cached) {
        if (onProgress)
          onProgress({
            stage: 'cache',
            message: 'Risultato trovato in cache!',
          });
        return {
          result: cached,
          fromCache: true,
          provider: provider,
        };
      }
    }

    // 2. Chiama API con resilienza
    if (onProgress) onProgress({ stage: 'api', message: 'Chiamata API in corso...' });

    const result = await resilience.callWithFallback({
      primaryProvider: provider,
      apiKeys,
      article,
      settings,
      enableFallback,
      onRetry: (attempt, maxAttempts, delay) => {
        if (onProgress) {
          onProgress({
            stage: 'retry',
            message: `Tentativo ${attempt}/${maxAttempts}... (attesa ${Math.round(delay / 1000)}s)`,
          });
        }
      },
      onFallback: (fallbackProvider, _index) => {
        if (onProgress) {
          onProgress({
            stage: 'fallback',
            message: `Passaggio a provider alternativo: ${fallbackProvider}`,
          });
        }
      },
    });

    // 3. Salva in cache
    if (enableCache && result.result) {
      await cacheManager.set(article.url, result.usedProvider, settings, result.result);
    }

    if (onProgress) onProgress({ stage: 'complete', message: 'Completato!' });

    return {
      result: result.result,
      fromCache: false,
      provider: result.usedProvider,
    };
  }
}
