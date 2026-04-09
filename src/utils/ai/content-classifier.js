// Content Classifier - Sistema di riconoscimento automatico del tipo di articolo tramite AI
import { StorageManager } from '../storage/storage-manager.js';
import { APIClient } from './api-client.js';
import { PromptRegistry } from './prompt-registry.js';
import { Logger } from '../core/logger.js';

export class ContentClassifier {
  /**
   * Classifica un articolo
   */
  static async classifyArticle(article, userSelection = 'auto') {
    // Se l'utente ha selezionato manualmente, usa quella
    if (userSelection !== 'auto') {
      return { category: userSelection, method: 'manual' };
    }

    // Classificazione AI
    try {
      const aiResult = await this.aiClassification(article);
      return { ...aiResult, method: 'ai' };
    } catch (error) {
      Logger.error('Errore classificazione AI:', error);
      return { category: 'general', method: 'fallback', error: error.message };
    }
  }

  /**
   * Classificazione tramite AI
   */
  static async aiClassification(article) {
    Logger.debug('Inizio classificazione AI...');
    const settings = await StorageManager.getSettings();
    const provider = settings.selectedProvider || 'groq';
    const apiKey = await StorageManager.getApiKey(provider);

    if (!apiKey) {
      throw new Error('API key non configurata');
    }

    // Sample first 500 words for classification
    const words = article.content.split(/\s+/);
    const contentSample = words.slice(0, 500).join(' ');
    Logger.debug(
      'Content sample:',
      words.length,
      'total words,',
      Math.min(500, words.length),
      'used',
    );

    const systemPrompt = PromptRegistry.getClassificationSystemPrompt();
    const userPrompt = PromptRegistry.getClassificationUserPrompt(article, contentSample);

    Logger.debug('Invio richiesta a', provider);
    const response = await APIClient.generateCompletion(
      provider,
      apiKey,
      systemPrompt,
      userPrompt,
      {
        temperature: 0.1, // Bassa temperatura per risposte più deterministiche
        maxTokens: 20,
      },
    );

    Logger.debug('Risposta ricevuta:', response);
    const category = response.trim().toLowerCase();
    Logger.debug('Categoria estratta:', category);

    // Valida la risposta
    const validCategories = ['scientific', 'news', 'tutorial', 'business', 'opinion', 'general'];
    if (!validCategories.includes(category)) {
      Logger.warn('Categoria non valida:', category);
      throw new Error("Categoria non valida ricevuta dall'AI: " + category);
    }

    Logger.info('Classificazione completata:', category);
    return { category };
  }

  /**
   * Salva la correzione dell'utente per migliorare l'euristica
   */
  static async saveUserCorrection(articleUrl, detectedCategory, userCategory) {
    const result = await chrome.storage.local.get(['classificationCorrections']);
    const corrections = result.classificationCorrections || [];

    corrections.push({
      url: articleUrl,
      detected: detectedCategory,
      corrected: userCategory,
      timestamp: Date.now(),
    });

    // Mantieni solo le ultime 100 correzioni
    if (corrections.length > 100) {
      corrections.shift();
    }

    await chrome.storage.local.set({ classificationCorrections: corrections });
  }

  /**
   * Ottieni la categoria con label leggibile
   */
  static getCategoryLabel(category) {
    const labels = {
      auto: 'Rilevamento Automatico',
      scientific: 'Scientifico',
      news: 'News',
      tutorial: 'Tutorial',
      business: 'Business',
      opinion: 'Opinione',
      general: 'Generico',
    };
    return labels[category] || category;
  }
}
