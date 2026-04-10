// API Client - Facade che orchestra content-detector, prompt-builder, provider-caller, response-parser
import { ContentDetector } from './content-detector.js';
import { PromptBuilder } from './prompt-builder.js';
import { ProviderCaller } from './provider-caller.js';
import { ResponseParser } from './response-parser.js';

// Default models per provider — single source of truth
export const DEFAULT_MODELS = {
  groq: 'llama-3.3-70b-versatile',
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-5-20250514',
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
}
