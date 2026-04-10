// Cache Manager - Facade che compone CacheStore e CacheStats
import { CacheStore } from './cache-store.js';
import { CacheStats } from './cache-stats.js';

export class CacheManager extends CacheStore {
  constructor() {
    super();
    this._stats = new CacheStats();
  }

  /**
   * Ottieni statistiche cache (delegato a CacheStats)
   */
  async getStats() {
    return this._stats.getStats();
  }

  /**
   * Formatta età in formato leggibile (delegato a CacheStats)
   */
  formatAge(ms) {
    return this._stats.formatAge(ms);
  }

  /**
   * Log operazione cache (override: usa CacheStats per coerenza)
   */
  async logCacheOperation(operation, key, success, reason = null) {
    return this._stats.logCacheOperation(operation, key, success, reason);
  }

  /**
   * Pulisci tutti i log (delegato a CacheStats)
   */
  async clearLogs() {
    return this._stats.clearLogs();
  }
}
