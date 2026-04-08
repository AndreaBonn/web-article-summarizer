// Popup Script - Logica interfaccia utente
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

async function analyzeArticle() {
  showState('loading');
  elements.loadingText.textContent = I18n.t('loading.extract');
  
  try {
    // Ottieni tab corrente
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Verifica che non sia una pagina chrome://
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      throw new Error('Impossibile analizzare pagine interne di Chrome');
    }
    
    // Estrai articolo
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractArticle' });
    
    if (!response || !response.success) {
      throw new Error(response?.error || 'Errore durante l\'estrazione');
    }
    
    currentArticle = response.article;
    currentArticle.url = tab.url;
    
    // Mostra info articolo
    elements.articleTitle.textContent = currentArticle.title;
    elements.articleStats.textContent = `${currentArticle.wordCount} ${I18n.t('article.words')} • ${currentArticle.readingTimeMinutes} ${I18n.t('article.readingTime')}`;
    
    // 🔍 Controlla se l'articolo è già stato analizzato in precedenza
    const history = await HistoryManager.getHistory();
    const previousAnalysis = history.find(entry => entry.article.url === currentArticle.url);
    
    if (previousAnalysis && previousAnalysis.metadata && previousAnalysis.metadata.contentType) {
      // Se l'articolo è già stato analizzato e ha un contentType salvato
      const savedContentType = previousAnalysis.metadata.contentType;
      
      // Imposta il tipo di articolo salvato nei select
      selectedContentType = savedContentType;
      elements.contentTypeSelect.value = savedContentType;
      elements.contentTypeSelectReady.value = savedContentType;
      
      console.log('📋 Tipo di articolo recuperato dalla cronologia:', savedContentType);
      
      // Mostra un feedback visivo temporaneo
      elements.loadingText.textContent = `${I18n.t('loading.articleType')} ${ContentClassifier.getCategoryLabel(savedContentType)} (${I18n.t('loading.fromHistory')})`;
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    showState('ready');
    
  } catch (error) {
    console.error('Errore analisi:', error);
    // 🆕 Usa ErrorHandler per gestione errori migliorata
    await ErrorHandler.showError(error, 'Analisi articolo');
  }
}

async function generateSummary() {
  if (!currentArticle) {
    await ErrorHandler.showError(new Error('Nessun articolo estratto'), 'Generazione riassunto');
    return;
  }
  
  showState('loading');
  progressTracker.start();
  
  try {
    const settings = await StorageManager.getSettings();
    const provider = elements.providerSelect.value;
    
    // Aggiungi la lingua selezionata alle impostazioni
    settings.outputLanguage = selectedLanguage;
    
    // Aggiungi la lunghezza del riassunto selezionata
    const summaryLengthSelect = document.getElementById('summaryLengthSelect');
    if (summaryLengthSelect) {
      settings.summaryLength = summaryLengthSelect.value;
    }
    
    // STEP 1: Classificazione del tipo di contenuto
    progressTracker.setStep('classify');
    let finalContentType = selectedContentType;
    
    console.log('🎯 selectedContentType:', selectedContentType);
    
    if (selectedContentType === 'auto') {
      console.log('🔄 Avvio classificazione automatica...');
      progressTracker.setStep('classify', '🔍 Analisi contenuto con AI...');
      
      console.log('📋 currentArticle:', currentArticle);
      
      try {
        const classification = await ContentClassifier.classifyArticle(currentArticle, 'auto');
        finalContentType = classification.category;
        
        console.log('✅ Classificazione completata:', classification);
        
        // Mostra la categoria rilevata
        const categoryLabel = ContentClassifier.getCategoryLabel(finalContentType);
        progressTracker.setStep('classify', `✓ Rilevato: ${categoryLabel}`);
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (error) {
        console.error('❌ Errore classificazione:', error);
        await ErrorHandler.logError(error, 'Classificazione contenuto');
        finalContentType = 'general'; // Fallback
      }
    } else {
      console.log('👤 Tipo già impostato (manuale o da cronologia):', selectedContentType);
      progressTracker.setStep('classify', '✓ Tipo già impostato');
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // STEP 2: Generazione riassunto
    progressTracker.setStep('generate');
    settings.contentType = finalContentType;
    
    const response = await chrome.runtime.sendMessage({
      action: 'generateSummary',
      article: currentArticle,
      provider: provider,
      settings: settings
    });
    
    if (!response.success) {
      throw new Error(response.error);
    }
    
    currentResults = response.result;
    
    // STEP 3: Punti chiave (già inclusi, ma mostriamo lo step)
    progressTracker.setStep('keypoints');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // STEP 4: Salvataggio
    progressTracker.setStep('save');
    
    if (selectedContentType === 'auto') {
      currentResults.detectedContentType = finalContentType;
      currentResults.contentTypeMethod = 'auto';
    } else {
      currentResults.detectedContentType = selectedContentType;
      currentResults.contentTypeMethod = 'manual';
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    progressTracker.complete();
    displayResults();
    
  } catch (error) {
    progressTracker.error(error.message);
    // 🆕 Usa ErrorHandler per gestione errori migliorata
    await ErrorHandler.showError(error, 'Generazione riassunto');
    setTimeout(() => {
      showState('error');
    }, 2000);
  }
}

async function displayResults() {
  // Mostra riassunto (contenuto AI sanitizzato)
  let summaryHtml = `<p>${HtmlSanitizer.escape(currentResults.summary)}</p>`;
  if (currentResults.fromCache) {
    summaryHtml = `<span class="cache-badge">Da cache</span>` + summaryHtml;
  }
  elements.summaryContent.innerHTML = summaryHtml;
  
  // Mostra punti chiave
  let keypointsHtml = '';
  currentResults.keyPoints.forEach((point, index) => {
    keypointsHtml += `
      <div class="keypoint" data-paragraph="${HtmlSanitizer.escape(String(point.paragraphs))}">
        <div class="keypoint-header">
          <div class="keypoint-title">${index + 1}. ${HtmlSanitizer.escape(point.title)}</div>
          <div class="keypoint-ref">§${HtmlSanitizer.escape(String(point.paragraphs))}</div>
        </div>
        <div class="keypoint-desc">${HtmlSanitizer.escape(point.description)}</div>
      </div>
    `;
  });
  elements.keypointsContent.innerHTML = keypointsHtml;
  
  // Aggiungi click handler per highlight
  document.querySelectorAll('.keypoint').forEach(el => {
    el.addEventListener('click', async () => {
      const paragraph = el.dataset.paragraph;
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, {
        action: 'highlightParagraph',
        paragraphNumber: paragraph
      });
    });
  });
  
  // Salva nella cronologia
  try {
    const metadata = {
      provider: elements.providerSelect.value,
      language: selectedLanguage,
      contentType: currentResults.detectedContentType || selectedContentType,
      contentTypeMethod: currentResults.contentTypeMethod || 'manual',
      fromCache: currentResults.fromCache || false
    };
    
    await HistoryManager.saveSummary(
      currentArticle,
      currentResults.summary,
      currentResults.keyPoints,
      metadata
    );
  } catch (error) {
    console.error('Errore salvataggio cronologia:', error);
  }
  
  showState('results');
  
  // Aggiungi pulsanti TTS dopo aver mostrato i risultati
  setTimeout(() => {
    addTTSButtons();
  }, 100);
}

function switchTab(tabName) {
  // Aggiorna tab attivi
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    }
  });
  
  // Aggiorna contenuto
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  
  if (tabName === 'summary') {
    document.getElementById('summaryTab').classList.add('active');
  } else if (tabName === 'keypoints') {
    document.getElementById('keypointsTab').classList.add('active');
  } else if (tabName === 'translation') {
    document.getElementById('translationTab').classList.add('active');
  } else if (tabName === 'citations') {
    document.getElementById('citationsTab').classList.add('active');
  }
}

async function copyToClipboard() {
  if (!currentResults) return;
  
  let text = `RIASSUNTO:\n${currentResults.summary}\n\n`;
  text += `PUNTI CHIAVE:\n`;
  currentResults.keyPoints.forEach((point, index) => {
    text += `${index + 1}. ${point.title} (§${point.paragraphs})\n   ${point.description}\n\n`;
  });
  
  // Aggiungi traduzione se presente
  if (currentTranslation) {
    text += `\n${'='.repeat(50)}\n\n`;
    text += `TRADUZIONE:\n${currentTranslation}\n`;
  }
  
  // Aggiungi Q&A se presenti
  if (currentQA && currentQA.length > 0) {
    text += `\n${'='.repeat(50)}\n\n`;
    text += `DOMANDE E RISPOSTE:\n\n`;
    currentQA.forEach((qa, index) => {
      text += `Q${index + 1}: ${qa.question}\n`;
      text += `R${index + 1}: ${qa.answer}\n\n`;
    });
  }
  
  // Aggiungi citazioni se presenti
  if (currentCitations && currentCitations.citations && currentCitations.citations.length > 0) {
    text += `\n${'='.repeat(50)}\n\n`;
    text += `CITAZIONI E BIBLIOGRAFIA:\n\n`;
    const style = document.getElementById('citationStyleSelect')?.value || 'apa';
    text += CitationExtractor.generateBibliography(currentArticle, currentCitations.citations, style);
  }
  
  try {
    await navigator.clipboard.writeText(text);
    elements.copyBtn.textContent = I18n.t('feedback.copied');
    setTimeout(() => {
      elements.copyBtn.textContent = I18n.t('action.copy');
    }, 2000);
  } catch (error) {
    console.error('Errore copia:', error);
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

// Export to PDF
async function exportToPDF() {
  if (!currentArticle || !currentResults) {
    showError('Nessun riassunto da esportare');
    return;
  }
  
  // Mostra modal di selezione
  showExportOptionsModal();
}

async function showExportOptionsModal() {
  const modal = document.getElementById('exportOptionsModal');
  const translationOption = document.getElementById('pdfTranslationOption');
  const qaOption = document.getElementById('pdfQAOption');
  const citationsOption = document.getElementById('pdfCitationsOption');
  const translationCheckbox = document.getElementById('pdfIncludeTranslation');
  const qaCheckbox = document.getElementById('pdfIncludeQA');
  const citationsCheckbox = document.getElementById('pdfIncludeCitations');
  
  // Gestisci disponibilità traduzione
  if (currentTranslation) {
    translationOption.classList.remove('disabled');
    translationCheckbox.disabled = false;
    translationCheckbox.checked = true;
  } else {
    translationOption.classList.add('disabled');
    translationCheckbox.disabled = true;
    translationCheckbox.checked = false;
  }
  
  // Gestisci disponibilità Q&A
  if (currentQA && currentQA.length > 0) {
    qaOption.classList.remove('disabled');
    qaCheckbox.disabled = false;
    qaCheckbox.checked = true;
  } else {
    qaOption.classList.add('disabled');
    qaCheckbox.disabled = true;
    qaCheckbox.checked = false;
  }
  
  // Gestisci disponibilità Citazioni
  if (currentCitations && currentCitations.citations && currentCitations.citations.length > 0) {
    citationsOption.classList.remove('disabled');
    citationsCheckbox.disabled = false;
    citationsCheckbox.checked = true;
  } else {
    citationsOption.classList.add('disabled');
    citationsCheckbox.disabled = true;
    citationsCheckbox.checked = false;
  }
  
  // Mostra modal
  modal.classList.remove('hidden');
  
  // Handler per conferma
  const handleConfirm = async () => {
    const options = {
      includeSummary: document.getElementById('pdfIncludeSummary').checked,
      includeKeypoints: document.getElementById('pdfIncludeKeypoints').checked,
      includeTranslation: document.getElementById('pdfIncludeTranslation').checked && currentTranslation,
      includeQA: document.getElementById('pdfIncludeQA').checked && currentQA && currentQA.length > 0,
      includeCitations: document.getElementById('pdfIncludeCitations').checked && currentCitations && currentCitations.citations && currentCitations.citations.length > 0
    };
    
    // Verifica che almeno una opzione sia selezionata
    if (!options.includeSummary && !options.includeKeypoints && !options.includeTranslation && !options.includeQA && !options.includeCitations) {
      await Modal.warning('Seleziona almeno una sezione da esportare', 'Nessuna Selezione');
      return;
    }
    
    modal.classList.add('hidden');
    
    try {
      const settings = await StorageManager.getSettings();
      const metadata = {
        provider: elements.providerSelect.value,
        language: selectedLanguage,
        contentType: selectedContentType !== 'auto' ? selectedContentType : 'auto'
      };
      
      await PDFExporter.exportToPDF(
        currentArticle,
        options.includeSummary ? currentResults.summary : null,
        options.includeKeypoints ? currentResults.keyPoints : null,
        metadata,
        options.includeTranslation ? currentTranslation : null,
        options.includeQA ? currentQA : null,
        options.includeCitations ? currentCitations : null
      );
      
      // Visual feedback
      const originalText = elements.exportPdfBtn.textContent;
      elements.exportPdfBtn.textContent = I18n.t('feedback.exported');
      setTimeout(() => {
        elements.exportPdfBtn.textContent = originalText;
      }, 2000);
    } catch (error) {
      console.error('Errore esportazione PDF:', error);
      showError('Errore durante l\'esportazione PDF: ' + error.message);
    }
    
    cleanup();
  };
  
  // Handler per annulla
  const handleCancel = () => {
    modal.classList.add('hidden');
    cleanup();
  };
  
  // Handler per overlay
  const handleOverlay = (e) => {
    if (e.target.classList.contains('custom-modal-overlay')) {
      handleCancel();
    }
  };
  
  // Cleanup function
  const cleanup = () => {
    document.getElementById('exportConfirmBtn').removeEventListener('click', handleConfirm);
    document.getElementById('exportCancelBtn').removeEventListener('click', handleCancel);
    modal.removeEventListener('click', handleOverlay);
  };
  
  // Aggiungi event listeners
  document.getElementById('exportConfirmBtn').addEventListener('click', handleConfirm);
  document.getElementById('exportCancelBtn').addEventListener('click', handleCancel);
  modal.addEventListener('click', handleOverlay);
}

// Export to Markdown
async function exportToMarkdown() {
  if (!currentArticle || !currentResults) {
    showError('Nessun riassunto da esportare');
    return;
  }
  
  // Mostra modal di selezione (riusa lo stesso del PDF)
  showMarkdownExportModal();
}

async function showMarkdownExportModal() {
  const modal = document.getElementById('exportOptionsModal');
  const translationOption = document.getElementById('pdfTranslationOption');
  const qaOption = document.getElementById('pdfQAOption');
  const citationsOption = document.getElementById('pdfCitationsOption');
  const translationCheckbox = document.getElementById('pdfIncludeTranslation');
  const qaCheckbox = document.getElementById('pdfIncludeQA');
  const citationsCheckbox = document.getElementById('pdfIncludeCitations');
  const modalTitle = modal.querySelector('.custom-modal-title');
  
  // Cambia titolo per Markdown
  modalTitle.textContent = I18n.t('export.markdown');
  
  // Gestisci disponibilità traduzione
  if (currentTranslation) {
    translationOption.classList.remove('disabled');
    translationCheckbox.disabled = false;
    translationCheckbox.checked = true;
  } else {
    translationOption.classList.add('disabled');
    translationCheckbox.disabled = true;
    translationCheckbox.checked = false;
  }
  
  // Gestisci disponibilità Q&A
  if (currentQA && currentQA.length > 0) {
    qaOption.classList.remove('disabled');
    qaCheckbox.disabled = false;
    qaCheckbox.checked = true;
  } else {
    qaOption.classList.add('disabled');
    qaCheckbox.disabled = true;
    qaCheckbox.checked = false;
  }
  
  // Gestisci disponibilità Citazioni
  if (currentCitations && currentCitations.citations && currentCitations.citations.length > 0) {
    citationsOption.classList.remove('disabled');
    citationsCheckbox.disabled = false;
    citationsCheckbox.checked = true;
  } else {
    citationsOption.classList.add('disabled');
    citationsCheckbox.disabled = true;
    citationsCheckbox.checked = false;
  }
  
  // Mostra modal
  modal.classList.remove('hidden');
  
  // Handler per conferma
  const handleConfirm = async () => {
    const options = {
      includeSummary: document.getElementById('pdfIncludeSummary').checked,
      includeKeypoints: document.getElementById('pdfIncludeKeypoints').checked,
      includeTranslation: document.getElementById('pdfIncludeTranslation').checked && currentTranslation,
      includeQA: document.getElementById('pdfIncludeQA').checked && currentQA && currentQA.length > 0,
      includeCitations: document.getElementById('pdfIncludeCitations').checked && currentCitations && currentCitations.citations && currentCitations.citations.length > 0
    };
    
    // Verifica che almeno una opzione sia selezionata
    if (!options.includeSummary && !options.includeKeypoints && !options.includeTranslation && !options.includeQA && !options.includeCitations) {
      await Modal.warning('Seleziona almeno una sezione da esportare', 'Nessuna Selezione');
      return;
    }
    
    modal.classList.add('hidden');
    modalTitle.textContent = I18n.t('export.pdf'); // Ripristina titolo
    
    try {
      const settings = await StorageManager.getSettings();
      const metadata = {
        provider: elements.providerSelect.value,
        language: selectedLanguage,
        contentType: selectedContentType !== 'auto' ? selectedContentType : 'auto'
      };
      
      MarkdownExporter.exportToMarkdown(
        currentArticle,
        options.includeSummary ? currentResults.summary : null,
        options.includeKeypoints ? currentResults.keyPoints : null,
        metadata,
        options.includeTranslation ? currentTranslation : null,
        options.includeQA ? currentQA : null,
        null, // notes
        options.includeCitations ? currentCitations : null
      );
      
      // Visual feedback
      const originalText = elements.exportMdBtn.textContent;
      elements.exportMdBtn.textContent = I18n.t('feedback.exported');
      setTimeout(() => {
        elements.exportMdBtn.textContent = originalText;
      }, 2000);
    } catch (error) {
      console.error('Errore esportazione Markdown:', error);
      showError('Errore durante l\'esportazione Markdown: ' + error.message);
    }
    
    cleanup();
  };
  
  // Handler per annulla
  const handleCancel = () => {
    modal.classList.add('hidden');
    modalTitle.textContent = I18n.t('export.pdf'); // Ripristina titolo
    cleanup();
  };
  
  // Handler per overlay
  const handleOverlay = (e) => {
    if (e.target.classList.contains('custom-modal-overlay')) {
      handleCancel();
    }
  };
  
  // Cleanup function
  const cleanup = () => {
    document.getElementById('exportConfirmBtn').removeEventListener('click', handleConfirm);
    document.getElementById('exportCancelBtn').removeEventListener('click', handleCancel);
    modal.removeEventListener('click', handleOverlay);
  };
  
  // Aggiungi event listeners
  document.getElementById('exportConfirmBtn').addEventListener('click', handleConfirm);
  document.getElementById('exportCancelBtn').addEventListener('click', handleCancel);
  modal.addEventListener('click', handleOverlay);
}

// Voice Controller
let voiceController = null;

// Inizializza Voice Controller
async function initVoiceController() {
  if (!voiceController) {
    voiceController = new VoiceController();
    await voiceController.initialize();
    console.log('🎤 Voice Controller inizializzato');
  }
}

// Q&A System
async function askQuestion() {
  const question = elements.questionInput.value.trim();
  
  if (!question) {
    return;
  }
  
  if (!currentArticle || !currentResults) {
    showError('Nessun articolo analizzato');
    return;
  }
  
  // ✅ SANITIZZA LA DOMANDA UTENTE
  let cleanQuestion;
  try {
    cleanQuestion = InputSanitizer.sanitizeUserPrompt(question, {
      maxLength: 500,
      minLength: 3
    });
  } catch (error) {
    await Modal.error(
      'La domanda non è valida: ' + error.message,
      'Input Non Valido'
    );
    return;
  }
  
  elements.askBtn.disabled = true;
  elements.askBtn.textContent = I18n.t('feedback.loading');
  elements.qaAnswer.classList.remove('hidden');
  elements.qaAnswer.classList.add('loading');
  elements.qaAnswer.textContent = I18n.t('feedback.thinking');
  
  try {
    const settings = await StorageManager.getSettings();
    const provider = elements.providerSelect.value;
    const apiKey = await StorageManager.getApiKey(provider);
    
    if (!apiKey) {
      throw new Error('API key non configurata per ' + provider);
    }
    
    settings.outputLanguage = selectedLanguage;
    
    const answer = await AdvancedAnalysis.askQuestion(
      cleanQuestion,  // ← Usa versione sanitizzata
      currentArticle,
      currentResults.summary,
      provider,
      apiKey,
      settings
    );
    
    elements.qaAnswer.classList.remove('loading');
    
    // Crea contenitore per risposta con pulsante TTS
    const answerContainer = document.createElement('div');
    answerContainer.className = 'qa-answer-container';
    
    const answerText = document.createElement('div');
    answerText.className = 'qa-answer-text';
    answerText.textContent = answer;
    
    const voiceLang = VoiceController.mapLanguageCode(selectedLanguage);
    const ttsBtn = createTTSButton(answer, voiceLang, 'Leggi Risposta');
    ttsBtn.style.marginTop = '8px';
    
    answerContainer.appendChild(answerText);
    answerContainer.appendChild(ttsBtn);
    
    elements.qaAnswer.innerHTML = '';
    elements.qaAnswer.appendChild(answerContainer);
    
    // Salva la Q&A nell'array (usa la domanda sanitizzata)
    currentQA.push({
      question: cleanQuestion,
      answer: answer,
      timestamp: new Date().toISOString()
    });
    
    // Aggiorna anche la cronologia con le Q&A
    if (currentArticle && currentArticle.url) {
      await HistoryManager.updateSummaryWithQA(currentArticle.url, currentQA);
    }
    
    elements.questionInput.value = '';
    
  } catch (error) {
    console.error('Errore Q&A:', error);
    elements.qaAnswer.classList.remove('loading');
    elements.qaAnswer.textContent = I18n.t('feedback.error') + ' ' + error.message;
  } finally {
    elements.askBtn.disabled = false;
    elements.askBtn.textContent = I18n.t('qa.ask');
  }
}

// Translation System
let currentTranslation = null;

// Citations System
let currentCitations = null;

function detectArticleLanguage(text) {
  const sample = text.toLowerCase().slice(0, 1000);
  
  const patterns = {
    it: ['che', 'della', 'degli', 'delle', 'questo', 'questa', 'sono', 'essere', 'nell', 'alla'],
    en: ['the', 'and', 'that', 'this', 'with', 'from', 'have', 'been', 'which', 'their'],
    es: ['que', 'del', 'los', 'las', 'esta', 'este', 'para', 'con', 'una', 'por'],
    fr: ['que', 'les', 'des', 'cette', 'dans', 'pour', 'avec', 'sont', 'qui', 'pas'],
    de: ['der', 'die', 'das', 'und', 'ist', 'des', 'dem', 'den', 'nicht', 'sich']
  };
  
  let maxScore = 0;
  let detectedLang = 'en';
  
  for (const [lang, words] of Object.entries(patterns)) {
    const score = words.filter(word => sample.includes(` ${word} `)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  }
  
  return detectedLang;
}

async function translateArticle() {
  if (!currentArticle) {
    showError('Nessun articolo da tradurre');
    return;
  }
  
  elements.translateBtn.disabled = true;
  elements.translateBtn.textContent = I18n.t('feedback.translating');
  
  // Mostra loading
  elements.translationContent.innerHTML = '<div class="translation-loading">Traduzione in corso... Questo potrebbe richiedere 10-30 secondi.</div>';
  
  try {
    const provider = elements.providerSelect.value;
    const apiKey = await StorageManager.getApiKey(provider);
    
    if (!apiKey) {
      throw new Error('API key non configurata per ' + provider);
    }
    
    const targetLanguage = selectedLanguage;
    
    // Rileva lingua originale (semplice detection)
    const originalLanguage = detectArticleLanguage(currentArticle.content);
    
    // Controlla cache prima
    const cached = await StorageManager.getCachedTranslation(
      currentArticle.url,
      provider,
      targetLanguage
    );
    
    let translation;
    let fromCache = false;
    
    if (cached) {
      translation = cached.translation;
      fromCache = true;
      console.log('Traduzione caricata da cache');
    } else {
      // Se la lingua è già quella target, avvisa
      if (originalLanguage === targetLanguage) {
        const confirmed = await Modal.confirm(
          `L'articolo sembra già essere in ${targetLanguage}. Vuoi comunque tradurlo?`,
          'Conferma Traduzione',
          '🌍'
        );
        
        if (!confirmed) {
          resetTranslationButton();
          elements.translationContent.innerHTML = `
            <div class="translation-empty">
              <p>Clicca sul pulsante per tradurre l'articolo completo</p>
              <button id="translateBtn" class="btn btn-primary">🌍 Traduci Articolo</button>
            </div>
          `;
          document.getElementById('translateBtn').addEventListener('click', translateArticle);
          return;
        }
      }
      
      translation = await Translator.translateArticle(
        currentArticle,
        targetLanguage,
        provider,
        apiKey
      );
      
      // Salva in cache
      await StorageManager.saveCachedTranslation(
        currentArticle.url,
        provider,
        targetLanguage,
        translation,
        originalLanguage
      );
      
      // Salva nello storico
      await HistoryManager.updateSummaryWithTranslation(
        currentArticle.url,
        translation,
        targetLanguage,
        originalLanguage
      );
    }
    
    currentTranslation = translation;
    displayTranslation(translation, targetLanguage, originalLanguage, fromCache);
    
  } catch (error) {
    console.error('Errore traduzione:', error);
    elements.translationContent.innerHTML = `
      <div class="translation-empty">
        <p style="color: #d63031;">❌ Errore durante la traduzione: ${HtmlSanitizer.escape(error.message)}</p>
        <button id="translateBtn" class="btn btn-primary">🔄 Riprova</button>
      </div>
    `;
    // Re-attach event listener
    document.getElementById('translateBtn').addEventListener('click', translateArticle);
  } finally {
    resetTranslationButton();
  }
}

function displayTranslation(translation, targetLang, originalLang, fromCache = false) {
  const languageNames = {
    it: 'Italiano',
    en: 'Inglese',
    es: 'Spagnolo',
    fr: 'Francese',
    de: 'Tedesco'
  };
  
  const targetName = languageNames[targetLang] || targetLang;
  const originalName = languageNames[originalLang] || originalLang;
  
  const cacheBadge = fromCache ? '<span class="cache-badge">Da cache</span>' : '';
  
  elements.translationContent.innerHTML = `
    <div class="translation-header">
      <div class="translation-info">
        📝 Tradotto da ${originalName} a ${targetName} ${cacheBadge}
      </div>
      <div class="translation-actions">
        <button id="copyTranslationBtn" class="btn-icon" title="Copia traduzione">📋</button>
        <button id="retranslateBtn" class="btn-icon" title="Traduci di nuovo">🔄</button>
      </div>
    </div>
    <div class="translation-text">${HtmlSanitizer.escape(translation)}</div>
  `;
  
  // Add event listeners
  document.getElementById('copyTranslationBtn').addEventListener('click', copyTranslation);
  document.getElementById('retranslateBtn').addEventListener('click', async () => {
    const confirmed = await Modal.confirm(
      'Vuoi generare una nuova traduzione? Quella in cache verrà sostituita.',
      'Rigenera Traduzione',
      '🔄'
    );
    
    if (confirmed) {
      // Forza rigenerazione rimuovendo dalla cache
      clearTranslationCache().then(() => translateArticle());
    }
  });
}

async function clearTranslationCache() {
  const provider = elements.providerSelect.value;
  await StorageManager.clearTranslationCacheEntry(currentArticle.url, provider, selectedLanguage);
}

function resetTranslationButton() {
  elements.translateBtn.disabled = false;
  elements.translateBtn.textContent = '🌍 Traduci Articolo';
}

async function copyTranslation() {
  if (!currentTranslation) return;
  
  try {
    await navigator.clipboard.writeText(currentTranslation);
    const btn = document.getElementById('copyTranslationBtn');
    const originalText = btn.textContent;
    btn.textContent = '✓';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  } catch (error) {
    console.error('Errore copia:', error);
  }
}

// Email System
async function openEmailModal() {
  if (!currentArticle || !currentResults) {
    showError('Nessun riassunto da inviare');
    return;
  }
  
  const modal = document.getElementById('emailModal');
  const emailInput = document.getElementById('emailInput');
  const savedEmailsSection = document.getElementById('savedEmailsSection');
  const savedEmailsList = document.getElementById('savedEmailsList');
  const sendBtn = document.getElementById('emailSendBtn');
  const cancelBtn = document.getElementById('emailCancelBtn');
  
  // Carica email salvate
  const savedEmails = await EmailManager.getSavedEmails();
  let selectedEmail = null;
  
  // Mostra/nascondi sezione email salvate
  if (savedEmails.length > 0) {
    savedEmailsSection.classList.remove('hidden');
    
    // Popola lista
    savedEmailsList.innerHTML = '';
    savedEmails.forEach(email => {
      const item = document.createElement('div');
      item.className = 'saved-email-item';
      
      const text = document.createElement('span');
      text.className = 'saved-email-text';
      text.textContent = email;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'saved-email-delete';
      deleteBtn.textContent = '🗑️';
      deleteBtn.title = 'Rimuovi';
      
      // Click per selezionare
      item.addEventListener('click', (e) => {
        if (e.target === deleteBtn) return;
        
        // Deseleziona tutti
        document.querySelectorAll('.saved-email-item').forEach(i => {
          i.classList.remove('selected');
        });
        
        // Seleziona questo
        item.classList.add('selected');
        selectedEmail = email;
        emailInput.value = email;
      });
      
      // Click per eliminare
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        
        const confirmed = await Modal.confirm(
          `Vuoi rimuovere "${email}" dalla lista?`,
          'Rimuovi Email',
          '🗑️'
        );
        
        if (confirmed) {
          await EmailManager.removeEmail(email);
          item.remove();
          
          // Nascondi sezione se non ci sono più email
          if (savedEmailsList.children.length === 0) {
            savedEmailsSection.classList.add('hidden');
          }
          
          // Pulisci input se era selezionata
          if (selectedEmail === email) {
            selectedEmail = null;
            emailInput.value = '';
          }
        }
      });
      
      item.appendChild(text);
      item.appendChild(deleteBtn);
      savedEmailsList.appendChild(item);
    });
  } else {
    savedEmailsSection.classList.add('hidden');
  }
  
  // Gestisci disponibilità opzioni
  const translationOption = document.getElementById('emailTranslationOption');
  const qaOption = document.getElementById('emailQAOption');
  const citationsOption = document.getElementById('emailCitationsOption');
  const translationCheckbox = document.getElementById('emailIncludeTranslation');
  const qaCheckbox = document.getElementById('emailIncludeQA');
  const citationsCheckbox = document.getElementById('emailIncludeCitations');
  
  // Gestisci disponibilità traduzione
  if (currentTranslation) {
    translationOption.classList.remove('disabled');
    translationCheckbox.disabled = false;
    translationCheckbox.checked = true;
  } else {
    translationOption.classList.add('disabled');
    translationCheckbox.disabled = true;
    translationCheckbox.checked = false;
  }
  
  // Gestisci disponibilità Q&A
  if (currentQA && currentQA.length > 0) {
    qaOption.classList.remove('disabled');
    qaCheckbox.disabled = false;
    qaCheckbox.checked = true;
  } else {
    qaOption.classList.add('disabled');
    qaCheckbox.disabled = true;
    qaCheckbox.checked = false;
  }
  
  // Gestisci disponibilità Citazioni
  if (currentCitations && currentCitations.citations && currentCitations.citations.length > 0) {
    citationsOption.classList.remove('disabled');
    citationsCheckbox.disabled = false;
    citationsCheckbox.checked = true;
  } else {
    citationsOption.classList.add('disabled');
    citationsCheckbox.disabled = true;
    citationsCheckbox.checked = false;
  }
  
  // Reset input
  emailInput.value = '';
  emailInput.focus();
  
  // Mostra modal
  modal.classList.remove('hidden');
  
  // Handler per invio
  const handleSend = async () => {
    const email = emailInput.value.trim();
    
    if (!email) {
      await Modal.warning('Inserisci un indirizzo email', 'Email Mancante');
      return;
    }
    
    if (!EmailManager.isValidEmail(email)) {
      await Modal.warning('Inserisci un indirizzo email valido', 'Email Non Valida');
      return;
    }
    
    // Raccogli opzioni selezionate
    const options = {
      includeSummary: document.getElementById('emailIncludeSummary').checked,
      includeKeypoints: document.getElementById('emailIncludeKeypoints').checked,
      includeTranslation: document.getElementById('emailIncludeTranslation').checked && currentTranslation,
      includeQA: document.getElementById('emailIncludeQA').checked && currentQA && currentQA.length > 0,
      includeCitations: document.getElementById('emailIncludeCitations').checked && currentCitations && currentCitations.citations && currentCitations.citations.length > 0
    };
    
    // Verifica che almeno una opzione sia selezionata
    if (!options.includeSummary && !options.includeKeypoints && !options.includeTranslation && !options.includeQA && !options.includeCitations) {
      await Modal.warning('Seleziona almeno una sezione da includere', 'Nessuna Selezione');
      return;
    }
    
    // Salva email se nuova
    await EmailManager.saveEmail(email);
    
    // Genera contenuto email con opzioni
    const { subject, body } = EmailManager.formatEmailContent(
      currentArticle,
      options.includeSummary ? currentResults.summary : null,
      options.includeKeypoints ? currentResults.keyPoints : null,
      options.includeTranslation ? currentTranslation : null,
      options.includeQA ? currentQA : null,
      options.includeCitations ? currentCitations : null
    );
    
    // Apri client email
    EmailManager.openEmailClient(email, subject, body);
    
    // Chiudi modal
    modal.classList.add('hidden');
    
    // Feedback
    await Modal.success(
      'Il client email è stato aperto. Verifica e invia il messaggio.',
      'Email Preparata'
    );
    
    // Cleanup
    cleanup();
  };
  
  // Handler per annulla
  const handleCancel = () => {
    modal.classList.add('hidden');
    cleanup();
  };
  
  // Handler per overlay
  const handleOverlay = (e) => {
    if (e.target.classList.contains('custom-modal-overlay')) {
      handleCancel();
    }
  };
  
  // Handler per Enter
  const handleEnter = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };
  
  // Cleanup function
  const cleanup = () => {
    sendBtn.removeEventListener('click', handleSend);
    cancelBtn.removeEventListener('click', handleCancel);
    modal.removeEventListener('click', handleOverlay);
    emailInput.removeEventListener('keypress', handleEnter);
  };
  
  // Aggiungi event listeners
  sendBtn.addEventListener('click', handleSend);
  cancelBtn.addEventListener('click', handleCancel);
  modal.addEventListener('click', handleOverlay);
  emailInput.addEventListener('keypress', handleEnter);
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


// Citations System
async function extractCitations() {
  if (!currentArticle || !currentResults) {
    showError('Nessun articolo analizzato');
    return;
  }
  
  const btn = elements.extractCitationsBtn;
  btn.disabled = true;
  btn.textContent = '⏳ Estrazione...';
  
  try {
    const settings = await StorageManager.getSettings();
    const provider = elements.providerSelect.value;
    
    // Invia richiesta al background script (come per i riassunti)
    const response = await chrome.runtime.sendMessage({
      action: 'extractCitations',
      article: currentArticle,
      provider: provider,
      settings: settings
    });
    
    if (!response.success) {
      throw new Error(response.error);
    }
    
    currentCitations = response.result.citations;
    
    // Mostra citazioni
    displayCitations();
    
    // Mostra badge "Da Cache" se applicabile
    if (response.result.fromCache) {
      const citationsHeader = document.querySelector('#citations-tab');
      if (citationsHeader && !citationsHeader.querySelector('.cache-badge')) {
        const badge = document.createElement('span');
        badge.className = 'cache-badge';
        badge.textContent = 'Da cache';
        badge.style.cssText = 'background: #4caf50; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px;';
        citationsHeader.appendChild(badge);
      }
      console.log('📚 Citazioni caricate dalla cache');
    } else {
      console.log('🔄 Citazioni estratte da API');
    }
    
    // Salva nella cronologia
    if (currentArticle && currentArticle.url) {
      await HistoryManager.updateSummaryWithCitations(currentArticle.url, currentCitations);
      console.log('💾 Citazioni salvate in cronologia');
    }
    
  } catch (error) {
    console.error('Errore estrazione citazioni:', error);
    elements.citationsContent.innerHTML = `
      <div class="error-box">
        <p>❌ ${HtmlSanitizer.escape(error.message)}</p>
        <button id="retryCitationsBtn" class="btn btn-primary">🔄 Riprova</button>
      </div>
    `;
    document.getElementById('retryCitationsBtn').addEventListener('click', extractCitations);
  } finally {
    btn.disabled = false;
    btn.textContent = '📖 Estrai Citazioni';
  }
}

function displayCitations() {
  if (!currentCitations || !currentCitations.citations || currentCitations.citations.length === 0) {
    elements.citationsContent.innerHTML = `
      <div class="citations-empty">
        <p>📚 Nessuna citazione trovata in questo articolo</p>
      </div>
    `;
    return;
  }
  
  // Calcola il numero totale di citazioni con fallback
  const totalCitations = currentCitations.total_citations || currentCitations.totalCount || currentCitations.citations.length;
  
  let html = `
    <div class="citations-header">
      <div class="citations-info">
        <strong>📚 ${totalCitations} citazioni trovate</strong>
      </div>
      <div class="citations-actions">
        <select id="citationStyleSelect" class="citation-style-select" title="Stile bibliografico per la citazione dell'articolo principale">
          <option value="apa">APA (Autore. (Anno). Titolo.)</option>
          <option value="mla">MLA (Autore. "Titolo.")</option>
          <option value="chicago">Chicago (Autore. "Titolo.")</option>
          <option value="ieee">IEEE (Autore, "Titolo,")</option>
          <option value="harvard">Harvard (Autore (Anno) Titolo.)</option>
        </select>
        <button id="copyCitationsBtn" class="btn-icon" title="Copia Bibliografia">📋</button>
      </div>
    </div>
    
    <div class="article-citation-box">
      <h4>📄 Citazione Articolo Principale</h4>
      <p style="font-size: 11px; color: #666; margin: 5px 0;">Lo stile selezionato sopra si applica a questa citazione</p>
      <div id="mainCitationText" class="citation-text"></div>
    </div>
    
    <div class="citations-list">
  `;
  
  currentCitations.citations.forEach(citation => {
    const typeIcon = {
      'direct_quote': '💬',
      'indirect_quote': '💭',
      'study_reference': '🔬',
      'statistic': '📊',
      'expert_opinion': '👤',
      'book_reference': '📖',
      'article_reference': '📄',
      'report_reference': '📋',
      'organization_data': '🏢',
      'web_source': '🌐'
    }[citation.type] || '📌';
    
    // Usa quote_text dalla nuova struttura (contenuto sanitizzato)
    const quoteText = citation.quote_text || citation.text || '';
    const escapedText = HtmlSanitizer.escape(quoteText);
    const safeAuthor = HtmlSanitizer.escape(citation.author || '');
    const safeContext = HtmlSanitizer.escape(citation.context || '');
    const safeSource = HtmlSanitizer.escape(citation.source || '');
    const safeParagraph = HtmlSanitizer.escape(String(citation.paragraph || ''));

    html += `
      <div class="citation-item"
           data-citation-id="${HtmlSanitizer.escape(String(citation.id))}"
           data-citation-text="${escapedText}"
           data-paragraph="${safeParagraph}"
           style="cursor: pointer;"
           title="Clicca per evidenziare nell'articolo">
        <div class="citation-header">
          <span class="citation-icon">${typeIcon}</span>
          <span class="citation-number">#${HtmlSanitizer.escape(String(citation.id))}</span>
          ${citation.author ? `<span class="citation-author">${safeAuthor}</span>` : ''}
          ${citation.paragraph ? `<span class="citation-paragraph">§${safeParagraph}</span>` : ''}
        </div>
        ${quoteText ? `<div class="citation-text">"${HtmlSanitizer.escape(quoteText.substring(0, 200))}${quoteText.length > 200 ? '...' : ''}"</div>` : ''}
        ${citation.context ? `<div class="citation-context">${safeContext}</div>` : ''}
        <div class="citation-meta">
          <span class="citation-type">${getCitationTypeLabel(citation.type)}</span>
          ${citation.source ? `<span class="citation-source">📚 ${safeSource}</span>` : ''}
          ${citation.year ? `<span class="citation-year">📅 ${HtmlSanitizer.escape(String(citation.year || ''))}</span>` : ''}
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  
  elements.citationsContent.innerHTML = html;
  
  // Mostra citazione principale
  updateMainCitation('apa');
  
  // Event listeners
  document.getElementById('citationStyleSelect').addEventListener('change', (e) => {
    updateMainCitation(e.target.value);
  });
  
  document.getElementById('copyCitationsBtn').addEventListener('click', copyCitations);
  
  // Click handler per evidenziare citazioni nell'articolo
  document.querySelectorAll('.citation-item').forEach(item => {
    item.addEventListener('click', async () => {
      const citationText = item.dataset.citationText;
      const paragraph = item.dataset.paragraph;
      
      // ✨ PRIORITÀ: Cerca sempre il testo della citazione nella pagina
      if (citationText) {
        const success = await highlightCitationInArticle(citationText);
        
        // Se non trova il testo, prova con il paragrafo come fallback
        if (!success && paragraph) {
          await highlightParagraph(paragraph);
        }
      } 
      // Fallback: usa solo il paragrafo se non c'è testo
      else if (paragraph) {
        await highlightParagraph(paragraph);
      }
    });
  });
}

function updateMainCitation(style) {
  // Usa currentArticle invece di currentCitations.article
  const citationText = CitationExtractor.formatCitation(currentArticle, style);
  document.getElementById('mainCitationText').textContent = citationText;
}

function getCitationTypeLabel(type) {
  const labels = {
    'direct_quote': '💬 Citazione Diretta',
    'indirect_quote': '💭 Citazione Indiretta',
    'study_reference': '🔬 Studio/Ricerca',
    'statistic': '📊 Statistica',
    'expert_opinion': '👤 Opinione Esperto',
    'book_reference': '📖 Libro',
    'article_reference': '📄 Articolo',
    'report_reference': '📋 Report',
    'organization_data': '🏢 Dati Organizzazione',
    'web_source': '🌐 Fonte Web'
  };
  return labels[type] || '📌 Altro';
}

function getPositionLabel(position) {
  const labels = {
    'inizio': '📍 Inizio',
    'metà': '📍 Metà',
    'fine': '📍 Fine'
  };
  return labels[position] || '📍 Articolo';
}

async function copyCitations() {
  if (!currentCitations || !currentArticle) return;
  
  const style = document.getElementById('citationStyleSelect').value;
  const bibliography = CitationExtractor.generateBibliography(
    currentArticle,
    currentCitations.citations,
    style
  );
  
  try {
    await navigator.clipboard.writeText(bibliography);
    const btn = document.getElementById('copyCitationsBtn');
    const originalText = btn.textContent;
    btn.textContent = '✓ Copiato!';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  } catch (error) {
    console.error('Errore copia citazioni:', error);
    await Modal.error('Impossibile copiare negli appunti', 'Errore');
  }
}


async function highlightParagraph(paragraphNumber) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Invia messaggio al content script per evidenziare il paragrafo
    await chrome.tabs.sendMessage(tab.id, {
      action: 'highlightParagraph',
      paragraphNumber: paragraphNumber
    });
    
    console.log(`✅ Paragrafo §${paragraphNumber} evidenziato`);
  } catch (error) {
    console.error('Errore highlight paragrafo:', error);
    // Fallback: prova con il testo
    return false;
  }
  return true;
}

async function highlightCitationInArticle(citationText) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    console.log('🔍 Ricerca citazione nella pagina:', citationText.substring(0, 50) + '...');
    
    // Invia messaggio al content script per evidenziare il testo
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'highlightText',
      text: citationText
    });
    
    if (response && response.success) {
      console.log('✅ Testo citazione evidenziato');
      return true;
    } else {
      console.warn('⚠️ Citazione non trovata nella pagina');
      return false;
    }
  } catch (error) {
    console.error('❌ Errore highlight citazione:', error);
    // Non mostrare modal per non disturbare l'utente
    return false;
  }
}


// Voice Question Handler
async function handleVoiceQuestion() {
  const voiceBtn = document.getElementById('voiceQuestionBtn');
  const listeningIndicator = document.getElementById('listeningIndicator');
  const interimTranscript = document.getElementById('interimTranscript');
  
  if (!voiceController) {
    await Modal.error('Voice Controller non inizializzato', 'Errore');
    return;
  }
  
  if (!STTManager.isSupported()) {
    await Modal.error(
      'Il riconoscimento vocale non è supportato in questo browser. Usa Chrome o Edge.',
      'Funzionalità Non Supportata'
    );
    return;
  }
  
  try {
    // Mostra indicatore ascolto
    voiceBtn.classList.add('listening');
    listeningIndicator.classList.add('active');
    interimTranscript.style.display = 'block';
    
    // Listener per trascrizione provvisoria
    const handleInterim = (event) => {
      interimTranscript.textContent = event.detail.transcript;
    };
    window.addEventListener('stt:interim', handleInterim);
    
    // Mappa lingua output a lingua vocale
    const voiceLang = VoiceController.mapLanguageCode(selectedLanguage);
    
    // Avvia ascolto
    const transcript = await voiceController.startListening(voiceLang);
    
    // Rimuovi listener
    window.removeEventListener('stt:interim', handleInterim);
    
    // Nascondi indicatori
    voiceBtn.classList.remove('listening');
    listeningIndicator.classList.remove('active');
    interimTranscript.style.display = 'none';
    
    // Inserisci la domanda nell'input
    elements.questionInput.value = transcript;
    
    // Invia automaticamente la domanda
    await askQuestion();
    
  } catch (error) {
    console.error('Errore domanda vocale:', error);
    
    // Nascondi indicatori
    voiceBtn.classList.remove('listening');
    listeningIndicator.classList.remove('active');
    interimTranscript.style.display = 'none';
    
    await Modal.error(error.message, 'Errore Riconoscimento Vocale');
  }
}

// Aggiungi pulsanti TTS ai contenuti
function addTTSButtons() {
  if (!voiceController) return;
  
  const voiceLang = VoiceController.mapLanguageCode(selectedLanguage);
  
  // TTS per riassunto
  const summaryContent = document.getElementById('summaryContent');
  if (summaryContent && !summaryContent.querySelector('.tts-button')) {
    const ttsBtn = createTTSButton(currentResults.summary, voiceLang, 'Leggi Riassunto');
    summaryContent.insertBefore(ttsBtn, summaryContent.firstChild);
  }
  
  // TTS per punti chiave
  const keypointsContent = document.getElementById('keypointsContent');
  if (keypointsContent && !keypointsContent.querySelector('.tts-button')) {
    const keypointsText = currentResults.keyPoints
      .map((kp, i) => `${i + 1}. ${kp.title}. ${kp.description}`)
      .join('. ');
    const ttsBtn = createTTSButton(keypointsText, voiceLang, 'Leggi Punti Chiave');
    keypointsContent.insertBefore(ttsBtn, keypointsContent.firstChild);
  }
  
  // TTS per traduzione (se presente)
  if (currentTranslation) {
    const translationText = document.querySelector('.translation-text');
    if (translationText && !translationText.parentElement.querySelector('.tts-button')) {
      const ttsBtn = createTTSButton(currentTranslation, voiceLang, 'Leggi Traduzione');
      translationText.parentElement.insertBefore(ttsBtn, translationText);
    }
  }
}

// Crea pulsante TTS con selezione voce
function createTTSButton(text, lang, label = 'Leggi') {
  const container = document.createElement('div');
  container.className = 'tts-button-container';
  
  const button = document.createElement('button');
  button.className = 'tts-button';
  button.innerHTML = `🔊 <span>${label}</span>`;
  button.title = label;
  
  button.addEventListener('click', () => {
    const state = voiceController.getTTSState();
    
    if (state.isSpeaking) {
      // Se sta parlando, ferma
      voiceController.stopSpeaking();
      button.classList.remove('active');
      button.innerHTML = `🔊 <span>${label}</span>`;
    } else {
      // Altrimenti, inizia a parlare
      voiceController.speak(text, lang);
      button.classList.add('active');
      button.innerHTML = `⏹️ <span>Stop</span>`;
    }
  });
  
  // Listener per quando TTS termina
  const handleTTSEnd = () => {
    button.classList.remove('active');
    button.innerHTML = `🔊 <span>${label}</span>`;
  };
  window.addEventListener('tts:ended', handleTTSEnd);
  window.addEventListener('tts:stopped', handleTTSEnd);
  
  // Aggiungi pulsante per selezione voce
  const voiceBtn = document.createElement('button');
  voiceBtn.className = 'tts-voice-select-btn';
  voiceBtn.innerHTML = '⚙️';
  voiceBtn.title = 'Seleziona voce';
  voiceBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showVoiceSelector(lang);
  });
  
  container.appendChild(button);
  container.appendChild(voiceBtn);
  
  return container;
}

// Mostra selettore voce
async function showVoiceSelector(lang) {
  const voices = voiceController.ttsManager.getVoicesForLanguage(lang);
  const currentVoice = voiceController.ttsManager.getPreferredVoice(lang);
  
  if (voices.length === 0) {
    await Modal.alert('Nessuna voce disponibile per questa lingua', 'Selezione Voce', '🔊');
    return;
  }
  
  // Crea lista voci
  let voiceList = '<div class="voice-list">';
  voices.forEach(voice => {
    const isSelected = voice.voiceName === currentVoice;
    const localBadge = voice.localService ? '<span class="badge-local">Locale</span>' : '<span class="badge-remote">Remota</span>';
    voiceList += `
      <div class="voice-item ${isSelected ? 'selected' : ''}" data-voice="${HtmlSanitizer.escape(voice.voiceName)}">
        <div class="voice-info">
          <div class="voice-name">${HtmlSanitizer.escape(voice.voiceName)}</div>
          <div class="voice-meta">
            <span class="voice-lang">${HtmlSanitizer.escape(voice.lang)}</span>
            ${localBadge}
          </div>
        </div>
        ${isSelected ? '<span class="voice-check">✓</span>' : ''}
      </div>
    `;
  });
  voiceList += '</div>';
  
  // Mostra modal personalizzato
  const modal = document.getElementById('customModal');
  const icon = document.getElementById('modalIcon');
  const title = document.getElementById('modalTitle');
  const message = document.getElementById('modalMessage');
  const confirmBtn = document.getElementById('modalConfirmBtn');
  const cancelBtn = document.getElementById('modalCancelBtn');
  
  icon.textContent = '🔊';
  title.textContent = 'Seleziona Voce TTS';
  message.innerHTML = voiceList;
  confirmBtn.textContent = 'Chiudi';
  cancelBtn.classList.add('hidden');
  
  modal.classList.remove('hidden');
  
  // Aggiungi event listeners alle voci
  let selectedVoice = currentVoice;
  document.querySelectorAll('.voice-item').forEach(item => {
    item.addEventListener('click', () => {
      // Rimuovi selezione precedente
      document.querySelectorAll('.voice-item').forEach(i => {
        i.classList.remove('selected');
        const check = i.querySelector('.voice-check');
        if (check) check.remove();
      });
      
      // Aggiungi nuova selezione
      item.classList.add('selected');
      const check = document.createElement('span');
      check.className = 'voice-check';
      check.textContent = '✓';
      item.appendChild(check);
      
      selectedVoice = item.dataset.voice;
    });
  });
  
  // Handler conferma
  const handleConfirm = async () => {
    if (selectedVoice) {
      await voiceController.ttsManager.setPreferredVoice(lang, selectedVoice);
      console.log(`✓ Voce impostata per ${lang}:`, selectedVoice);
    }
    modal.classList.add('hidden');
    confirmBtn.removeEventListener('click', handleConfirm);
  };
  
  confirmBtn.addEventListener('click', handleConfirm);
  
  // Close on overlay click
  const overlay = modal.querySelector('.custom-modal-overlay');
  overlay.addEventListener('click', handleConfirm, { once: true });
}

// Leggi risposta Q&A ad alta voce
async function speakQAAnswer(answer) {
  if (!voiceController) return;
  
  const voiceLang = VoiceController.mapLanguageCode(selectedLanguage);
  voiceController.speak(answer, voiceLang);
}

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
