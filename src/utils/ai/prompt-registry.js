// Prompt Registry — facade che delega ai sotto-moduli per tipo di prompt.
// API pubblica invariata: 4 metodi statici identici alla versione precedente.

import { getSummaryPrompt } from './prompts/summary-prompts.js';
import { getKeyPointsPrompt } from './prompts/keypoints-prompts.js';
import { getTranslationPrompt } from './prompts/translation-prompts.js';
import { getCitationPrompt } from './prompts/citation-prompts.js';

export class PromptRegistry {
  /**
   * @param {string} provider     - 'gemini' | 'groq' | 'openai' | 'anthropic'
   * @param {string} contentType  - 'general' | 'scientific' | 'news' | 'tutorial' | 'business' | 'opinion'
   * @returns {string}
   */
  static getSummarySystemPrompt(provider, contentType) {
    return getSummaryPrompt(provider, contentType);
  }

  /**
   * @param {string} provider     - 'gemini' | 'groq' | 'openai' | 'anthropic'
   * @param {string} contentType  - 'general' | 'scientific' | 'news' | 'tutorial' | 'business' | 'opinion'
   * @returns {string}
   */
  static getKeyPointsSystemPrompt(provider, contentType) {
    return getKeyPointsPrompt(provider, contentType);
  }

  /**
   * @param {string} provider     - 'gemini' | 'groq' | 'openai' | 'anthropic'
   * @param {string} contentType  - 'general' | 'scientific' | 'news' | 'tutorial' | 'business' | 'opinion'
   * @returns {string}
   */
  static getTranslationSystemPrompt(provider, contentType) {
    return getTranslationPrompt(provider, contentType);
  }

  /**
   * @param {string} provider - 'gemini' | 'groq' | 'openai' | 'anthropic'
   * @returns {string}
   */
  static getCitationSystemPrompt(provider) {
    return getCitationPrompt(provider);
  }
}
