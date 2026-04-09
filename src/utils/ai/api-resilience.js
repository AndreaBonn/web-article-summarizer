// API Resilience Manager - Retry Logic, Fallback Providers, Rate Limiting
import { APIClient } from './api-client.js';

export class APIResilience {
  constructor() {
    this.requestQueue = [];
    this.isProcessing = false;
    this.rateLimits = {
      groq: { requestsPerMinute: 30, tokens: 30, lastReset: Date.now() },
      openai: { requestsPerMinute: 60, tokens: 60, lastReset: Date.now() },
      anthropic: { requestsPerMinute: 50, tokens: 50, lastReset: Date.now() },
      gemini: { requestsPerMinute: 60, tokens: 60, lastReset: Date.now() },
    };
  }

  // Errori temporanei che richiedono retry
  static TEMPORARY_ERRORS = [429, 500, 502, 503, 504];

  // Errori permanenti che non richiedono retry
  static PERMANENT_ERRORS = [400, 401, 403, 404];

  /**
   * Chiama API con retry logic e exponential backoff
   * @param {Function} apiCall - Funzione che esegue la chiamata API
   * @param {Object} options - Opzioni di retry
   * @returns {Promise} Risultato della chiamata API
   */
  async callWithRetry(apiCall, options = {}) {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 8000,
      backoffMultiplier = 2,
      onRetry = null,
    } = options;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await apiCall();

        // Log successo
        await this.logApiCall({
          success: true,
          attempt: attempt + 1,
          timestamp: Date.now(),
        });

        return result;
      } catch (error) {
        lastError = error;

        // Estrai status code dall'errore
        const statusCode = this.extractStatusCode(error);

        // Se è un errore permanente, non fare retry
        if (APIResilience.PERMANENT_ERRORS.includes(statusCode)) {
          await this.logApiCall({
            success: false,
            error: error.message,
            statusCode,
            permanent: true,
            timestamp: Date.now(),
          });
          throw error;
        }

        // Se è l'ultimo tentativo, lancia l'errore
        if (attempt === maxRetries) {
          await this.logApiCall({
            success: false,
            error: error.message,
            statusCode,
            attempts: maxRetries + 1,
            timestamp: Date.now(),
          });
          throw error;
        }

        // Calcola delay con exponential backoff
        const delay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt), maxDelay);

        // Callback per notificare il retry
        if (onRetry) {
          onRetry(attempt + 1, maxRetries + 1, delay);
        }

        // Log retry
        await this.logApiCall({
          success: false,
          error: error.message,
          statusCode,
          attempt: attempt + 1,
          retrying: true,
          delay,
          timestamp: Date.now(),
        });

        // Aspetta prima di riprovare
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Chiama API con fallback automatico su altri provider
   * @param {Object} params - Parametri della chiamata
   * @returns {Promise} Risultato della chiamata API
   */
  async callWithFallback(params) {
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
      return await this.callWithRetry(
        () => APIClient.callAPI(primaryProvider, apiKeys[primaryProvider], article, settings),
        { onRetry: params.onRetry },
      );
    }

    // Ordine di fallback basato sul provider primario
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

        const result = await this.callWithRetry(
          () => APIClient.callAPI(provider, apiKey, article, settings),
          {
            maxRetries: i === 0 ? 3 : 2, // Meno retry per i fallback
            onRetry: params.onRetry,
          },
        );

        // Log fallback success
        if (i > 0) {
          await this.logFallback({
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
          await this.logFallback({
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
   * Accoda richiesta e gestisce rate limiting
   */
  async enqueueRequest(provider, apiCall, onQueueUpdate = null) {
    return new Promise((resolve, reject) => {
      const request = {
        provider,
        apiCall,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      this.requestQueue.push(request);

      if (onQueueUpdate) {
        onQueueUpdate(this.requestQueue.length);
      }

      this.processQueue(onQueueUpdate);
    });
  }

  /**
   * Processa la coda di richieste rispettando i rate limits
   */
  async processQueue(onQueueUpdate = null) {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue[0];
      const provider = request.provider;

      // Controlla rate limit
      if (!this.canMakeRequest(provider)) {
        const waitTime = this.getWaitTime(provider);
        await this.sleep(waitTime);
        continue;
      }

      // Rimuovi dalla coda
      this.requestQueue.shift();

      if (onQueueUpdate) {
        onQueueUpdate(this.requestQueue.length);
      }

      // Esegui richiesta
      try {
        this.consumeToken(provider);
        const result = await request.apiCall();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Controlla se possiamo fare una richiesta al provider
   */
  canMakeRequest(provider) {
    const limit = this.rateLimits[provider];
    if (!limit) return true;

    // Reset tokens se è passato un minuto
    const now = Date.now();
    if (now - limit.lastReset >= 60000) {
      limit.tokens = limit.requestsPerMinute;
      limit.lastReset = now;
    }

    return limit.tokens > 0;
  }

  /**
   * Consuma un token dal rate limit
   */
  consumeToken(provider) {
    const limit = this.rateLimits[provider];
    if (limit && limit.tokens > 0) {
      limit.tokens--;
    }
  }

  /**
   * Calcola tempo di attesa per il prossimo token
   */
  getWaitTime(provider) {
    const limit = this.rateLimits[provider];
    if (!limit) return 0;

    const timeSinceReset = Date.now() - limit.lastReset;
    const timeUntilReset = 60000 - timeSinceReset;

    return Math.max(timeUntilReset, 1000);
  }

  /**
   * Estrae status code dall'errore
   */
  extractStatusCode(error) {
    // Priorità 1: proprietà status dell'errore (più affidabile della regex)
    if (error.status) {
      return error.status;
    }

    // Priorità 2: cerca pattern HTTP status espliciti nel messaggio
    const message = error.message || '';
    const match =
      message.match(/\b(?:status|code|errore)\s*:?\s*(4\d{2}|5\d{2})\b/i) ||
      message.match(/^(4\d{2}|5\d{2})\b/);
    if (match) {
      return parseInt(match[1]);
    }

    return null;
  }

  /**
   * Log chiamata API per telemetria
   */
  async logApiCall(logEntry) {
    try {
      const result = await chrome.storage.local.get(['apiLogs']);
      const logs = result.apiLogs || [];

      // Mantieni solo gli ultimi 100 log
      logs.push(logEntry);
      if (logs.length > 100) {
        logs.shift();
      }

      await chrome.storage.local.set({ apiLogs: logs });
    } catch (error) {
      console.error('Errore nel salvare log API:', error);
    }
  }

  /**
   * Log fallback per telemetria
   */
  async logFallback(logEntry) {
    try {
      const result = await chrome.storage.local.get(['fallbackLogs']);
      const logs = result.fallbackLogs || [];

      logs.push(logEntry);
      if (logs.length > 50) {
        logs.shift();
      }

      await chrome.storage.local.set({ fallbackLogs: logs });
    } catch (error) {
      console.error('Errore nel salvare log fallback:', error);
    }
  }

  /**
   * Ottieni statistiche API
   */
  async getStats() {
    const result = await chrome.storage.local.get(['apiLogs', 'fallbackLogs']);
    const apiLogs = result.apiLogs || [];
    const fallbackLogs = result.fallbackLogs || [];

    const successCount = apiLogs.filter((log) => log.success).length;
    const failureCount = apiLogs.filter((log) => !log.success && !log.retrying).length;
    const retryCount = apiLogs.filter((log) => log.retrying).length;
    const fallbackCount = fallbackLogs.length;

    const successRate = apiLogs.length > 0 ? ((successCount / apiLogs.length) * 100).toFixed(1) : 0;

    return {
      totalCalls: apiLogs.length,
      successCount,
      failureCount,
      retryCount,
      fallbackCount,
      successRate: parseFloat(successRate),
      recentLogs: apiLogs.slice(-10),
      recentFallbacks: fallbackLogs.slice(-10),
    };
  }

  /**
   * Pulisci log vecchi
   */
  async clearLogs() {
    await chrome.storage.local.remove(['apiLogs', 'fallbackLogs']);
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
