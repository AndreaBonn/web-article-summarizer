// Storage Manager - Gestione API keys e impostazioni
// Le API key sono salvate in chrome.storage.local che è sandboxed per estensione.
// Non viene usata cifratura custom perché in un'estensione Chrome il codice sorgente
// è sempre leggibile — un segreto hardcoded non offre protezione reale.

class StorageManager {
  // API Keys management
  static async saveApiKey(provider, apiKey) {
    const result = await chrome.storage.local.get(['apiKeys']);
    const apiKeys = result.apiKeys || {};
    apiKeys[provider] = apiKey;
    await chrome.storage.local.set({ apiKeys });
  }

  static async getApiKey(provider) {
    const result = await chrome.storage.local.get(['apiKeys']);
    if (!result.apiKeys || !result.apiKeys[provider]) {
      return null;
    }
    const stored = result.apiKeys[provider];
    // Migrazione: se la key è un oggetto cifrato (formato legacy), decripta e ri-salva in chiaro
    if (typeof stored === 'object' && stored.encrypted) {
      try {
        const plainKey = await this._decryptLegacyKey(stored);
        await this.saveApiKey(provider, plainKey);
        return plainKey;
      } catch (e) {
        console.error(`Migrazione API key ${provider} fallita:`, e);
        return null;
      }
    }
    return stored;
  }

  // Migrazione legacy: decripta key cifrate con il vecchio segreto hardcoded
  static async _decryptLegacyKey(encryptedData) {
    const LEGACY_SECRET = 'ai-summarizer-v1-secret-key-2024';
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', encoder.encode(LEGACY_SECRET), 'PBKDF2', false, ['deriveKey']
    );
    const salt = this._base64ToArrayBuffer(encryptedData.salt);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 }, false, ['decrypt']
    );
    const iv = this._base64ToArrayBuffer(encryptedData.iv);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, key,
      this._base64ToArrayBuffer(encryptedData.encrypted)
    );
    return decoder.decode(decrypted);
  }

  static _base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Settings management
  static async saveSettings(settings) {
    await chrome.storage.local.set({ settings });
  }

  static async getSettings() {
    try {
      const result = await chrome.storage.local.get(['settings']);
      return result.settings || {
        selectedProvider: 'groq',
        contentType: 'auto',
        summaryLength: 'medium',
        tone: 'neutral',
        saveHistory: true
      };
    } catch (error) {
      console.error('Errore getSettings:', error);
      return {
        selectedProvider: 'groq',
        contentType: 'auto',
        summaryLength: 'medium',
        tone: 'neutral',
        saveHistory: true
      };
    }
  }

  // Language management (output language for AI)
  static async saveSelectedLanguage(language) {
    await chrome.storage.local.set({ selectedLanguage: language });
  }

  static async getSelectedLanguage() {
    const result = await chrome.storage.local.get(['selectedLanguage']);
    return result.selectedLanguage || 'it'; // Default: Italiano
  }
  
  // UI Language management (interface language)
  static async saveUILanguage(language) {
    await chrome.storage.local.set({ uiLanguage: language });
  }

  static async getUILanguage() {
    const result = await chrome.storage.local.get(['uiLanguage']);
    return result.uiLanguage || 'it'; // Default: Italiano
  }

  // Content Type management
  static async saveSelectedContentType(contentType) {
    await chrome.storage.local.set({ selectedContentType: contentType });
  }

  static async getSelectedContentType() {
    const result = await chrome.storage.local.get(['selectedContentType']);
    return result.selectedContentType || 'auto'; // Default: Rilevamento automatico
  }

  // Translation cache (la cache summary è gestita da CacheManager)
  static _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'tcache_' + Math.abs(hash).toString(36);
  }

  static async getCachedTranslation(url, provider, targetLanguage) {
    const str = JSON.stringify({ url, provider, targetLanguage });
    const cacheKey = this._hashString(str);
    const result = await chrome.storage.local.get(['translationCache']);
    const cache = result.translationCache || {};

    if (cache[cacheKey]) {
      const cached = cache[cacheKey];
      const age = Date.now() - cached.timestamp;
      const TTL = 24 * 60 * 60 * 1000; // 24 ore
      if (age < TTL) {
        return cached;
      }
    }
    return null;
  }

  static async saveCachedTranslation(url, provider, targetLanguage, translation, originalLanguage) {
    const str = JSON.stringify({ url, provider, targetLanguage });
    const cacheKey = this._hashString(str);
    const result = await chrome.storage.local.get(['translationCache']);
    let cache = result.translationCache || {};

    cache[cacheKey] = {
      timestamp: Date.now(),
      translation,
      provider,
      url,
      targetLanguage,
      originalLanguage
    };

    // LRU eviction - mantieni max 50 traduzioni
    const entries = Object.entries(cache);
    if (entries.length > 50) {
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      cache = Object.fromEntries(entries.slice(-50));
    }

    await chrome.storage.local.set({ translationCache: cache });
  }

  static async clearTranslationCacheEntry(url, provider, targetLanguage) {
    const str = JSON.stringify({ url, provider, targetLanguage });
    const cacheKey = this._hashString(str);
    const result = await chrome.storage.local.get(['translationCache']);
    const cache = result.translationCache || {};
    delete cache[cacheKey];
    await chrome.storage.local.set({ translationCache: cache });
  }

  // Statistics
  static async updateStats(provider, wordCount, generationTime) {
    const result = await chrome.storage.local.get(['stats']);
    const stats = result.stats || {
      totalSummaries: 0,
      totalWords: 0,
      providerUsage: {},
      totalTime: 0
    };
    
    stats.totalSummaries++;
    stats.totalWords += wordCount;
    stats.providerUsage[provider] = (stats.providerUsage[provider] || 0) + 1;
    stats.totalTime += generationTime;
    
    await chrome.storage.local.set({ stats });
  }
}
