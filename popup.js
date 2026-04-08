// Popup Script - Controller principale
// Variabili globali di stato, init, event listeners, UI management
// Modules loaded before this file: src/popup/ (analysis, export, features, citations, voice)
// accedono a queste variabili globali direttamente.

let currentArticle = null;
let currentResults = null;
let selectedLanguage = 'it'; // Default: Italiano
let selectedContentType = 'auto'; // Default: Rilevamento automatico
let currentQA = []; // Array per salvare domande e risposte

// Progress Tracker
let progressTracker = null;

// Modal System — caricato da utils/modal.js

// Elementi DOM
const elements = {
  // Stati
  initialState: document.getElementById('initialState'),
  loadingState: document.getElementById('loadingState'),
  errorState: document.getElementById('errorState'),
  resultsState: document.getElementById('resultsState'),

  // Info articolo
  articleInfo: document.getElementById('articleInfo'),
  articleTitle: document.getElementById('articleTitle'),
  articleStats: document.getElementById('articleStats'),

  // Controlli
  controls: document.getElementById('controls'),
  providerSelect: document.getElementById('providerSelect'),
  languageSelect: document.getElementById('languageSelect'),
  contentTypeSelect: document.getElementById('contentTypeSelect'),
  languageSelectReady: document.getElementById('languageSelectReady'),
  contentTypeSelectReady: document.getElementById('contentTypeSelectReady'),

  // Bottoni
  analyzeBtn: document.getElementById('analyzeBtn'),
  generateBtn: document.getElementById('generateBtn'),
  retryBtn: document.getElementById('retryBtn'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  historyBtn: document.getElementById('historyBtn'),
  multiAnalysisBtn: document.getElementById('multiAnalysisBtn'),
  pdfAnalysisBtn: document.getElementById('pdfAnalysisBtn'),
  readingModeBtn: document.getElementById('readingModeBtn'),
  copyBtn: document.getElementById('copyBtn'),
  newBtn: document.getElementById('newBtn'),
  exportPdfBtn: document.getElementById('exportPdfBtn'),
  exportMdBtn: document.getElementById('exportMdBtn'),
  sendEmailBtn: document.getElementById('sendEmailBtn'),
  askBtn: document.getElementById('askBtn'),

  // Contenuto
  loadingText: document.getElementById('loadingText'),
  errorMessage: document.getElementById('errorMessage'),
  summaryContent: document.getElementById('summaryContent'),
  keypointsContent: document.getElementById('keypointsContent'),
  translationContent: document.getElementById('translationContent'),

  // Q&A
  questionInput: document.getElementById('questionInput'),
  qaAnswer: document.getElementById('qaAnswer'),

  // Translation
  translateBtn: document.getElementById('translateBtn'),

  // Citations
  extractCitationsBtn: document.getElementById('extractCitationsBtn'),
  citationsContent: document.getElementById('citationsContent')
};

// Inizializzazione
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('Popup inizializzato');

    // Inizializza i18n
    await I18n.init();

    // Inizializza Progress Tracker
    progressTracker = new ProgressTracker(
      elements.loadingState,
      elements.loadingText,
      document.getElementById('progressBar'),
      document.getElementById('progressPercent')
    );

    // Definisci gli step del processo
    progressTracker.defineSteps([
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
      selectedLanguage = savedLanguage;
      elements.languageSelect.value = savedLanguage;
      elements.languageSelectReady.value = savedLanguage;
    }

    // Imposta sempre "auto" come default all'apertura
    selectedContentType = 'auto';
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
      selectedLanguage = elements.languageSelect.value;
      elements.languageSelectReady.value = selectedLanguage; // Sincronizza
      await StorageManager.saveSelectedLanguage(selectedLanguage);
      console.log('Lingua selezionata:', selectedLanguage);
    };
    eventCleanup.addEventListener(elements.languageSelect, 'change', handleLanguageChange);

    // Salva lingua selezionata (pagina ready)
    const handleLanguageReadyChange = async () => {
      selectedLanguage = elements.languageSelectReady.value;
      elements.languageSelect.value = selectedLanguage; // Sincronizza
      await StorageManager.saveSelectedLanguage(selectedLanguage);
      console.log('Lingua selezionata:', selectedLanguage);
    };
    eventCleanup.addEventListener(elements.languageSelectReady, 'change', handleLanguageReadyChange);

    // Gestisci cambio tipo di contenuto (pagina iniziale)
    const handleContentTypeChange = () => {
      selectedContentType = elements.contentTypeSelect.value;
      elements.contentTypeSelectReady.value = selectedContentType; // Sincronizza
      console.log('Tipo di contenuto selezionato:', selectedContentType);
    };
    eventCleanup.addEventListener(elements.contentTypeSelect, 'change', handleContentTypeChange);

    // Gestisci cambio tipo di contenuto (pagina ready)
    const handleContentTypeReadyChange = () => {
      selectedContentType = elements.contentTypeSelectReady.value;
      elements.contentTypeSelect.value = selectedContentType; // Sincronizza
      console.log('Tipo di contenuto selezionato:', selectedContentType);
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

function showState(stateName) {
  // Nascondi tutti gli stati
  elements.initialState.classList.add('hidden');
  elements.loadingState.classList.add('hidden');
  elements.errorState.classList.add('hidden');
  elements.resultsState.classList.add('hidden');
  elements.articleInfo.classList.add('hidden');
  elements.controls.classList.add('hidden');

  // Mostra solo lo stato richiesto
  if (stateName === 'initial') {
    elements.initialState.classList.remove('hidden');
  } else if (stateName === 'loading') {
    elements.loadingState.classList.remove('hidden');
  } else if (stateName === 'error') {
    elements.errorState.classList.remove('hidden');
  } else if (stateName === 'ready') {
    // Mostra solo info articolo e controlli, NON la schermata iniziale
    elements.articleInfo.classList.remove('hidden');
    elements.controls.classList.remove('hidden');
    // Aggiorna traduzioni per elementi appena mostrati
    I18n.updateUI();
  } else if (stateName === 'results') {
    elements.articleInfo.classList.remove('hidden');
    elements.resultsState.classList.remove('hidden');
    // Aggiorna traduzioni per elementi appena mostrati
    I18n.updateUI();
  }
}

function reset() {
  currentArticle = null;
  currentResults = null;
  currentQA = []; // Pulisci anche le Q&A

  // Reset tipo di articolo a 'auto'
  selectedContentType = 'auto';
  elements.contentTypeSelect.value = 'auto';
  elements.contentTypeSelectReady.value = 'auto';

  showState('initial');
}

function showError(message) {
  elements.errorMessage.textContent = message;
  showState('error');
}

function getErrorMessage(error) {
  if (error.includes('No article found')) {
    return 'Nessun articolo rilevato in questa pagina. Prova con un articolo di blog o news.';
  }
  if (error.includes('Article too short')) {
    return 'Articolo troppo breve per essere riassunto (minimo 200 parole).';
  }
  if (error.includes('API key non configurata')) {
    return 'API key non configurata. Clicca sull\'icona ⚙️ per configurare.';
  }
  if (error.includes('401')) {
    return 'API key non valida. Verifica la configurazione nelle impostazioni.';
  }
  if (error.includes('429')) {
    return 'Troppe richieste. Riprova tra qualche secondo.';
  }
  if (error.includes('Network')) {
    return 'Errore di connessione. Verifica la tua connessione internet.';
  }
  return error;
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
    elements.themeToggleBtn.textContent = '☀️';
    elements.themeToggleBtn.title = 'Tema Chiaro';
  }
});

// Open Reading Mode
async function openReadingMode() {
  if (!currentArticle || !currentResults) {
    showError('Nessun riassunto disponibile per la modalità lettura');
    return;
  }

  // Prepare data for reading mode (include all available data)
  const readingData = {
    article: currentArticle,
    summary: currentResults.summary,
    keyPoints: currentResults.keyPoints,
    translation: currentTranslation || null,
    citations: currentCitations || null,
    qa: currentQA && currentQA.length > 0 ? currentQA : null,
    metadata: {
      provider: elements.providerSelect.value,
      language: selectedLanguage,
      contentType: currentResults.detectedContentType || selectedContentType
    }
  };

  // Save to chrome.storage.local (persists across tabs)
  await chrome.storage.local.set({ readingModeData: readingData });

  // Open reading mode in new tab
  chrome.tabs.create({ url: 'reading-mode.html' });
}
