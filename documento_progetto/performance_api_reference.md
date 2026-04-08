# API Reference - Sistema Performance e Affidabilità

## 📚 Indice

1. [APIResilience](#apiresilience)
2. [CacheManager](#cachemanager)
3. [CompressionManager](#compressionmanager)
4. [AutoMaintenance](#automaintenance)

---

## APIResilience

Gestisce retry logic, fallback automatico e rate limiting.

### Constructor

```javascript
const resilience = new APIResilience();
```

### Metodi Principali

#### `callWithRetry(apiCall, options)`

Esegue una chiamata API con retry automatico.

**Parametri:**
- `apiCall` (Function): Funzione async che esegue la chiamata API
- `options` (Object):
  - `maxRetries` (number): Numero massimo di tentativi (default: 3)
  - `initialDelay` (number): Delay iniziale in ms (default: 1000)
  - `maxDelay` (number): Delay massimo in ms (default: 8000)
  - `backoffMultiplier` (number): Moltiplicatore per exponential backoff (default: 2)
  - `onRetry` (Function): Callback chiamata ad ogni retry

**Ritorna:** Promise con il risultato della chiamata API

**Esempio:**
```javascript
const result = await resilience.callWithRetry(
  async () => {
    const response = await fetch('https://api.example.com/data');
    return await response.json();
  },
  {
    maxRetries: 3,
    onRetry: (attempt, maxAttempts, delay) => {
      console.log(`Retry ${attempt}/${maxAttempts} - wait ${delay}ms`);
    }
  }
);
```

#### `callWithFallback(params)`

Esegue una chiamata API con fallback automatico su provider alternativi.

**Parametri:**
- `params` (Object):
  - `primaryProvider` (string): Provider primario ('groq', 'openai', 'anthropic')
  - `apiKeys` (Object): Oggetto con le API keys per ogni provider
  - `article` (Object): Articolo da riassumere
  - `settings` (Object): Impostazioni riassunto
  - `enableFallback` (boolean): Abilita fallback (default: false)
  - `onRetry` (Function): Callback per retry
  - `onFallback` (Function): Callback per fallback

**Ritorna:** Promise con `{ result, usedProvider }`

**Esempio:**
```javascript
const result = await resilience.callWithFallback({
  primaryProvider: 'groq',
  apiKeys: {
    groq: 'gsk_...',
    openai: 'sk-...',
    anthropic: 'sk-ant-...'
  },
  article: articleData,
  settings: { summaryLength: 'detailed' },
  enableFallback: true,
  onFallback: (provider, index) => {
    console.log(`Fallback to ${provider}`);
  }
});

console.log('Used provider:', result.usedProvider);
console.log('Result:', result.result);
```

#### `enqueueRequest(provider, apiCall, onQueueUpdate)`

Accoda una richiesta per gestire rate limiting.

**Parametri:**
- `provider` (string): Nome del provider
- `apiCall` (Function): Funzione async della chiamata API
- `onQueueUpdate` (Function): Callback con lunghezza coda

**Ritorna:** Promise con il risultato

**Esempio:**
```javascript
const result = await resilience.enqueueRequest(
  'groq',
  async () => {
    return await callGroqAPI();
  },
  (queueLength) => {
    console.log(`Queue: ${queueLength} requests`);
  }
);
```

#### `getStats()`

Ottiene statistiche API.

**Ritorna:** Promise con oggetto statistiche

**Esempio:**
```javascript
const stats = await resilience.getStats();
console.log('Success rate:', stats.successRate + '%');
console.log('Total calls:', stats.totalCalls);
console.log('Retries:', stats.retryCount);
console.log('Fallbacks:', stats.fallbackCount);
```

#### `clearLogs()`

Pulisce tutti i log.

**Esempio:**
```javascript
await resilience.clearLogs();
```

---

## CacheManager

Gestisce caching avanzato con TTL e invalidazione.

### Constructor

```javascript
const cacheManager = new CacheManager();
```

### Metodi Principali

#### `set(url, provider, settings, data, customTTL)`

Salva dati in cache.

**Parametri:**
- `url` (string): URL dell'articolo
- `provider` (string): Provider usato
- `settings` (Object): Impostazioni riassunto
- `data` (any): Dati da salvare
- `customTTL` (number): TTL personalizzato in ms (opzionale)

**Ritorna:** Promise<boolean>

**Esempio:**
```javascript
await cacheManager.set(
  'https://example.com/article',
  'groq',
  { summaryLength: 'detailed', outputLanguage: 'it' },
  { summary: '...', keyPoints: [...] },
  7 * 24 * 60 * 60 * 1000 // 7 giorni
);
```

#### `get(url, provider, settings)`

Recupera dati dalla cache.

**Parametri:**
- `url` (string): URL dell'articolo
- `provider` (string): Provider usato
- `settings` (Object): Impostazioni riassunto

**Ritorna:** Promise con dati o null se non trovato/scaduto

**Esempio:**
```javascript
const cached = await cacheManager.get(
  'https://example.com/article',
  'groq',
  { summaryLength: 'detailed', outputLanguage: 'it' }
);

if (cached) {
  console.log('Cache hit!');
  console.log('Summary:', cached.summary);
} else {
  console.log('Cache miss');
}
```

#### `invalidate(cacheKey)`

Invalida una entry specifica.

**Parametri:**
- `cacheKey` (string): Chiave cache da invalidare

**Ritorna:** Promise<boolean>

**Esempio:**
```javascript
await cacheManager.invalidate('cache_abc123');
```

#### `invalidateByUrl(url)`

Invalida tutte le entry per un URL.

**Parametri:**
- `url` (string): URL da invalidare

**Ritorna:** Promise<number> (numero di entry invalidate)

**Esempio:**
```javascript
const count = await cacheManager.invalidateByUrl('https://example.com/article');
console.log(`Invalidated ${count} entries`);
```

#### `cleanExpired()`

Pulisce cache scadute.

**Ritorna:** Promise<number> (numero di entry pulite)

**Esempio:**
```javascript
const cleaned = await cacheManager.cleanExpired();
console.log(`Cleaned ${cleaned} expired entries`);
```

#### `cleanLRU(maxEntries)`

Pulisce cache usando strategia LRU.

**Parametri:**
- `maxEntries` (number): Numero massimo di entry da mantenere

**Ritorna:** Promise<number> (numero di entry rimosse)

**Esempio:**
```javascript
const removed = await cacheManager.cleanLRU(100);
console.log(`Removed ${removed} old entries`);
```

#### `getStats()`

Ottiene statistiche cache.

**Ritorna:** Promise con oggetto statistiche

**Esempio:**
```javascript
const stats = await cacheManager.getStats();
console.log('Total entries:', stats.totalEntries);
console.log('Hit rate:', stats.hitRate + '%');
console.log('Size:', stats.sizeMB + ' MB');
console.log('Top entries:', stats.topEntries);
```

#### `setDefaultTTL(days)`

Configura TTL di default.

**Parametri:**
- `days` (number): Giorni di validità

**Esempio:**
```javascript
cacheManager.setDefaultTTL(14); // 14 giorni
```

#### `clearAll()`

Pulisce tutta la cache.

**Esempio:**
```javascript
await cacheManager.clearAll();
```

---

## CompressionManager

Gestisce compressione dati con LZ-String.

### Constructor

```javascript
const compressionManager = new CompressionManager();
```

### Metodi Principali

#### `compress(data)`

Comprimi dati.

**Parametri:**
- `data` (string|Object): Dati da comprimere

**Ritorna:** Oggetto con info compressione

**Esempio:**
```javascript
const result = compressionManager.compress('Large text data...');

console.log('Compressed:', result.compressed);
console.log('Original size:', result.originalSize);
console.log('Compressed size:', result.compressedSize);
console.log('Ratio:', result.ratio + '%');
```

#### `decompress(compressedData)`

Decomprimi dati.

**Parametri:**
- `compressedData` (Object): Dati compressi da `compress()`

**Ritorna:** Dati originali

**Esempio:**
```javascript
const compressed = compressionManager.compress('Data');
const decompressed = compressionManager.decompress(compressed);
console.log('Original:', decompressed);
```

#### `saveCompressed(key, data, useIndexedDB)`

Salva dati compressi in storage.

**Parametri:**
- `key` (string): Chiave storage
- `data` (any): Dati da salvare
- `useIndexedDB` (boolean): Usa IndexedDB per dati grandi (default: true)

**Ritorna:** Promise con info operazione

**Esempio:**
```javascript
const result = await compressionManager.saveCompressed(
  'myData',
  { large: 'data'.repeat(1000) }
);

console.log('Saved to:', result.savedTo);
console.log('Compression ratio:', result.ratio + '%');
```

#### `loadCompressed(key)`

Carica dati compressi da storage.

**Parametri:**
- `key` (string): Chiave storage

**Ritorna:** Promise con `{ data, metadata }`

**Esempio:**
```javascript
const result = await compressionManager.loadCompressed('myData');

console.log('Data:', result.data);
console.log('Was compressed:', result.metadata.compressed);
console.log('Original size:', result.metadata.originalSize);
```

#### `compressOldHistory(daysOld)`

Comprimi cronologia vecchia.

**Parametri:**
- `daysOld` (number): Età minima in giorni

**Ritorna:** Promise<number> (numero di entry compresse)

**Esempio:**
```javascript
const count = await compressionManager.compressOldHistory(30);
console.log(`Compressed ${count} old history entries`);
```

#### `compressOldCache(daysOld)`

Comprimi cache vecchia.

**Parametri:**
- `daysOld` (number): Età minima in giorni

**Ritorna:** Promise<number> (numero di entry compresse)

**Esempio:**
```javascript
const count = await compressionManager.compressOldCache(7);
console.log(`Compressed ${count} old cache entries`);
```

#### `autoCleanup(options)`

Esegue cleanup automatico completo.

**Parametri:**
- `options` (Object):
  - `compressHistoryOlderThan` (number): Giorni per cronologia (default: 30)
  - `compressCacheOlderThan` (number): Giorni per cache (default: 7)
  - `deleteHistoryOlderThan` (number): Giorni per eliminazione (default: 180)
  - `maxCacheEntries` (number): Max entry cache (default: 100)

**Ritorna:** Promise con risultati

**Esempio:**
```javascript
const results = await compressionManager.autoCleanup({
  compressHistoryOlderThan: 30,
  compressCacheOlderThan: 7,
  deleteHistoryOlderThan: 180,
  maxCacheEntries: 100
});

console.log('Compressed history:', results.compressedHistory);
console.log('Compressed cache:', results.compressedCache);
console.log('Deleted history:', results.deletedHistory);
console.log('Cleaned cache:', results.cleanedCache);
```

#### `getStats()`

Ottiene statistiche compressione.

**Ritorna:** Promise con oggetto statistiche

**Esempio:**
```javascript
const stats = await compressionManager.getStats();
console.log('Compressed items:', stats.compressedItems);
console.log('Compression ratio:', stats.compressionRatio + '%');
console.log('Space saved:', stats.savedMB + ' MB');
```

---

## AutoMaintenance

Gestisce manutenzione automatica in background.

### Constructor

```javascript
const autoMaintenance = new AutoMaintenance();
```

### Metodi Principali

#### `initialize()`

Inizializza sistema di manutenzione.

**Esempio:**
```javascript
await autoMaintenance.initialize();
```

#### `runMaintenance()`

Esegue manutenzione completa.

**Ritorna:** Promise con risultati

**Esempio:**
```javascript
const results = await autoMaintenance.runMaintenance();

console.log('Cache expired cleaned:', results.cacheExpired);
console.log('Cache LRU cleaned:', results.cacheLRU);
console.log('History compressed:', results.historyCompressed);
console.log('Cache compressed:', results.cacheCompressed);
console.log('History deleted:', results.historyDeleted);
console.log('Errors:', results.errors);
```

#### `getLastMaintenanceStats()`

Ottiene statistiche ultima manutenzione.

**Ritorna:** Promise con `{ lastRun, results, nextRun }`

**Esempio:**
```javascript
const stats = await autoMaintenance.getLastMaintenanceStats();

console.log('Last run:', new Date(stats.lastRun));
console.log('Next run:', new Date(stats.nextRun));
console.log('Results:', stats.results);
```

#### `forceRun()`

Forza esecuzione manutenzione.

**Esempio:**
```javascript
const results = await autoMaintenance.forceRun();
console.log('Maintenance completed:', results);
```

---

## Esempi Completi

### Esempio 1: Chiamata API con Resilienza Completa

```javascript
// Setup
const resilience = new APIResilience();
const cacheManager = new CacheManager();

// Parametri
const url = 'https://example.com/article';
const provider = 'groq';
const settings = { summaryLength: 'detailed', outputLanguage: 'it' };

// 1. Controlla cache
let result = await cacheManager.get(url, provider, settings);

if (result) {
  console.log('Cache hit!');
} else {
  // 2. Chiama API con resilienza
  result = await resilience.callWithRetry(
    async () => {
      const response = await fetch('https://api.groq.com/...');
      return await response.json();
    },
    {
      maxRetries: 3,
      onRetry: (attempt, max, delay) => {
        console.log(`Retry ${attempt}/${max}`);
      }
    }
  );
  
  // 3. Salva in cache
  await cacheManager.set(url, provider, settings, result);
}

console.log('Result:', result);
```

### Esempio 2: Compressione e Storage

```javascript
const compressionManager = new CompressionManager();

// Dati grandi
const largeData = {
  summary: 'Very long summary...'.repeat(100),
  keyPoints: Array.from({ length: 50 }, (_, i) => ({
    title: `Point ${i}`,
    description: 'Description...'.repeat(20)
  }))
};

// Salva compresso
await compressionManager.saveCompressed('article_123', largeData);

// Carica decompresso
const loaded = await compressionManager.loadCompressed('article_123');
console.log('Data:', loaded.data);
console.log('Saved:', loaded.metadata.compressedSize, 'bytes');
```

### Esempio 3: Manutenzione Programmata

```javascript
const autoMaintenance = new AutoMaintenance();

// Inizializza (esegue automaticamente ogni 24h)
await autoMaintenance.initialize();

// Controlla stato
const stats = await autoMaintenance.getLastMaintenanceStats();
console.log('Last maintenance:', new Date(stats.lastRun));
console.log('Next maintenance:', new Date(stats.nextRun));

// Forza esecuzione
const results = await autoMaintenance.forceRun();
console.log('Maintenance results:', results);
```

---

## Best Practices

### 1. Gestione Errori

```javascript
try {
  const result = await resilience.callWithRetry(apiCall);
} catch (error) {
  if (error.message.includes('401')) {
    // Errore autenticazione
    console.error('Invalid API key');
  } else if (error.message.includes('429')) {
    // Rate limit (dopo tutti i retry)
    console.error('Rate limit exceeded');
  } else {
    // Altro errore
    console.error('API error:', error);
  }
}
```

### 2. Cache Invalidation

```javascript
// Invalida quando l'articolo cambia
async function updateArticle(url, newContent) {
  // Aggiorna contenuto
  await saveArticle(url, newContent);
  
  // Invalida cache
  await cacheManager.invalidateByUrl(url);
}
```

### 3. Monitoraggio Performance

```javascript
// Monitora statistiche periodicamente
setInterval(async () => {
  const cacheStats = await cacheManager.getStats();
  const apiStats = await resilience.getStats();
  
  console.log('Cache hit rate:', cacheStats.hitRate + '%');
  console.log('API success rate:', apiStats.successRate + '%');
  
  // Alert se performance degrada
  if (apiStats.successRate < 90) {
    console.warn('API success rate is low!');
  }
}, 60000); // Ogni minuto
```

### 4. Cleanup Proattivo

```javascript
// Esegui cleanup prima di operazioni pesanti
async function beforeHeavyOperation() {
  const compressionManager = new CompressionManager();
  
  // Comprimi dati vecchi
  await compressionManager.compressOldHistory(30);
  await compressionManager.compressOldCache(7);
  
  // Pulisci cache
  const cacheManager = new CacheManager();
  await cacheManager.cleanExpired();
  await cacheManager.cleanLRU(100);
}
```

---

## Riferimenti

- [LZ-String Documentation](http://pieroxy.net/blog/pages/lz-string/index.html)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
