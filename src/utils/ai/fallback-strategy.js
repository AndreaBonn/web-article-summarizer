// Fallback Strategy - Gestione provider alternativi per chiamate API
import { APIOrchestrator as APIClient } from './api-orchestrator.js';

export class FallbackStrategy {
  /**
   * Determina l'ordine di fallback basato sul provider primario
   */
  getFallbackOrder(primaryProvider, apiKeys) {
    // Ordini di fallback ottimizzati per qualità e velocità
    const fallbackStrategies = {
      groq: ['groq', 'openai', 'anthropic', 'gemini'],
      openai: ['openai', 'anthropic', 'groq', 'gemini'],
      anthropic: ['anthropic', 'openai', 'groq', 'gemini'],
      gemini: ['gemini', 'openai', 'anthropic', 'groq'],
    };

    const order = fallbackStrategies[primaryProvider] || ['groq', 'openai', 'anthropic', 'gemini'];

    // Filtra solo i provider con API key configurata
    return order.filter((provider) => apiKeys[provider]);
  }

  /**
   * Chiama API con fallback automatico su altri provider.
   * @param {Object} params - Parametri della chiamata
   * @param {Function} callWithRetry - Funzione di retry da APIResilience
   * @param {Function} logFallback - Callback per logging telemetria
   */
  async callWithFallback(params, callWithRetry, logFallback) {
    const {
      primaryProvider,
      apiKeys,
      article,
      settings,
      enableFallback = false,
      onFallback = null,
    } = params;

    // Se fallback non è abilitato, usa solo il provider primario
    if (!enableFallback) {
      const result = await callWithRetry(
        () => APIClient.callAPI(primaryProvider, apiKeys[primaryProvider], article, settings),
        { onRetry: params.onRetry },
      );
      return { result, usedProvider: primaryProvider };
    }

    const fallbackOrder = this.getFallbackOrder(primaryProvider, apiKeys);

    let lastError;

    for (let i = 0; i < fallbackOrder.length; i++) {
      const provider = fallbackOrder[i];
      const apiKey = apiKeys[provider];

      // Salta provider senza API key
      if (!apiKey) continue;

      try {
        // Notifica se stiamo usando un fallback
        if (i > 0 && onFallback) {
          onFallback(provider, i);
        }

        const result = await callWithRetry(
          () => APIClient.callAPI(provider, apiKey, article, settings),
          {
            maxRetries: i === 0 ? 3 : 2, // Meno retry per i fallback
            onRetry: params.onRetry,
          },
        );

        // Log fallback success
        if (i > 0) {
          await logFallback({
            primaryProvider,
            usedProvider: provider,
            success: true,
            timestamp: Date.now(),
          });
        }

        return { result, usedProvider: provider };
      } catch (error) {
        lastError = error;

        // Log fallback failure
        if (i > 0) {
          await logFallback({
            primaryProvider,
            attemptedProvider: provider,
            success: false,
            error: error.message,
            timestamp: Date.now(),
          });
        }

        // Continua con il prossimo provider
        continue;
      }
    }

    // Tutti i provider hanno fallito
    throw new Error(`Tutti i provider hanno fallito. Ultimo errore: ${lastError?.message}`);
  }
}
