// Options Script - Gestione impostazioni
import { StorageManager } from '../../utils/storage/storage-manager.js';
import { I18n } from '../../utils/i18n/i18n.js';
import { ThemeManager } from '../../utils/core/theme-manager.js';
import { APIResilience } from '../../utils/ai/api-resilience.js';
import { CacheManager } from '../../utils/storage/cache-manager.js';
import { CompressionManager } from '../../utils/storage/compression-manager.js';
document.addEventListener('DOMContentLoaded', async () => {
  await I18n.initPage();

  await loadSettings();
  await loadApiKeys();
  await loadStats();
  await loadPerformanceStats();

  // Event listeners
  document.getElementById('saveKeysBtn').addEventListener('click', saveApiKeys);
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
  document.getElementById('savePerformanceBtn').addEventListener('click', savePerformanceSettings);
  document.getElementById('clearCacheBtn').addEventListener('click', clearCache);
  document.getElementById('clearLogsBtn').addEventListener('click', clearLogs);
  document.getElementById('runCleanupBtn').addEventListener('click', runCleanup);

  // Test API keys
  document.querySelectorAll('.btn-test').forEach((btn) => {
    btn.addEventListener('click', () => testApiKey(btn.dataset.provider));
  });

  // Applica tema in tempo reale quando cambia il checkbox
  document.getElementById('darkMode').addEventListener('change', (e) => {
    applyTheme(e.target.checked);
  });

  // Refresh stats ogni 30 secondi
  setInterval(async () => {
    await loadPerformanceStats();
  }, 30000);
});

async function loadSettings() {
  const settings = await StorageManager.getSettings();

  document.getElementById('defaultProvider').value = settings.selectedProvider;
  document.getElementById('saveHistory').checked = settings.saveHistory;
  document.getElementById('darkMode').checked = settings.darkMode || false;

  // Performance settings
  document.getElementById('enableCache').checked = settings.enableCache !== false;
  document.getElementById('cacheTTL').value = settings.cacheTTL || 7;
  document.getElementById('enableFallback').checked = settings.enableFallback || false;
  document.getElementById('enableCompression').checked = settings.enableCompression !== false;
  document.getElementById('autoCleanup').checked = settings.autoCleanup !== false;

  // Applica il tema
  applyTheme(settings.darkMode);
}

async function loadApiKeys() {
  const providers = ['groq', 'openai', 'anthropic', 'gemini'];

  for (const provider of providers) {
    const key = await StorageManager.getApiKey(provider);
    if (key) {
      const input = document.getElementById(`${provider}Key`);
      // Mostra solo gli ultimi 4 caratteri per sicurezza
      const masked = '\u2022'.repeat(Math.max(0, key.length - 4)) + key.slice(-4);
      input.value = masked;
      input.dataset.masked = 'true';
      // Al focus, se ancora mascherato, svuota per nuovo inserimento
      input.addEventListener(
        'focus',
        function onFocus() {
          if (this.dataset.masked === 'true') {
            this.value = '';
            this.dataset.masked = 'false';
          }
        },
        { once: true },
      );
      showStatus(provider, 'success', I18n.t('settings.status.configured'));
    }
  }
}

async function loadStats() {
  const result = await chrome.storage.local.get(['stats']);
  const stats = result.stats || {
    totalSummaries: 0,
    totalWords: 0,
    providerUsage: {},
    totalTime: 0,
  };

  document.getElementById('totalSummaries').textContent = stats.totalSummaries;
  document.getElementById('totalWords').textContent = stats.totalWords.toLocaleString();

  // Provider più usato
  const providers = Object.entries(stats.providerUsage);
  if (providers.length > 0) {
    const mostUsed = providers.reduce((a, b) => (a[1] > b[1] ? a : b));
    document.getElementById('mostUsedProvider').textContent = mostUsed[0];
  }

  // Tempo risparmiato (assumendo 225 parole/min)
  const minutesSaved = Math.floor(stats.totalWords / 225);
  const hoursSaved = (minutesSaved / 60).toFixed(1);
  document.getElementById('timeSaved').textContent = `${hoursSaved}h`;
}

async function saveApiKeys() {
  const providers = ['groq', 'openai', 'anthropic', 'gemini'];

  for (const provider of providers) {
    const input = document.getElementById(`${provider}Key`);
    const key = input.value.trim();

    // Non salvare se il campo è ancora mascherato (non modificato dall'utente)
    if (key && input.dataset.masked !== 'true') {
      await StorageManager.saveApiKey(provider, key);
      showStatus(provider, 'success', I18n.t('settings.status.saved'));
    }
  }

  showToast(I18n.t('settings.toast.keysSaved'), 'success');
}

async function saveSettings() {
  const darkMode = document.getElementById('darkMode').checked;

  const settings = {
    selectedProvider: document.getElementById('defaultProvider').value,
    summaryLength: 'detailed', // Fisso a dettagliato per massima completezza
    tone: 'neutral', // Fisso a neutrale
    saveHistory: document.getElementById('saveHistory').checked,
    darkMode: darkMode,
  };

  await StorageManager.saveSettings(settings);
  applyTheme(darkMode);
  showToast(I18n.t('settings.toast.prefSaved'), 'success');
}

function applyTheme(isDark) {
  if (isDark) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

async function testApiKey(provider) {
  const input = document.getElementById(`${provider}Key`);
  const key = input.value.trim();

  if (!key) {
    showStatus(provider, 'error', I18n.t('settings.test.enterKey'));
    return;
  }

  showStatus(provider, 'loading', I18n.t('settings.test.testing'));

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'testApiKey',
      provider: provider,
      apiKey: key,
    });

    if (response.success) {
      showStatus(provider, 'success', I18n.t('settings.test.verified'));
    } else {
      showStatus(provider, 'error', `${I18n.t('settings.test.failed')} ${response.error}`);
    }
  } catch (error) {
    console.error('Errore test API key:', error);
    showStatus(
      provider,
      'error',
      I18n.t('settings.test.genericError') || 'Errore durante il test. Riprova.',
    );
  }
}

async function savePerformanceSettings() {
  const settings = await StorageManager.getSettings();

  settings.enableCache = document.getElementById('enableCache').checked;
  settings.cacheTTL = parseInt(document.getElementById('cacheTTL').value);
  settings.enableFallback = document.getElementById('enableFallback').checked;
  settings.enableCompression = document.getElementById('enableCompression').checked;
  settings.autoCleanup = document.getElementById('autoCleanup').checked;

  await StorageManager.saveSettings(settings);

  // Configura TTL cache
  const cacheManager = new CacheManager();
  cacheManager.setDefaultTTL(settings.cacheTTL);

  showToast(I18n.t('settings.toast.perfSaved'), 'success');

  // Refresh stats
  await loadPerformanceStats();
}

async function loadPerformanceStats() {
  try {
    // Cache stats
    const cacheManager = new CacheManager();
    const cacheStats = await cacheManager.getStats();

    if (cacheStats) {
      document.getElementById('cacheEntries').textContent = cacheStats.validEntries;
      document.getElementById('cacheHitRate').textContent = cacheStats.hitRate + '%';
      document.getElementById('cacheSize').textContent = cacheStats.sizeMB + ' MB';
      document.getElementById('cacheSaved').textContent = cacheStats.totalHits;
    }

    // API stats
    const resilience = new APIResilience();
    const apiStats = await resilience.getStats();

    if (apiStats) {
      document.getElementById('apiSuccessRate').textContent = apiStats.successRate + '%';
      document.getElementById('apiRetries').textContent = apiStats.retryCount;
      document.getElementById('apiFallbacks').textContent = apiStats.fallbackCount;
      document.getElementById('apiFailures').textContent = apiStats.failureCount;
    }

    // Compression stats
    const compressionManager = new CompressionManager();
    const compressionStats = await compressionManager.getStats();

    if (compressionStats) {
      document.getElementById('compressedItems').textContent = compressionStats.compressedItems;
      document.getElementById('compressionRatio').textContent =
        compressionStats.compressionRatio + '%';
      document.getElementById('spaceSaved').textContent = compressionStats.savedMB + ' MB';
      document.getElementById('totalSize').textContent = compressionStats.totalCompressedSize;
    }
  } catch (error) {
    console.error('Errore nel caricare statistiche performance:', error);
  }
}

async function runCleanup() {
  showToast(I18n.t('settings.cleanup.running'), 'info');

  try {
    const compressionManager = new CompressionManager();
    const results = await compressionManager.autoCleanup({
      compressHistoryOlderThan: 30,
      compressCacheOlderThan: 7,
      deleteHistoryOlderThan: 180,
      maxCacheEntries: 100,
    });

    const message = I18n.tf('settings.cleanup.completed', {
      compressedHistory: results.compressedHistory,
      compressedCache: results.compressedCache,
      deletedHistory: results.deletedHistory,
      cleanedCache: results.cleanedCache,
    });
    showToast(message, 'success');

    // Refresh stats
    await loadPerformanceStats();
  } catch (error) {
    console.error('Errore cleanup:', error);
    showToast(I18n.t('settings.cleanup.error') || 'Errore durante la pulizia. Riprova.', 'error');
  }
}

async function clearCache() {
  if (confirm(I18n.t('settings.cache.confirmClear'))) {
    const cacheManager = new CacheManager();
    await cacheManager.clearAll();
    showToast(I18n.t('settings.cache.cleared'), 'success');
    await loadPerformanceStats();
  }
}

async function clearLogs() {
  if (confirm(I18n.t('settings.logs.confirmClear'))) {
    const resilience = new APIResilience();
    const cacheManager = new CacheManager();
    const compressionManager = new CompressionManager();

    await resilience.clearLogs();
    await cacheManager.clearLogs();

    showToast(I18n.t('settings.logs.cleared'), 'success');
    await loadPerformanceStats();
  }
}

function showStatus(provider, type, message) {
  const statusEl = document.getElementById(`${provider}Status`);
  statusEl.className = `status ${type}`;
  statusEl.textContent = message;
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}
