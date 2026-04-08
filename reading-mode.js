// Reading Mode - Side-by-Side View
// Controller: variabili globali, init, caricamento dati, event listeners, theme, resize
// Funzioni di visualizzazione  → reading-mode-display.js
// Traduzioni, citazioni, Q&A  → reading-mode-features.js
// Export e copia              → reading-mode-export.js
// Voce e font size            → reading-mode-voice.js

let currentData = null;
let syncScroll = true;
let isResizing = false;
let voiceController = null;

// Elements
const elements = {
  backBtn: document.getElementById('backBtn'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  copyBtn: document.getElementById('copyBtn'),
  exportBtn: document.getElementById('exportBtn'),
  articleContent: document.getElementById('articleContent'),
  summaryContent: document.getElementById('summaryContent'),
  articleWordCount: document.getElementById('articleWordCount'),
  articleReadTime: document.getElementById('articleReadTime'),
  summaryProvider: document.getElementById('summaryProvider'),
  summaryLanguage: document.getElementById('summaryLanguage'),
  divider: document.getElementById('divider'),
  // Article views
  articleIframe: document.getElementById('articleIframe'),
  articleText: document.getElementById('articleText'),
  viewIframeBtn: document.getElementById('viewIframeBtn'),
  viewTextBtn: document.getElementById('viewTextBtn'),
  // Tab contents
  summaryTabContent: document.getElementById('summaryTabContent'),
  keypointsTabContent: document.getElementById('keypointsTabContent'),
  translationTabContent: document.getElementById('translationTabContent'),
  citationsTabContent: document.getElementById('citationsTabContent'),
  qaTabContent: document.getElementById('qaTabContent'),
  // Buttons
  translateBtn: document.getElementById('translateBtn'),
  extractCitationsBtn: document.getElementById('extractCitationsBtn'),
  qaAskBtn: document.getElementById('qaAskBtn'),
  qaInput: document.getElementById('qaInput'),
  qaHistory: document.getElementById('qaHistory'),
  // Voice controls
  ttsPlayBtn: document.getElementById('ttsPlayBtn'),
  ttsPauseBtn: document.getElementById('ttsPauseBtn'),
  ttsStopBtn: document.getElementById('ttsStopBtn'),
  qaVoiceBtn: document.getElementById('qaVoiceBtn'),
  // Font size controls
  fontIncreaseBtn: document.getElementById('fontIncreaseBtn'),
  fontDecreaseBtn: document.getElementById('fontDecreaseBtn'),
  fontSizeLabel: document.getElementById('fontSizeLabel')
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize voice controller
    voiceController = new VoiceController();
    await voiceController.initialize();

    // Load data from URL params or storage
    await loadData();

    // Setup event listeners
    setupEventListeners();

    // Setup voice event listeners
    setupVoiceEventListeners();

    // Load theme
    loadTheme();

    // Load font size
    loadFontSize();

    // Display content
    displayContent();

  } catch (error) {
    console.error('Initialization error:', error);

    if (error.message === 'NODATA') {
      showNoDataMessage();
    } else {
      showError(error.message || 'Errore durante il caricamento dei dati');
    }
  }
});

// Load data
async function loadData() {
  try {
    // Try to get data from URL params
    const params = new URLSearchParams(window.location.search);
    const historyId = params.get('id');
    const source = params.get('source');

    // Check if loading PDF analysis
    if (source === 'pdf' && typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(['pdfReadingMode']);
      if (result.pdfReadingMode) {
        currentData = result.pdfReadingMode;
        currentData.isPDF = true;
        // Clean up after loading
        await chrome.storage.local.remove(['pdfReadingMode']);
        console.log('📄 Dati PDF caricati:', currentData);
        return;
      }
    }

    if (historyId && typeof chrome !== 'undefined' && chrome.storage) {
      // Load from history using chrome.storage (use summaryHistory)
      const result = await chrome.storage.local.get(['summaryHistory']);
      const history = result.summaryHistory || [];
      currentData = history.find(item => item.id === parseInt(historyId));

      if (!currentData) {
        throw new Error('Riassunto non trovato nella cronologia');
      }

      console.log('📖 Dati caricati dalla cronologia:', currentData);
    } else if (typeof chrome !== 'undefined' && chrome.storage) {
      // Try to load from chrome.storage (passed from popup)
      const result = await chrome.storage.local.get(['readingModeData']);
      if (result.readingModeData) {
        currentData = result.readingModeData;
        // Clean up after loading
        await chrome.storage.local.remove(['readingModeData']);
      } else {
        // No data available - show helpful message
        throw new Error('NODATA');
      }
    } else {
      // Fallback to sessionStorage (for test files)
      const sessionData = sessionStorage.getItem('readingModeData');
      if (sessionData) {
        currentData = JSON.parse(sessionData);
      } else {
        throw new Error('NODATA');
      }
    }
  } catch (error) {
    if (error.message === 'NODATA') {
      throw error;
    }
    console.error('Error loading data:', error);
    throw error;
  }
}

// Setup event listeners
function setupEventListeners() {
  // Back button
  elements.backBtn.addEventListener('click', () => {
    window.close();
  });

  // Theme toggle
  elements.themeToggleBtn.addEventListener('click', toggleTheme);

  // Copy button
  elements.copyBtn.addEventListener('click', copyAll);

  // Export button
  elements.exportBtn.addEventListener('click', exportToPDF);

  // View toggle buttons
  if (elements.viewIframeBtn) {
    elements.viewIframeBtn.addEventListener('click', () => switchArticleView('iframe'));
  }
  if (elements.viewTextBtn) {
    elements.viewTextBtn.addEventListener('click', () => switchArticleView('text'));
  }

  // Summary tabs
  document.querySelectorAll('.summary-tab').forEach(tab => {
    tab.addEventListener('click', () => switchSummaryTab(tab.dataset.tab));
  });

  // Translation button
  if (elements.translateBtn) {
    elements.translateBtn.addEventListener('click', translateArticle);
  }

  // Citations button
  if (elements.extractCitationsBtn) {
    elements.extractCitationsBtn.addEventListener('click', extractCitations);
  }

  // Q&A
  if (elements.qaAskBtn) {
    elements.qaAskBtn.addEventListener('click', askQuestion);
  }
  if (elements.qaInput) {
    elements.qaInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') askQuestion();
    });
  }

  // Scroll sync
  let scrollTimeout;
  elements.articleContent.addEventListener('scroll', () => {
    if (!syncScroll) return;

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      syncScrollPosition('article');
    }, 50);
  });

  elements.summaryContent.addEventListener('scroll', () => {
    if (!syncScroll) return;

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      syncScrollPosition('summary');
    }, 50);
  });

  // Resizable divider
  elements.divider.addEventListener('mousedown', startResize);

  // Voice controls
  if (elements.ttsPlayBtn) {
    elements.ttsPlayBtn.addEventListener('click', handleTTSPlay);
  }
  if (elements.ttsPauseBtn) {
    elements.ttsPauseBtn.addEventListener('click', handleTTSPause);
  }
  if (elements.ttsStopBtn) {
    elements.ttsStopBtn.addEventListener('click', handleTTSStop);
  }
  if (elements.qaVoiceBtn) {
    elements.qaVoiceBtn.addEventListener('click', handleVoiceInput);
  }

  // Font size controls
  if (elements.fontIncreaseBtn) {
    elements.fontIncreaseBtn.addEventListener('click', increaseFontSize);
  }
  if (elements.fontDecreaseBtn) {
    elements.fontDecreaseBtn.addEventListener('click', decreaseFontSize);
  }
}

// Resizable divider
function startResize(e) {
  isResizing = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';

  const onMouseMove = (e) => {
    if (!isResizing) return;

    const container = document.querySelector('.reading-container');
    const containerRect = container.getBoundingClientRect();
    const percentage = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Limit between 20% and 80%
    if (percentage >= 20 && percentage <= 80) {
      document.querySelector('.article-panel').style.flex = `0 0 ${percentage}%`;
      document.querySelector('.summary-panel').style.flex = `0 0 ${100 - percentage}%`;
    }
  };

  const onMouseUp = () => {
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// Theme management
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  elements.themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Helper functions
function getLanguageName(code) {
  const languages = {
    'it': 'Italiano',
    'en': 'English',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch'
  };
  return languages[code] || code;
}

function showError(message) {
  const safeMessage = HtmlSanitizer.escape(message);
  elements.articleContent.innerHTML = `
    <div class="loading-state">
      <p style="color: var(--text-primary);">❌ ${safeMessage}</p>
    </div>
  `;
  elements.summaryContent.innerHTML = `
    <div class="loading-state">
      <p style="color: var(--text-primary);">❌ ${safeMessage}</p>
    </div>
  `;
}

function showNoDataMessage() {
  elements.articleContent.innerHTML = `
    <div class="loading-state">
      <div style="text-align: center; max-width: 400px;">
        <div style="font-size: 64px; margin-bottom: 20px;">📖</div>
        <h2 style="color: var(--text-primary); margin-bottom: 16px;">Modalità Lettura</h2>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">
          Per usare questa funzionalità:
        </p>
        <ol style="text-align: left; color: var(--text-secondary); line-height: 1.8;">
          <li>Apri un articolo web</li>
          <li>Clicca sull'icona dell'extension</li>
          <li>Analizza la pagina</li>
          <li>Genera il riassunto</li>
          <li>Clicca su "📖 Modalità Lettura"</li>
        </ol>
        <p style="color: var(--text-secondary); margin-top: 24px; font-size: 14px;">
          Oppure apri <strong>test-reading-mode.html</strong> per vedere una demo
        </p>
      </div>
    </div>
  `;
  elements.summaryContent.innerHTML = `
    <div class="loading-state">
      <div style="text-align: center; max-width: 400px;">
        <div style="font-size: 64px; margin-bottom: 20px;">✨</div>
        <h2 style="color: var(--text-primary); margin-bottom: 16px;">Riassunto AI</h2>
        <p style="color: var(--text-secondary);">
          Il riassunto apparirà qui dopo aver analizzato un articolo
        </p>
      </div>
    </div>
  `;
}
