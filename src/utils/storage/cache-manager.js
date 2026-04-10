// Cache Manager - Caching avanzato con TTL e invalidazione intelligente
import { Logger } from '../core/logger.js';

export class CacheManager {
  constructor() {
    this.defaultTTL = 7 * 24 * 60 * 60 * 1000; // 7 giorni in millisecondi
  }

  /**
   * Genera chiave cache univoca basata su URL e parametri
   */
  generateCacheKey(url, provider, settings) {
    const params = {
      url: this.normalizeUrl(url),
      provider,
      summaryLength: settings.summaryLength,
      outputLanguage: settings.outputLanguage,
      contentType: settings.contentType,
    };

    return this.hashObject(params);
  }

  /**
   * Normalizza URL per cache consistency
   */
  normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      // Rimuovi parametri di tracking comuni
      const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
      paramsToRemove.forEach((param) => urlObj.searchParams.delete(param));

      // Rimuovi hash
      urlObj.hash = '';

      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Hash FNV-1a a 52-bit di un oggetto per generare chiave cache.
   * Usa due hash indipendenti (FNV-1a con seed diversi) combinati in una chiave
   * a 52 bit per ridurre drasticamente le collisioni rispetto a djb2 a 32 bit.
   */
  hashObject(obj) {
    const str = JSON.stringify(obj);
    let h1 = 0x811c9dc5;
    let h2 = 0x01000193;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      h1 ^= c;
      h1 = Math.imul(h1, 0x01000193);
      h2 ^= c;
      h2 = Math.imul(h2, 0x811c9dc5);
    }
    const hi = (Math.abs(h1) >>> 0).toString(36);
    const lo = (Math.abs(h2) >>> 0).toString(36);
    return `cache_${hi}_${lo}`;
  }

  /**
   * Salva risultato in cache con TTL e hash contenuto
   */
  async set(url, provider, settings, data, customTTL = null, contentHash = null) {
    const cacheKey = this.generateCacheKey(url, provider, settings);
    const ttl = customTTL || this.defaultTTL;

    const cacheEntry = {
      key: cacheKey,
      url,
      provider,
      settings,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      hits: 0,
      lastAccessed: Date.now(),
      contentHash: contentHash || null,
    };

    try {
      const result = await chrome.storage.local.get(['summaryCache']);
      const cache = result.summaryCache || {};

      cache[cacheKey] = cacheEntry;

      await chrome.storage.local.set({ summaryCache: cache });

      // Log cache write
      await this.logCacheOperation('write', cacheKey, true);

      return true;
    } catch (error) {
      Logger.error('Errore nel salvare cache:', error);
      await this.logCacheOperation('write', cacheKey, false, error.message);
      return false;
    }
  }

  /**
   * Recupera risultato dalla cache con validazione contenuto
   */
  async get(url, provider, settings, contentHash = null) {
    const cacheKey = this.generateCacheKey(url, provider, settings);

    try {
      const result = await chrome.storage.local.get(['summaryCache']);
      const cache = result.summaryCache || {};

      const entry = cache[cacheKey];

      // Cache miss
      if (!entry) {
        await this.logCacheOperation('read', cacheKey, false, 'miss');
        return null;
      }

      // Cache expired
      if (Date.now() > entry.expiresAt) {
        await this.invalidate(cacheKey);
        await this.logCacheOperation('read', cacheKey, false, 'expired');
        return null;
      }

      // Validazione contenuto: se fornito un hash, verifica che corrisponda
      if (contentHash && entry.contentHash && entry.contentHash !== contentHash) {
        await this.invalidate(cacheKey);
        await this.logCacheOperation('read', cacheKey, false, 'content_changed');
        return null;
      }

      // Validazione età: se la cache è troppo vecchia (>24h), potrebbe essere obsoleta
      const cacheAge = Date.now() - entry.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 ore

      if (cacheAge > maxAge) {
        await this.logCacheOperation('read', cacheKey, true, 'old_cache');
      }

      // Cache hit — NON scrivere su disco per una lettura (performance)
      return entry.data;
    } catch (error) {
      Logger.error('Errore nel leggere cache:', error);
      await this.logCacheOperation('read', cacheKey, false, error.message);
      return null;
    }
  }

  /**
   * Invalida una entry specifica
   */
  async invalidate(cacheKey) {
    try {
      const result = await chrome.storage.local.get(['summaryCache']);
      const cache = result.summaryCache || {};

      if (cache[cacheKey]) {
        delete cache[cacheKey];
        await chrome.storage.local.set({ summaryCache: cache });
        await this.logCacheOperation('invalidate', cacheKey, true);
        return true;
      }

      return false;
    } catch (error) {
      Logger.error("Errore nell'invalidare cache:", error);
      await this.logCacheOperation('invalidate', cacheKey, false, error.message);
      return false;
    }
  }

  /**
   * Invalida tutte le entry per un URL specifico
   */
  async invalidateByUrl(url) {
    const normalizedUrl = this.normalizeUrl(url);

    try {
      const result = await chrome.storage.local.get(['summaryCache']);
      const cache = result.summaryCache || {};

      let invalidatedCount = 0;

      for (const [key, entry] of Object.entries(cache)) {
        if (this.normalizeUrl(entry.url) === normalizedUrl) {
          delete cache[key];
          invalidatedCount++;
        }
      }

      if (invalidatedCount > 0) {
        await chrome.storage.local.set({ summaryCache: cache });
      }

      return invalidatedCount;
    } catch (error) {
      Logger.error("Errore nell'invalidare cache per URL:", error);
      return 0;
    }
  }

  /**
   * Pulisci cache scadute
   */
  async cleanExpired() {
    try {
      const result = await chrome.storage.local.get(['summaryCache']);
      const cache = result.summaryCache || {};

      const now = Date.now();
      let cleanedCount = 0;

      for (const [key, entry] of Object.entries(cache)) {
        if (now > entry.expiresAt) {
          delete cache[key];
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        await chrome.storage.local.set({ summaryCache: cache });
      }

      return cleanedCount;
    } catch (error) {
      Logger.error('Errore nella pulizia cache:', error);
      return 0;
    }
  }

  /**
   * Pulisci cache LRU (Least Recently Used)
   */
  async cleanLRU(maxEntries = 100) {
    try {
      const result = await chrome.storage.local.get(['summaryCache']);
      const cache = result.summaryCache || {};

      const entries = Object.entries(cache);

      if (entries.length <= maxEntries) {
        return 0;
      }

      // Ordina per lastAccessed (più vecchi prima)
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

      // Rimuovi le entry più vecchie
      const toRemove = entries.length - maxEntries;
      const newCache = {};

      for (let i = toRemove; i < entries.length; i++) {
        newCache[entries[i][0]] = entries[i][1];
      }

      await chrome.storage.local.set({ summaryCache: newCache });

      return toRemove;
    } catch (error) {
      Logger.error('Errore nella pulizia LRU:', error);
      return 0;
    }
  }

  /**
   * Ottieni statistiche cache
   */
  async getStats() {
    try {
      const result = await chrome.storage.local.get(['summaryCache', 'cacheLogs']);
      const cache = result.summaryCache || {};
      const logs = result.cacheLogs || [];

      const entries = Object.values(cache);
      const now = Date.now();

      const totalEntries = entries.length;
      const expiredEntries = entries.filter((e) => now > e.expiresAt).length;
      const validEntries = totalEntries - expiredEntries;

      const totalHits = entries.reduce((sum, e) => sum + e.hits, 0);
      const avgHits = totalEntries > 0 ? (totalHits / totalEntries).toFixed(1) : 0;

      // Calcola hit rate dai log
      const recentLogs = logs.slice(-100);
      const reads = recentLogs.filter((l) => l.operation === 'read');
      const hits = reads.filter((l) => l.success).length;
      const hitRate = reads.length > 0 ? ((hits / reads.length) * 100).toFixed(1) : 0;

      // Calcola dimensione approssimativa
      const sizeBytes = new Blob([JSON.stringify(cache)]).size;
      const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);

      // Entry più popolari
      const topEntries = entries
        .sort((a, b) => b.hits - a.hits)
        .slice(0, 5)
        .map((e) => ({
          url: e.url,
          provider: e.provider,
          hits: e.hits,
          age: this.formatAge(now - e.timestamp),
        }));

      return {
        totalEntries,
        validEntries,
        expiredEntries,
        totalHits,
        avgHits: parseFloat(avgHits),
        hitRate: parseFloat(hitRate),
        sizeMB: parseFloat(sizeMB),
        topEntries,
      };
    } catch (error) {
      Logger.error('Errore nel calcolare statistiche cache:', error);
      return null;
    }
  }

  /**
   * Formatta età in formato leggibile
   */
  formatAge(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}g`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }

  /**
   * Log operazione cache per telemetria
   */
  async logCacheOperation(operation, key, success, reason = null) {
    try {
      const result = await chrome.storage.local.get(['cacheLogs']);
      const logs = result.cacheLogs || [];

      logs.push({
        operation,
        key,
        success,
        reason,
        timestamp: Date.now(),
      });

      // Mantieni solo gli ultimi 200 log
      if (logs.length > 200) {
        logs.shift();
      }

      await chrome.storage.local.set({ cacheLogs: logs });
    } catch (error) {
      Logger.error('Errore nel salvare log cache:', error);
    }
  }

  /**
   * Pulisci tutti i log
   */
  async clearLogs() {
    await chrome.storage.local.remove(['cacheLogs']);
  }

  /**
   * Pulisci tutta la cache
   */
  async clearAll() {
    await chrome.storage.local.remove(['summaryCache']);
  }

  /**
   * Configura TTL personalizzato
   */
  setDefaultTTL(days) {
    this.defaultTTL = days * 24 * 60 * 60 * 1000;
  }

  /**
   * Ottieni TTL configurato
   */
  getDefaultTTL() {
    return Math.floor(this.defaultTTL / (24 * 60 * 60 * 1000));
  }

  /**
   * Genera hash semplice del contenuto per validazione
   */
  static hashContent(content) {
    if (!content) return null;

    // Usa i primi 500 caratteri per l'hash (più veloce)
    const sample = content.substring(0, 500);

    let hash = 0;
    for (let i = 0; i < sample.length; i++) {
      const char = sample.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(36);
  }

  /**
   * Invalida cache per URL se il contenuto è cambiato
   */
  async invalidateIfContentChanged(url, newContentHash) {
    const normalizedUrl = this.normalizeUrl(url);

    try {
      const result = await chrome.storage.local.get(['summaryCache']);
      const cache = result.summaryCache || {};

      let invalidatedCount = 0;

      for (const [key, entry] of Object.entries(cache)) {
        if (this.normalizeUrl(entry.url) === normalizedUrl) {
          // Se l'hash è diverso, invalida
          if (entry.contentHash && entry.contentHash !== newContentHash) {
            delete cache[key];
            invalidatedCount++;
          }
        }
      }

      if (invalidatedCount > 0) {
        await chrome.storage.local.set({ summaryCache: cache });
      }

      return invalidatedCount;
    } catch (error) {
      Logger.error("Errore nell'invalidare cache per contenuto:", error);
      return 0;
    }
  }
}
