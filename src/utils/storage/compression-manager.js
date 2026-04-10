// Compression Manager - Compressione dati con LZ-String
// LZ-String è opzionale: se non disponibile, i dati passano senza compressione.
import LZString from 'lz-string';
import { Logger } from '../core/logger.js';
import { CacheManager } from './cache-manager.js';

export class CompressionManager {
  constructor() {
    this.compressionThreshold = 1000; // Comprimi solo se > 1KB
  }

  /**
   * Comprimi stringa usando LZ-String
   */
  compress(data) {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }

    // Se i dati sono piccoli, non comprimere
    if (data.length < this.compressionThreshold) {
      return {
        compressed: false,
        data: data,
        originalSize: data.length,
        compressedSize: data.length,
      };
    }

    try {
      const compressed = LZString.compressToUTF16(data);
      return {
        compressed: true,
        data: compressed,
        originalSize: data.length,
        compressedSize: compressed.length,
        ratio: ((1 - compressed.length / data.length) * 100).toFixed(1),
      };
    } catch (error) {
      Logger.error('Errore nella compressione:', error);
      return {
        compressed: false,
        data: data,
        originalSize: data.length,
        compressedSize: data.length,
        error: error.message,
      };
    }
  }

  /**
   * Decomprimi stringa
   */
  decompress(compressedData) {
    if (!compressedData.compressed) {
      return typeof compressedData.data === 'string'
        ? compressedData.data
        : JSON.stringify(compressedData.data);
    }

    try {
      const result = LZString.decompressFromUTF16(compressedData.data);
      if (result === null || result === '') {
        throw new Error('Decompressione ha restituito dati vuoti — possibile corruzione');
      }
      return result;
    } catch (error) {
      Logger.error('Errore nella decompressione — dati corrotti:', error);
      throw new Error('Impossibile decomprimere i dati: potrebbero essere corrotti.', {
        cause: error,
      });
    }
  }

  /**
   * Salva dati compressi in storage
   */
  async saveCompressed(key, data, useIndexedDB = false) {
    const compressed = this.compress(data);

    const entry = {
      ...compressed,
      timestamp: Date.now(),
      key,
    };

    try {
      if (useIndexedDB && compressed.originalSize > 50000) {
        // Usa IndexedDB per dati grandi
        await this.saveToIndexedDB(key, entry);

        // Salva riferimento in chrome.storage
        await chrome.storage.local.set({
          [`${key}_ref`]: {
            inIndexedDB: true,
            timestamp: Date.now(),
            size: compressed.compressedSize,
          },
        });
      } else {
        // Usa chrome.storage per dati piccoli
        await chrome.storage.local.set({ [key]: entry });
      }

      return {
        success: true,
        compressed: compressed.compressed,
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        savedTo: useIndexedDB && compressed.originalSize > 50000 ? 'IndexedDB' : 'chrome.storage',
      };
    } catch (error) {
      Logger.error('Errore nel salvare dati compressi:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Carica dati compressi da storage
   */
  async loadCompressed(key) {
    try {
      // Controlla se è in IndexedDB
      const refResult = await chrome.storage.local.get([`${key}_ref`]);
      const ref = refResult[`${key}_ref`];

      let entry;

      if (ref && ref.inIndexedDB) {
        // Carica da IndexedDB
        entry = await this.loadFromIndexedDB(key);
      } else {
        // Carica da chrome.storage
        const result = await chrome.storage.local.get([key]);
        entry = result[key];
      }

      if (!entry) {
        return null;
      }

      const decompressed = this.decompress(entry);

      return {
        data: decompressed,
        metadata: {
          compressed: entry.compressed,
          originalSize: entry.originalSize,
          compressedSize: entry.compressedSize,
          timestamp: entry.timestamp,
        },
      };
    } catch (error) {
      Logger.error('Errore nel caricare dati compressi:', error);
      return null;
    }
  }

  /**
   * Salva in IndexedDB
   */
  async saveToIndexedDB(key, data) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AIArticleSummarizer', 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['compressed_data'], 'readwrite');
        const store = transaction.objectStore('compressed_data');

        const putRequest = store.put({ key, ...data });

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('compressed_data')) {
          db.createObjectStore('compressed_data', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Carica da IndexedDB
   */
  async loadFromIndexedDB(key) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AIArticleSummarizer', 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['compressed_data'], 'readonly');
        const store = transaction.objectStore('compressed_data');

        const getRequest = store.get(key);

        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
      };
    });
  }

  /**
   * Comprimi cronologia vecchia
   */
  async compressOldHistory(daysOld = 30) {
    try {
      const result = await chrome.storage.local.get(['summaryHistory']);
      const history = result.summaryHistory || [];

      const cutoffDate = Date.now() - daysOld * 24 * 60 * 60 * 1000;
      let compressedCount = 0;

      for (let entry of history) {
        if (entry.timestamp < cutoffDate && !entry.compressed) {
          // Comprimi il riassunto
          if (entry.summary) {
            const compressed = this.compress(entry.summary);
            entry.summary = compressed.data;
            entry.compressed = compressed.compressed;
            entry.originalSize = compressed.originalSize;
            entry.compressedSize = compressed.compressedSize;
            compressedCount++;
          }
        }
      }

      if (compressedCount > 0) {
        await chrome.storage.local.set({ summaryHistory: history });
      }

      return compressedCount;
    } catch (error) {
      Logger.error('Errore nella compressione cronologia:', error);
      return 0;
    }
  }

  /**
   * Comprimi cache vecchia
   */
  async compressOldCache(daysOld = 7) {
    try {
      const result = await chrome.storage.local.get(['summaryCache']);
      const cache = result.summaryCache || {};

      const cutoffDate = Date.now() - daysOld * 24 * 60 * 60 * 1000;
      let compressedCount = 0;

      for (let [, entry] of Object.entries(cache)) {
        if (entry.timestamp < cutoffDate && !entry.data.compressed) {
          // Comprimi i dati
          const compressed = this.compress(JSON.stringify(entry.data));
          entry.data = {
            compressed: compressed.compressed,
            data: compressed.data,
            originalSize: compressed.originalSize,
            compressedSize: compressed.compressedSize,
          };
          compressedCount++;
        }
      }

      if (compressedCount > 0) {
        await chrome.storage.local.set({ summaryCache: cache });
      }

      return compressedCount;
    } catch (error) {
      Logger.error('Errore nella compressione cache:', error);
      return 0;
    }
  }

  /**
   * Ottieni statistiche compressione
   */
  async getStats() {
    try {
      const result = await chrome.storage.local.get(['summaryHistory', 'summaryCache']);
      const history = result.summaryHistory || [];
      const cache = result.summaryCache || {};

      let totalOriginalSize = 0;
      let totalCompressedSize = 0;
      let compressedItems = 0;
      let uncompressedItems = 0;

      // Analizza cronologia
      for (let entry of history) {
        if (entry.compressed) {
          totalOriginalSize += entry.originalSize || 0;
          totalCompressedSize += entry.compressedSize || 0;
          compressedItems++;
        } else {
          const size = JSON.stringify(entry.summary || '').length;
          totalOriginalSize += size;
          totalCompressedSize += size;
          uncompressedItems++;
        }
      }

      // Analizza cache
      for (let entry of Object.values(cache)) {
        if (entry.data && entry.data.compressed) {
          totalOriginalSize += entry.data.originalSize || 0;
          totalCompressedSize += entry.data.compressedSize || 0;
          compressedItems++;
        } else {
          const size = JSON.stringify(entry.data || '').length;
          totalOriginalSize += size;
          totalCompressedSize += size;
          uncompressedItems++;
        }
      }

      const savedBytes = totalOriginalSize - totalCompressedSize;
      const savedMB = (savedBytes / (1024 * 1024)).toFixed(2);
      const compressionRatio =
        totalOriginalSize > 0
          ? ((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(1)
          : 0;

      return {
        compressedItems,
        uncompressedItems,
        totalItems: compressedItems + uncompressedItems,
        totalOriginalSize: (totalOriginalSize / (1024 * 1024)).toFixed(2) + ' MB',
        totalCompressedSize: (totalCompressedSize / (1024 * 1024)).toFixed(2) + ' MB',
        savedMB: parseFloat(savedMB),
        compressionRatio: parseFloat(compressionRatio),
      };
    } catch (error) {
      Logger.error('Errore nel calcolare statistiche compressione:', error);
      return null;
    }
  }

  /**
   * Cleanup automatico: comprimi e archivia dati vecchi
   */
  async autoCleanup(options = {}) {
    const {
      compressHistoryOlderThan = 30, // giorni
      compressCacheOlderThan = 7, // giorni
      deleteHistoryOlderThan = 180, // giorni
      maxCacheEntries = 100,
    } = options;

    const results = {
      compressedHistory: 0,
      compressedCache: 0,
      deletedHistory: 0,
      cleanedCache: 0,
    };

    try {
      // Comprimi cronologia vecchia
      results.compressedHistory = await this.compressOldHistory(compressHistoryOlderThan);

      // Comprimi cache vecchia
      results.compressedCache = await this.compressOldCache(compressCacheOlderThan);

      // Elimina cronologia molto vecchia
      if (deleteHistoryOlderThan > 0) {
        const result = await chrome.storage.local.get(['summaryHistory']);
        const history = result.summaryHistory || [];
        const cutoffDate = Date.now() - deleteHistoryOlderThan * 24 * 60 * 60 * 1000;

        const filteredHistory = history.filter((entry) => entry.timestamp >= cutoffDate);
        results.deletedHistory = history.length - filteredHistory.length;

        if (results.deletedHistory > 0) {
          await chrome.storage.local.set({ summaryHistory: filteredHistory });
        }
      }

      // Pulisci cache LRU
      const cacheManager = new CacheManager();
      results.cleanedCache = await cacheManager.cleanLRU(maxCacheEntries);

      return results;
    } catch (error) {
      Logger.error("Errore nell'auto cleanup:", error);
      return results;
    }
  }
}
