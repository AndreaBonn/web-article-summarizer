// History Page Script
let currentHistory = [];
let currentEntry = null;
let voiceController = null;

// Lazy Loader e Search Optimizer
let lazyLoader = null;
let searchOptimizer = new SearchOptimizer();
let debouncedSearch = null;

// Modal System
const Modal = {
  show(options) {
    return new Promise((resolve) => {
      const modal = document.getElementById('customModal');
      const icon = document.getElementById('modalIcon');
      const title = document.getElementById('modalTitle');
      const message = document.getElementById('modalMessage');
      const confirmBtn = document.getElementById('modalConfirmBtn');
      const cancelBtn = document.getElementById('modalCancelBtn');
      
      // Set content
      icon.textContent = options.icon || 'ℹ️';
      title.textContent = options.title || I18n.t('history.modalTitle');
      message.textContent = options.message || '';
      
      // Configure buttons
      if (options.type === 'confirm') {
        cancelBtn.classList.remove('hidden');
        cancelBtn.textContent = options.cancelText || 'Annulla';
        confirmBtn.textContent = options.confirmText || 'OK';
      } else {
        cancelBtn.classList.add('hidden');
        confirmBtn.textContent = options.confirmText || 'OK';
      }
      
      // Show modal
      modal.classList.remove('hidden');
      
      // Event handlers
      const handleConfirm = () => {
        modal.classList.add('hidden');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        resolve(true);
      };
      
      const handleCancel = () => {
        modal.classList.add('hidden');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        resolve(false);
      };
      
      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      
      // Close on overlay click
      const overlay = modal.querySelector('.custom-modal-overlay');
      overlay.addEventListener('click', handleCancel, { once: true });
    });
  },
  
  alert(message, title = 'Cronologia', icon = 'ℹ️') {
    return this.show({
      type: 'alert',
      title,
      message,
      icon,
      confirmText: 'OK'
    });
  },
  
  confirm(message, title = 'Conferma', icon = '❓') {
    return this.show({
      type: 'confirm',
      title,
      message,
      icon,
      confirmText: 'OK',
      cancelText: 'Annulla'
    });
  },
  
  error(message, title = 'Errore') {
    return this.show({
      type: 'alert',
      title,
      message,
      icon: '❌',
      confirmText: 'OK'
    });
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  // Inizializza i18n
  await I18n.init();
  
  // Initialize voice controller
  voiceController = new VoiceController();
  await voiceController.initialize();
  
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
  debouncedSearch = DebounceUtility.debounceWithFeedback(
    handleSearch,
    300, // 300ms di attesa
    document.getElementById('searchInput')
  );
  
  document.getElementById('searchInput').addEventListener('input', debouncedSearch);
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

async function loadHistory() {
  currentHistory = await HistoryManager.getHistory();
  
  // Inizializza lazy loader se non esiste
  if (!lazyLoader) {
    const listEl = document.getElementById('historyList');
    lazyLoader = new HistoryLazyLoader(listEl, 20); // 20 items per page
    
    // Imposta callbacks
    lazyLoader.onItemClick = openDetail;
    lazyLoader.onFavoriteToggle = async (id) => {
      const isFavorite = await HistoryManager.toggleFavorite(id);
      // Aggiorna anche in currentHistory
      const entry = currentHistory.find(e => e.id === id);
      if (entry) {
        entry.favorite = isFavorite;
      }
      return isFavorite;
    };
  }
  
  displayHistory(currentHistory);
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
  if (!lazyLoader) {
    lazyLoader = new HistoryLazyLoader(listEl, 20);
    lazyLoader.onItemClick = openDetail;
    lazyLoader.onFavoriteToggle = async (id) => {
      const isFavorite = await HistoryManager.toggleFavorite(id);
      const entry = currentHistory.find(e => e.id === id);
      if (entry) {
        entry.favorite = isFavorite;
      }
      return isFavorite;
    };
  }
  
  lazyLoader.setItems(history);
}

async function handleSearch(e) {
  const query = e.target.value.trim();
  
  if (query === '') {
    searchOptimizer.reset();
    displayHistory(currentHistory);
    return;
  }
  
  // Ottieni opzioni di ricerca
  const searchInTitle = document.getElementById('searchInTitle').checked;
  const searchInUrl = document.getElementById('searchInUrl').checked;
  const searchInContent = document.getElementById('searchInContent').checked;
  
  // Usa search optimizer per ricerca incrementale
  const filtered = searchOptimizer.search(currentHistory, query, {
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
  
  let filtered = currentHistory;
  
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

async function openDetail(id) {
  currentEntry = await HistoryManager.getSummaryById(id);
  
  if (!currentEntry) {
    await Modal.error(I18n.t('history.summaryNotFound'));
    return;
  }
  
  // Populate modal
  document.getElementById('modalTitle').textContent = currentEntry.article.title;
  document.getElementById('modalDate').textContent = new Date(currentEntry.timestamp).toLocaleString('it-IT');
  document.getElementById('modalProvider').textContent = `Provider: ${currentEntry.metadata.provider}`;
  document.getElementById('modalLanguage').textContent = `${I18n.t('controls.language')} ${currentEntry.metadata.language}`;
  document.getElementById('modalStats').textContent = `${currentEntry.article.wordCount} ${I18n.t('article.words')} • ${currentEntry.article.readingTimeMinutes} ${I18n.t('article.readingTime')}`;
  
  // Summary
  document.getElementById('modalSummary').innerHTML = `<p>${currentEntry.summary}</p>`;
  
  // Key points
  const keypointsHtml = currentEntry.keyPoints.map((point, index) => `
    <div class="keypoint-modal">
      <div class="keypoint-modal-title">${index + 1}. ${point.title}</div>
      <div class="keypoint-modal-ref">§${point.paragraphs}</div>
      <div class="keypoint-modal-desc">${point.description}</div>
    </div>
  `).join('');
  document.getElementById('modalKeypoints').innerHTML = keypointsHtml;
  
  // Translation (if available)
  if (currentEntry.translation) {
    document.getElementById('modalTranslation').innerHTML = `
      <div class="translation-info-modal">
        📝 Tradotto da ${currentEntry.translation.originalLanguage} a ${currentEntry.translation.targetLanguage}
      </div>
      <div class="translation-text">${currentEntry.translation.text}</div>
    `;
  } else {
    document.getElementById('modalTranslation').innerHTML = `
      <p style="color: #636e72; text-align: center; padding: 40px;">
        Nessuna traduzione disponibile per questo riassunto
      </p>
    `;
  }
  
  // Q&A (if available)
  if (currentEntry.qa && currentEntry.qa.length > 0) {
    let qaHtml = '';
    currentEntry.qa.forEach((qa, index) => {
      qaHtml += `
        <div class="qa-item">
          <div class="qa-question">
            <strong>Q${index + 1}:</strong> ${qa.question}
          </div>
          <div class="qa-answer">
            <strong>R${index + 1}:</strong> ${qa.answer}
          </div>
        </div>
      `;
    });
    document.getElementById('modalQA').innerHTML = qaHtml;
  } else {
    document.getElementById('modalQA').innerHTML = `
      <p style="color: #636e72; text-align: center; padding: 40px;">
        Nessuna domanda e risposta disponibile per questo riassunto
      </p>
    `;
  }
  
  // Citations (if available)
  if (currentEntry.citations && currentEntry.citations.citations && currentEntry.citations.citations.length > 0) {
    let citationsHtml = `
      <div class="citations-info" style="margin-bottom: 16px;">
        <strong>📚 ${currentEntry.citations.total_citations || currentEntry.citations.citations.length} citazioni trovate</strong>
      </div>
      
      <div class="article-citation-box" style="background: #f0f3ff; padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
        <h4 style="font-size: 13px; margin-bottom: 10px;">📄 Citazione Articolo Principale (APA)</h4>
        <div style="font-size: 12px; line-height: 1.6; font-family: 'Courier New', monospace;">
          ${CitationExtractor.formatCitation(currentEntry.article, 'apa')}
        </div>
      </div>
      
      <div class="citations-list" style="display: flex; flex-direction: column; gap: 12px;">
    `;
    
    currentEntry.citations.citations.forEach(citation => {
      const typeIcon = {
        'direct_quote': '💬',
        'reference': '📖',
        'statistic': '📊',
        'source': '🔗'
      }[citation.type] || '📌';
      
      citationsHtml += `
        <div class="citation-item" style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 3px solid #667eea;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 16px;">${typeIcon}</span>
            <span style="font-size: 11px; font-weight: 600; color: #667eea; background: rgba(102, 126, 234, 0.1); padding: 2px 6px; border-radius: 4px;">#${citation.id}</span>
            ${citation.author ? `<span style="font-size: 12px; font-weight: 600;">${citation.author}</span>` : ''}
          </div>
          ${citation.text ? `<div style="font-size: 11px; font-style: italic; margin-bottom: 8px; background: rgba(102, 126, 234, 0.05); padding: 8px; border-radius: 4px;">"${citation.text}"</div>` : ''}
          <div style="font-size: 11px; color: #636e72; line-height: 1.5;">${citation.context}</div>
        </div>
      `;
    });
    
    citationsHtml += `</div>`;
    document.getElementById('modalCitations').innerHTML = citationsHtml;
  } else {
    document.getElementById('modalCitations').innerHTML = `
      <p style="color: #636e72; text-align: center; padding: 40px;">
        Nessuna citazione disponibile per questo riassunto
      </p>
    `;
  }
  
  // Notes (always editable)
  const notesHtml = `
    <div class="notes-container">
      <textarea id="notesTextarea" class="notes-textarea" placeholder="Aggiungi note personali su questo articolo...">${currentEntry.notes || ''}</textarea>
      <button id="saveNotesBtn" class="btn btn-primary save-notes-btn">💾 Salva Note</button>
    </div>
  `;
  document.getElementById('modalNotes').innerHTML = notesHtml;
  
  // Add event listener for save notes
  document.getElementById('saveNotesBtn').addEventListener('click', async () => {
    const notes = document.getElementById('notesTextarea').value.trim();
    await HistoryManager.updateSummaryNotes(currentEntry.id, notes || null);
    currentEntry.notes = notes || null;
    
    const btn = document.getElementById('saveNotesBtn');
    const originalText = btn.textContent;
    btn.textContent = '✓ Salvate!';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  });
  
  // Show modal
  document.getElementById('detailModal').classList.remove('hidden');
}

function closeModal() {
  // Stop TTS if playing
  if (voiceController) {
    voiceController.stopSpeaking();
  }
  
  document.getElementById('detailModal').classList.add('hidden');
  currentEntry = null;
}

function switchModalTab(tabName) {
  document.querySelectorAll('.modal-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    }
  });
  
  document.querySelectorAll('.modal-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  
  if (tabName === 'summary') {
    document.getElementById('modalSummary').classList.add('active');
  } else if (tabName === 'keypoints') {
    document.getElementById('modalKeypoints').classList.add('active');
  } else if (tabName === 'translation') {
    document.getElementById('modalTranslation').classList.add('active');
  } else if (tabName === 'qa') {
    document.getElementById('modalQA').classList.add('active');
  } else if (tabName === 'citations') {
    document.getElementById('modalCitations').classList.add('active');
  } else if (tabName === 'notes') {
    document.getElementById('modalNotes').classList.add('active');
  }
}

async function exportCurrentPdf() {
  if (!currentEntry) return;
  
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
  if (currentEntry.translation) {
    translationOption.classList.remove('disabled');
    translationCheckbox.disabled = false;
    translationCheckbox.checked = true;
  } else {
    translationOption.classList.add('disabled');
    translationCheckbox.disabled = true;
    translationCheckbox.checked = false;
  }
  
  // Gestisci disponibilità Q&A
  if (currentEntry.qa && currentEntry.qa.length > 0) {
    qaOption.classList.remove('disabled');
    qaCheckbox.disabled = false;
    qaCheckbox.checked = true;
  } else {
    qaOption.classList.add('disabled');
    qaCheckbox.disabled = true;
    qaCheckbox.checked = false;
  }
  
  // Gestisci disponibilità Citazioni
  if (currentEntry.citations && currentEntry.citations.citations && currentEntry.citations.citations.length > 0) {
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
      includeTranslation: document.getElementById('pdfIncludeTranslation').checked && currentEntry.translation,
      includeQA: document.getElementById('pdfIncludeQA').checked && currentEntry.qa && currentEntry.qa.length > 0,
      includeCitations: document.getElementById('pdfIncludeCitations').checked && currentEntry.citations && currentEntry.citations.citations && currentEntry.citations.citations.length > 0
    };
    
    // Verifica che almeno una opzione sia selezionata
    if (!options.includeSummary && !options.includeKeypoints && !options.includeTranslation && !options.includeQA && !options.includeCitations) {
      await Modal.alert('Seleziona almeno una sezione da esportare', 'Nessuna Selezione', '⚠️');
      return;
    }
    
    modal.classList.add('hidden');
    
    try {
      const translation = options.includeTranslation && currentEntry.translation ? currentEntry.translation.text : null;
      const qaList = options.includeQA ? currentEntry.qa : null;
      const citations = options.includeCitations ? currentEntry.citations : null;
      
      await PDFExporter.exportToPDF(
        currentEntry.article,
        options.includeSummary ? currentEntry.summary : null,
        options.includeKeypoints ? currentEntry.keyPoints : null,
        currentEntry.metadata,
        translation,
        qaList,
        citations
      );
    } catch (error) {
      await Modal.error('Errore durante l\'esportazione PDF: ' + error.message);
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

async function exportCurrentMarkdown() {
  if (!currentEntry) return;
  
  // Mostra modal di selezione (riusa lo stesso del PDF)
  showMarkdownExportModalHistory();
}

async function showMarkdownExportModalHistory() {
  const modal = document.getElementById('exportOptionsModal');
  const translationOption = document.getElementById('pdfTranslationOption');
  const qaOption = document.getElementById('pdfQAOption');
  const citationsOption = document.getElementById('pdfCitationsOption');
  const translationCheckbox = document.getElementById('pdfIncludeTranslation');
  const qaCheckbox = document.getElementById('pdfIncludeQA');
  const citationsCheckbox = document.getElementById('pdfIncludeCitations');
  const modalTitle = modal.querySelector('.custom-modal-title');
  
  // Cambia titolo per Markdown
  modalTitle.textContent = 'Esporta Markdown';
  
  // Gestisci disponibilità traduzione
  if (currentEntry.translation) {
    translationOption.classList.remove('disabled');
    translationCheckbox.disabled = false;
    translationCheckbox.checked = true;
  } else {
    translationOption.classList.add('disabled');
    translationCheckbox.disabled = true;
    translationCheckbox.checked = false;
  }
  
  // Gestisci disponibilità Q&A
  if (currentEntry.qa && currentEntry.qa.length > 0) {
    qaOption.classList.remove('disabled');
    qaCheckbox.disabled = false;
    qaCheckbox.checked = true;
  } else {
    qaOption.classList.add('disabled');
    qaCheckbox.disabled = true;
    qaCheckbox.checked = false;
  }
  
  // Gestisci disponibilità Citazioni
  if (currentEntry.citations && currentEntry.citations.citations && currentEntry.citations.citations.length > 0) {
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
      includeTranslation: document.getElementById('pdfIncludeTranslation').checked && currentEntry.translation,
      includeQA: document.getElementById('pdfIncludeQA').checked && currentEntry.qa && currentEntry.qa.length > 0,
      includeCitations: document.getElementById('pdfIncludeCitations').checked && currentEntry.citations && currentEntry.citations.citations && currentEntry.citations.citations.length > 0
    };
    
    // Verifica che almeno una opzione sia selezionata
    if (!options.includeSummary && !options.includeKeypoints && !options.includeTranslation && !options.includeQA && !options.includeCitations) {
      await Modal.alert('Seleziona almeno una sezione da esportare', 'Nessuna Selezione', '⚠️');
      return;
    }
    
    modal.classList.add('hidden');
    modalTitle.textContent = 'Esporta PDF'; // Ripristina titolo
    
    try {
      const translation = options.includeTranslation && currentEntry.translation ? currentEntry.translation.text : null;
      const qaList = options.includeQA ? currentEntry.qa : null;
      const citations = options.includeCitations ? currentEntry.citations : null;
      
      MarkdownExporter.exportToMarkdown(
        currentEntry.article,
        options.includeSummary ? currentEntry.summary : null,
        options.includeKeypoints ? currentEntry.keyPoints : null,
        currentEntry.metadata,
        translation,
        qaList,
        currentEntry.notes || null, // notes - sarà implementato dopo
        citations
      );
    } catch (error) {
      await Modal.error('Errore durante l\'esportazione Markdown: ' + error.message);
    }
    
    cleanup();
  };
  
  // Handler per annulla
  const handleCancel = () => {
    modal.classList.add('hidden');
    modalTitle.textContent = 'Esporta PDF'; // Ripristina titolo
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

async function copyCurrentSummary() {
  if (!currentEntry) return;
  
  let text = `RIASSUNTO:\n${currentEntry.summary}\n\n`;
  text += `PUNTI CHIAVE:\n`;
  currentEntry.keyPoints.forEach((point, index) => {
    text += `${index + 1}. ${point.title} (§${point.paragraphs})\n   ${point.description}\n\n`;
  });
  
  // Aggiungi traduzione se presente
  if (currentEntry.translation) {
    text += `\n${'='.repeat(50)}\n\n`;
    text += `TRADUZIONE:\n${currentEntry.translation.text}\n`;
  }
  
  // Aggiungi Q&A se presenti
  if (currentEntry.qa && currentEntry.qa.length > 0) {
    text += `\n${'='.repeat(50)}\n\n`;
    text += `DOMANDE E RISPOSTE:\n\n`;
    currentEntry.qa.forEach((qa, index) => {
      text += `Q${index + 1}: ${qa.question}\n`;
      text += `R${index + 1}: ${qa.answer}\n\n`;
    });
  }
  
  // Aggiungi citazioni se presenti
  if (currentEntry.citations && currentEntry.citations.citations && currentEntry.citations.citations.length > 0) {
    text += `\n${'='.repeat(50)}\n\n`;
    text += `CITAZIONI E BIBLIOGRAFIA:\n\n`;
    // Usa stile APA di default per la copia
    text += CitationExtractor.generateBibliography(currentEntry.article, currentEntry.citations.citations, 'apa');
  }
  
  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById('copyModalBtn');
    const originalText = btn.textContent;
    btn.textContent = '✓ Copiato!';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  } catch (error) {
    await Modal.error(I18n.t('history.copyError'));
  }
}

async function deleteCurrentEntry() {
  if (!currentEntry) return;
  
  const confirmed = await Modal.confirm(
    I18n.t('history.confirmDelete'),
    I18n.t('history.deleteTitle'),
    '🗑️'
  );
  
  if (!confirmed) return;
  
  await HistoryManager.deleteSummary(currentEntry.id);
  closeModal();
  await loadHistory();
}

// Email System
async function sendCurrentEmail() {
  if (!currentEntry) return;
  
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
  const translationCheckbox = document.getElementById('emailIncludeTranslation');
  const qaCheckbox = document.getElementById('emailIncludeQA');
  
  // Gestisci disponibilità traduzione
  if (currentEntry.translation) {
    translationOption.classList.remove('disabled');
    translationCheckbox.disabled = false;
    translationCheckbox.checked = true;
  } else {
    translationOption.classList.add('disabled');
    translationCheckbox.disabled = true;
    translationCheckbox.checked = false;
  }
  
  // Gestisci disponibilità Q&A
  if (currentEntry.qa && currentEntry.qa.length > 0) {
    qaOption.classList.remove('disabled');
    qaCheckbox.disabled = false;
    qaCheckbox.checked = true;
  } else {
    qaOption.classList.add('disabled');
    qaCheckbox.disabled = true;
    qaCheckbox.checked = false;
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
      await Modal.alert('Inserisci un indirizzo email', 'Email Mancante', '⚠️');
      return;
    }
    
    if (!EmailManager.isValidEmail(email)) {
      await Modal.alert('Inserisci un indirizzo email valido', 'Email Non Valida', '⚠️');
      return;
    }
    
    // Raccogli opzioni selezionate
    const options = {
      includeSummary: document.getElementById('emailIncludeSummary').checked,
      includeKeypoints: document.getElementById('emailIncludeKeypoints').checked,
      includeTranslation: document.getElementById('emailIncludeTranslation').checked && currentEntry.translation,
      includeQA: document.getElementById('emailIncludeQA').checked && currentEntry.qa && currentEntry.qa.length > 0
    };
    
    // Verifica che almeno una opzione sia selezionata
    if (!options.includeSummary && !options.includeKeypoints && !options.includeTranslation && !options.includeQA) {
      await Modal.alert('Seleziona almeno una sezione da includere', 'Nessuna Selezione', '⚠️');
      return;
    }
    
    // Salva email se nuova
    await EmailManager.saveEmail(email);
    
    // Genera contenuto email con opzioni
    const { subject, body } = EmailManager.formatEmailContent(
      currentEntry.article,
      options.includeSummary ? currentEntry.summary : null,
      options.includeKeypoints ? currentEntry.keyPoints : null,
      options.includeTranslation && currentEntry.translation ? currentEntry.translation.text : null,
      options.includeQA ? currentEntry.qa : null
    );
    
    // Apri client email
    EmailManager.openEmailClient(email, subject, body);
    
    // Chiudi modal
    modal.classList.add('hidden');
    
    // Feedback
    await Modal.alert(
      'Il client email è stato aperto. Verifica e invia il messaggio.',
      'Email Preparata',
      '✅'
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

async function loadPDFHistory() {
  console.log('Caricamento cronologia PDF...');
  const history = await HistoryManager.getPDFHistory();
  console.log('Trovati', history.length, 'PDF analizzati');
  const container = document.getElementById('pdfHistoryList');
  
  if (history.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <p>Nessun PDF analizzato</p>
        <small>I tuoi PDF analizzati appariranno qui</small>
      </div>
    `;
    return;
  }
  
  container.innerHTML = history.map(entry => createPDFCard(entry)).join('');
  
  // Aggiungi event listeners
  document.querySelectorAll('.pdf-card').forEach(card => {
    const id = parseInt(card.dataset.id);
    
    card.addEventListener('click', (e) => {
      if (e.target.closest('.history-btn') || e.target.closest('.btn-favorite')) return;
      openPDF(id);
    });
    
    const deleteBtn = card.querySelector('.btn-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await deletePDF(id);
      });
    }
    
    const favoriteBtn = card.querySelector('.btn-favorite');
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const isFavorite = await HistoryManager.togglePDFFavorite(id);
        favoriteBtn.classList.toggle('active', isFavorite);
        favoriteBtn.textContent = isFavorite ? '⭐' : '☆';
        favoriteBtn.title = isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti';
      });
    }
  });
}

function createPDFCard(entry) {
  const date = HistoryManager.formatDate(entry.timestamp);
  const fileSize = HistoryManager.formatFileSize(entry.pdf.size);
  const isFavorite = entry.favorite || false;
  const hasTranslation = !!entry.translation;
  const hasQA = entry.qa && entry.qa.length > 0;
  const hasCitations = entry.citations && entry.citations.citations && entry.citations.citations.length > 0;
  const hasNotes = !!entry.notes;
  
  const badges = [];
  if (hasTranslation) badges.push('<span class="badge">🌍 Tradotto</span>');
  if (hasQA) badges.push(`<span class="badge">💬 ${entry.qa.length} Q&A</span>`);
  if (hasCitations) badges.push(`<span class="badge">📚 ${entry.citations.citations.length} Citazioni</span>`);
  if (hasNotes) badges.push('<span class="badge">📝 Note</span>');
  if (entry.metadata.fromCache) badges.push('<span class="badge cache-badge">⚡ Cache</span>');
  
  return `
    <div class="history-card pdf-card" data-id="${entry.id}">
      <div class="card-header">
        <div class="card-title-row">
          <h3 class="card-title">📄 ${entry.pdf.name}</h3>
          <button class="btn-favorite ${isFavorite ? 'active' : ''}" 
                  title="${isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}">
            ${isFavorite ? '⭐' : '☆'}
          </button>
        </div>
        <div class="card-meta">
          <span class="meta-item">📅 ${date}</span>
          <span class="meta-item">📊 ${fileSize}</span>
          <span class="meta-item">📄 ${entry.pdf.pages} pagine</span>
          <span class="meta-item">🤖 ${entry.metadata.provider}</span>
          <span class="meta-item">🌍 ${entry.metadata.language}</span>
        </div>
      </div>
      
      <div class="card-content">
        <div class="summary-preview">
          ${entry.summary.substring(0, 200)}${entry.summary.length > 200 ? '...' : ''}
        </div>
        
        ${badges.length > 0 ? `<div class="badges">${badges.join('')}</div>` : ''}
        
        <div class="keypoints-preview">
          <strong>🔑 Punti Chiave:</strong>
          <ul>
            ${entry.keyPoints.slice(0, 3).map(kp => `<li>${kp.title}</li>`).join('')}
            ${entry.keyPoints.length > 3 ? `<li><em>+${entry.keyPoints.length - 3} altri...</em></li>` : ''}
          </ul>
        </div>
      </div>
      
      <div class="card-actions">
        <button class="history-btn btn-delete" title="Elimina" style="flex: 1;">
          🗑️ Elimina
        </button>
      </div>
    </div>
  `;
}

async function openPDF(id) {
  const entry = await HistoryManager.getPDFById(id);
  if (!entry) {
    alert('PDF non trovato');
    return;
  }
  
  // Prepara dati per reading mode
  const readingData = {
    pdf: entry.pdf,
    summary: entry.summary,
    keyPoints: entry.keyPoints,
    translation: entry.translation,
    citations: entry.citations,
    qa: entry.qa,
    notes: entry.notes,
    metadata: entry.metadata,
    historyId: entry.id,
    source: 'pdf',
    // Aggiungi campi necessari per il reading mode
    isPDF: true,
    extractedText: entry.pdf.text,
    pageCount: entry.pdf.pages,
    filename: entry.pdf.name,
    apiProvider: entry.metadata.provider
  };
  
  // Salva in storage
  await chrome.storage.local.set({ pdfReadingMode: readingData });
  
  // Apri reading mode
  chrome.tabs.create({ url: 'reading-mode.html?source=pdf' });
}

async function deletePDF(id) {
  const confirmed = await Modal.confirm(
    'Sei sicuro di voler eliminare questo PDF dalla cronologia?\n\nQuesta azione non può essere annullata.',
    'Elimina PDF',
    '🗑️'
  );
  
  if (!confirmed) return;
  
  await HistoryManager.deletePDF(id);
  await loadPDFHistory();
}

async function loadMultiAnalysisHistory() {
  console.log('Caricamento cronologia multi-analisi...');
  const history = await HistoryManager.getMultiAnalysisHistory();
  console.log('Trovate', history.length, 'analisi Multi Articolo');
  const container = document.getElementById('multiAnalysisList');
  
  if (history.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <p>Nessuna analisi Multi Articolo</p>
        <small>Le tue analisi Multi Articolo appariranno qui</small>
      </div>
    `;
    return;
  }
  
  container.innerHTML = history.map(entry => createMultiAnalysisCard(entry)).join('');
  
  // Aggiungi event listeners
  document.querySelectorAll('.multi-analysis-card').forEach(card => {
    const id = parseInt(card.dataset.id);
    
    card.addEventListener('click', (e) => {
      // Non aprire se si clicca sulla stella o sul pulsante elimina
      if (e.target.closest('.multi-analysis-btn') || e.target.closest('.btn-favorite-multi')) return;
      
      openMultiAnalysis(id);
    });
    
    const deleteBtn = card.querySelector('.btn-delete-multi');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await deleteMultiAnalysis(id);
      });
    }
    
    const favoriteBtn = card.querySelector('.btn-favorite-multi');
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const isFavorite = await HistoryManager.toggleMultiAnalysisFavorite(id);
        
        // Aggiorna UI
        favoriteBtn.classList.toggle('active', isFavorite);
        favoriteBtn.textContent = isFavorite ? '⭐' : '☆';
        favoriteBtn.title = isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti';
      });
    }
  });
}

function createMultiAnalysisCard(entry) {
  const date = HistoryManager.formatDate(entry.timestamp);
  const qaCount = entry.analysis?.qa?.questions?.length || 0;
  const articlesCount = entry.articles?.length || 0;
  const provider = entry.metadata?.provider || 'unknown';
  
  return `
    <div class="multi-analysis-card" data-id="${entry.id}">
      <div class="multi-analysis-header">
        <div>
          <div class="multi-analysis-title">
            🔬 ${I18n.t('multi.analysisOf')} ${articlesCount} ${I18n.t('multi.articles')}
          </div>
          <div class="multi-analysis-meta">
            <span class="multi-analysis-badge articles">${articlesCount} ${I18n.t('multi.articles')}</span>
            <span class="multi-analysis-badge date">${date}</span>
            <span class="multi-analysis-badge provider">${provider}</span>
            ${qaCount > 0 ? `<span class="multi-analysis-badge qa">${qaCount} Q&A</span>` : ''}
          </div>
        </div>
        <button class="btn-favorite-multi ${entry.favorite ? 'active' : ''}" data-id="${entry.id}" title="${entry.favorite ? I18n.t('history.removeFavorite') : I18n.t('history.addFavorite')}">
          ${entry.favorite ? '⭐' : '☆'}
        </button>
      </div>
      
      <div class="multi-analysis-articles">
        <div class="multi-analysis-articles-title">${I18n.t('multi.articlesIncluded')}</div>
        ${entry.articles && entry.articles.length > 0 ? entry.articles.slice(0, 3).map(a => `
          <div class="multi-analysis-article-item">${a.title || 'Titolo non disponibile'}</div>
        `).join('') : '<div class="multi-analysis-article-item">Nessun articolo</div>'}
        ${entry.articles && entry.articles.length > 3 ? `<div class="multi-analysis-article-item">... e altri ${entry.articles.length - 3}</div>` : ''}
      </div>
      
      <div class="multi-analysis-actions">
        <button class="multi-analysis-btn danger btn-delete-multi">🗑️ Elimina</button>
      </div>
    </div>
  `;
}

async function openMultiAnalysis(id) {
  console.log('Apertura analisi Multi Articolo ID:', id);
  const entry = await HistoryManager.getMultiAnalysisById(id);
  console.log('Entry trovata:', entry);
  
  if (!entry) {
    await Modal.error('Analisi non trovata');
    return;
  }
  
  // Verifica che i dati siano validi
  if (!entry.analysis || !entry.articles) {
    await Modal.error('Questa analisi ha una struttura dati non valida. Prova a eliminarla e rifare l\'analisi.');
    return;
  }
  
  // Apri la pagina multi-analysis con i dati salvati
  chrome.storage.local.set({ 
    reopenMultiAnalysis: {
      id: entry.id,
      analysis: entry.analysis,
      articles: entry.articles
    }
  }, () => {
    console.log('Reindirizzamento a multi-analysis.html');
    window.location.href = 'multi-analysis.html';
  });
}

async function deleteMultiAnalysis(id) {
  const confirmed = await Modal.confirm(
    'Vuoi eliminare questa analisi Multi Articolo?',
    'Conferma Eliminazione',
    '⚠️'
  );
  
  if (confirmed) {
    await HistoryManager.deleteMultiAnalysis(id);
    await loadMultiAnalysisHistory();
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


// Open Reading Mode from History
async function openReadingModeFromHistory() {
  if (!currentEntry) return;
  
  // Prepare data for reading mode (include all available data)
  const readingData = {
    article: currentEntry.article,
    summary: currentEntry.summary,
    keyPoints: currentEntry.keyPoints,
    translation: currentEntry.translation || null,
    citations: currentEntry.citations || null,
    qa: currentEntry.qa || null,
    metadata: currentEntry.metadata || {}
  };
  
  console.log('📖 Opening reading mode with data:', readingData);
  
  // Save to chrome.storage.local (persists across tabs)
  await chrome.storage.local.set({ readingModeData: readingData });
  
  // Open reading mode in new tab
  window.open('reading-mode.html', '_blank');
}


// ===== BACKUP/EXPORT CRONOLOGIA =====

/**
 * Scarica l'intera cronologia in formato JSON
 */
async function downloadHistory() {
  try {
    // Mostra loading
    const btn = document.getElementById('downloadHistoryBtn');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Preparazione...';
    btn.disabled = true;
    
    // Ottieni tutta la cronologia
    const singleHistory = await HistoryManager.getHistory();
    const multiHistory = await HistoryManager.getMultiAnalysisHistory();
    
    // Ottieni anche le impostazioni e statistiche
    const settings = await StorageManager.getSettings();
    const statsResult = await chrome.storage.local.get(['stats']);
    const stats = statsResult.stats || {};
    
    // Crea oggetto backup completo
    const backup = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      exportTimestamp: Date.now(),
      data: {
        singleArticles: singleHistory,
        multiAnalysis: multiHistory,
        settings: settings,
        stats: stats
      },
      metadata: {
        totalSingleArticles: singleHistory.length,
        totalMultiAnalysis: multiHistory.length,
        totalSummaries: stats.totalSummaries || 0,
        totalWords: stats.totalWords || 0
      }
    };
    
    // Converti in JSON
    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Crea nome file con data
    const date = new Date().toISOString().split('T')[0];
    const filename = `ai-summarizer-backup-${date}.json`;
    
    // Scarica file
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Mostra successo
    btn.textContent = '✓ Scaricato!';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 2000);
    
    // Mostra statistiche
    await Modal.alert(
      `Backup completato con successo!\n\n` +
      `📄 Articoli singoli: ${singleHistory.length}\n` +
      `🔬 Analisi multiple: ${multiHistory.length}\n` +
      `📊 Totale riassunti: ${stats.totalSummaries || 0}\n` +
      `📝 Parole elaborate: ${(stats.totalWords || 0).toLocaleString()}\n\n` +
      `File salvato:\n${filename}`,
      'Backup Completato',
      '✅'
    );
    
  } catch (error) {
    console.error('Errore download cronologia:', error);
    
    const btn = document.getElementById('downloadHistoryBtn');
    btn.textContent = '❌ Errore';
    btn.disabled = false;
    
    setTimeout(() => {
      btn.textContent = '💾 Download Cronologia';
    }, 2000);
    
    await Modal.error(
      'Errore durante il download della cronologia: ' + error.message,
      'Errore Download'
    );
  }
}


/**
 * Importa cronologia da file JSON
 */
async function importHistory(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    // Leggi file
    const text = await file.text();
    const backup = JSON.parse(text);
    
    // Valida struttura
    if (!backup.version || !backup.data) {
      throw new Error('File di backup non valido');
    }
    
    // Chiedi conferma
    const confirmed = await Modal.confirm(
      `Vuoi importare questo backup?\n\n` +
      `📅 Data backup:\n${new Date(backup.exportDate).toLocaleString('it-IT')}\n\n` +
      `📄 Articoli singoli: ${backup.metadata.totalSingleArticles || 0}\n` +
      `🔬 Analisi multiple: ${backup.metadata.totalMultiAnalysis || 0}\n\n` +
      `⚠️ ATTENZIONE:\n` +
      `Questo AGGIUNGERÀ i dati al tuo storico\n` +
      `esistente (non li sostituirà).`,
      'Conferma Importazione',
      '📥'
    );
    
    if (!confirmed) {
      // Reset input
      event.target.value = '';
      return;
    }
    
    // Mostra loading
    const btn = document.getElementById('importHistoryBtn');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Importazione...';
    btn.disabled = true;
    
    // Importa articoli singoli
    let importedSingle = 0;
    if (backup.data.singleArticles && Array.isArray(backup.data.singleArticles)) {
      const currentHistory = await HistoryManager.getHistory();
      const currentIds = new Set(currentHistory.map(h => h.id));
      
      for (const article of backup.data.singleArticles) {
        // Evita duplicati basati su ID
        if (!currentIds.has(article.id)) {
          // Genera nuovo ID se necessario
          article.id = Date.now() + Math.random();
          await HistoryManager.saveSummary(
            article.article,
            article.summary,
            article.keyPoints,
            article.metadata,
            article.translation,
            article.qa,
            article.citations,
            article.notes
          );
          importedSingle++;
        }
      }
    }
    
    // Importa analisi multiple
    let importedMulti = 0;
    if (backup.data.multiAnalysis && Array.isArray(backup.data.multiAnalysis)) {
      const currentMulti = await HistoryManager.getMultiAnalysisHistory();
      const currentIds = new Set(currentMulti.map(h => h.id));
      
      for (const analysis of backup.data.multiAnalysis) {
        // Evita duplicati basati su ID
        if (!currentIds.has(analysis.id)) {
          // Genera nuovo ID se necessario
          analysis.id = Date.now() + Math.random();
          await HistoryManager.saveMultiAnalysis(analysis.analysis, analysis.articles);
          importedMulti++;
        }
      }
    }
    
    // Ricarica cronologia
    await loadHistory();
    await loadMultiAnalysisHistory();
    
    // Ripristina bottone
    btn.textContent = '✓ Importato!';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 2000);
    
    // Mostra successo
    await Modal.alert(
      `Importazione completata con successo!\n\n` +
      `📄 Articoli singoli importati: ${importedSingle}\n` +
      `🔬 Analisi multiple importate: ${importedMulti}\n\n` +
      `La cronologia è stata aggiornata.`,
      'Importazione Completata',
      '✅'
    );
    
  } catch (error) {
    console.error('Errore importazione cronologia:', error);
    
    const btn = document.getElementById('importHistoryBtn');
    btn.textContent = '❌ Errore';
    btn.disabled = false;
    
    setTimeout(() => {
      btn.textContent = '📥 Importa Cronologia';
    }, 2000);
    
    await Modal.error(
      `Errore durante l'importazione della cronologia:\n\n` +
      `${error.message}\n\n` +
      `Assicurati che il file sia un backup valido\n` +
      `generato da questa estensione.`,
      'Errore Importazione'
    );
  } finally {
    // Reset input
    event.target.value = '';
  }
}


// ============================================
// VOICE CONTROLS
// ============================================

/**
 * Setup voice event listeners
 */
function setupVoiceEventListeners() {
  // TTS events
  window.addEventListener('tts:started', () => {
    updateModalTTSButtons('playing');
  });
  
  window.addEventListener('tts:paused', () => {
    updateModalTTSButtons('paused');
  });
  
  window.addEventListener('tts:resumed', () => {
    updateModalTTSButtons('playing');
  });
  
  window.addEventListener('tts:stopped', () => {
    updateModalTTSButtons('stopped');
  });
  
  window.addEventListener('tts:ended', () => {
    updateModalTTSButtons('stopped');
  });
  
  window.addEventListener('tts:error', (event) => {
    console.error('TTS Error:', event.detail);
    updateModalTTSButtons('stopped');
    Modal.error('Errore nella lettura vocale: ' + event.detail.error);
  });
}

/**
 * Update TTS button states in modal
 */
function updateModalTTSButtons(state) {
  const playBtn = document.getElementById('modalTtsPlayBtn');
  const pauseBtn = document.getElementById('modalTtsPauseBtn');
  const stopBtn = document.getElementById('modalTtsStopBtn');
  
  if (!playBtn || !pauseBtn || !stopBtn) return;
  
  switch (state) {
    case 'playing':
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'inline-block';
      stopBtn.style.display = 'inline-block';
      pauseBtn.classList.add('active');
      break;
      
    case 'paused':
      playBtn.style.display = 'inline-block';
      pauseBtn.style.display = 'none';
      stopBtn.style.display = 'inline-block';
      playBtn.textContent = '▶️';
      playBtn.title = 'Riprendi';
      break;
      
    case 'stopped':
      playBtn.style.display = 'inline-block';
      pauseBtn.style.display = 'none';
      stopBtn.style.display = 'none';
      playBtn.textContent = '🔊';
      playBtn.title = 'Leggi ad alta voce';
      pauseBtn.classList.remove('active');
      break;
  }
}

/**
 * Handle TTS play/resume in modal
 */
function handleModalTTSPlay() {
  if (!voiceController || !currentEntry) return;
  
  const ttsState = voiceController.getTTSState();
  
  if (ttsState.isPaused) {
    // Resume
    voiceController.resumeSpeaking();
  } else {
    // Start new reading
    const textToRead = getCurrentModalTabText();
    if (!textToRead) {
      Modal.alert('Nessun testo da leggere', 'Lettura Vocale', 'ℹ️');
      return;
    }
    
    // Get language from metadata
    const lang = currentEntry.metadata?.language || 'it';
    const voiceLang = VoiceController.mapLanguageCode(lang);
    
    voiceController.speak(textToRead, voiceLang);
  }
}

/**
 * Handle TTS pause in modal
 */
function handleModalTTSPause() {
  if (!voiceController) return;
  voiceController.pauseSpeaking();
}

/**
 * Handle TTS stop in modal
 */
function handleModalTTSStop() {
  if (!voiceController) return;
  voiceController.stopSpeaking();
}

/**
 * Get text from current active modal tab
 */
function getCurrentModalTabText() {
  if (!currentEntry) return null;
  
  // Find active tab
  const activeTab = document.querySelector('.modal-tab.active');
  if (!activeTab) return null;
  
  const tabName = activeTab.dataset.tab;
  
  switch (tabName) {
    case 'summary':
      return currentEntry.summary || null;
      
    case 'keypoints':
      if (!currentEntry.keyPoints) return null;
      return currentEntry.keyPoints
        .map((point, index) => `${index + 1}. ${point.title}. ${point.description}`)
        .join('. ');
      
    case 'translation':
      if (!currentEntry.translation) return null;
      return currentEntry.translation.text || currentEntry.translation;
      
    case 'citations':
      if (!currentEntry.citations?.citations) return null;
      return currentEntry.citations.citations
        .map((citation, index) => {
          let text = `Citazione ${index + 1}. `;
          if (citation.author) text += `${citation.author}. `;
          if (citation.quote_text || citation.text) text += citation.quote_text || citation.text;
          return text;
        })
        .join('. ');
      
    case 'qa':
      if (!currentEntry.qa || currentEntry.qa.length === 0) return null;
      return currentEntry.qa
        .map(item => `Domanda: ${item.question}. Risposta: ${item.answer}`)
        .join('. ');
      
    case 'notes':
      return currentEntry.notes || null;
      
    default:
      return null;
  }
}
