// history-io.js — Email, import/export, reading mode

import { Logger } from '../../utils/core/logger.js';
import { state } from './state.js';
import { StorageManager } from '../../utils/storage/storage-manager.js';
import { HistoryManager } from '../../utils/storage/history-manager.js';
import { EmailManager } from '../../utils/export/email-manager.js';
import { Modal } from '../../utils/core/modal.js';

// Email System
export async function sendCurrentEmail() {
  if (!state.currentEntry) return;

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
    savedEmails.forEach((email) => {
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
        document.querySelectorAll('.saved-email-item').forEach((i) => {
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
          '🗑️',
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
  if (state.currentEntry.translation) {
    translationOption.classList.remove('disabled');
    translationCheckbox.disabled = false;
    translationCheckbox.checked = true;
  } else {
    translationOption.classList.add('disabled');
    translationCheckbox.disabled = true;
    translationCheckbox.checked = false;
  }

  // Gestisci disponibilità Q&A
  if (state.currentEntry.qa && state.currentEntry.qa.length > 0) {
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
      includeTranslation:
        document.getElementById('emailIncludeTranslation').checked &&
        state.currentEntry.translation,
      includeQA:
        document.getElementById('emailIncludeQA').checked &&
        state.currentEntry.qa &&
        state.currentEntry.qa.length > 0,
    };

    // Verifica che almeno una opzione sia selezionata
    if (
      !options.includeSummary &&
      !options.includeKeypoints &&
      !options.includeTranslation &&
      !options.includeQA
    ) {
      await Modal.alert('Seleziona almeno una sezione da includere', 'Nessuna Selezione', '⚠️');
      return;
    }

    // Salva email se nuova
    await EmailManager.saveEmail(email);

    // Genera contenuto email con opzioni
    const { subject, body } = EmailManager.formatEmailContent(
      state.currentEntry.article,
      options.includeSummary ? state.currentEntry.summary : null,
      options.includeKeypoints ? state.currentEntry.keyPoints : null,
      options.includeTranslation && state.currentEntry.translation
        ? state.currentEntry.translation.text
        : null,
      options.includeQA ? state.currentEntry.qa : null,
    );

    // Apri client email
    EmailManager.openEmailClient(email, subject, body);

    // Chiudi modal
    modal.classList.add('hidden');

    // Feedback
    await Modal.alert(
      'Il client email è stato aperto. Verifica e invia il messaggio.',
      'Email Preparata',
      '✅',
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

// Open Reading Mode from History
export async function openReadingModeFromHistory() {
  if (!state.currentEntry) return;

  // Prepare data for reading mode (include all available data)
  const readingData = {
    article: state.currentEntry.article,
    summary: state.currentEntry.summary,
    keyPoints: state.currentEntry.keyPoints,
    translation: state.currentEntry.translation || null,
    citations: state.currentEntry.citations || null,
    qa: state.currentEntry.qa || null,
    metadata: state.currentEntry.metadata || {},
  };

  Logger.debug('Opening reading mode with data:', readingData);

  // Save to chrome.storage.local (persists across tabs)
  await chrome.storage.local.set({ readingModeData: readingData });

  // Open reading mode in new tab
  window.open(chrome.runtime.getURL('src/pages/reading-mode/reading-mode.html'), '_blank');
}

// ===== BACKUP/EXPORT CRONOLOGIA =====

/**
 * Scarica l'intera cronologia in formato JSON
 */
export async function downloadHistory() {
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
        stats: stats,
      },
      metadata: {
        totalSingleArticles: singleHistory.length,
        totalMultiAnalysis: multiHistory.length,
        totalSummaries: stats.totalSummaries || 0,
        totalWords: stats.totalWords || 0,
      },
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
      '✅',
    );
  } catch (error) {
    Logger.error('Errore download cronologia:', error);

    const btn = document.getElementById('downloadHistoryBtn');
    btn.textContent = '❌ Errore';
    btn.disabled = false;

    setTimeout(() => {
      btn.textContent = '💾 Download Cronologia';
    }, 2000);

    await Modal.error(
      'Errore durante il download della cronologia: ' + error.message,
      'Errore Download',
    );
  }
}

/**
 * Importa cronologia da file JSON
 */
export async function importHistory(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    // Leggi file con limite di dimensione (10 MB)
    const MAX_IMPORT_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_IMPORT_SIZE) {
      throw new Error('File troppo grande (max 10 MB)');
    }
    const text = await file.text();
    const backup = JSON.parse(text);

    // Valida struttura del backup
    if (
      !backup.version ||
      typeof backup.version !== 'string' ||
      !backup.data ||
      typeof backup.data !== 'object' ||
      Array.isArray(backup.data)
    ) {
      throw new Error('File di backup non valido');
    }

    // Valida che contenga almeno una delle chiavi attese
    const hasArticles = backup.data.singleArticles && Array.isArray(backup.data.singleArticles);
    const hasMulti = backup.data.multiAnalysis && Array.isArray(backup.data.multiAnalysis);
    if (!hasArticles && !hasMulti) {
      throw new Error('Il backup non contiene dati importabili');
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
      '📥',
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

    // Whitelist di valori validi per i metadati
    const VALID_PROVIDERS = ['groq', 'openai', 'anthropic', 'gemini'];
    const VALID_CONTENT_TYPES = ['general', 'scientific', 'news', 'technical', 'opinion'];

    const sanitizeMetadata = (metadata) => {
      if (!metadata || typeof metadata !== 'object') return { provider: 'groq', language: 'it' };
      return {
        ...metadata,
        provider: VALID_PROVIDERS.includes(metadata.provider) ? metadata.provider : 'groq',
        contentType: VALID_CONTENT_TYPES.includes(metadata.contentType)
          ? metadata.contentType
          : undefined,
        language:
          typeof metadata.language === 'string' && /^[a-z]{2}(-[A-Z]{2})?$/.test(metadata.language)
            ? metadata.language
            : 'it',
      };
    };

    // Sanitize text fields to prevent stored XSS via malicious backup
    const sanitizeTextField = (val, maxLen = 50000) => {
      if (typeof val !== 'string') return typeof val === 'undefined' ? undefined : '';
      return val.substring(0, maxLen);
    };

    const sanitizeArticleEntry = (entry) => {
      if (entry.article && typeof entry.article === 'object') {
        entry.article.title = sanitizeTextField(entry.article.title, 500);
        entry.article.content = sanitizeTextField(entry.article.content, 100000);
        entry.article.excerpt = sanitizeTextField(entry.article.excerpt, 1000);
      }
      entry.summary = sanitizeTextField(entry.summary, 50000);
      if (entry.translation && typeof entry.translation === 'object') {
        entry.translation.text = sanitizeTextField(entry.translation.text, 100000);
      } else if (typeof entry.translation === 'string') {
        entry.translation = sanitizeTextField(entry.translation, 100000);
      }
      entry.notes = sanitizeTextField(entry.notes, 10000);
    };

    const sanitizeMultiAnalysisEntry = (entry) => {
      if (entry.analysis && typeof entry.analysis === 'object') {
        entry.analysis.globalSummary = sanitizeTextField(entry.analysis.globalSummary, 100000);
        entry.analysis.comparison = sanitizeTextField(entry.analysis.comparison, 100000);
      }
    };

    // Importa articoli singoli
    let importedSingle = 0;
    if (backup.data.singleArticles && Array.isArray(backup.data.singleArticles)) {
      const currentHistory = await HistoryManager.getHistory();
      const currentIds = new Set(currentHistory.map((h) => h.id));

      for (const article of backup.data.singleArticles) {
        // Evita duplicati basati su ID
        if (!currentIds.has(article.id)) {
          article.id = crypto.randomUUID();
          article.metadata = sanitizeMetadata(article.metadata);
          sanitizeArticleEntry(article);
          await HistoryManager.saveSummary(
            article.article,
            article.summary,
            article.keyPoints,
            article.metadata,
            article.translation,
            article.qa,
            article.citations,
            article.notes,
          );
          importedSingle++;
        }
      }
    }

    // Importa analisi multiple
    let importedMulti = 0;
    if (backup.data.multiAnalysis && Array.isArray(backup.data.multiAnalysis)) {
      const currentMulti = await HistoryManager.getMultiAnalysisHistory();
      const currentIds = new Set(currentMulti.map((h) => h.id));

      for (const analysis of backup.data.multiAnalysis) {
        // Evita duplicati basati su ID
        if (!currentIds.has(analysis.id)) {
          analysis.id = crypto.randomUUID();
          sanitizeMultiAnalysisEntry(analysis);
          await HistoryManager.saveMultiAnalysis(analysis.analysis, analysis.articles);
          importedMulti++;
        }
      }
    }

    // Ricarica cronologia
    await state.loadHistory();
    await state.loadMultiAnalysisHistory();

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
      '✅',
    );
  } catch (error) {
    Logger.error('Errore importazione cronologia:', error);

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
      'Errore Importazione',
    );
  } finally {
    // Reset input
    event.target.value = '';
  }
}
