// Multi-Analysis Page Script
import { Logger } from '../../utils/core/logger.js';
import { HtmlSanitizer } from '../../utils/security/html-sanitizer.js';
import { StorageManager } from '../../utils/storage/storage-manager.js';
import { I18n } from '../../utils/i18n/i18n.js';
import { HistoryManager } from '../../utils/storage/history-manager.js';
import { APIClient } from '../../utils/ai/api-client.js';
import { MultiAnalysisManager } from '../../utils/core/multi-analysis-manager.js';
import { Modal } from '../../utils/core/modal.js';
import { state } from './state.js';
import { exportPdf, exportMarkdown, sendEmail, copyContent } from './export.js';
import { submitQuestion } from './qa.js';

document.addEventListener('DOMContentLoaded', async () => {
  Logger.info('Multi-Analysis: DOMContentLoaded');

  await I18n.initPage();

  // Controlla se stiamo riaprendo un'analisi salvata
  const result = await chrome.storage.local.get(['reopenMultiAnalysis']);
  if (result.reopenMultiAnalysis) {
    await reopenSavedAnalysis(result.reopenMultiAnalysis);
    await chrome.storage.local.remove(['reopenMultiAnalysis']);
    return;
  }

  await loadArticles();

  const startBtn = document.getElementById('startAnalysisBtn');
  Logger.debug('Start button trovato:', startBtn);

  document.getElementById('backBtn').addEventListener('click', () => {
    window.close();
  });

  document.getElementById('selectAllBtn').addEventListener('click', selectAll);
  document.getElementById('clearSelectionBtn').addEventListener('click', clearSelection);
  document.getElementById('searchArticles').addEventListener('input', filterArticles);
  document.getElementById('filterProvider').addEventListener('change', filterArticles);

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      Logger.debug('Click su startAnalysisBtn');
      startAnalysis();
    });
  } else {
    Logger.error('startAnalysisBtn non trovato!');
  }

  document.getElementById('closeModal').addEventListener('click', closeAnalysisModal);

  document.querySelectorAll('.modal-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  document.getElementById('exportPdfBtn').addEventListener('click', exportPdf);
  document.getElementById('exportMdBtn').addEventListener('click', exportMarkdown);
  document.getElementById('sendEmailBtn').addEventListener('click', sendEmail);
  document.getElementById('copyBtn').addEventListener('click', copyContent);
});

async function loadArticles() {
  state.allArticles = await HistoryManager.getHistory();
  displayArticles(state.allArticles);
}

function displayArticles(articles) {
  const listEl = document.getElementById('articlesList');

  if (articles.length === 0) {
    listEl.innerHTML =
      '<p style="text-align: center; color: #636e72; padding: 40px;">Nessun articolo disponibile</p>';
    return;
  }

  listEl.innerHTML = articles
    .map(
      (article) => `
    <div class="article-item" data-id="${article.id}">
      <input type="checkbox" class="article-checkbox" data-id="${article.id}" />
      <div class="article-info">
        <div class="article-title">${HtmlSanitizer.escape(article.article.title)}</div>
        <div class="article-meta">
          <span class="meta-badge provider">${HtmlSanitizer.escape(article.metadata.provider)}</span>
          <span class="meta-badge date">${HistoryManager.formatDate(article.timestamp)}</span>
          <span class="meta-badge words">${article.article.wordCount} ${I18n.t('article.words')}</span>
        </div>
      </div>
    </div>
  `,
    )
    .join('');

  document.querySelectorAll('.article-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', handleSelection);
  });

  document.querySelectorAll('.article-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('article-checkbox')) return;
      const checkbox = item.querySelector('.article-checkbox');
      checkbox.checked = !checkbox.checked;
      handleSelection({ target: checkbox });
    });
  });
}

function handleSelection(e) {
  const id = parseInt(e.target.dataset.id);
  const item = document.querySelector(`.article-item[data-id="${id}"]`);

  if (e.target.checked) {
    state.selectedArticles.push(id);
    item.classList.add('selected');
  } else {
    state.selectedArticles = state.selectedArticles.filter((artId) => artId !== id);
    item.classList.remove('selected');
  }

  updateSelectionCount();
}

function updateSelectionCount() {
  const countNumber = document.getElementById('selectionCountNumber');
  if (countNumber) {
    countNumber.textContent = state.selectedArticles.length;
  } else {
    document.getElementById('selectionCount').textContent =
      `${state.selectedArticles.length} ${I18n.t('multi.selected')}`;
  }
  document.getElementById('startAnalysisBtn').disabled = state.selectedArticles.length < 2;
}

function selectAll() {
  const visibleCheckboxes = document.querySelectorAll(
    '.article-item:not([style*="display: none"]) .article-checkbox',
  );
  visibleCheckboxes.forEach((checkbox) => {
    checkbox.checked = true;
    const id = parseInt(checkbox.dataset.id);
    if (!state.selectedArticles.includes(id)) {
      state.selectedArticles.push(id);
      document.querySelector(`.article-item[data-id="${id}"]`).classList.add('selected');
    }
  });
  updateSelectionCount();
}

function clearSelection() {
  document.querySelectorAll('.article-checkbox').forEach((checkbox) => {
    checkbox.checked = false;
  });
  document.querySelectorAll('.article-item').forEach((item) => {
    item.classList.remove('selected');
  });
  state.selectedArticles = [];
  updateSelectionCount();
}

function filterArticles() {
  const searchQuery = document.getElementById('searchArticles').value.toLowerCase();
  const providerFilter = document.getElementById('filterProvider').value;

  const filtered = state.allArticles.filter((article) => {
    const matchesSearch =
      !searchQuery ||
      article.article.title.toLowerCase().includes(searchQuery) ||
      article.article.url.toLowerCase().includes(searchQuery);

    const matchesProvider = !providerFilter || article.metadata.provider === providerFilter;

    return matchesSearch && matchesProvider;
  });

  displayArticles(filtered);

  state.selectedArticles.forEach((id) => {
    const checkbox = document.querySelector(`.article-checkbox[data-id="${id}"]`);
    if (checkbox) {
      checkbox.checked = true;
      document.querySelector(`.article-item[data-id="${id}"]`).classList.add('selected');
    }
  });
}

async function startAnalysis() {
  Logger.debug('startAnalysis chiamato, articoli selezionati:', state.selectedArticles.length);

  if (state.selectedArticles.length < 2) {
    Logger.debug('Troppo pochi articoli selezionati');
    await Modal.alert(I18n.t('multi.minArticles'), I18n.t('multi.minArticlesTitle'), '⚠️');
    return;
  }

  const options = {
    globalSummary: document.getElementById('optGlobalSummary').checked,
    comparison: document.getElementById('optComparison').checked,
    qa: document.getElementById('optQA').checked,
  };

  if (!options.globalSummary && !options.comparison && !options.qa) {
    await Modal.alert(I18n.t('multi.minOptions'), I18n.t('multi.minOptionsTitle'), '⚠️');
    return;
  }

  const articles = state.selectedArticles.map((id) => state.allArticles.find((a) => a.id === id));

  showProgress(I18n.t('multi.checkingCorrelation'), 10);

  const correlationResult = await MultiAnalysisManager.checkArticlesRelation(articles);

  if (!correlationResult.related) {
    hideProgress();
    const choice = await showUnrelatedModal(correlationResult.reason);

    if (choice === 'cancel') return;
    if (choice === 'qaOnly') {
      options.globalSummary = false;
      options.comparison = false;
      options.qa = true;
    }
  }

  try {
    showProgress(I18n.t('multi.startingAnalysis'), 20);
    state.currentAnalysis = await MultiAnalysisManager.analyzeArticles(
      articles,
      options,
      updateProgress,
    );
    hideProgress();

    try {
      Logger.debug('Tentativo di salvare analisi...', state.currentAnalysis, articles);
      const analysisId = await HistoryManager.saveMultiAnalysis(state.currentAnalysis, articles);
      state.currentAnalysis.id = analysisId;
      Logger.info('Analisi salvata nella cronologia con ID:', analysisId);
    } catch (saveError) {
      Logger.error('Errore nel salvataggio cronologia:', saveError);
    }

    showAnalysisModal();
  } catch (error) {
    Logger.error('Errore completo:', error);
    Logger.error('Stack trace:', error.stack);
    hideProgress();
    await Modal.alert(
      I18n.t('multi.analysisError') +
        ' ' +
        error.message +
        '\n\n' +
        I18n.t('multi.errorDetails') +
        ' ' +
        (error.stack || 'N/A'),
      I18n.t('multi.errorTitle'),
      '❌',
    );
  }
}

function showProgress(message, percent) {
  const modal = document.getElementById('progressModal');
  document.getElementById('progressMessage').textContent = message;
  document.getElementById('progressFill').style.width = percent + '%';
  document.getElementById('progressPercent').textContent = Math.round(percent) + '%';
  modal.classList.remove('hidden');
}

function updateProgress(message, percent) {
  document.getElementById('progressMessage').textContent = message;
  document.getElementById('progressFill').style.width = percent + '%';
  document.getElementById('progressPercent').textContent = Math.round(percent) + '%';
}

function hideProgress() {
  document.getElementById('progressModal').classList.add('hidden');
}

function showUnrelatedModal(reason = null) {
  return new Promise((resolve) => {
    const modal = document.getElementById('unrelatedModal');
    const reasonEl = document.getElementById('unrelatedReason');

    if (reason) {
      reasonEl.textContent = '💡 ' + reason;
      reasonEl.style.display = 'block';
    } else {
      reasonEl.style.display = 'none';
    }

    modal.classList.remove('hidden');

    const handleQAOnly = () => {
      modal.classList.add('hidden');
      cleanup();
      resolve('qaOnly');
    };

    const handleFullAnalysis = () => {
      modal.classList.add('hidden');
      cleanup();
      resolve('full');
    };

    const handleCancel = () => {
      modal.classList.add('hidden');
      cleanup();
      resolve('cancel');
    };

    const cleanup = () => {
      document.getElementById('unrelatedQAOnly').removeEventListener('click', handleQAOnly);
      document
        .getElementById('unrelatedFullAnalysis')
        .removeEventListener('click', handleFullAnalysis);
      document.getElementById('unrelatedCancel').removeEventListener('click', handleCancel);
    };

    document.getElementById('unrelatedQAOnly').addEventListener('click', handleQAOnly);
    document.getElementById('unrelatedFullAnalysis').addEventListener('click', handleFullAnalysis);
    document.getElementById('unrelatedCancel').addEventListener('click', handleCancel);
  });
}

function formatMarkdown(text) {
  text = HtmlSanitizer.escape(text);
  return text
    .replace(/### (.*)/g, '<h4>$1</h4>')
    .replace(/## (.*)/g, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(.*)$/, '<p>$1</p>');
}

function showAnalysisModal() {
  if (!state.currentAnalysis) return;

  Logger.debug('showAnalysisModal - currentAnalysis:', state.currentAnalysis);
  Logger.debug('currentAnalysis.qa:', state.currentAnalysis.qa);

  if (state.currentAnalysis.globalSummary) {
    document.getElementById('tabSummary').innerHTML = `
      <div class="analysis-content">
        ${formatMarkdown(state.currentAnalysis.globalSummary)}
      </div>
    `;
  } else {
    document.getElementById('tabSummary').innerHTML =
      '<p style="text-align: center; color: #636e72; padding: 40px;">Riassunto non generato</p>';
  }

  if (state.currentAnalysis.comparison) {
    document.getElementById('tabComparison').innerHTML = `
      <div class="analysis-content">
        ${formatMarkdown(state.currentAnalysis.comparison)}
      </div>
    `;
  } else {
    document.getElementById('tabComparison').innerHTML =
      '<p style="text-align: center; color: #636e72; padding: 40px;">Confronto non generato</p>';
  }

  Logger.debug('Verifica Q&A - qa:', state.currentAnalysis.qa);
  Logger.debug('Verifica Q&A - interactive:', state.currentAnalysis.qa?.interactive);

  if (state.currentAnalysis.qa && state.currentAnalysis.qa.interactive) {
    Logger.debug('Rendering Q&A interattivo');
    document.getElementById('tabQA').innerHTML = `
      <div class="qa-interactive">
        <div class="qa-chat-container" id="qaChatContainer">
          <div class="qa-welcome">
            <p>💬 <strong>Q&A Interattivo</strong></p>
            <p>Fai domande sui ${state.currentAnalysis.qa.articles?.length || state.selectedArticles.length} articoli selezionati. Il sistema risponderà basandosi esclusivamente sui loro contenuti.</p>
          </div>
        </div>
        <div class="qa-input-container">
          <input type="text" id="qaInput" placeholder="Scrivi la tua domanda..." />
          <button id="qaSubmitBtn" class="btn-primary">Invia</button>
        </div>
      </div>
    `;

    if (state.currentAnalysis.qa.questions && state.currentAnalysis.qa.questions.length > 0) {
      const chatContainer = document.getElementById('qaChatContainer');
      chatContainer.innerHTML = '';

      state.currentAnalysis.qa.questions.forEach((qa) => {
        const questionEl = document.createElement('div');
        questionEl.className = 'qa-message qa-question-msg';
        questionEl.innerHTML = `<strong>Tu:</strong> ${HtmlSanitizer.escape(qa.question)}`;
        chatContainer.appendChild(questionEl);

        const answerEl = document.createElement('div');
        answerEl.className = 'qa-message qa-answer-msg';
        answerEl.innerHTML = `<strong>Assistente:</strong> ${HtmlSanitizer.escape(qa.answer)}`;
        chatContainer.appendChild(answerEl);
      });

      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    document.getElementById('qaSubmitBtn').addEventListener('click', submitQuestion);
    document.getElementById('qaInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') submitQuestion();
    });
  } else {
    document.getElementById('tabQA').innerHTML =
      '<p style="text-align: center; color: #636e72; padding: 40px;">Q&A non abilitato</p>';
  }

  document.getElementById('analysisModal').classList.remove('hidden');
}

function closeAnalysisModal() {
  document.getElementById('analysisModal').classList.add('hidden');
}

function switchTab(tabName) {
  document.querySelectorAll('.modal-tab').forEach((tab) => {
    tab.classList.remove('active');
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    }
  });

  document.querySelectorAll('.modal-pane').forEach((pane) => {
    pane.classList.remove('active');
  });

  const tabIds = {
    summary: 'tabSummary',
    comparison: 'tabComparison',
    qa: 'tabQA',
  };

  const tabId = tabIds[tabName];
  if (tabId) {
    const tabElement = document.getElementById(tabId);
    if (tabElement) {
      tabElement.classList.add('active');
    } else {
      Logger.error('Tab element non trovato:', tabId);
    }
  }
}

// ===== REOPEN SAVED ANALYSIS =====

async function reopenSavedAnalysis(data) {
  Logger.info('Riapertura analisi salvata:', data);

  state.currentAnalysis = {
    id: data.id,
    timestamp: Date.now(),
    globalSummary: data.analysis.globalSummary,
    comparison: data.analysis.comparison,
    qa: data.analysis.qa,
    metadata: {
      provider: data.analysis.metadata?.provider || 'unknown',
    },
  };

  state.selectedArticles = data.articles.map((a) => a.id);
  state.allArticles = data.articles.map((a) => ({
    id: a.id,
    article: {
      title: a.title,
      url: a.url,
      wordCount: a.wordCount,
    },
  }));

  document.querySelector('.selection-panel').style.display = 'none';
  document.querySelector('.analysis-panel').style.display = 'none';

  const header = document.querySelector('header');
  header.innerHTML = `
    <h1>🔬 Analisi Multi Articolo</h1>
    <button id="backBtn" class="btn-back">← Cronologia</button>
  `;

  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = chrome.runtime.getURL('src/pages/history/history.html');
  });

  document.getElementById('closeModal').addEventListener('click', () => {
    window.location.href = chrome.runtime.getURL('src/pages/history/history.html');
  });

  document.querySelectorAll('.modal-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  document.getElementById('exportPdfBtn').addEventListener('click', exportPdf);
  document.getElementById('exportMdBtn').addEventListener('click', exportMarkdown);
  document.getElementById('sendEmailBtn').addEventListener('click', sendEmail);
  document.getElementById('copyBtn').addEventListener('click', copyContent);

  showAnalysisModal();
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
