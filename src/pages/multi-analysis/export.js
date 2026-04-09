import { PDFExporter } from '../../utils/export/pdf-exporter.js';
import { MarkdownExporter } from '../../utils/export/markdown-exporter.js';
import { EmailManager } from '../../utils/export/email-manager.js';
import { Modal } from '../../utils/core/modal.js';
import { I18n } from '../../utils/i18n/i18n.js';
import { state } from './state.js';
import { Logger } from '../../utils/core/logger.js';

export async function exportPdf() {
  if (!state.currentAnalysis) return;

  try {
    const options = await showExportOptionsModal('PDF');
    if (!options) return;

    await PDFExporter.exportMultiAnalysisToPDF(
      state.currentAnalysis,
      state.selectedArticles.map((id) => state.allArticles.find((a) => a.id === id)),
      options,
    );
  } catch (error) {
    Logger.error('Errore PDF:', error);
    await Modal.alert("Errore durante l'esportazione PDF: " + error.message, 'Errore', '❌');
  }
}

export async function exportMarkdown() {
  if (!state.currentAnalysis) return;

  try {
    const options = await showExportOptionsModal('Markdown');
    if (!options) return;

    MarkdownExporter.exportMultiAnalysisToMarkdown(
      state.currentAnalysis,
      state.selectedArticles.map((id) => state.allArticles.find((a) => a.id === id)),
      options,
    );
  } catch (error) {
    Logger.error('Errore Markdown:', error);
    await Modal.alert("Errore durante l'esportazione Markdown: " + error.message, 'Errore', '❌');
  }
}

export async function sendEmail() {
  if (!state.currentAnalysis) return;

  try {
    const options = await showExportOptionsModal('Email');
    if (!options) return;

    let content = '# Analisi Multi Articolo\n\n';
    content += `**Data:** ${new Date(state.currentAnalysis.timestamp).toLocaleDateString('it-IT')}\n\n`;
    content += `**Articoli analizzati:** ${state.selectedArticles.length}\n\n`;
    content += '---\n\n';

    content += '## Articoli\n\n';
    state.selectedArticles.forEach((id, index) => {
      const article = state.allArticles.find((a) => a.id === id);
      if (article) {
        content += `${index + 1}. ${article.article.title}\n`;
      }
    });
    content += '\n---\n\n';

    if (options.includeSummary && state.currentAnalysis.summary) {
      content += '## Riassunto Globale\n\n';
      content += state.currentAnalysis.summary + '\n\n---\n\n';
    }

    if (options.includeComparison && state.currentAnalysis.comparison) {
      content += '## Confronto Idee\n\n';
      content += state.currentAnalysis.comparison + '\n\n---\n\n';
    }

    if (
      options.includeQA &&
      state.currentAnalysis.qa &&
      state.currentAnalysis.qa.questions &&
      state.currentAnalysis.qa.questions.length > 0
    ) {
      content += '## Domande e Risposte\n\n';
      state.currentAnalysis.qa.questions.forEach((qa, index) => {
        content += `**Q${index + 1}:** ${qa.question}\n\n`;
        content += `**R${index + 1}:** ${qa.answer}\n\n`;
      });
      content += '---\n\n';
    }

    await EmailManager.showEmailModal(content, 'Analisi Multi Articolo');
  } catch (error) {
    Logger.error('Errore email:', error);
    await Modal.alert("Errore durante l'invio email: " + error.message, 'Errore', '❌');
  }
}

export async function copyContent() {
  if (!state.currentAnalysis) return;

  let text = '';

  if (state.currentAnalysis.globalSummary) {
    text += 'RIASSUNTO GLOBALE:\n\n' + state.currentAnalysis.globalSummary + '\n\n';
  }

  if (state.currentAnalysis.comparison) {
    text += '='.repeat(50) + '\n\nCONFRONTO IDEE:\n\n' + state.currentAnalysis.comparison + '\n\n';
  }

  if (state.currentAnalysis.qa && state.currentAnalysis.qa.interactive) {
    const chatContainer = document.getElementById('qaChatContainer');
    if (chatContainer) {
      const messages = chatContainer.querySelectorAll(
        '.qa-message:not(.qa-loading):not(.qa-welcome)',
      );
      if (messages.length > 0) {
        text += '='.repeat(50) + '\n\nCONVERSAZIONE Q&A:\n\n';
        messages.forEach((msg) => {
          text += msg.textContent + '\n\n';
        });
      }
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById('copyBtn');
    const originalText = btn.textContent;
    btn.textContent = '✓ Copiato!';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  } catch {
    await Modal.alert(I18n.t('multi.copyError'), I18n.t('multi.errorTitle'), '❌');
  }
}

export function showExportOptionsModal(type) {
  return new Promise((resolve) => {
    const modal = document.getElementById('exportOptionsModal');
    const title = document.getElementById('exportModalTitle');
    const summaryOption = document.getElementById('exportSummaryOption');
    const comparisonOption = document.getElementById('exportComparisonOption');
    const qaOption = document.getElementById('exportQAOption');
    const cancelBtn = document.getElementById('exportCancelBtn');
    const confirmBtn = document.getElementById('exportConfirmBtn');

    title.textContent = `Esporta ${type}`;

    summaryOption.style.display = state.currentAnalysis.summary ? 'flex' : 'none';
    comparisonOption.style.display = state.currentAnalysis.comparison ? 'flex' : 'none';
    qaOption.style.display = state.currentAnalysis.qa ? 'flex' : 'none';

    modal.classList.remove('hidden');

    const handleConfirm = () => {
      const options = {
        includeSummary: document.getElementById('exportIncludeSummary').checked,
        includeComparison: document.getElementById('exportIncludeComparison').checked,
        includeQA: document.getElementById('exportIncludeQA').checked,
      };
      cleanup();
      resolve(options);
    };

    const handleCancel = () => {
      cleanup();
      resolve(null);
    };

    const cleanup = () => {
      modal.classList.add('hidden');
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
  });
}
