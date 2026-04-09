// Reading Mode - Display Module
// Gestisce la visualizzazione dei contenuti (articoli, PDF, tab, highlight)

import { state, elements } from './state.js';
import { HtmlSanitizer } from '../../utils/security/html-sanitizer.js';
import { Logger } from '../../utils/core/logger.js';

// Display content
export function displayContent() {
  if (!state.currentData) return;

  // Check if PDF
  if (state.currentData.isPDF) {
    displayPDFContent();
    return;
  }

  const { article, summary, keyPoints, metadata } = state.currentData;

  // Safety check for article
  if (!article) {
    Logger.error('Article data is missing');
    showError('Dati articolo mancanti');
    return;
  }

  // Article metadata
  elements.articleWordCount.textContent = `${article.wordCount || 0} parole`;
  elements.articleReadTime.textContent = `${article.readingTimeMinutes || 0} min`;

  // Summary metadata
  elements.summaryProvider.textContent = metadata?.provider || 'AI';
  elements.summaryLanguage.textContent = getLanguageName(metadata?.language || 'it');

  // Article content
  displayArticle(article);

  // Summary content in tabs
  displaySummaryInTab(summary);
  displayKeypointsInTab(keyPoints);

  // Check if translation exists
  if (state.currentData.translation) {
    elements.translationTabContent.innerHTML = `
      <div class="translation-content">
        <h3>${HtmlSanitizer.escape(article.title)}</h3>
        <div class="translation-text">${HtmlSanitizer.escape(state.currentData.translation)}</div>
      </div>
    `;
  }

  // Check if citations exist
  if (state.currentData.citations) {
    Logger.debug('📚 Struttura citazioni:', state.currentData.citations);

    // Handle both structures: direct array or nested object
    const citationsList = state.currentData.citations.citations || state.currentData.citations;

    if (citationsList && citationsList.length > 0) {
      Logger.debug('📚 Lista citazioni:', citationsList);
      Logger.debug('📚 Prima citazione:', citationsList[0]);

      const totalCitations =
        state.currentData.citations.total_citations ||
        state.currentData.citations.totalCount ||
        citationsList.length;
      let html = `<div class="citations-content"><h3>📚 ${totalCitations} Citazioni Trovate</h3>`;

      citationsList.forEach((citation, index) => {
        // Use correct field names from citation structure - handle null/undefined
        const text = citation.quote_text || citation.text || citation.quote || null;
        const author = citation.author || null;
        const source = citation.source || null;
        const paragraph = citation.paragraph || null;
        const context = citation.context || null;
        const year = citation.year || null;

        // Skip if no meaningful content
        if (!text && !author && !source) {
          Logger.warn('Citazione vuota saltata:', citation);
          return;
        }

        // Type icon
        const typeIcon =
          {
            direct_quote: '💬',
            indirect_quote: '💭',
            study_reference: '🔬',
            statistic: '📊',
            expert_opinion: '👤',
            book_reference: '📖',
            article_reference: '📄',
            report_reference: '📋',
            organization_data: '🏢',
            web_source: '🌐',
          }[citation.type] || '📌';

        // Type label
        const typeLabels = {
          direct_quote: 'Citazione Diretta',
          indirect_quote: 'Citazione Indiretta',
          study_reference: 'Riferimento Studio',
          statistic: 'Statistica',
          expert_opinion: 'Opinione Esperto',
          book_reference: 'Riferimento Libro',
          article_reference: 'Riferimento Articolo',
          report_reference: 'Riferimento Report',
          organization_data: 'Dati Organizzazione',
          web_source: 'Fonte Web',
        };
        const typeLabel = typeLabels[citation.type] || 'Citazione';

        html += `
          <div class="citation-item">
            <div class="citation-header">
              <span class="citation-icon">${typeIcon}</span>
              <div class="citation-number">#${citation.id || index + 1}</div>
              ${author ? `<span class="citation-author-badge">${HtmlSanitizer.escape(author)}</span>` : ''}
              ${paragraph ? `<div class="citation-ref">§${HtmlSanitizer.escape(String(paragraph))}</div>` : ''}
            </div>
            ${text ? `<div class="citation-text">"${HtmlSanitizer.escape(text.substring(0, 300))}${text.length > 300 ? '...' : ''}"</div>` : '<div class="citation-text citation-no-text">Riferimento senza testo citato</div>'}
            ${context ? `<div class="citation-context">📝 ${HtmlSanitizer.escape(context)}</div>` : ''}
            <div class="citation-meta">
              <span class="citation-type">${typeLabel}</span>
              ${source ? `<span class="citation-source">📚 ${HtmlSanitizer.escape(source)}</span>` : ''}
              ${year ? `<span class="citation-year">📅 ${HtmlSanitizer.escape(String(year))}</span>` : ''}
            </div>
          </div>
        `;
      });

      html += '</div>';
      elements.citationsTabContent.innerHTML = html;
    }
  }

  // Check if Q&A exists
  if (state.currentData.qa && state.currentData.qa.length > 0) {
    state.currentData.qa.forEach((item) => {
      const qaItem = document.createElement('div');
      qaItem.className = 'qa-item';
      qaItem.innerHTML = `
        <div class="qa-question">Q: ${HtmlSanitizer.escape(item.question)}</div>
        <div class="qa-answer">A: ${HtmlSanitizer.escape(item.answer)}</div>
      `;
      elements.qaHistory.appendChild(qaItem);
    });
  }
}

// Display article
function displayArticle(article) {
  // Prepare text view (always available as fallback)
  let html = `
    <div class="article-content">
      <h1>${HtmlSanitizer.escape(article.title || 'Articolo')}</h1>
      ${article.excerpt ? `<p class="article-excerpt"><em>${HtmlSanitizer.escape(article.excerpt)}</em></p>` : ''}
      <hr style="margin: 24px 0; border: none; border-top: 1px solid var(--border-color);">
  `;

  // Split content into paragraphs (with safety check)
  if (article.content) {
    const paragraphs = article.content.split('\n\n');
    paragraphs.forEach((para, index) => {
      if (para.trim()) {
        html += `<p data-paragraph="${index + 1}">${HtmlSanitizer.escape(para.trim())}</p>`;
      }
    });
  } else {
    html += `<p style="color: var(--text-secondary);">Contenuto non disponibile.</p>`;
  }

  html += `</div>`;
  elements.articleText.innerHTML = html;

  // Try iframe FIRST (default)
  if (article.url && elements.articleIframe) {
    elements.articleIframe.src = article.url;

    // Start with iframe view
    switchArticleView('iframe');

    // Detect if iframe fails to load
    setTimeout(() => {
      try {
        const iframeDoc =
          elements.articleIframe.contentDocument || elements.articleIframe.contentWindow.document;
        if (!iframeDoc || iframeDoc.body.innerHTML === '') {
          Logger.warn('⚠️ Iframe bloccato, switch automatico a vista testo');
          switchArticleView('text');
          elements.viewIframeBtn.disabled = true;
          elements.viewIframeBtn.title = 'Iframe bloccato dal sito';
        } else {
          Logger.info('✅ Iframe caricato correttamente');
        }
      } catch {
        // Cross-origin error = iframe loaded successfully
        Logger.info('✅ Iframe caricato (cross-origin)');
      }
    }, 3000);
  } else {
    // No URL = use text view
    switchArticleView('text');
    elements.viewIframeBtn.disabled = true;
    elements.viewIframeBtn.title = 'URL non disponibile';
  }
}

// Highlight paragraph in article
function highlightParagraph(paragraphNumber) {
  // Only works in text view
  if (!elements.articleText.classList.contains('hidden')) {
    // Remove previous highlights
    document.querySelectorAll('.highlight').forEach((el) => {
      el.classList.remove('highlight');
    });

    // Find and highlight target paragraph
    const targetPara = elements.articleText.querySelector(`[data-paragraph="${paragraphNumber}"]`);
    if (targetPara) {
      targetPara.classList.add('highlight');
      targetPara.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Remove highlight after 3 seconds
      setTimeout(() => {
        targetPara.classList.remove('highlight');
      }, 3000);
    }
  } else {
    // In iframe view, show a message
    alert('💡 Passa alla vista "📄 Testo" per evidenziare i paragrafi');
  }
}

// Sync scroll position
export function syncScrollPosition(source) {
  const sourceEl = source === 'article' ? elements.articleContent : elements.summaryContent;
  const targetEl = source === 'article' ? elements.summaryContent : elements.articleContent;

  const scrollPercentage = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight);
  const targetScroll = scrollPercentage * (targetEl.scrollHeight - targetEl.clientHeight);

  targetEl.scrollTop = targetScroll;
}

// Switch summary tab
export function switchSummaryTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.summary-tab').forEach((tab) => {
    tab.classList.remove('active');
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    }
  });

  // Update tab content
  document.querySelectorAll('.summary-tab-content').forEach((content) => {
    content.classList.remove('active');
  });

  const targetContent = document.getElementById(`${tabName}TabContent`);
  if (targetContent) {
    targetContent.classList.add('active');
  }
}

// Display summary in tab
function displaySummaryInTab(summary) {
  // Controlla se il PDF è dalla cache
  const isFromCache =
    state.currentData?.isFromCache || state.currentData?.metadata?.fromCache || false;
  const cacheBadge = isFromCache
    ? '<span class="cache-badge" style="background: #4caf50; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-bottom: 12px; display: inline-block;">⚡ Da Cache!</span>'
    : '';

  elements.summaryTabContent.innerHTML = `
    ${cacheBadge}
    <div class="summary-text">${HtmlSanitizer.escape(summary)}</div>
  `;
}

// Display key points in tab
function displayKeypointsInTab(keyPoints) {
  if (!keyPoints || keyPoints.length === 0) {
    elements.keypointsTabContent.innerHTML = `
      <div class="empty-state">
        <p>Nessun punto chiave disponibile</p>
      </div>
    `;
    return;
  }

  let html = '';
  keyPoints.forEach((point, index) => {
    html += `
      <div class="keypoint" data-paragraph="${point.paragraphs}">
        <div class="keypoint-header">
          <div class="keypoint-title">${index + 1}. ${HtmlSanitizer.escape(point.title)}</div>
          <div class="keypoint-ref">§${HtmlSanitizer.escape(String(point.paragraphs))}</div>
        </div>
        <div class="keypoint-desc">${HtmlSanitizer.escape(point.description)}</div>
      </div>
    `;
  });

  elements.keypointsTabContent.innerHTML = html;

  // Add click handlers
  elements.keypointsTabContent.querySelectorAll('.keypoint').forEach((el) => {
    el.addEventListener('click', () => {
      const paragraph = el.dataset.paragraph;
      highlightParagraph(paragraph);
    });
  });
}

// Switch article view (iframe vs text)
export function switchArticleView(view) {
  if (view === 'iframe') {
    // Hide error message if present
    const errorDiv = document.querySelector('.iframe-error');
    if (errorDiv) errorDiv.remove();

    // Show iframe, hide text
    elements.articleIframe.style.display = 'block';
    elements.articleText.classList.add('hidden');

    // Update buttons
    elements.viewIframeBtn.classList.add('active');
    elements.viewTextBtn.classList.remove('active');

    // Disable sync scroll (iframe can't sync)
    state.syncScroll = false;
  } else {
    // Show text, hide iframe and error
    elements.articleIframe.style.display = 'none';
    const errorDiv = document.querySelector('.iframe-error');
    if (errorDiv) errorDiv.style.display = 'none';

    elements.articleText.classList.remove('hidden');

    // Update buttons
    elements.viewIframeBtn.classList.remove('active');
    elements.viewTextBtn.classList.add('active');

    // Enable sync scroll
    state.syncScroll = true;
  }
}

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
          <p style="color: var(--text-secondary); font-size: 14px;">
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
        <p style="color: var(--text-secondary); font-size: 14px;">
          Questo è il testo estratto automaticamente dal documento PDF.
        </p>
      </div>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid var(--border-color);">
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

// Helper — get language name
function getLanguageName(code) {
  const languages = {
    it: 'Italiano',
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
  };
  return languages[code] || code;
}

// Show error in both panels
export function showError(message) {
  const safeMessage = HtmlSanitizer.escape(message);
  elements.articleContent.innerHTML = `
    <div class="loading-state">
      <p style="color: var(--text-primary);">❌ ${safeMessage}</p>
    </div>
  `;
  elements.summaryContent.innerHTML = `
    <div class="loading-state">
      <p style="color: var(--text-primary);">❌ ${safeMessage}</p>
    </div>
  `;
}
