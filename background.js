// Background Service Worker - Gestisce chiamate API
importScripts(
  'utils/storage-manager.js',
  'utils/api-client.js',
  'utils/api-resilience.js',
  'utils/cache-manager.js',
  'utils/compression-manager.js',
  'utils/auto-maintenance.js',
  'utils/citation-extractor.js',
  'utils/input-sanitizer.js',
  'utils/error-handler.js'
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateSummary') {
    handleGenerateSummary(request.article, request.provider, request.settings)
      .then(result => {
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Errore generazione:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Mantiene il canale aperto per risposta asincrona
  }
  
  if (request.action === 'extractCitations') {
    handleExtractCitations(request.article, request.provider, request.settings)
      .then(result => {
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Errore estrazione citazioni:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  if (request.action === 'testApiKey') {
    testApiKey(request.provider, request.apiKey)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Errore test API:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  // Restituisci false per altri messaggi
  return false;
});

async function handleGenerateSummary(article, provider, settings) {
  const startTime = Date.now();
  
  // Ottieni tutte le API keys per fallback
  const apiKeys = {
    groq: await StorageManager.getApiKey('groq'),
    openai: await StorageManager.getApiKey('openai'),
    anthropic: await StorageManager.getApiKey('anthropic'),
    gemini: await StorageManager.getApiKey('gemini')
  };
  
  // Verifica che almeno il provider primario abbia una key
  if (!apiKeys[provider]) {
    throw new Error('API key non configurata. Vai nelle impostazioni.');
  }
  
  // Ottieni impostazioni performance
  const performanceSettings = await StorageManager.getSettings();
  const enableCache = performanceSettings.enableCache !== false;
  const enableFallback = performanceSettings.enableFallback || false;
  
  // 🆕 Genera hash del contenuto per validazione cache
  const contentHash = CacheManager.hashContent(article.content);
  
  // Usa il metodo con cache integrata
  try {
    // 1. Controlla cache con validazione contenuto
    if (enableCache) {
      const cacheManager = new CacheManager();
      const cached = await cacheManager.get(article.url, provider, settings, contentHash);
      
      if (cached) {
        console.log('📚 Riassunto caricato dalla cache (contenuto validato)');
        return {
          summary: cached.summary,
          keyPoints: cached.keyPoints,
          fromCache: true,
          usedProvider: provider
        };
      }
    }
    
    // 2. Chiama API con retry
    const apiKey = apiKeys[provider];
    if (!apiKey) {
      throw new Error(`API key non configurata per ${provider}`);
    }
    
    console.log(`🔄 Chiamata API ${provider}...`);
    const responseText = await APIClient.callAPIWithRetry(provider, apiKey, article, settings);
    
    // 3. Parsa risposta
    const { summary, keyPoints } = APIClient.parseResponse(responseText);
    
    // 4. Salva in cache con hash contenuto
    if (enableCache) {
      const cacheManager = new CacheManager();
      await cacheManager.set(
        article.url, 
        provider, 
        settings, 
        { summary, keyPoints },
        null, // TTL default
        contentHash // 🆕 Hash per validazione futura
      );
      console.log('💾 Riassunto salvato in cache con hash contenuto');
    }
    
    // 5. Aggiorna statistiche
    const generationTime = Date.now() - startTime;
    await StorageManager.updateStats(provider, article.wordCount, generationTime);
    
    return {
      summary,
      keyPoints,
      fromCache: false,
      usedProvider: provider,
      generationTime
    };
  } catch (error) {
    console.error('❌ Errore generazione riassunto:', error);
    // 🆕 Gestione errore migliorata
    const errorMessage = ErrorHandler.getErrorMessage(error);
    await ErrorHandler.logError(error, 'handleGenerateSummary');
    throw new Error(errorMessage);
  }
}

async function testApiKey(provider, apiKey) {
  const testArticle = {
    title: 'Test Article',
    paragraphs: [
      { id: 1, text: 'This is a test paragraph to verify API connectivity.' }
    ],
    wordCount: 10,
    readingTimeMinutes: 1,
    content: 'This is a test paragraph to verify API connectivity.'
  };
  
  const testSettings = {
    summaryLength: 'short',
    tone: 'neutral',
    autoDetectLanguage: true
  };
  
  try {
    await APIClient.callAPI(provider, apiKey, testArticle, testSettings);
    return true;
  } catch (error) {
    throw new Error(`Test fallito: ${error.message}`);
  }
}


async function handleExtractCitations(article, provider, settings) {
  const startTime = Date.now();
  
  // Ottieni API key
  const apiKey = await StorageManager.getApiKey(provider);
  if (!apiKey) {
    throw new Error('API key non configurata. Vai nelle impostazioni.');
  }
  
  // Ottieni impostazioni performance
  const performanceSettings = await StorageManager.getSettings();
  const enableCache = performanceSettings.enableCache !== false;
  
  // 🆕 Genera hash del contenuto per validazione cache
  const contentHash = CacheManager.hashContent(article.content);
  
  // Genera chiave cache per citazioni
  const cacheKey = article.url + '_citations';
  
  // 1. Controlla cache con validazione contenuto
  if (enableCache) {
    const cacheManager = new CacheManager();
    const cached = await cacheManager.get(
      cacheKey,
      provider,
      { type: 'citations' },
      contentHash // 🆕 Valida hash contenuto
    );
    
    if (cached) {
      console.log('📚 Citazioni caricate dalla cache (contenuto validato)');
      return {
        citations: cached,
        fromCache: true,
        usedProvider: provider
      };
    }
  }
  
  // 2. Nessuna cache - estrai citazioni
  console.log('🔄 Estrazione citazioni da API...');
  
  try {
    const citations = await CitationExtractor.extractCitations(
      article,
      provider,
      apiKey,
      settings
    );
    
    // 3. Salva in cache con hash contenuto
    if (enableCache) {
      const cacheManager = new CacheManager();
      await cacheManager.set(
        cacheKey,
        provider,
        { type: 'citations' },
        citations,
        null, // TTL default
        contentHash // 🆕 Hash per validazione futura
      );
      console.log('💾 Citazioni salvate in cache con hash contenuto');
    }
    
    const extractionTime = Date.now() - startTime;
    
    return {
      citations,
      fromCache: false,
      usedProvider: provider,
      extractionTime
    };
  } catch (error) {
    console.error('❌ Errore estrazione citazioni:', error);
    // 🆕 Gestione errore migliorata
    const errorMessage = ErrorHandler.getErrorMessage(error);
    await ErrorHandler.logError(error, 'handleExtractCitations');
    throw new Error(errorMessage);
  }
}
