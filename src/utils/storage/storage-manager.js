// Storage Manager - Gestione API keys e impostazioni
// Le API key sono salvate in chrome.storage.local che è sandboxed per estensione.
// Non viene usata cifratura custom perché in un'estensione Chrome il codice sorgente
// è sempre leggibile — un segreto hardcoded non offre protezione reale.

const MAX_TRANSLATION_CACHE = 50;

export class StorageManager {
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
    // Legacy v1.x keys were encrypted objects — prompt user to re-enter
    if (typeof stored === 'object' && stored.encrypted) {
      throw new Error(
        `La API key di ${provider} è in un formato obsoleto (v1.x). Reinserisci la chiave nelle impostazioni.`,
      );
    }
    return stored;
  }

  // Settings management
  static async saveSettings(settings) {
    await chrome.storage.local.set({ settings });
  }

  static async getSettings() {
    const result = await chrome.storage.local.get(['settings']);
    return (
      result.settings || {
        selectedProvider: 'groq',
        contentType: 'auto',
        summaryLength: 'medium',
        tone: 'neutral',
        saveHistory: true,
      }
    );
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
  static async _hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return 'tcache_' + hashHex.slice(0, 16);
  }

  static async getCachedTranslation(url, provider, targetLanguage) {
    const str = JSON.stringify({ url, provider, targetLanguage });
    const cacheKey = await this._hashString(str);
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
    const cacheKey = await this._hashString(str);
    const result = await chrome.storage.local.get(['translationCache']);
    let cache = result.translationCache || {};

    cache[cacheKey] = {
      timestamp: Date.now(),
      translation,
      provider,
      url,
      targetLanguage,
      originalLanguage,
    };

    // LRU eviction - mantieni max MAX_TRANSLATION_CACHE traduzioni
    const entries = Object.entries(cache);
    if (entries.length > MAX_TRANSLATION_CACHE) {
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      cache = Object.fromEntries(entries.slice(-MAX_TRANSLATION_CACHE));
    }

    await chrome.storage.local.set({ translationCache: cache });
  }

  static async clearTranslationCacheEntry(url, provider, targetLanguage) {
    const str = JSON.stringify({ url, provider, targetLanguage });
    const cacheKey = await this._hashString(str);
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
      totalTime: 0,
    };

    stats.totalSummaries++;
    stats.totalWords += wordCount;
    stats.providerUsage[provider] = (stats.providerUsage[provider] || 0) + 1;
    stats.totalTime += generationTime;

    await chrome.storage.local.set({ stats });
  }
}
