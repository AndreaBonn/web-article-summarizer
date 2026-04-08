// Storage Manager - Gestione sicura di API keys e cache
const EXTENSION_SECRET = 'ai-summarizer-v1-secret-key-2024';

class StorageManager {
  // Encryption helpers
  static async encryptKey(apiKey) {
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(EXTENSION_SECRET),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return {
      encrypted: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv),
      salt: this.arrayBufferToBase64(salt)
    };
  }

  static async decryptKey(encryptedData) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(EXTENSION_SECRET),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.base64ToArrayBuffer(encryptedData.salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: this.base64ToArrayBuffer(encryptedData.iv)
      },
      key,
      this.base64ToArrayBuffer(encryptedData.encrypted)
    );
    
    return decoder.decode(decrypted);
  }

  static arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  static base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // API Keys management
  static async saveApiKey(provider, apiKey) {
    const encrypted = await this.encryptKey(apiKey);
    const result = await chrome.storage.local.get(['apiKeys']);
    const apiKeys = result.apiKeys || {};
    apiKeys[provider] = encrypted;
    await chrome.storage.local.set({ apiKeys });
  }

  static async getApiKey(provider) {
    const result = await chrome.storage.local.get(['apiKeys']);
    if (!result.apiKeys || !result.apiKeys[provider]) {
      return null;
    }
    return await this.decryptKey(result.apiKeys[provider]);
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

  // Cache management
  static getCacheKey(url, provider, settings, type = 'summary') {
    // Crea una chiave che include tutti i parametri rilevanti
    // IMPORTANTE: La lingua di output deve essere parte della chiave
    const cacheParams = {
      url,
      provider,
      type, // 'summary' o 'translation'
      contentType: settings.contentType || 'auto',
      summaryLength: settings.summaryLength || 'medium',
      outputLanguage: settings.outputLanguage || 'it', // ← CRITICO per cache
      tone: settings.tone || 'neutral'
    };
    const str = JSON.stringify(cacheParams);
    return this.hashString(str);
  }

  static hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  static async getCachedSummary(url, provider, settings) {
    // La cache è specifica per:
    // - URL dell'articolo
    // - Provider AI (groq/openai/anthropic)
    // - Lingua di output (it/en/es/fr/de)
    // - Tipo di contenuto (auto/general/scientific/etc)
    // - Lunghezza riassunto (short/medium/detailed)
    // Cambiando uno di questi parametri, viene generato un nuovo riassunto
    const cacheKey = this.getCacheKey(url, provider, settings, 'summary');
    const result = await chrome.storage.local.get(['summaryCache']);
    const cache = result.summaryCache || {};
    
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
  
  static async getCachedTranslation(url, provider, targetLanguage) {
    const settings = { outputLanguage: targetLanguage };
    const cacheKey = this.getCacheKey(url, provider, settings, 'translation');
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

  static async saveCachedSummary(url, provider, settings, summary, keyPoints) {
    const cacheKey = this.getCacheKey(url, provider, settings, 'summary');
    const result = await chrome.storage.local.get(['summaryCache']);
    let cache = result.summaryCache || {};
    
    cache[cacheKey] = {
      timestamp: Date.now(),
      summary,
      keyPoints,
      provider,
      url,
      // Salva anche i parametri per debug/info
      outputLanguage: settings.outputLanguage || 'it',
      contentType: settings.contentType || 'auto',
      summaryLength: settings.summaryLength || 'medium'
    };
    
    // LRU eviction - mantieni max 50 articoli
    const entries = Object.entries(cache);
    if (entries.length > 50) {
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      cache = Object.fromEntries(entries.slice(-50));
    }
    
    await chrome.storage.local.set({ summaryCache: cache });
  }
  
  static async saveCachedTranslation(url, provider, targetLanguage, translation, originalLanguage) {
    const settings = { outputLanguage: targetLanguage };
    const cacheKey = this.getCacheKey(url, provider, settings, 'translation');
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
