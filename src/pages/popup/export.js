// Popup Export Module - Estratto da popup.js
// Gestisce: exportToPDF, showExportOptionsModal, exportToMarkdown, showMarkdownExportModal, openEmailModal

import { state, elements, showError } from './state.js';
import { translationState, citationsState } from './features.js';
import { I18n } from '../../utils/i18n/i18n.js';
import { PDFExporter } from '../../utils/export/pdf-exporter.js';
import { MarkdownExporter } from '../../utils/export/markdown-exporter.js';
import { EmailManager } from '../../utils/export/email-manager.js';
import { Modal } from '../../utils/core/modal.js';
import { Logger } from '../../utils/core/logger.js';

// Shared helpers to avoid triplicating checkbox logic across PDF/Markdown/Email modals

function configureExportCheckboxes(prefix) {
  const hasTrans = !!translationState.value;
  const hasQA = state.currentQA && state.currentQA.length > 0;
  const hasCitations =
    citationsState.value &&
    citationsState.value.citations &&
    citationsState.value.citations.length > 0;

  const pairs = [
    {
      option: `${prefix}TranslationOption`,
      checkbox: `${prefix}IncludeTranslation`,
      available: hasTrans,
    },
    { option: `${prefix}QAOption`, checkbox: `${prefix}IncludeQA`, available: hasQA },
    {
      option: `${prefix}CitationsOption`,
      checkbox: `${prefix}IncludeCitations`,
      available: hasCitations,
    },
  ];

  for (const { option, checkbox, available } of pairs) {
    const optEl = document.getElementById(option);
    const cbEl = document.getElementById(checkbox);
    if (!optEl || !cbEl) continue;
    optEl.classList.toggle('disabled', !available);
    cbEl.disabled = !available;
    cbEl.checked = available;
  }
}

function collectExportOptions(prefix) {
  return {
    includeSummary: document.getElementById(`${prefix}IncludeSummary`).checked,
    includeKeypoints: document.getElementById(`${prefix}IncludeKeypoints`).checked,
    includeTranslation:
      document.getElementById(`${prefix}IncludeTranslation`).checked && translationState.value,
    includeQA:
      document.getElementById(`${prefix}IncludeQA`).checked &&
      state.currentQA &&
      state.currentQA.length > 0,
    includeCitations:
      document.getElementById(`${prefix}IncludeCitations`).checked &&
      citationsState.value &&
      citationsState.value.citations &&
      citationsState.value.citations.length > 0,
  };
}

function hasAnyOptionSelected(options) {
  return (
    options.includeSummary ||
    options.includeKeypoints ||
    options.includeTranslation ||
    options.includeQA ||
    options.includeCitations
  );
}

// Export to PDF
export async function exportToPDF() {
  if (!state.currentArticle || !state.currentResults) {
    showError('Nessun riassunto da esportare');
    return;
  }

  // Mostra modal di selezione
  showExportOptionsModal();
}

export async function showExportOptionsModal() {
  const modal = document.getElementById('exportOptionsModal');
  configureExportCheckboxes('pdf');
  modal.classList.remove('hidden');

  // Handler per conferma
  const handleConfirm = async () => {
    const options = collectExportOptions('pdf');
    if (!hasAnyOptionSelected(options)) {
      await Modal.warning('Seleziona almeno una sezione da esportare', 'Nessuna Selezione');
      return;
    }

    modal.classList.add('hidden');

    try {
      const metadata = {
        provider: elements.providerSelect.value,
        language: state.selectedLanguage,
        contentType: state.selectedContentType !== 'auto' ? state.selectedContentType : 'auto',
      };

      await PDFExporter.exportToPDF(
        state.currentArticle,
        options.includeSummary ? state.currentResults.summary : null,
        options.includeKeypoints ? state.currentResults.keyPoints : null,
        metadata,
        options.includeTranslation ? translationState.value : null,
        options.includeQA ? state.currentQA : null,
        options.includeCitations ? citationsState.value : null,
      );

      // Visual feedback
      const originalText = elements.exportPdfBtn.textContent;
      elements.exportPdfBtn.textContent = I18n.t('feedback.exported');
      setTimeout(() => {
        elements.exportPdfBtn.textContent = originalText;
      }, 2000);
    } catch (error) {
      Logger.error('Errore esportazione PDF:', error);
      showError("Errore durante l'esportazione PDF: " + error.message);
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
export async function exportToMarkdown() {
  if (!state.currentArticle || !state.currentResults) {
    showError('Nessun riassunto da esportare');
    return;
  }

  // Mostra modal di selezione (riusa lo stesso del PDF)
  showMarkdownExportModal();
}

export async function showMarkdownExportModal() {
  const modal = document.getElementById('exportOptionsModal');
  const modalTitle = modal.querySelector('.custom-modal-title');

  // Cambia titolo per Markdown
  modalTitle.textContent = I18n.t('export.markdown');
  configureExportCheckboxes('pdf');
  modal.classList.remove('hidden');

  // Handler per conferma
  const handleConfirm = async () => {
    const options = collectExportOptions('pdf');
    if (!hasAnyOptionSelected(options)) {
      await Modal.warning('Seleziona almeno una sezione da esportare', 'Nessuna Selezione');
      return;
    }

    modal.classList.add('hidden');
    modalTitle.textContent = I18n.t('export.pdf'); // Ripristina titolo

    try {
      const metadata = {
        provider: elements.providerSelect.value,
        language: state.selectedLanguage,
        contentType: state.selectedContentType !== 'auto' ? state.selectedContentType : 'auto',
      };

      MarkdownExporter.exportToMarkdown(
        state.currentArticle,
        options.includeSummary ? state.currentResults.summary : null,
        options.includeKeypoints ? state.currentResults.keyPoints : null,
        metadata,
        options.includeTranslation ? translationState.value : null,
        options.includeQA ? state.currentQA : null,
        null, // notes
        options.includeCitations ? citationsState.value : null,
      );

      // Visual feedback
      const originalText = elements.exportMdBtn.textContent;
      elements.exportMdBtn.textContent = I18n.t('feedback.exported');
      setTimeout(() => {
        elements.exportMdBtn.textContent = originalText;
      }, 2000);
    } catch (error) {
      Logger.error('Errore esportazione Markdown:', error);
      showError("Errore durante l'esportazione Markdown: " + error.message);
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

// Email System
export async function openEmailModal() {
  if (!state.currentArticle || !state.currentResults) {
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

  configureExportCheckboxes('email');

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
    const options = collectExportOptions('email');
    if (!hasAnyOptionSelected(options)) {
      await Modal.warning('Seleziona almeno una sezione da includere', 'Nessuna Selezione');
      return;
    }

    // Salva email se nuova
    await EmailManager.saveEmail(email);

    // Genera contenuto email con opzioni
    const { subject, body } = EmailManager.formatEmailContent(
      state.currentArticle,
      options.includeSummary ? state.currentResults.summary : null,
      options.includeKeypoints ? state.currentResults.keyPoints : null,
      options.includeTranslation ? translationState.value : null,
      options.includeQA ? state.currentQA : null,
      options.includeCitations ? citationsState.value : null,
    );

    // Apri client email
    EmailManager.openEmailClient(email, subject, body);

    // Chiudi modal
    modal.classList.add('hidden');

    // Feedback
    await Modal.success(
      'Il client email è stato aperto. Verifica e invia il messaggio.',
      'Email Preparata',
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
