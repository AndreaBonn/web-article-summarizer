// Reading Mode - Side-by-Side View
// Controller: init, caricamento dati, event listeners, theme, resize

import { state, elements, initElements } from './src/reading-mode/state.js';
import { HtmlSanitizer } from './utils/html-sanitizer.js';
import { VoiceController } from './utils/voice-controller.js';

import {
  displayContent,
  switchArticleView,
  syncScrollPosition,
  switchSummaryTab,
  showError,
} from './src/reading-mode/display.js';

import { copyAll, exportToPDF } from './src/reading-mode/export.js';

import {
  translateArticle,
  extractCitations,
  askQuestion,
} from './src/reading-mode/features.js';

import {
  setupVoiceEventListeners,
  handleTTSPlay,
  handleTTSPause,
  handleTTSStop,
  handleVoiceInput,
  loadFontSize,
  increaseFontSize,
  decreaseFontSize,
} from './src/reading-mode/voice.js';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Populate DOM element references
  initElements();

  try {
    // Initialize voice controller
    state.voiceController = new VoiceController();
    await state.voiceController.initialize();

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
        state.currentData = result.pdfReadingMode;
        state.currentData.isPDF = true;
        // Clean up after loading
        await chrome.storage.local.remove(['pdfReadingMode']);
        console.log('📄 Dati PDF caricati:', state.currentData);
        return;
      }
    }

    if (historyId && typeof chrome !== 'undefined' && chrome.storage) {
      // Load from history using chrome.storage (use summaryHistory)
      const result = await chrome.storage.local.get(['summaryHistory']);
      const history = result.summaryHistory || [];
      state.currentData = history.find(item => item.id === parseInt(historyId));

      if (!state.currentData) {
        throw new Error('Riassunto non trovato nella cronologia');
      }

      console.log('📖 Dati caricati dalla cronologia:', state.currentData);
    } else if (typeof chrome !== 'undefined' && chrome.storage) {
      // Try to load from chrome.storage (passed from popup)
      const result = await chrome.storage.local.get(['readingModeData']);
      if (result.readingModeData) {
        state.currentData = result.readingModeData;
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
        state.currentData = JSON.parse(sessionData);
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
    if (!state.syncScroll) return;

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      syncScrollPosition('article');
    }, 50);
  });

  elements.summaryContent.addEventListener('scroll', () => {
    if (!state.syncScroll) return;

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
  state.isResizing = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';

  const onMouseMove = (e) => {
    if (!state.isResizing) return;

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
    state.isResizing = false;
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
