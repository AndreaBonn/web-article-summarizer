import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock chrome.storage.local
const store = {};
global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys) => {
        const result = {};
        for (const key of keys) {
          if (store[key] !== undefined) result[key] = store[key];
        }
        return Promise.resolve(result);
      }),
      set: vi.fn((data) => {
        Object.assign(store, data);
        return Promise.resolve();
      }),
    },
  },
};

import { CacheManager } from '@utils/storage/cache-manager.js';

describe('CacheManager', () => {
  let cache;
  const settings = { summaryLength: 'medium', outputLanguage: 'it', contentType: 'general' };

  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(store)) delete store[key];
    cache = new CacheManager();
  });

  describe('normalizeUrl', () => {
    it('strips UTM tracking parameters', () => {
      const url = 'https://example.com/article?utm_source=twitter&utm_medium=social&id=42';
      const normalized = cache.normalizeUrl(url);
      expect(normalized).toContain('id=42');
      expect(normalized).not.toContain('utm_source');
      expect(normalized).not.toContain('utm_medium');
    });

    it('strips fbclid and gclid', () => {
      const url = 'https://example.com/page?fbclid=abc123&gclid=xyz';
      const normalized = cache.normalizeUrl(url);
      expect(normalized).not.toContain('fbclid');
      expect(normalized).not.toContain('gclid');
    });

    it('strips hash fragments', () => {
      const url = 'https://example.com/article#section-3';
      const normalized = cache.normalizeUrl(url);
      expect(normalized).not.toContain('#section-3');
    });

    it('returns original string for invalid URLs', () => {
      expect(cache.normalizeUrl('not-a-url')).toBe('not-a-url');
    });
  });

  describe('hashObject', () => {
    it('returns deterministic hash for same input', () => {
      const obj = { url: 'https://example.com', provider: 'groq' };
      expect(cache.hashObject(obj)).toBe(cache.hashObject(obj));
    });

    it('returns different hash for different inputs', () => {
      const hash1 = cache.hashObject({ url: 'https://a.com' });
      const hash2 = cache.hashObject({ url: 'https://b.com' });
      expect(hash1).not.toBe(hash2);
    });

    it('returns hash in expected format (cache_xxx_yyy)', () => {
      const hash = cache.hashObject({ test: 'data' });
      expect(hash).toMatch(/^cache_[a-z0-9]+_[a-z0-9]+$/);
    });
  });

  describe('generateCacheKey', () => {
    it('generates consistent key for same parameters', () => {
      const key1 = cache.generateCacheKey('https://example.com', 'groq', settings);
      const key2 = cache.generateCacheKey('https://example.com', 'groq', settings);
      expect(key1).toBe(key2);
    });

    it('generates different keys for different providers', () => {
      const key1 = cache.generateCacheKey('https://example.com', 'groq', settings);
      const key2 = cache.generateCacheKey('https://example.com', 'openai', settings);
      expect(key1).not.toBe(key2);
    });

    it('normalizes URL before hashing (UTM stripping)', () => {
      const key1 = cache.generateCacheKey('https://example.com/article', 'groq', settings);
      const key2 = cache.generateCacheKey(
        'https://example.com/article?utm_source=twitter',
        'groq',
        settings,
      );
      expect(key1).toBe(key2);
    });
  });

  describe('set and get', () => {
    it('stores and retrieves data', async () => {
      const data = { summary: 'Test summary', keyPoints: [] };
      await cache.set('https://example.com', 'groq', settings, data);

      const result = await cache.get('https://example.com', 'groq', settings);
      expect(result).toEqual(data);
    });

    it('returns null for cache miss', async () => {
      const result = await cache.get('https://missing.com', 'groq', settings);
      expect(result).toBeNull();
    });

    it('returns null for expired entries', async () => {
      const data = { summary: 'Old' };
      await cache.set('https://example.com', 'groq', settings, data);

      // Manually expire the entry
      const cacheKey = cache.generateCacheKey('https://example.com', 'groq', settings);
      store.summaryCache[cacheKey].expiresAt = Date.now() - 1000;

      const result = await cache.get('https://example.com', 'groq', settings);
      expect(result).toBeNull();
    });

    it('returns null when content hash mismatches', async () => {
      const data = { summary: 'Cached' };
      await cache.set('https://example.com', 'groq', settings, data, null, 'hash-v1');

      const result = await cache.get('https://example.com', 'groq', settings, 'hash-v2');
      expect(result).toBeNull();
    });

    it('returns data when content hash matches', async () => {
      const data = { summary: 'Cached' };
      await cache.set('https://example.com', 'groq', settings, data, null, 'hash-v1');

      const result = await cache.get('https://example.com', 'groq', settings, 'hash-v1');
      expect(result).toEqual(data);
    });

    it('accepts custom TTL', async () => {
      const shortTTL = 1000; // 1 second
      const data = { summary: 'Short lived' };
      await cache.set('https://example.com', 'groq', settings, data, shortTTL);

      const cacheKey = cache.generateCacheKey('https://example.com', 'groq', settings);
      const entry = store.summaryCache[cacheKey];
      expect(entry.expiresAt - entry.timestamp).toBe(shortTTL);
    });
  });

  describe('invalidate', () => {
    it('removes specific cache entry', async () => {
      const data = { summary: 'To invalidate' };
      await cache.set('https://example.com', 'groq', settings, data);

      const cacheKey = cache.generateCacheKey('https://example.com', 'groq', settings);
      const result = await cache.invalidate(cacheKey);

      expect(result).toBe(true);
      expect(await cache.get('https://example.com', 'groq', settings)).toBeNull();
    });

    it('returns false for non-existent key', async () => {
      const result = await cache.invalidate('non-existent-key');
      expect(result).toBe(false);
    });
  });

  describe('invalidateByUrl', () => {
    it('removes all cache entries for a URL across providers', async () => {
      await cache.set('https://example.com', 'groq', settings, { s: '1' });
      await cache.set('https://example.com', 'openai', settings, { s: '2' });
      await cache.set('https://other.com', 'groq', settings, { s: '3' });

      const count = await cache.invalidateByUrl('https://example.com');

      expect(count).toBe(2);
      expect(await cache.get('https://example.com', 'groq', settings)).toBeNull();
      expect(await cache.get('https://example.com', 'openai', settings)).toBeNull();
      expect(await cache.get('https://other.com', 'groq', settings)).not.toBeNull();
    });
  });
});
