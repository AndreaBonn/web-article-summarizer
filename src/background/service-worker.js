// Background Service Worker - Gestisce chiamate API
import { StorageManager } from "../utils/storage/storage-manager.js";
import { PromptRegistry } from "../utils/ai/prompt-registry.js";
import { APIClient } from "../utils/ai/api-client.js";
import { APIResilience } from "../utils/ai/api-resilience.js";
import { CacheManager } from "../utils/storage/cache-manager.js";
import { CompressionManager } from "../utils/storage/compression-manager.js";
import { AutoMaintenance } from "../utils/core/auto-maintenance.js";
import { CitationExtractor } from "../utils/ai/citation-extractor.js";
import { InputSanitizer } from "../utils/security/input-sanitizer.js";
import { ErrorHandler } from "../utils/core/error-handler.js";

// Inizializza manutenzione automatica cache
const autoMaintenance = new AutoMaintenance();
autoMaintenance
  .initialize()
  .catch((err) => console.error("AutoMaintenance init fallita:", err));

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Valida che il messaggio venga dalla propria estensione
  if (sender.id !== chrome.runtime.id) {
    return false;
  }

  if (request.action === "generateSummary") {
    handleGenerateSummary(request.article, request.provider, request.settings)
      .then((result) => {
        sendResponse({ success: true, result });
      })
      .catch((error) => {
        console.error("Errore generazione:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Mantiene il canale aperto per risposta asincrona
  }

  if (request.action === "extractCitations") {
    handleExtractCitations(request.article, request.provider, request.settings)
      .then((result) => {
        sendResponse({ success: true, result });
      })
      .catch((error) => {
        console.error("Errore estrazione citazioni:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.action === "testApiKey") {
    testApiKey(request.provider, request.apiKey)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("Errore test API:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  // Restituisci false per altri messaggi
  return false;
});

async function handleGenerateSummary(article, provider, settings) {
  const startTime = Date.now();

  // Decripta solo la API key del provider richiesto
  const apiKey = await StorageManager.getApiKey(provider);
  if (!apiKey) {
    throw new Error("API key non configurata. Vai nelle impostazioni.");
  }

  // Ottieni impostazioni performance
  const performanceSettings = await StorageManager.getSettings();
  const enableCache = performanceSettings.enableCache !== false;

  // Genera hash del contenuto per validazione cache
  const contentHash = CacheManager.hashContent(article.content);

  // Istanzia CacheManager una sola volta
  const cacheManager = enableCache ? new CacheManager() : null;

  try {
    // 1. Controlla cache con validazione contenuto
    if (cacheManager) {
      const cached = await cacheManager.get(
        article.url,
        provider,
        settings,
        contentHash,
      );
      if (cached) {
        return {
          summary: cached.summary,
          keyPoints: cached.keyPoints,
          fromCache: true,
          usedProvider: provider,
        };
      }
    }

    // 2. Chiama API con retry
    const responseText = await APIClient.callAPI(
      provider,
      apiKey,
      article,
      settings,
    );

    // 3. Parsa risposta
    const { summary, keyPoints } = APIClient.parseResponse(responseText);

    // 4. Salva in cache con hash contenuto
    if (cacheManager) {
      await cacheManager.set(
        article.url,
        provider,
        settings,
        { summary, keyPoints },
        null,
        contentHash,
      );
    }

    // 5. Aggiorna statistiche
    const generationTime = Date.now() - startTime;
    await StorageManager.updateStats(
      provider,
      article.wordCount,
      generationTime,
    );

    return {
      summary,
      keyPoints,
      fromCache: false,
      usedProvider: provider,
      generationTime,
    };
  } catch (error) {
    console.error("Errore generazione riassunto:", error);
    const errorMessage = ErrorHandler.getErrorMessage(error);
    await ErrorHandler.logError(error, "handleGenerateSummary");
    throw new Error(errorMessage);
  }
}

async function testApiKey(provider, apiKey) {
  const testArticle = {
    title: "Test Article",
    paragraphs: [
      { id: 1, text: "This is a test paragraph to verify API connectivity." },
    ],
    wordCount: 10,
    readingTimeMinutes: 1,
    content: "This is a test paragraph to verify API connectivity.",
  };

  const testSettings = {
    summaryLength: "short",
    tone: "neutral",
    autoDetectLanguage: true,
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

  const apiKey = await StorageManager.getApiKey(provider);
  if (!apiKey) {
    throw new Error("API key non configurata. Vai nelle impostazioni.");
  }

  const performanceSettings = await StorageManager.getSettings();
  const enableCache = performanceSettings.enableCache !== false;
  const contentHash = CacheManager.hashContent(article.content);
  const cacheKey = article.url + "_citations";

  // Istanzia CacheManager una sola volta
  const cacheManager = enableCache ? new CacheManager() : null;

  // 1. Controlla cache
  if (cacheManager) {
    const cached = await cacheManager.get(
      cacheKey,
      provider,
      { type: "citations" },
      contentHash,
    );
    if (cached) {
      return { citations: cached, fromCache: true, usedProvider: provider };
    }
  }

  // 2. Estrai citazioni da API
  try {
    const citations = await CitationExtractor.extractCitations(
      article,
      provider,
      apiKey,
      settings,
    );

    // 3. Salva in cache
    if (cacheManager) {
      await cacheManager.set(
        cacheKey,
        provider,
        { type: "citations" },
        citations,
        null,
        contentHash,
      );
    }

    const extractionTime = Date.now() - startTime;
    return {
      citations,
      fromCache: false,
      usedProvider: provider,
      extractionTime,
    };
  } catch (error) {
    console.error("Errore estrazione citazioni:", error);
    const errorMessage = ErrorHandler.getErrorMessage(error);
    await ErrorHandler.logError(error, "handleExtractCitations");
    throw new Error(errorMessage);
  }
}
