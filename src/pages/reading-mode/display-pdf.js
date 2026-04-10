// Reading Mode - PDF Display Module
// Gestisce la visualizzazione dei contenuti PDF (testo estratto, citazioni)

import { state, elements } from './state.js';
import { HtmlSanitizer } from '../../utils/security/html-sanitizer.js';
import { Logger } from '../../utils/core/logger.js';
import { displaySummaryInTab, displayKeypointsInTab } from './display.js';

// Display PDF content
export function displayPDFContent() {
  Logger.info('📄 Rendering PDF content:', state.currentData);

  // Update header
  document.querySelector('.reading-header h1').textContent = '📄 Analisi PDF';

  // Update metadata - gestisci diverse strutture dati
  const pageCount = state.currentData.pageCount || state.currentData.pdf?.pages || 0;
  const filename = state.currentData.filename || state.currentData.pdf?.name || 'PDF';
  const provider = state.currentData.apiProvider || state.currentData.metadata?.provider || 'AI';
  const language = state.currentData.metadata?.language || 'it';

  elements.articleWordCount.textContent = `${pageCount} pagine`;
  elements.articleReadTime.textContent = filename;
  elements.summaryProvider.textContent = provider;
  elements.summaryLanguage.textContent = language === 'it' ? 'Italiano' : language.toUpperCase();

  // Left panel: Always show extracted text
  const articlePanel = document.querySelector('.article-panel .panel-header h2');
  articlePanel.textContent = '📄 Testo Estratto';

  // Hide view toggle buttons for PDF
  const viewToggle = document.querySelector('.view-toggle');
  if (viewToggle) viewToggle.style.display = 'none';

  // Show extracted text - gestisci diverse strutture dati
  const extractedText = state.currentData.extractedText || state.currentData.pdf?.text || '';
  displayExtractedText(extractedText);

  // Right panel: Show analysis
  displaySummaryInTab(state.currentData.summary);
  displayKeypointsInTab(state.currentData.keyPoints);

  // Show quotes if available
  if (state.currentData.quotes && state.currentData.quotes.length > 0) {
    displayQuotesInTab(state.currentData.quotes);
  }
}

// Display extracted text
function displayExtractedText(text) {
  const articleText = elements.articleText;
  const articleIframe = elements.articleIframe;

  // Hide iframe, show text container
  articleIframe.style.display = 'none';
  articleText.classList.remove('hidden');

  // Gestisci testo mancante o undefined
  if (!text || typeof text !== 'string') {
    articleText.innerHTML = `
      <div class="extracted-text-container">
        <div class="text-metadata">
          <p><strong>⚠️ Testo non disponibile</strong></p>
          <p class="text-meta-secondary">
            Il testo estratto non è disponibile per questo PDF.
          </p>
        </div>
      </div>
    `;
    return;
  }

  // Format text with page markers
  const formattedText = text
    .split(/--- Pagina (\d+) ---/)
    .filter((part) => part.trim())
    .map((part, index) => {
      if (index % 2 === 0) {
        // Page number
        return `<div class="page-marker">📄 Pagina ${part}</div>`;
      } else {
        // Page content
        return `<div class="page-content">${HtmlSanitizer.escape(part).replace(/\n/g, '<br>')}</div>`;
      }
    })
    .join('');

  articleText.innerHTML = `
    <div class="extracted-text-container">
      <div class="text-metadata">
        <p><strong>Testo estratto dal PDF</strong></p>
        <p class="text-meta-secondary">
          Questo è il testo estratto automaticamente dal documento PDF.
        </p>
      </div>
      <hr class="content-divider">
      ${formattedText}
    </div>
  `;
}

// Display quotes in tab
function displayQuotesInTab(quotes) {
  if (!quotes || quotes.length === 0) return;

  let html = '<div class="quotes-content"><h3>💬 Citazioni Importanti</h3>';

  quotes.forEach((quote, index) => {
    html += `
      <div class="quote-item">
        <div class="quote-number">${index + 1}</div>
        <div class="quote-text">"${HtmlSanitizer.escape(quote)}"</div>
      </div>
    `;
  });

  html += '</div>';

  // Add to citations tab
  const citationsTab = document.getElementById('citationsTabContent');
  if (citationsTab) {
    citationsTab.innerHTML = html;
  }
}
