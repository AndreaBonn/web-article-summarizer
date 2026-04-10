// Reading Mode - Export Module
// Gestisce copia negli appunti ed esportazione PDF

import { state, elements } from './state.js';
import { PDFExporter } from '../../utils/export/pdf-exporter.js';
import { Logger } from '../../utils/core/logger.js';
import {
  formatCitationsText,
  formatQAText,
  formatTranslationText,
  formatKeyPointsText,
} from '../../shared/export-formatters.js';

// Copy all content
export async function copyAll() {
  if (!state.currentData) return;

  const { article, pdf, summary, keyPoints } = state.currentData;

  // Gestisci sia articoli che PDF
  if (state.currentData.isPDF || pdf) {
    let text = `PDF: ${pdf?.name || state.currentData.filename || 'Documento'}\n`;
    text += `Pagine: ${pdf?.pages || state.currentData.pageCount || 'N/A'}\n\n`;
    text += `${'='.repeat(60)}\n\n`;
    text += `RIASSUNTO:\n${summary}\n\n`;

    text += formatKeyPointsText(keyPoints);
    text += formatTranslationText(state.currentData.translation);
    text += formatQAText(state.currentData.qa);
    text += formatCitationsText(state.currentData.citations?.citations);

    // Aggiungi note se presenti
    if (state.currentData.notes) {
      text += `${'='.repeat(60)}\n\n`;
      text += `NOTE PERSONALI:\n${state.currentData.notes}\n\n`;
    }

    try {
      await navigator.clipboard.writeText(text);

      const originalText = elements.copyBtn.textContent;
      elements.copyBtn.textContent = '✓ Copiato!';
      setTimeout(() => {
        elements.copyBtn.textContent = originalText;
      }, 2000);
    } catch (error) {
      Logger.error('Copy error:', error);
      alert('Errore durante la copia');
    }
    return;
  }

  // Gestione articoli normali
  let text = `ARTICOLO: ${article.title}\n`;
  text += `URL: ${article.url}\n\n`;
  text += `${'='.repeat(60)}\n\n`;
  text += `RIASSUNTO:\n${summary}\n\n`;

  text += formatKeyPointsText(keyPoints, true);
  text += formatTranslationText(state.currentData.translation);
  text += formatQAText(state.currentData.qa);
  text += formatCitationsText(state.currentData.citations?.citations);

  // Aggiungi note se presenti
  if (state.currentData.notes) {
    text += `${'='.repeat(60)}\n\n`;
    text += `NOTE PERSONALI:\n${state.currentData.notes}\n\n`;
  }

  try {
    await navigator.clipboard.writeText(text);

    const originalText = elements.copyBtn.textContent;
    elements.copyBtn.textContent = '✓ Copiato!';
    setTimeout(() => {
      elements.copyBtn.textContent = originalText;
    }, 2000);
  } catch (error) {
    Logger.error('Copy error:', error);
    alert('Errore durante la copia');
  }
}

// Export to PDF
export async function exportToPDF() {
  if (!state.currentData) {
    alert('Nessun dato da esportare');
    return;
  }

  try {
    // Mostra loading
    const originalText = elements.exportBtn.textContent;
    elements.exportBtn.textContent = '⏳ Esportazione...';
    elements.exportBtn.disabled = true;

    const { article, pdf, summary, keyPoints, metadata } = state.currentData;

    // Gestisci sia articoli che PDF
    const articleData =
      state.currentData.isPDF || pdf
        ? {
            title: pdf?.name || state.currentData.filename || 'Documento PDF',
            url: 'PDF Document',
            content: state.currentData.extractedText || pdf?.text || '',
            wordCount: 0,
            readingTimeMinutes: 0,
          }
        : article;

    const metadataData = metadata ||
      state.currentData.metadata || {
        provider: state.currentData.apiProvider || 'AI',
        language: 'it',
        contentType: 'pdf',
      };

    await PDFExporter.exportToPDF(
      articleData,
      summary,
      keyPoints,
      metadataData,
      state.currentData.translation,
      state.currentData.qa,
      state.currentData.citations,
    );

    // Successo
    elements.exportBtn.textContent = '✓ Esportato!';
    setTimeout(() => {
      elements.exportBtn.textContent = originalText;
      elements.exportBtn.disabled = false;
    }, 2000);
  } catch (error) {
    Logger.error('Export error:', error);
    alert("Errore durante l'esportazione PDF: " + error.message);
    elements.exportBtn.textContent = 'PDF';
    elements.exportBtn.disabled = false;
  }
}
