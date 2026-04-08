// history-detail.js — Modal dettaglio e funzioni di export
// Dipende da: currentEntry, voiceController (globals in history.js)

async function openDetail(id) {
  currentEntry = await HistoryManager.getSummaryById(id);

  if (!currentEntry) {
    await Modal.error(I18n.t('history.summaryNotFound'));
    return;
  }

  // Populate modal
  document.getElementById('detailModalTitle').textContent = currentEntry.article.title;
  document.getElementById('modalDate').textContent = new Date(currentEntry.timestamp).toLocaleString('it-IT');
  document.getElementById('modalProvider').textContent = `Provider: ${currentEntry.metadata.provider}`;
  document.getElementById('modalLanguage').textContent = `${I18n.t('controls.language')} ${currentEntry.metadata.language}`;
  document.getElementById('modalStats').textContent = `${currentEntry.article.wordCount} ${I18n.t('article.words')} • ${currentEntry.article.readingTimeMinutes} ${I18n.t('article.readingTime')}`;

  // Summary
  document.getElementById('modalSummary').innerHTML = `<p>${HtmlSanitizer.escape(currentEntry.summary)}</p>`;

  // Key points
  const keypointsHtml = currentEntry.keyPoints.map((point, index) => `
    <div class="keypoint-modal">
      <div class="keypoint-modal-title">${index + 1}. ${HtmlSanitizer.escape(point.title)}</div>
      <div class="keypoint-modal-ref">§${HtmlSanitizer.escape(String(point.paragraphs))}</div>
      <div class="keypoint-modal-desc">${HtmlSanitizer.escape(point.description)}</div>
    </div>
  `).join('');
  document.getElementById('modalKeypoints').innerHTML = keypointsHtml;

  // Translation (if available)
  if (currentEntry.translation) {
    document.getElementById('modalTranslation').innerHTML = `
      <div class="translation-info-modal">
        📝 Tradotto da ${HtmlSanitizer.escape(currentEntry.translation.originalLanguage)} a ${HtmlSanitizer.escape(currentEntry.translation.targetLanguage)}
      </div>
      <div class="translation-text">${HtmlSanitizer.escape(currentEntry.translation.text)}</div>
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
            <strong>Q${index + 1}:</strong> ${HtmlSanitizer.escape(qa.question)}
          </div>
          <div class="qa-answer">
            <strong>R${index + 1}:</strong> ${HtmlSanitizer.escape(qa.answer)}
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
            <span style="font-size: 11px; font-weight: 600; color: #667eea; background: rgba(102, 126, 234, 0.1); padding: 2px 6px; border-radius: 4px;">#${HtmlSanitizer.escape(String(citation.id))}</span>
            ${citation.author ? `<span style="font-size: 12px; font-weight: 600;">${HtmlSanitizer.escape(citation.author)}</span>` : ''}
          </div>
          ${citation.text ? `<div style="font-size: 11px; font-style: italic; margin-bottom: 8px; background: rgba(102, 126, 234, 0.05); padding: 8px; border-radius: 4px;">"${HtmlSanitizer.escape(citation.text)}"</div>` : ''}
          <div style="font-size: 11px; color: #636e72; line-height: 1.5;">${HtmlSanitizer.escape(citation.context)}</div>
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
      <textarea id="notesTextarea" class="notes-textarea" placeholder="Aggiungi note personali su questo articolo...">${HtmlSanitizer.escape(currentEntry.notes || '')}</textarea>
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
