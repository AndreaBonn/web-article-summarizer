// API Orchestrator - Orchestrazione chiamate LLM multi-provider
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

export class APIOrchestrator {
  static async generateCompletion(provider, apiKey, systemPrompt, userPrompt, options = {}) {
    const { temperature = 0.3, maxTokens = 4096, model = null, responseFormat = null } = options;

    switch (provider) {
      case 'groq':
        return await ProviderCaller.callGroqCompletion(apiKey, systemPrompt, userPrompt, {
          temperature,
          maxTokens,
          model: model || DEFAULT_MODELS.groq,
          responseFormat,
        });
      case 'openai':
        return await ProviderCaller.callOpenAICompletion(apiKey, systemPrompt, userPrompt, {
          temperature,
          maxTokens,
          model: model || DEFAULT_MODELS.openai,
          responseFormat,
        });
      case 'anthropic':
        return await ProviderCaller.callAnthropicCompletion(apiKey, systemPrompt, userPrompt, {
          temperature,
          maxTokens,
          model: model || DEFAULT_MODELS.anthropic,
          responseFormat,
        });
      case 'gemini':
        return await ProviderCaller.callGeminiCompletion(apiKey, systemPrompt, userPrompt, {
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
    const prompt = PromptBuilder.buildPrompt(
      provider,
      article,
      settings,
      (a) => ContentDetector.detectContentType(a),
      (t) => ContentDetector.detectLanguage(t),
    );
    return await this.generateCompletion(provider, apiKey, prompt.systemPrompt, prompt.userPrompt, {
      temperature: 0.3,
      maxTokens: provider === 'gemini' ? 8000 : 4096,
    });
  }

  static async extractKeyPoints(provider, apiKey, article, settings) {
    const prompt = PromptBuilder.buildKeyPointsPrompt(
      provider,
      article,
      settings,
      (a) => ContentDetector.detectContentType(a),
      (t) => ContentDetector.detectLanguage(t),
    );
    return await this.generateCompletion(provider, apiKey, prompt.systemPrompt, prompt.userPrompt, {
      temperature: 0.3,
      maxTokens: provider === 'gemini' ? 8000 : 4096,
    });
  }

  // Proxy parseResponse per convenienza dei caller che usano callAPI
  static parseResponse(responseText) {
    return ResponseParser.parseResponse(responseText);
  }
}
