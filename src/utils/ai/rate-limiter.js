// Rate Limiter - Gestione code e token bucket per rate limiting API

export class RateLimiter {
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

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
