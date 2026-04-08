// Popup Script - Controller principale
// Entry point ES Module: importa tutti i moduli e gestisce init + event listeners

import { state, elements, initElements, showState, showError } from './src/popup/state.js';
import { translationState, citationsState } from './src/popup/features.js';
import { analyzeArticle, generateSummary, switchTab, copyToClipboard } from './src/popup/analysis.js';
import { exportToPDF, exportToMarkdown, openEmailModal } from './src/popup/export.js';
import { askQuestion, translateArticle } from './src/popup/features.js';
import { extractCitations } from './src/popup/citations.js';
import { initVoiceController, handleVoiceQuestion } from './src/popup/voice.js';
import { StorageManager } from './utils/storage-manager.js';
import { I18n } from './utils/i18n.js';
import { ProgressTracker } from './utils/progress-tracker.js';
import { eventCleanup } from './utils/event-cleanup.js';
import { ErrorHandler } from './utils/error-handler.js';

// Inizializzazione
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('Popup inizializzato');

    // Inizializza elementi DOM
    initElements();

    // Inizializza i18n
    await I18n.init();

    // Inizializza Progress Tracker
    state.progressTracker = new ProgressTracker(
      elements.loadingState,
      elements.loadingText,
      document.getElementById('progressBar'),
      document.getElementById('progressPercent')
    );

    // Definisci gli step del processo
    state.progressTracker.defineSteps([
      { name: 'extract', label: '📄 Estrazione articolo', weight: 10 },
      { name: 'classify', label: '🔍 Classificazione tipo', weight: 15 },
      { name: 'generate', label: '🤖 Generazione riassunto', weight: 60 },
      { name: 'keypoints', label: '🔑 Estrazione punti chiave', weight: 10 },
      { name: 'save', label: '💾 Salvataggio', weight: 5 }
    ]);

    // Carica impostazioni
    const settings = await StorageManager.getSettings();
    elements.providerSelect.value = settings.selectedProvider;

    // Carica lingua UI salvata
    const savedUILanguage = await StorageManager.getUILanguage();
    const uiLanguageSelect = document.getElementById('uiLanguageSelect');
    if (savedUILanguage && uiLanguageSelect) {
      uiLanguageSelect.value = savedUILanguage;
    }

    // Carica lingua output salvata
    const savedLanguage = await StorageManager.getSelectedLanguage();
    if (savedLanguage) {
      state.selectedLanguage = savedLanguage;
      elements.languageSelect.value = savedLanguage;
      elements.languageSelectReady.value = savedLanguage;
    }

    // Imposta sempre "auto" come default all'apertura
    state.selectedContentType = 'auto';
    elements.contentTypeSelect.value = 'auto';
    elements.contentTypeSelectReady.value = 'auto';

    // 🆕 Event listener per cambio lingua UI (con cleanup)
    if (uiLanguageSelect) {
      const handleUILanguageChange = async (e) => {
        await I18n.setLanguage(e.target.value);
      };
      eventCleanup.addEventListener(uiLanguageSelect, 'change', handleUILanguageChange);
    }

    // 🆕 Event listeners con cleanup automatico
    eventCleanup.addEventListener(elements.analyzeBtn, 'click', analyzeArticle);
    eventCleanup.addEventListener(elements.generateBtn, 'click', generateSummary);
    eventCleanup.addEventListener(elements.retryBtn, 'click', analyzeArticle);
    eventCleanup.addEventListener(elements.themeToggleBtn, 'click', toggleTheme);
    eventCleanup.addEventListener(elements.settingsBtn, 'click', () => {
      chrome.runtime.openOptionsPage();
    });
    eventCleanup.addEventListener(elements.historyBtn, 'click', () => {
      chrome.tabs.create({ url: 'history.html' });
    });
    eventCleanup.addEventListener(elements.multiAnalysisBtn, 'click', () => {
      chrome.tabs.create({ url: 'multi-analysis.html' });
    });
    eventCleanup.addEventListener(elements.pdfAnalysisBtn, 'click', () => {
      chrome.tabs.create({ url: 'pdf-analysis.html' });
    });
    eventCleanup.addEventListener(elements.readingModeBtn, 'click', openReadingMode);
    eventCleanup.addEventListener(elements.copyBtn, 'click', copyToClipboard);
    eventCleanup.addEventListener(elements.newBtn, 'click', reset);
    eventCleanup.addEventListener(elements.exportPdfBtn, 'click', exportToPDF);
    eventCleanup.addEventListener(elements.exportMdBtn, 'click', exportToMarkdown);
    eventCleanup.addEventListener(elements.sendEmailBtn, 'click', openEmailModal);
    eventCleanup.addEventListener(elements.askBtn, 'click', askQuestion);
    eventCleanup.addEventListener(elements.translateBtn, 'click', translateArticle);
    eventCleanup.addEventListener(elements.extractCitationsBtn, 'click', extractCitations);

    // Inizializza Voice Controller
    await initVoiceController();

    // Event listener per domanda vocale
    const voiceQuestionBtn = document.getElementById('voiceQuestionBtn');
    if (voiceQuestionBtn) {
      eventCleanup.addEventListener(voiceQuestionBtn, 'click', handleVoiceQuestion);
    }

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
      const handleTabClick = () => switchTab(tab.dataset.tab);
      eventCleanup.addEventListener(tab, 'click', handleTabClick);
    });

    // Salva provider selezionato
    const handleProviderChange = async () => {
      const settings = await StorageManager.getSettings();
      settings.selectedProvider = elements.providerSelect.value;
      await StorageManager.saveSettings(settings);
    };
    eventCleanup.addEventListener(elements.providerSelect, 'change', handleProviderChange);

    // Salva lingua selezionata (pagina iniziale)
    const handleLanguageChange = async () => {
      state.selectedLanguage = elements.languageSelect.value;
      elements.languageSelectReady.value = state.selectedLanguage; // Sincronizza
      await StorageManager.saveSelectedLanguage(state.selectedLanguage);
      console.log('Lingua selezionata:', state.selectedLanguage);
    };
    eventCleanup.addEventListener(elements.languageSelect, 'change', handleLanguageChange);

    // Salva lingua selezionata (pagina ready)
    const handleLanguageReadyChange = async () => {
      state.selectedLanguage = elements.languageSelectReady.value;
      elements.languageSelect.value = state.selectedLanguage; // Sincronizza
      await StorageManager.saveSelectedLanguage(state.selectedLanguage);
      console.log('Lingua selezionata:', state.selectedLanguage);
    };
    eventCleanup.addEventListener(elements.languageSelectReady, 'change', handleLanguageReadyChange);

    // Gestisci cambio tipo di contenuto (pagina iniziale)
    const handleContentTypeChange = () => {
      state.selectedContentType = elements.contentTypeSelect.value;
      elements.contentTypeSelectReady.value = state.selectedContentType; // Sincronizza
      console.log('Tipo di contenuto selezionato:', state.selectedContentType);
    };
    eventCleanup.addEventListener(elements.contentTypeSelect, 'change', handleContentTypeChange);

    // Gestisci cambio tipo di contenuto (pagina ready)
    const handleContentTypeReadyChange = () => {
      state.selectedContentType = elements.contentTypeSelectReady.value;
      elements.contentTypeSelect.value = state.selectedContentType; // Sincronizza
      console.log('Tipo di contenuto selezionato:', state.selectedContentType);
    };
    eventCleanup.addEventListener(elements.contentTypeSelectReady, 'change', handleContentTypeReadyChange);

    console.log('Event listeners configurati con cleanup automatico');

    // 🆕 Log statistiche listener
    const stats = eventCleanup.getStats();
    console.log(`📊 Listener registrati: ${stats.totalListeners} su ${stats.totalElements} elementi`);
  } catch (error) {
    console.error('Errore inizializzazione popup:', error);
    // 🆕 Usa ErrorHandler per mostrare errore all'utente
    await ErrorHandler.showError(error, 'Inizializzazione popup');
  }
});

function reset() {
  state.currentArticle = null;
  state.currentResults = null;
  state.currentQA = []; // Pulisci anche le Q&A

  // Reset tipo di articolo a 'auto'
  state.selectedContentType = 'auto';
  elements.contentTypeSelect.value = 'auto';
  elements.contentTypeSelectReady.value = 'auto';

  showState('initial');
}

// Theme Toggle
async function toggleTheme() {
  const settings = await StorageManager.getSettings();
  const newDarkMode = !settings.darkMode;

  // Aggiorna impostazioni
  settings.darkMode = newDarkMode;
  await StorageManager.saveSettings(settings);

  // Applica tema
  if (newDarkMode) {
    document.body.classList.add('dark-mode');
    elements.themeToggleBtn.textContent = '☀️';
    elements.themeToggleBtn.title = 'Tema Chiaro';
  } else {
    document.body.classList.remove('dark-mode');
    elements.themeToggleBtn.textContent = '🌙';
    elements.themeToggleBtn.title = 'Tema Scuro';
  }
}

// Inizializza icona tema all'avvio
document.addEventListener('DOMContentLoaded', async () => {
  const settings = await StorageManager.getSettings();
  if (settings.darkMode) {
    // elements può non essere ancora inizializzato qui se questo listener
    // gira prima del principale. Il primo DOMContentLoaded chiama initElements(),
    // quindi l'ordine di registrazione garantisce che questo giri dopo.
    elements.themeToggleBtn.textContent = '☀️';
    elements.themeToggleBtn.title = 'Tema Chiaro';
  }
});

// Open Reading Mode
async function openReadingMode() {
  if (!state.currentArticle || !state.currentResults) {
    showError('Nessun riassunto disponibile per la modalità lettura');
    return;
  }

  // Prepare data for reading mode (include all available data)
  const readingData = {
    article: state.currentArticle,
    summary: state.currentResults.summary,
    keyPoints: state.currentResults.keyPoints,
    translation: translationState.value || null,
    citations: citationsState.value || null,
    qa: state.currentQA && state.currentQA.length > 0 ? state.currentQA : null,
    metadata: {
      provider: elements.providerSelect.value,
      language: state.selectedLanguage,
      contentType: state.currentResults.detectedContentType || state.selectedContentType
    }
  };

  // Save to chrome.storage.local (persists across tabs)
  await chrome.storage.local.set({ readingModeData: readingData });

  // Open reading mode in new tab
  chrome.tabs.create({ url: 'reading-mode.html' });
}
