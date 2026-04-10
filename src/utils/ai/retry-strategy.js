// Retry Strategy - Retry con exponential backoff per chiamate API

// Errori temporanei che richiedono retry
export const TEMPORARY_ERRORS = [429, 500, 502, 503, 504];

// Errori permanenti che non richiedono retry
export const PERMANENT_ERRORS = [400, 401, 403, 404];

export class RetryStrategy {
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
   * Chiama API con retry logic e exponential backoff.
   * @param {Function} apiCall - Funzione che esegue la chiamata API
   * @param {Object} options - Opzioni di retry
   * @param {Function} logApiCall - Callback per logging telemetria
   */
  async callWithRetry(apiCall, options = {}, logApiCall) {
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

        await logApiCall({
          success: true,
          attempt: attempt + 1,
          timestamp: Date.now(),
        });

        return result;
      } catch (error) {
        lastError = error;

        const statusCode = this.extractStatusCode(error);

        // Se è un errore permanente, non fare retry
        if (PERMANENT_ERRORS.includes(statusCode)) {
          await logApiCall({
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
          await logApiCall({
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

        if (onRetry) {
          onRetry(attempt + 1, maxRetries + 1, delay);
        }

        await logApiCall({
          success: false,
          error: error.message,
          statusCode,
          attempt: attempt + 1,
          retrying: true,
          delay,
          timestamp: Date.now(),
        });

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
