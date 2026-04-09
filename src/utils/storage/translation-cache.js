// Translation Cache — LRU cache for AI translations stored in chrome.storage.local

const MAX_ENTRIES = 50;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_KEY = 'translationCache';

async function hashKey(str) {
  const data = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return 'tcache_' + hashHex.slice(0, 16);
}

function buildCacheId(url, provider, targetLanguage) {
  return JSON.stringify({ url, provider, targetLanguage });
}

export class TranslationCache {
  static async get(url, provider, targetLanguage) {
    const cacheKey = await hashKey(buildCacheId(url, provider, targetLanguage));
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    const cache = result[STORAGE_KEY] || {};

    if (cache[cacheKey]) {
      const cached = cache[cacheKey];
      if (Date.now() - cached.timestamp < TTL_MS) {
        return cached;
      }
    }
    return null;
  }

  static async save(url, provider, targetLanguage, translation, originalLanguage) {
    const cacheKey = await hashKey(buildCacheId(url, provider, targetLanguage));
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    let cache = result[STORAGE_KEY] || {};

    cache[cacheKey] = {
      timestamp: Date.now(),
      translation,
      provider,
      url,
      targetLanguage,
      originalLanguage,
    };

    // LRU eviction
    const entries = Object.entries(cache);
    if (entries.length > MAX_ENTRIES) {
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      cache = Object.fromEntries(entries.slice(-MAX_ENTRIES));
    }

    await chrome.storage.local.set({ [STORAGE_KEY]: cache });
  }

  static async clearEntry(url, provider, targetLanguage) {
    const cacheKey = await hashKey(buildCacheId(url, provider, targetLanguage));
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    const cache = result[STORAGE_KEY] || {};
    delete cache[cacheKey];
    await chrome.storage.local.set({ [STORAGE_KEY]: cache });
  }
}
