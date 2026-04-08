// History Page Script

import { state } from './state.js';
import { I18n } from '../../utils/i18n/i18n.js';
import { StorageManager } from '../../utils/storage/storage-manager.js';
import { HistoryManager } from '../../utils/storage/history-manager.js';
import { DebounceUtility } from '../../utils/core/debounce-utility.js';
import { SearchOptimizer } from '../../utils/core/search-optimizer.js';
import { HistoryLazyLoader } from '../../utils/core/history-lazy-loader.js';
import { VoiceController } from '../../utils/voice/voice-controller.js';
import { Modal } from '../../utils/core/modal.js';
import { openDetail, closeModal, switchModalTab, exportCurrentPdf, exportCurrentMarkdown, copyCurrentSummary, deleteCurrentEntry } from './detail.js';
import { loadPDFHistory, loadMultiAnalysisHistory } from './collections.js';
import { sendCurrentEmail, openReadingModeFromHistory, downloadHistory, importHistory } from './io.js';
import { setupVoiceEventListeners, handleModalTTSPlay, handleModalTTSPause, handleModalTTSStop } from './voice.js';

// Inizializza SearchOptimizer nello state
state.searchOptimizer = new SearchOptimizer();

// Registra callbacks sullo state per evitare circular imports tra i moduli
state.loadHistory = () => loadHistory();
state.loadMultiAnalysisHistory = () => loadMultiAnalysisHistory();

// Modal System — caricato da utils/modal.js

document.addEventListener('DOMContentLoaded', async () => {
  // Inizializza i18n
  await I18n.init();

  // Initialize voice controller
  state.voiceController = new VoiceController();
  await state.voiceController.initialize();

  // Setup voice event listeners
  setupVoiceEventListeners();

  // Carica lingua UI salvata
  const savedUILanguage = await StorageManager.getUILanguage();
  const uiLanguageSelect = document.getElementById('uiLanguageSelect');
  if (savedUILanguage && uiLanguageSelect) {
    uiLanguageSelect.value = savedUILanguage;
  }

  // Event listener per cambio lingua UI
  if (uiLanguageSelect) {
    uiLanguageSelect.addEventListener('change', async (e) => {
      await I18n.setLanguage(e.target.value);
    });
  }

  // Assicurati che il tab single sia visibile all'avvio
  document.getElementById('historyList').classList.remove('hidden');
  document.getElementById('multiAnalysisList').classList.add('hidden');

  await loadHistory();

  // History tabs event listeners
  document.querySelectorAll('.history-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Event listeners
  document.getElementById('backBtn').addEventListener('click', () => {
    window.close();
  });

  // Crea versione debounced della ricerca con feedback visivo
  state.debouncedSearch = DebounceUtility.debounceWithFeedback(
    handleSearch,
    300, // 300ms di attesa
    document.getElementById('searchInput')
  );

  document.getElementById('searchInput').addEventListener('input', state.debouncedSearch);
  document.getElementById('searchInTitle').addEventListener('change', () => {
    // Ri-esegui ricerca se c'è un query
    const query = document.getElementById('searchInput').value.trim();
    if (query) handleSearch({ target: document.getElementById('searchInput') });
  });
  document.getElementById('searchInUrl').addEventListener('change', () => {
    const query = document.getElementById('searchInput').value.trim();
    if (query) handleSearch({ target: document.getElementById('searchInput') });
  });
  document.getElementById('searchInContent').addEventListener('change', () => {
    const query = document.getElementById('searchInput').value.trim();
    if (query) handleSearch({ target: document.getElementById('searchInput') });
  });
  document.getElementById('providerFilter').addEventListener('change', handleFilter);
  document.getElementById('languageFilter').addEventListener('change', handleFilter);
  document.getElementById('contentTypeFilter').addEventListener('change', handleFilter);
  document.getElementById('favoriteFilter').addEventListener('change', handleFilter);
  document.getElementById('downloadHistoryBtn').addEventListener('click', downloadHistory);
  document.getElementById('importHistoryBtn').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
  });
  document.getElementById('importFileInput').addEventListener('change', importHistory);
  document.getElementById('clearSingleHistoryBtn').addEventListener('click', clearSingleHistory);
  document.getElementById('clearPDFHistoryBtn').addEventListener('click', clearPDFHistory);
  document.getElementById('clearMultiHistoryBtn').addEventListener('click', clearMultiHistory);

  // Modal
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('readingModeBtn').addEventListener('click', openReadingModeFromHistory);
  document.getElementById('exportPdfBtn').addEventListener('click', exportCurrentPdf);
  document.getElementById('exportMdBtn').addEventListener('click', exportCurrentMarkdown);
  document.getElementById('sendEmailBtn').addEventListener('click', sendCurrentEmail);
  document.getElementById('copyModalBtn').addEventListener('click', copyCurrentSummary);
  document.getElementById('deleteModalBtn').addEventListener('click', deleteCurrentEntry);

  // Modal tabs
  document.querySelectorAll('.modal-tab').forEach(tab => {
    tab.addEventListener('click', () => switchModalTab(tab.dataset.tab));
  });

  // Voice controls in modal
  document.getElementById('modalTtsPlayBtn').addEventListener('click', handleModalTTSPlay);
  document.getElementById('modalTtsPauseBtn').addEventListener('click', handleModalTTSPause);
  document.getElementById('modalTtsStopBtn').addEventListener('click', handleModalTTSStop);

  // Close modal on background click
  document.getElementById('detailModal').addEventListener('click', (e) => {
    if (e.target.id === 'detailModal') {
      closeModal();
    }
  });
});

export async function loadHistory() {
  state.currentHistory = await HistoryManager.getHistory();

  // Inizializza lazy loader se non esiste
  if (!state.lazyLoader) {
    const listEl = document.getElementById('historyList');
    state.lazyLoader = new HistoryLazyLoader(listEl, 20); // 20 items per page

    // Imposta callbacks
    state.lazyLoader.onItemClick = openDetail;
    state.lazyLoader.onFavoriteToggle = async (id) => {
      const isFavorite = await HistoryManager.toggleFavorite(id);
      // Aggiorna anche in currentHistory
      const entry = state.currentHistory.find(e => e.id === id);
      if (entry) {
        entry.favorite = isFavorite;
      }
      return isFavorite;
    };
  }

  displayHistory(state.currentHistory);
}

function displayHistory(history) {
  const listEl = document.getElementById('historyList');
  const emptyEl = document.getElementById('emptyState');

  if (history.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');

  // Usa lazy loader invece di innerHTML
  if (!state.lazyLoader) {
    state.lazyLoader = new HistoryLazyLoader(listEl, 20);
    state.lazyLoader.onItemClick = openDetail;
    state.lazyLoader.onFavoriteToggle = async (id) => {
      const isFavorite = await HistoryManager.toggleFavorite(id);
      const entry = state.currentHistory.find(e => e.id === id);
      if (entry) {
        entry.favorite = isFavorite;
      }
      return isFavorite;
    };
  }

  state.lazyLoader.setItems(history);
}

async function handleSearch(e) {
  const query = e.target.value.trim();

  if (query === '') {
    state.searchOptimizer.reset();
    displayHistory(state.currentHistory);
    return;
  }

  // Ottieni opzioni di ricerca
  const searchInTitle = document.getElementById('searchInTitle').checked;
  const searchInUrl = document.getElementById('searchInUrl').checked;
  const searchInContent = document.getElementById('searchInContent').checked;

  // Usa search optimizer per ricerca incrementale
  const filtered = state.searchOptimizer.search(state.currentHistory, query, {
    searchInTitle,
    searchInUrl,
    searchInContent
  });

  displayHistory(filtered);
}

async function handleFilter() {
  const provider = document.getElementById('providerFilter').value;
  const language = document.getElementById('languageFilter').value;
  const contentType = document.getElementById('contentTypeFilter').value;
  const favoriteFilter = document.getElementById('favoriteFilter').value;

  let filtered = state.currentHistory;

  // Applica filtri standard
  const filters = {};
  if (provider) filters.provider = provider;
  if (language) filters.language = language;
  if (contentType) filters.contentType = contentType;

  if (Object.keys(filters).length > 0) {
    filtered = await HistoryManager.filterHistory(filters);
  }

  // Applica filtro preferiti/note
  if (favoriteFilter === 'favorites') {
    filtered = filtered.filter(entry => entry.favorite === true);
  } else if (favoriteFilter === 'withNotes') {
    filtered = filtered.filter(entry => entry.notes && entry.notes.trim().length > 0);
  }

  displayHistory(filtered);
}

async function clearSingleHistory() {
  const history = await HistoryManager.getHistory();
  const favoritesCount = history.filter(e => e.favorite).length;

  let message = 'Sei sicuro di voler cancellare tutta la cronologia degli articoli singoli?';
  if (favoritesCount > 0) {
    message += `\n\n⭐ ${favoritesCount} articoli preferiti NON verranno eliminati.`;
  }
  message += '\n\nQuesta azione non può essere annullata.';

  const confirmed = await Modal.confirm(
    message,
    'Cancella Articoli Singoli',
    '🗑️'
  );

  if (!confirmed) return;

  await HistoryManager.clearHistory();
  await loadHistory();
}

async function clearPDFHistory() {
  const history = await HistoryManager.getPDFHistory();
  const favoritesCount = history.filter(e => e.favorite).length;

  let message = 'Sei sicuro di voler cancellare tutta la cronologia dei PDF analizzati?';
  if (favoritesCount > 0) {
    message += `\n\n⭐ ${favoritesCount} PDF preferiti NON verranno eliminati.`;
  }
  message += '\n\nQuesta azione non può essere annullata.';

  const confirmed = await Modal.confirm(
    message,
    'Elimina Cronologia PDF',
    '🗑️'
  );

  if (!confirmed) return;

  await HistoryManager.clearPDFHistory();
  await loadPDFHistory();
}

async function clearMultiHistory() {
  const history = await HistoryManager.getMultiAnalysisHistory();
  const favoritesCount = history.filter(e => e.favorite).length;

  let message = 'Sei sicuro di voler cancellare tutta la cronologia delle analisi Multi Articolo?';
  if (favoritesCount > 0) {
    message += `\n\n⭐ ${favoritesCount} analisi preferite NON verranno eliminate.`;
  }
  message += '\n\nQuesta azione non può essere annullata.';

  const confirmed = await Modal.confirm(
    message,
    'Cancella Analisi Multiple',
    '🗑️'
  );

  if (!confirmed) return;

  await HistoryManager.clearMultiAnalysisHistory();
  await loadMultiAnalysisHistory();
}


// ===== MULTI-ANALYSIS HISTORY =====

let currentTab = 'single';

function switchTab(tab) {
  currentTab = tab;

  // Aggiorna UI dei tab
  document.querySelectorAll('.history-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });

  // Mostra/nascondi liste
  document.getElementById('historyList').classList.toggle('hidden', tab !== 'single');
  document.getElementById('pdfHistoryList').classList.toggle('hidden', tab !== 'pdf');
  document.getElementById('multiAnalysisList').classList.toggle('hidden', tab !== 'multi');

  // Mostra/nascondi pulsanti appropriati
  document.getElementById('clearSingleHistoryBtn').classList.toggle('hidden', tab !== 'single');
  document.getElementById('clearPDFHistoryBtn').classList.toggle('hidden', tab !== 'pdf');
  document.getElementById('clearMultiHistoryBtn').classList.toggle('hidden', tab !== 'multi');

  // Carica la cronologia appropriata
  if (tab === 'multi') {
    loadMultiAnalysisHistory();
  } else if (tab === 'pdf') {
    loadPDFHistory();
  }
}


// Theme Toggle
async function toggleTheme() {
  const settings = await StorageManager.getSettings();
  const newDarkMode = !settings.darkMode;

  settings.darkMode = newDarkMode;
  await StorageManager.saveSettings(settings);

  if (newDarkMode) {
    document.body.classList.add('dark-mode');
    document.getElementById('themeToggleBtn').textContent = '☀️';
    document.getElementById('themeToggleBtn').title = 'Tema Chiaro';
  } else {
    document.body.classList.remove('dark-mode');
    document.getElementById('themeToggleBtn').textContent = '🌙';
    document.getElementById('themeToggleBtn').title = 'Tema Scuro';
  }
}

// Inizializza tema
(async function initTheme() {
  const settings = await StorageManager.getSettings();
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
    if (settings.darkMode) {
      themeBtn.textContent = '☀️';
      themeBtn.title = 'Tema Chiaro';
    }
  }
})();
