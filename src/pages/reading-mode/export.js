// Reading Mode - Export Module
// Gestisce copia negli appunti ed esportazione PDF

import { state, elements } from './state.js';
import { HtmlSanitizer } from '../../utils/security/html-sanitizer.js';
import { PDFExporter } from '../../utils/export/pdf-exporter.js';
import { Logger } from '../../utils/core/logger.js';

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

    if (keyPoints && keyPoints.length > 0) {
      text += `PUNTI CHIAVE:\n`;
      keyPoints.forEach((point, index) => {
        text += `${index + 1}. ${point.title}\n`;
        text += `   ${point.description}\n\n`;
      });
    }

    // Aggiungi traduzione se presente
    if (state.currentData.translation) {
      text += `${'='.repeat(60)}\n\n`;
      text += `TRADUZIONE:\n${state.currentData.translation.text || state.currentData.translation}\n\n`;
    }

    // Aggiungi Q&A se presenti
    if (state.currentData.qa && state.currentData.qa.length > 0) {
      text += `${'='.repeat(60)}\n\n`;
      text += `DOMANDE E RISPOSTE:\n\n`;
      state.currentData.qa.forEach((qa, index) => {
        text += `Q${index + 1}: ${qa.question}\n`;
        text += `R${index + 1}: ${qa.answer}\n\n`;
      });
    }

    // Aggiungi citazioni se presenti
    if (
      state.currentData.citations &&
      state.currentData.citations.citations &&
      state.currentData.citations.citations.length > 0
    ) {
      text += `${'='.repeat(60)}\n\n`;
      text += `CITAZIONI (${state.currentData.citations.citations.length}):\n\n`;
      state.currentData.citations.citations.forEach((citation, index) => {
        text += `[${index + 1}] `;
        if (citation.author) text += `${citation.author} `;
        if (citation.year) text += `(${citation.year}) `;
        if (citation.source) text += `- ${citation.source}`;
        text += `\n`;
        if (citation.quote_text) text += `   "${citation.quote_text}"\n`;
        text += `\n`;
      });
    }

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

  if (keyPoints && keyPoints.length > 0) {
    text += `PUNTI CHIAVE:\n`;
    keyPoints.forEach((point, index) => {
      text += `${index + 1}. ${point.title} (§${point.paragraphs})\n`;
      text += `   ${point.description}\n\n`;
    });
  }

  // Aggiungi traduzione se presente
  if (state.currentData.translation) {
    text += `${'='.repeat(60)}\n\n`;
    text += `TRADUZIONE:\n${state.currentData.translation.text || state.currentData.translation}\n\n`;
  }

  // Aggiungi Q&A se presenti
  if (state.currentData.qa && state.currentData.qa.length > 0) {
    text += `${'='.repeat(60)}\n\n`;
    text += `DOMANDE E RISPOSTE:\n\n`;
    state.currentData.qa.forEach((qa, index) => {
      text += `Q${index + 1}: ${qa.question}\n`;
      text += `R${index + 1}: ${qa.answer}\n\n`;
    });
  }

  // Aggiungi citazioni se presenti
  if (
    state.currentData.citations &&
    state.currentData.citations.citations &&
    state.currentData.citations.citations.length > 0
  ) {
    text += `${'='.repeat(60)}\n\n`;
    text += `CITAZIONI (${state.currentData.citations.citations.length}):\n\n`;
    state.currentData.citations.citations.forEach((citation, index) => {
      text += `[${index + 1}] `;
      if (citation.author) text += `${citation.author} `;
      if (citation.year) text += `(${citation.year}) `;
      if (citation.source) text += `- ${citation.source}`;
      text += `\n`;
      if (citation.quote_text) text += `   "${citation.quote_text}"\n`;
      text += `\n`;
    });
  }

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
    elements.exportBtn.textContent = '📄 PDF';
    elements.exportBtn.disabled = false;
  }
}
