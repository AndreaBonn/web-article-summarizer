// Reading Mode - Side-by-Side View
let currentData = null;
let syncScroll = true;
let isResizing = false;
let voiceController = null;

// Elements
const elements = {
  backBtn: document.getElementById('backBtn'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  copyBtn: document.getElementById('copyBtn'),
  exportBtn: document.getElementById('exportBtn'),
  articleContent: document.getElementById('articleContent'),
  summaryContent: document.getElementById('summaryContent'),
  articleWordCount: document.getElementById('articleWordCount'),
  articleReadTime: document.getElementById('articleReadTime'),
  summaryProvider: document.getElementById('summaryProvider'),
  summaryLanguage: document.getElementById('summaryLanguage'),
  divider: document.getElementById('divider'),
  // Article views
  articleIframe: document.getElementById('articleIframe'),
  articleText: document.getElementById('articleText'),
  viewIframeBtn: document.getElementById('viewIframeBtn'),
  viewTextBtn: document.getElementById('viewTextBtn'),
  // Tab contents
  summaryTabContent: document.getElementById('summaryTabContent'),
  keypointsTabContent: document.getElementById('keypointsTabContent'),
  translationTabContent: document.getElementById('translationTabContent'),
  citationsTabContent: document.getElementById('citationsTabContent'),
  qaTabContent: document.getElementById('qaTabContent'),
  // Buttons
  translateBtn: document.getElementById('translateBtn'),
  extractCitationsBtn: document.getElementById('extractCitationsBtn'),
  qaAskBtn: document.getElementById('qaAskBtn'),
  qaInput: document.getElementById('qaInput'),
  qaHistory: document.getElementById('qaHistory'),
  // Voice controls
  ttsPlayBtn: document.getElementById('ttsPlayBtn'),
  ttsPauseBtn: document.getElementById('ttsPauseBtn'),
  ttsStopBtn: document.getElementById('ttsStopBtn'),
  qaVoiceBtn: document.getElementById('qaVoiceBtn'),
  // Font size controls
  fontIncreaseBtn: document.getElementById('fontIncreaseBtn'),
  fontDecreaseBtn: document.getElementById('fontDecreaseBtn'),
  fontSizeLabel: document.getElementById('fontSizeLabel')
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize voice controller
    voiceController = new VoiceController();
    await voiceController.initialize();
    
    // Load data from URL params or storage
    await loadData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup voice event listeners
    setupVoiceEventListeners();
    
    // Load theme
    loadTheme();
    
    // Load font size
    loadFontSize();
    
    // Display content
    displayContent();
    
  } catch (error) {
    console.error('Initialization error:', error);
    
    if (error.message === 'NODATA') {
      showNoDataMessage();
    } else {
      showError(error.message || 'Errore durante il caricamento dei dati');
    }
  }
});

// Load data
async function loadData() {
  try {
    // Try to get data from URL params
    const params = new URLSearchParams(window.location.search);
    const historyId = params.get('id');
    const source = params.get('source');
    
    // Check if loading PDF analysis
    if (source === 'pdf' && typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(['pdfReadingMode']);
      if (result.pdfReadingMode) {
        currentData = result.pdfReadingMode;
        currentData.isPDF = true;
        // Clean up after loading
        await chrome.storage.local.remove(['pdfReadingMode']);
        console.log('📄 Dati PDF caricati:', currentData);
        return;
      }
    }
    
    if (historyId && typeof chrome !== 'undefined' && chrome.storage) {
      // Load from history using chrome.storage (use summaryHistory)
      const result = await chrome.storage.local.get(['summaryHistory']);
      const history = result.summaryHistory || [];
      currentData = history.find(item => item.id === parseInt(historyId));
      
      if (!currentData) {
        throw new Error('Riassunto non trovato nella cronologia');
      }
      
      console.log('📖 Dati caricati dalla cronologia:', currentData);
    } else if (typeof chrome !== 'undefined' && chrome.storage) {
      // Try to load from chrome.storage (passed from popup)
      const result = await chrome.storage.local.get(['readingModeData']);
      if (result.readingModeData) {
        currentData = result.readingModeData;
        // Clean up after loading
        await chrome.storage.local.remove(['readingModeData']);
      } else {
        // No data available - show helpful message
        throw new Error('NODATA');
      }
    } else {
      // Fallback to sessionStorage (for test files)
      const sessionData = sessionStorage.getItem('readingModeData');
      if (sessionData) {
        currentData = JSON.parse(sessionData);
      } else {
        throw new Error('NODATA');
      }
    }
  } catch (error) {
    if (error.message === 'NODATA') {
      throw error;
    }
    console.error('Error loading data:', error);
    throw error;
  }
}

// Setup event listeners
function setupEventListeners() {
  // Back button
  elements.backBtn.addEventListener('click', () => {
    window.close();
  });
  
  // Theme toggle
  elements.themeToggleBtn.addEventListener('click', toggleTheme);
  
  // Copy button
  elements.copyBtn.addEventListener('click', copyAll);
  
  // Export button
  elements.exportBtn.addEventListener('click', exportToPDF);
  
  // View toggle buttons
  if (elements.viewIframeBtn) {
    elements.viewIframeBtn.addEventListener('click', () => switchArticleView('iframe'));
  }
  if (elements.viewTextBtn) {
    elements.viewTextBtn.addEventListener('click', () => switchArticleView('text'));
  }
  
  // Summary tabs
  document.querySelectorAll('.summary-tab').forEach(tab => {
    tab.addEventListener('click', () => switchSummaryTab(tab.dataset.tab));
  });
  
  // Translation button
  if (elements.translateBtn) {
    elements.translateBtn.addEventListener('click', translateArticle);
  }
  
  // Citations button
  if (elements.extractCitationsBtn) {
    elements.extractCitationsBtn.addEventListener('click', extractCitations);
  }
  
  // Q&A
  if (elements.qaAskBtn) {
    elements.qaAskBtn.addEventListener('click', askQuestion);
  }
  if (elements.qaInput) {
    elements.qaInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') askQuestion();
    });
  }
  
  // Scroll sync
  let scrollTimeout;
  elements.articleContent.addEventListener('scroll', () => {
    if (!syncScroll) return;
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      syncScrollPosition('article');
    }, 50);
  });
  
  elements.summaryContent.addEventListener('scroll', () => {
    if (!syncScroll) return;
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      syncScrollPosition('summary');
    }, 50);
  });
  
  // Resizable divider
  elements.divider.addEventListener('mousedown', startResize);
  
  // Voice controls
  if (elements.ttsPlayBtn) {
    elements.ttsPlayBtn.addEventListener('click', handleTTSPlay);
  }
  if (elements.ttsPauseBtn) {
    elements.ttsPauseBtn.addEventListener('click', handleTTSPause);
  }
  if (elements.ttsStopBtn) {
    elements.ttsStopBtn.addEventListener('click', handleTTSStop);
  }
  if (elements.qaVoiceBtn) {
    elements.qaVoiceBtn.addEventListener('click', handleVoiceInput);
  }
  
  // Font size controls
  if (elements.fontIncreaseBtn) {
    elements.fontIncreaseBtn.addEventListener('click', increaseFontSize);
  }
  if (elements.fontDecreaseBtn) {
    elements.fontDecreaseBtn.addEventListener('click', decreaseFontSize);
  }
}

// Display content
function displayContent() {
  if (!currentData) return;
  
  // Check if PDF
  if (currentData.isPDF) {
    displayPDFContent();
    return;
  }
  
  const { article, summary, keyPoints, metadata } = currentData;
  
  // Safety check for article
  if (!article) {
    console.error('Article data is missing');
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
  if (currentData.translation) {
    elements.translationTabContent.innerHTML = `
      <div class="translation-content">
        <h3>${HtmlSanitizer.escape(article.title)}</h3>
        <div class="translation-text">${HtmlSanitizer.escape(currentData.translation)}</div>
      </div>
    `;
  }
  
  // Check if citations exist
  if (currentData.citations) {
    console.log('📚 Struttura citazioni:', currentData.citations);
    
    // Handle both structures: direct array or nested object
    const citationsList = currentData.citations.citations || currentData.citations;
    
    if (citationsList && citationsList.length > 0) {
      console.log('📚 Lista citazioni:', citationsList);
      console.log('📚 Prima citazione:', citationsList[0]);
      
      const totalCitations = currentData.citations.total_citations || currentData.citations.totalCount || citationsList.length;
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
          console.warn('Citazione vuota saltata:', citation);
          return;
        }
        
        // Type icon
        const typeIcon = {
          'direct_quote': '💬',
          'indirect_quote': '💭',
          'study_reference': '🔬',
          'statistic': '📊',
          'expert_opinion': '👤',
          'book_reference': '📖',
          'article_reference': '📄',
          'report_reference': '📋',
          'organization_data': '🏢',
          'web_source': '🌐'
        }[citation.type] || '📌';
        
        // Type label
        const typeLabels = {
          'direct_quote': 'Citazione Diretta',
          'indirect_quote': 'Citazione Indiretta',
          'study_reference': 'Riferimento Studio',
          'statistic': 'Statistica',
          'expert_opinion': 'Opinione Esperto',
          'book_reference': 'Riferimento Libro',
          'article_reference': 'Riferimento Articolo',
          'report_reference': 'Riferimento Report',
          'organization_data': 'Dati Organizzazione',
          'web_source': 'Fonte Web'
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
  if (currentData.qa && currentData.qa.length > 0) {
    currentData.qa.forEach(item => {
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
        const iframeDoc = elements.articleIframe.contentDocument || elements.articleIframe.contentWindow.document;
        if (!iframeDoc || iframeDoc.body.innerHTML === '') {
          console.warn('⚠️ Iframe bloccato, switch automatico a vista testo');
          switchArticleView('text');
          elements.viewIframeBtn.disabled = true;
          elements.viewIframeBtn.title = 'Iframe bloccato dal sito';
        } else {
          console.log('✅ Iframe caricato correttamente');
        }
      } catch (e) {
        // Cross-origin error = iframe loaded successfully
        console.log('✅ Iframe caricato (cross-origin)');
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
    document.querySelectorAll('.highlight').forEach(el => {
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
function syncScrollPosition(source) {
  const sourceEl = source === 'article' ? elements.articleContent : elements.summaryContent;
  const targetEl = source === 'article' ? elements.summaryContent : elements.articleContent;
  
  const scrollPercentage = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight);
  const targetScroll = scrollPercentage * (targetEl.scrollHeight - targetEl.clientHeight);
  
  targetEl.scrollTop = targetScroll;
}

// Resizable divider
function startResize(e) {
  isResizing = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  
  const onMouseMove = (e) => {
    if (!isResizing) return;
    
    const container = document.querySelector('.reading-container');
    const containerRect = container.getBoundingClientRect();
    const percentage = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Limit between 20% and 80%
    if (percentage >= 20 && percentage <= 80) {
      document.querySelector('.article-panel').style.flex = `0 0 ${percentage}%`;
      document.querySelector('.summary-panel').style.flex = `0 0 ${100 - percentage}%`;
    }
  };
  
  const onMouseUp = () => {
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// Theme management
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  elements.themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Copy all content
async function copyAll() {
  if (!currentData) return;
  
  const { article, pdf, summary, keyPoints } = currentData;
  
  // Gestisci sia articoli che PDF
  if (currentData.isPDF || pdf) {
    let text = `PDF: ${pdf?.name || currentData.filename || 'Documento'}\n`;
    text += `Pagine: ${pdf?.pages || currentData.pageCount || 'N/A'}\n\n`;
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
    if (currentData.translation) {
      text += `${'='.repeat(60)}\n\n`;
      text += `TRADUZIONE:\n${currentData.translation.text || currentData.translation}\n\n`;
    }
    
    // Aggiungi Q&A se presenti
    if (currentData.qa && currentData.qa.length > 0) {
      text += `${'='.repeat(60)}\n\n`;
      text += `DOMANDE E RISPOSTE:\n\n`;
      currentData.qa.forEach((qa, index) => {
        text += `Q${index + 1}: ${qa.question}\n`;
        text += `R${index + 1}: ${qa.answer}\n\n`;
      });
    }
    
    // Aggiungi citazioni se presenti
    if (currentData.citations && currentData.citations.citations && currentData.citations.citations.length > 0) {
      text += `${'='.repeat(60)}\n\n`;
      text += `CITAZIONI (${currentData.citations.citations.length}):\n\n`;
      currentData.citations.citations.forEach((citation, index) => {
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
    if (currentData.notes) {
      text += `${'='.repeat(60)}\n\n`;
      text += `NOTE PERSONALI:\n${currentData.notes}\n\n`;
    }
    
    try {
      await navigator.clipboard.writeText(text);
      
      const originalText = elements.copyBtn.textContent;
      elements.copyBtn.textContent = '✓ Copiato!';
      setTimeout(() => {
        elements.copyBtn.textContent = originalText;
      }, 2000);
    } catch (error) {
      console.error('Copy error:', error);
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
  if (currentData.translation) {
    text += `${'='.repeat(60)}\n\n`;
    text += `TRADUZIONE:\n${currentData.translation.text || currentData.translation}\n\n`;
  }
  
  // Aggiungi Q&A se presenti
  if (currentData.qa && currentData.qa.length > 0) {
    text += `${'='.repeat(60)}\n\n`;
    text += `DOMANDE E RISPOSTE:\n\n`;
    currentData.qa.forEach((qa, index) => {
      text += `Q${index + 1}: ${qa.question}\n`;
      text += `R${index + 1}: ${qa.answer}\n\n`;
    });
  }
  
  // Aggiungi citazioni se presenti
  if (currentData.citations && currentData.citations.citations && currentData.citations.citations.length > 0) {
    text += `${'='.repeat(60)}\n\n`;
    text += `CITAZIONI (${currentData.citations.citations.length}):\n\n`;
    currentData.citations.citations.forEach((citation, index) => {
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
  if (currentData.notes) {
    text += `${'='.repeat(60)}\n\n`;
    text += `NOTE PERSONALI:\n${currentData.notes}\n\n`;
  }
  
  try {
    await navigator.clipboard.writeText(text);
    
    const originalText = elements.copyBtn.textContent;
    elements.copyBtn.textContent = '✓ Copiato!';
    setTimeout(() => {
      elements.copyBtn.textContent = originalText;
    }, 2000);
  } catch (error) {
    console.error('Copy error:', error);
    alert('Errore durante la copia');
  }
}

// Export to PDF
async function exportToPDF() {
  if (!currentData) {
    alert('Nessun dato da esportare');
    return;
  }
  
  try {
    // Verifica che jsPDF sia caricato
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('Libreria PDF non caricata. Ricarica la pagina e riprova.');
      return;
    }
    
    // Mostra loading
    const originalText = elements.exportBtn.textContent;
    elements.exportBtn.textContent = '⏳ Esportazione...';
    elements.exportBtn.disabled = true;
    
    const { article, pdf, summary, keyPoints, metadata } = currentData;
    
    // Gestisci sia articoli che PDF
    const articleData = currentData.isPDF || pdf ? {
      title: pdf?.name || currentData.filename || 'Documento PDF',
      url: 'PDF Document',
      content: currentData.extractedText || pdf?.text || '',
      wordCount: 0,
      readingTimeMinutes: 0
    } : article;
    
    const metadataData = metadata || currentData.metadata || {
      provider: currentData.apiProvider || 'AI',
      language: 'it',
      contentType: 'pdf'
    };
    
    // Usa PDFExporter se disponibile, altrimenti fallback
    if (typeof PDFExporter !== 'undefined') {
      await PDFExporter.exportToPDF(
        articleData,
        summary,
        keyPoints,
        metadataData,
        currentData.translation,
        currentData.qa,
        currentData.citations
      );
    } else {
      // Fallback: export semplice
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      let y = 20;
      const lineHeight = 7;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const maxWidth = 170;
      
      // Helper function to add text with page breaks
      const addText = (text, fontSize = 11, isBold = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach(line => {
          if (y + lineHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += lineHeight;
        });
      };
      
      // Title
      addText(article.title, 16, true);
      y += 5;
      
      // Metadata
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`${article.wordCount || 0} parole • ${article.readingTimeMinutes || 0} min lettura`, margin, y);
      y += 10;
      doc.setTextColor(0);
      
      // Summary
      addText('RIASSUNTO', 14, true);
      y += 3;
      addText(summary);
      y += 10;
      
      // Key Points
      if (keyPoints && keyPoints.length > 0) {
        addText('PUNTI CHIAVE', 14, true);
        y += 3;
        
        keyPoints.forEach((point, index) => {
          addText(`${index + 1}. ${point.title}`, 11, true);
          addText(`   ${point.description}`);
          y += 3;
        });
      }
      
      // Save
      const filename = `${article.title.substring(0, 50)}_reading-mode.pdf`;
      doc.save(filename);
    }
    
    // Successo
    elements.exportBtn.textContent = '✓ Esportato!';
    setTimeout(() => {
      elements.exportBtn.textContent = originalText;
      elements.exportBtn.disabled = false;
    }, 2000);
    
  } catch (error) {
    console.error('Export error:', error);
    alert('Errore durante l\'esportazione PDF: ' + error.message);
    elements.exportBtn.textContent = '📄 PDF';
    elements.exportBtn.disabled = false;
  }
}

// Helper functions
function getLanguageName(code) {
  const languages = {
    'it': 'Italiano',
    'en': 'English',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch'
  };
  return languages[code] || code;
}

function showError(message) {
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

function showNoDataMessage() {
  elements.articleContent.innerHTML = `
    <div class="loading-state">
      <div style="text-align: center; max-width: 400px;">
        <div style="font-size: 64px; margin-bottom: 20px;">📖</div>
        <h2 style="color: var(--text-primary); margin-bottom: 16px;">Modalità Lettura</h2>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">
          Per usare questa funzionalità:
        </p>
        <ol style="text-align: left; color: var(--text-secondary); line-height: 1.8;">
          <li>Apri un articolo web</li>
          <li>Clicca sull'icona dell'extension</li>
          <li>Analizza la pagina</li>
          <li>Genera il riassunto</li>
          <li>Clicca su "📖 Modalità Lettura"</li>
        </ol>
        <p style="color: var(--text-secondary); margin-top: 24px; font-size: 14px;">
          Oppure apri <strong>test-reading-mode.html</strong> per vedere una demo
        </p>
      </div>
    </div>
  `;
  elements.summaryContent.innerHTML = `
    <div class="loading-state">
      <div style="text-align: center; max-width: 400px;">
        <div style="font-size: 64px; margin-bottom: 20px;">✨</div>
        <h2 style="color: var(--text-primary); margin-bottom: 16px;">Riassunto AI</h2>
        <p style="color: var(--text-secondary);">
          Il riassunto apparirà qui dopo aver analizzato un articolo
        </p>
      </div>
    </div>
  `;
}


// Switch summary tab
function switchSummaryTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.summary-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    }
  });
  
  // Update tab content
  document.querySelectorAll('.summary-tab-content').forEach(content => {
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
  const isFromCache = currentData?.isFromCache || currentData?.metadata?.fromCache || false;
  const cacheBadge = isFromCache ? '<span class="cache-badge" style="background: #4caf50; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-bottom: 12px; display: inline-block;">⚡ Da Cache!</span>' : '';
  
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
  elements.keypointsTabContent.querySelectorAll('.keypoint').forEach(el => {
    el.addEventListener('click', () => {
      const paragraph = el.dataset.paragraph;
      highlightParagraph(paragraph);
    });
  });
}

// Translate article
async function translateArticle() {
  // Check if we have data (article or PDF)
  if (!currentData) return;
  
  // For PDFs, check if we have extracted text - gestisci diverse strutture
  const extractedText = currentData.extractedText || currentData.pdf?.text;
  if (currentData.isPDF && !extractedText) {
    console.error('No extracted text for PDF translation');
    await Modal.error('Testo non disponibile per la traduzione');
    return;
  }
  
  // For articles, check if we have article object
  if (!currentData.isPDF && !currentData.article) {
    console.error('No article for translation');
    return;
  }
  
  elements.translateBtn.disabled = true;
  elements.translateBtn.textContent = '⏳ Traduzione in corso...';
  
  try {
    // Get settings
    const settings = await StorageManager.getSettings();
    const provider = settings.selectedProvider || 'groq';
    const apiKey = await StorageManager.getApiKey(provider);
    
    if (!apiKey) {
      throw new Error('API key non configurata per ' + provider);
    }
    
    const targetLanguage = currentData.metadata?.language || 'it';
    
    let translationResult;
    
    if (currentData.isPDF) {
      // For PDFs, translate the extracted text directly - usa la variabile già estratta
      translationResult = await translatePDFText(
        extractedText,
        targetLanguage,
        provider,
        apiKey,
        false // Non forzare traduzione
      );
      
      // Check if same language detected
      if (translationResult.sameLanguage) {
        // Show popup with choice
        const choice = await showSameLanguageModal(targetLanguage);
        
        if (choice === 'translate') {
          // Force translate (reformat)
          translationResult = await translatePDFText(
            currentData.extractedText,
            targetLanguage,
            provider,
            apiKey,
            true // Forza traduzione/riformattazione
          );
        } else if (choice === 'ignore') {
          // Use original text - usa la variabile già estratta
          translationResult = {
            sameLanguage: false,
            translation: extractedText
          };
        } else {
          // User cancelled
          elements.translateBtn.disabled = false;
          elements.translateBtn.textContent = '🌍 Traduci Articolo';
          return;
        }
      }
    } else {
      // For articles, use Translator
      const translation = await Translator.translateArticle(
        currentData.article,
        targetLanguage,
        provider,
        apiKey
      );
      translationResult = { sameLanguage: false, translation };
    }
    
    // Display translation
    const title = currentData.isPDF ? currentData.filename : currentData.article.title;
    const translation = translationResult.translation;
    
    elements.translationTabContent.innerHTML = `
      <div class="translation-content">
        <h3>${HtmlSanitizer.escape(title)}</h3>
        <div class="translation-text">${HtmlSanitizer.escape(translation).replace(/\n/g, '<br>')}</div>
      </div>
    `;
    
    // Save to current data
    currentData.translation = translation;
    
    // Update in storage
    await updateDataInStorage();
    
  } catch (error) {
    console.error('Translation error:', error);
    elements.translationTabContent.innerHTML = `
      <div class="empty-state">
        <p style="color: var(--text-primary);">❌ ${HtmlSanitizer.escape(error.message)}</p>
        <button id="translateBtn" class="btn btn-primary">🔄 Riprova</button>
      </div>
    `;
    document.getElementById('translateBtn').addEventListener('click', translateArticle);
  } finally {
    elements.translateBtn.disabled = false;
    elements.translateBtn.textContent = '🌍 Traduci Articolo';
  }
}

// Extract citations
async function extractCitations() {
  // Check if we have data (article or PDF)
  if (!currentData) return;
  
  // For PDFs, check if we have extracted text - gestisci diverse strutture
  const extractedText = currentData.extractedText || currentData.pdf?.text;
  if (currentData.isPDF && !extractedText) {
    console.error('No extracted text for PDF citations');
    await Modal.error('Testo non disponibile per l\'estrazione citazioni');
    return;
  }
  
  // For articles, check if we have article object
  if (!currentData.isPDF && !currentData.article) {
    console.error('No article for citations');
    return;
  }
  
  elements.extractCitationsBtn.disabled = true;
  elements.extractCitationsBtn.textContent = '⏳ Estrazione in corso...';
  
  try {
    // Get settings
    const settings = await StorageManager.getSettings();
    const provider = settings.selectedProvider || 'groq';
    
    let citations;
    
    if (currentData.isPDF) {
      // For PDFs, extract citations from extracted text - usa la variabile già estratta
      const filename = currentData.filename || currentData.pdf?.name || 'PDF';
      citations = await extractPDFCitations(
        extractedText,
        filename,
        provider,
        settings
      );
    } else {
      // For articles, call background script
      const response = await chrome.runtime.sendMessage({
        action: 'extractCitations',
        article: currentData.article,
        provider: provider,
        settings: settings
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Errore durante l\'estrazione');
      }
      
      citations = response.result.citations;
    }
    
    // Display citations
    let html = '<div class="citations-content">';
    
    if (citations && citations.citations && citations.citations.length > 0) {
      const totalCitations = citations.total_citations || citations.totalCount || citations.citations.length;
      html += `<h3>📚 ${totalCitations} Citazioni Trovate</h3>`;
      
      citations.citations.forEach((citation, index) => {
        // Estrai i campi per questa citazione
        const text = citation.quote_text || citation.text || citation.quote || null;
        const author = citation.author || null;
        
        html += `
          <div class="citation-item">
            <div class="citation-number">[${index + 1}]</div>
            <div class="citation-text">${HtmlSanitizer.escape(text || 'Testo citazione non disponibile')}</div>
            ${author ? `<div class="citation-author">— ${HtmlSanitizer.escape(author)}</div>` : ''}
            ${citation.paragraph ? `<div class="citation-ref">§${HtmlSanitizer.escape(String(citation.paragraph))}</div>` : ''}
          </div>
        `;
      });
    } else {
      html += '<p>📚 Nessuna citazione trovata in questo articolo</p>';
    }
    
    html += '</div>';
    elements.citationsTabContent.innerHTML = html;
    
    // Save to current data
    currentData.citations = citations;
    
    // Update in storage
    await updateDataInStorage();
    
  } catch (error) {
    console.error('Citations error:', error);
    elements.citationsTabContent.innerHTML = `
      <div class="empty-state">
        <p style="color: var(--text-primary);">❌ ${HtmlSanitizer.escape(error.message)}</p>
        <button id="extractCitationsBtn" class="btn btn-primary">🔄 Riprova</button>
      </div>
    `;
    document.getElementById('extractCitationsBtn').addEventListener('click', extractCitations);
  }
}

// Ask question
async function askQuestion() {
  const question = elements.qaInput.value.trim();
  if (!question || !currentData) return;
  
  // Add question to history
  const qaItem = document.createElement('div');
  qaItem.className = 'qa-item';
  qaItem.innerHTML = `
    <div class="qa-question">Q: ${HtmlSanitizer.escape(question)}</div>
    <div class="qa-answer">⏳ Sto pensando...</div>
  `;
  elements.qaHistory.appendChild(qaItem);
  
  // Clear input
  elements.qaInput.value = '';
  
  // Scroll to top (since we use flex-direction: column-reverse)
  elements.qaHistory.scrollTop = 0;
  
  try {
    // Get settings
    const settings = await StorageManager.getSettings();
    const provider = settings.selectedProvider || 'groq';
    const apiKey = await StorageManager.getApiKey(provider);
    
    if (!apiKey) {
      throw new Error('API key non configurata per ' + provider);
    }
    
    let answer;
    
    if (currentData.isPDF) {
      // For PDFs, use extracted text directly
      answer = await askQuestionPDF(
        question,
        currentData.extractedText,
        currentData.summary,
        provider,
        apiKey
      );
    } else {
      // For articles, prepare article with paragraphs structure
      const articleWithParagraphs = {
        ...currentData.article,
        paragraphs: []
      };
      
      // Convert content to paragraphs if needed
      if (currentData.article.content && !currentData.article.paragraphs) {
        const paragraphs = currentData.article.content.split('\n\n');
        articleWithParagraphs.paragraphs = paragraphs
          .filter(p => p.trim())
          .map((text, index) => ({
            id: index + 1,
            text: text.trim()
          }));
      } else if (currentData.article.paragraphs) {
        articleWithParagraphs.paragraphs = currentData.article.paragraphs;
      }
      
      // Use AdvancedAnalysis directly (like popup does)
      answer = await AdvancedAnalysis.askQuestion(
        question,
        articleWithParagraphs,
        currentData.summary,
        provider,
        apiKey,
        settings
      );
    }
    
    // Update answer
    qaItem.querySelector('.qa-answer').textContent = `A: ${answer}`;
    
    // Save to current data
    if (!currentData.qa) currentData.qa = [];
    currentData.qa.push({ 
      question, 
      answer,
      timestamp: new Date().toISOString()
    });
    
    // Update in storage
    await updateDataInStorage();
    
  } catch (error) {
    console.error('Q&A error:', error);
    qaItem.querySelector('.qa-answer').textContent = `❌ Errore: ${error.message}`;
  }
}

// Update data in storage (save to history)
async function updateDataInStorage() {
  try {
    if (currentData.isPDF) {
      // For PDFs, update in PDF history
      const result = await chrome.storage.local.get(['pdf_analysis_history']);
      const pdfHistory = result.pdf_analysis_history || [];
      
      // Find existing entry by fileHash
      const existingIndex = pdfHistory.findIndex(item => 
        item.fileHash === currentData.fileHash
      );
      
      if (existingIndex >= 0) {
        // Update existing PDF entry
        pdfHistory[existingIndex] = {
          ...pdfHistory[existingIndex],
          analysis: {
            ...pdfHistory[existingIndex].analysis,
            translation: currentData.translation || pdfHistory[existingIndex].analysis.translation,
            citations: currentData.citations || pdfHistory[existingIndex].analysis.citations,
            qa: currentData.qa || pdfHistory[existingIndex].analysis.qa
          },
          timestamp: Date.now()
        };
        
        await chrome.storage.local.set({ pdf_analysis_history: pdfHistory });
        console.log('💾 Dati PDF aggiornati nella cronologia');
      }
    } else {
      // For articles, update in article history
      const result = await chrome.storage.local.get(['summaryHistory']);
      const history = result.summaryHistory || [];
      
      // Find existing entry by URL
      const existingIndex = history.findIndex(item => 
        item.article && item.article.url === currentData.article.url
      );
      
      if (existingIndex >= 0) {
        // Update existing entry with new data
        history[existingIndex] = {
          ...history[existingIndex],
          translation: currentData.translation || history[existingIndex].translation,
          citations: currentData.citations || history[existingIndex].citations,
          qa: currentData.qa || history[existingIndex].qa,
          timestamp: Date.now()
        };
        
        await chrome.storage.local.set({ summaryHistory: history });
        console.log('💾 Dati aggiornati nella cronologia');
      } else {
        console.warn('⚠️ Articolo non trovato nella cronologia');
      }
    }
  } catch (error) {
    console.error('Error updating storage:', error);
  }
}


// Switch article view (iframe vs text)
function switchArticleView(view) {
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
    syncScroll = false;
    
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
    syncScroll = true;
  }
}


// Display PDF content
function displayPDFContent() {
  console.log('📄 Rendering PDF content:', currentData);
  
  // Update header
  document.querySelector('.reading-header h1').textContent = '📄 Analisi PDF';
  
  // Update metadata - gestisci diverse strutture dati
  const pageCount = currentData.pageCount || currentData.pdf?.pages || 0;
  const filename = currentData.filename || currentData.pdf?.name || 'PDF';
  const provider = currentData.apiProvider || currentData.metadata?.provider || 'AI';
  const language = currentData.metadata?.language || 'it';
  
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
  const extractedText = currentData.extractedText || currentData.pdf?.text || '';
  displayExtractedText(extractedText);
  
  // Right panel: Show analysis
  displaySummaryInTab(currentData.summary);
  displayKeypointsInTab(currentData.keyPoints);
  
  // Show quotes if available
  if (currentData.quotes && currentData.quotes.length > 0) {
    displayQuotesInTab(currentData.quotes);
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
    .filter(part => part.trim())
    .map((part, index) => {
      if (index % 2 === 0) {
        // Page number
        return `<div class="page-marker">📄 Pagina ${part}</div>`;
      } else {
        // Page content
        return `<div class="page-content">${part.replace(/\n/g, '<br>')}</div>`;
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
        <div class="quote-text">"${quote}"</div>
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


// Translate PDF text
async function translatePDFText(text, targetLanguage, provider, apiKey, forceTranslate = false) {
  console.log('Translating PDF text to:', targetLanguage, 'Force:', forceTranslate);
  
  // Language names for prompt
  const languageNames = {
    it: 'italiano',
    en: 'inglese',
    es: 'spagnolo',
    fr: 'francese',
    de: 'tedesco'
  };
  
  const targetLangName = languageNames[targetLanguage] || targetLanguage;
  
  // Build prompt
  let systemPrompt, userPrompt;
  
  if (forceTranslate) {
    // Prompt per forzare la traduzione anche se già nella lingua corretta
    systemPrompt = `Sei un traduttore professionale. 
Il tuo compito è riformattare e migliorare il testo in ${targetLangName}, anche se è già in quella lingua.
Mantieni il significato originale ma migliora la formattazione, correggi errori e rendi il testo più fluente.`;
    
    userPrompt = `Riformatta e migliora questo testo in ${targetLangName}:

${text}`;
  } else {
    // Prompt normale con rilevamento lingua
    systemPrompt = `Sei un traduttore professionale. 
Se il testo è già in ${targetLangName}, rispondi ESATTAMENTE con: "SAME_LANGUAGE"
Altrimenti, traduci il testo in ${targetLangName} mantenendo formattazione e struttura.`;
    
    userPrompt = `Traduci questo testo in ${targetLangName}:

${text}`;
  }
  
  // Call API
  try {
    const translation = await APIClient.generateCompletion(
      provider,
      apiKey,
      systemPrompt,
      userPrompt,
      {
        temperature: 0.3,
        maxTokens: 4000
      }
    );
    
    // Check if same language detected
    if (!forceTranslate && translation.includes('SAME_LANGUAGE')) {
      return { sameLanguage: true };
    }
    
    return { sameLanguage: false, translation };
  } catch (error) {
    console.error('API translation error:', error);
    throw new Error('Errore durante la traduzione: ' + error.message);
  }
}


// Extract citations from PDF text
async function extractPDFCitations(text, filename, provider, settings) {
  console.log('Extracting citations from PDF:', filename);
  
  const apiKey = await StorageManager.getApiKey(provider);
  if (!apiKey) {
    throw new Error('API key non configurata per ' + provider);
  }
  
  // Build prompt for citation extraction
  const systemPrompt = `Sei un esperto nell'analisi di documenti accademici e scientifici.
Il tuo compito è identificare ed estrarre tutte le citazioni, riferimenti bibliografici e fonti presenti nel testo.

Estrai:
- Citazioni dirette (tra virgolette)
- Riferimenti bibliografici
- Menzioni di autori e opere
- Dati e statistiche con fonte

Rispondi in formato JSON:
{
  "citations": [
    {
      "quote_text": "testo citazione",
      "author": "autore (se presente)",
      "source": "fonte (se presente)",
      "type": "direct_quote | reference | statistic"
    }
  ],
  "total_citations": numero
}`;
  
  const userPrompt = `Analizza questo documento PDF ed estrai tutte le citazioni e riferimenti:

${text}

Rispondi in formato JSON come specificato.`;
  
  try {
    const response = await APIClient.generateCompletion(
      provider,
      apiKey,
      systemPrompt,
      userPrompt,
      {
        temperature: 0.1,
        maxTokens: 2000
      }
    );
    
    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }
    
    // Fallback if no JSON
    return {
      citations: [],
      total_citations: 0
    };
    
  } catch (error) {
    console.error('Error extracting PDF citations:', error);
    throw new Error('Errore estrazione citazioni: ' + error.message);
  }
}


// Show modal when same language is detected
function showSameLanguageModal(targetLanguage) {
  return new Promise((resolve) => {
    // Language names in current UI language
    const languageKey = `language.${targetLanguage}`;
    const langName = I18n.t(languageKey);
    
    // Get translated strings
    const title = I18n.t('sameLanguage.title').replace('{language}', langName);
    const message = I18n.t('sameLanguage.message').replace('{language}', langName);
    const translateBtn = I18n.t('sameLanguage.translate');
    const useOriginalBtn = I18n.t('sameLanguage.useOriginal');
    const cancelBtn = I18n.t('sameLanguage.cancel');
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.innerHTML = `
      <div class="custom-modal-overlay"></div>
      <div class="custom-modal-content">
        <div class="custom-modal-icon">ℹ️</div>
        <h3 class="custom-modal-title">${title}</h3>
        <p class="custom-modal-message">${message}</p>
        <div class="custom-modal-buttons" style="flex-direction: column; gap: 8px;">
          <button id="sameLanguageTranslate" class="modal-btn modal-btn-confirm" style="width: 100%;">
            ${translateBtn}
          </button>
          <button id="sameLanguageIgnore" class="modal-btn modal-btn-secondary" style="width: 100%; background: var(--secondary-color);">
            ${useOriginalBtn}
          </button>
          <button id="sameLanguageCancel" class="modal-btn modal-btn-cancel" style="width: 100%;">
            ${cancelBtn}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event handlers
    const handleTranslate = () => {
      document.body.removeChild(modal);
      resolve('translate');
    };
    
    const handleIgnore = () => {
      document.body.removeChild(modal);
      resolve('ignore');
    };
    
    const handleCancel = () => {
      document.body.removeChild(modal);
      resolve('cancel');
    };
    
    // Add event listeners
    document.getElementById('sameLanguageTranslate').addEventListener('click', handleTranslate);
    document.getElementById('sameLanguageIgnore').addEventListener('click', handleIgnore);
    document.getElementById('sameLanguageCancel').addEventListener('click', handleCancel);
    
    // Close on overlay click
    modal.querySelector('.custom-modal-overlay').addEventListener('click', handleCancel);
  });
}


// Ask question about PDF
async function askQuestionPDF(question, extractedText, summary, provider, apiKey) {
  console.log('Asking question about PDF:', question);
  
  // Build prompt
  const systemPrompt = `Sei un assistente esperto nell'analisi di documenti.
Rispondi alle domande basandoti ESCLUSIVAMENTE sul contenuto del documento fornito.

REGOLE:
1. Usa solo informazioni presenti nel documento
2. Se l'informazione non è nel documento, dillo chiaramente
3. Sii preciso e conciso
4. Cita parti specifiche del documento quando possibile`;
  
  const userPrompt = `DOCUMENTO:
${extractedText}

RIASSUNTO:
${summary}

DOMANDA:
${question}

Rispondi alla domanda basandoti sul documento sopra.`;
  
  try {
    const answer = await APIClient.generateCompletion(
      provider,
      apiKey,
      systemPrompt,
      userPrompt,
      {
        temperature: 0.3,
        maxTokens: 1000
      }
    );
    
    return answer;
  } catch (error) {
    console.error('Error asking question about PDF:', error);
    throw new Error('Errore durante la risposta: ' + error.message);
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
    updateTTSButtons('playing');
  });
  
  window.addEventListener('tts:paused', () => {
    updateTTSButtons('paused');
  });
  
  window.addEventListener('tts:resumed', () => {
    updateTTSButtons('playing');
  });
  
  window.addEventListener('tts:stopped', () => {
    updateTTSButtons('stopped');
  });
  
  window.addEventListener('tts:ended', () => {
    updateTTSButtons('stopped');
  });
  
  window.addEventListener('tts:error', (event) => {
    console.error('TTS Error:', event.detail);
    updateTTSButtons('stopped');
    alert('Errore nella lettura vocale: ' + event.detail.error);
  });
  
  // STT events
  window.addEventListener('stt:started', () => {
    if (elements.qaVoiceBtn) {
      elements.qaVoiceBtn.classList.add('listening');
      elements.qaVoiceBtn.textContent = '🎙️';
      elements.qaVoiceBtn.title = 'Ascolto in corso...';
    }
  });
  
  window.addEventListener('stt:interim', (event) => {
    // Mostra trascrizione provvisoria
    if (elements.qaInput) {
      elements.qaInput.value = event.detail.transcript;
      elements.qaInput.style.fontStyle = 'italic';
      elements.qaInput.style.color = 'var(--text-secondary)';
    }
  });
  
  window.addEventListener('stt:result', (event) => {
    // Trascrizione finale
    if (elements.qaInput) {
      elements.qaInput.value = event.detail.transcript;
      elements.qaInput.style.fontStyle = 'normal';
      elements.qaInput.style.color = 'var(--text-primary)';
    }
    if (elements.qaVoiceBtn) {
      elements.qaVoiceBtn.classList.remove('listening');
      elements.qaVoiceBtn.textContent = '🎤';
      elements.qaVoiceBtn.title = 'Domanda vocale';
    }
  });
  
  window.addEventListener('stt:ended', () => {
    if (elements.qaVoiceBtn) {
      elements.qaVoiceBtn.classList.remove('listening');
      elements.qaVoiceBtn.textContent = '🎤';
      elements.qaVoiceBtn.title = 'Domanda vocale';
    }
  });
  
  window.addEventListener('stt:error', (event) => {
    console.error('STT Error:', event.detail);
    if (elements.qaVoiceBtn) {
      elements.qaVoiceBtn.classList.remove('listening');
      elements.qaVoiceBtn.textContent = '🎤';
      elements.qaVoiceBtn.title = 'Domanda vocale';
    }
    alert(event.detail.message || 'Errore nel riconoscimento vocale');
  });
}

/**
 * Update TTS button states
 */
function updateTTSButtons(state) {
  if (!elements.ttsPlayBtn || !elements.ttsPauseBtn || !elements.ttsStopBtn) return;
  
  switch (state) {
    case 'playing':
      elements.ttsPlayBtn.style.display = 'none';
      elements.ttsPauseBtn.style.display = 'inline-block';
      elements.ttsStopBtn.style.display = 'inline-block';
      elements.ttsPauseBtn.classList.add('active');
      break;
      
    case 'paused':
      elements.ttsPlayBtn.style.display = 'inline-block';
      elements.ttsPauseBtn.style.display = 'none';
      elements.ttsStopBtn.style.display = 'inline-block';
      elements.ttsPlayBtn.textContent = '▶️';
      elements.ttsPlayBtn.title = 'Riprendi';
      break;
      
    case 'stopped':
      elements.ttsPlayBtn.style.display = 'inline-block';
      elements.ttsPauseBtn.style.display = 'none';
      elements.ttsStopBtn.style.display = 'none';
      elements.ttsPlayBtn.textContent = '🔊';
      elements.ttsPlayBtn.title = 'Leggi ad alta voce';
      elements.ttsPauseBtn.classList.remove('active');
      break;
  }
}

/**
 * Handle TTS play/resume
 */
function handleTTSPlay() {
  if (!voiceController) return;
  
  const ttsState = voiceController.getTTSState();
  
  if (ttsState.isPaused) {
    // Resume
    voiceController.resumeSpeaking();
  } else {
    // Start new reading
    const textToRead = getCurrentTabText();
    if (!textToRead) {
      alert('Nessun testo da leggere');
      return;
    }
    
    // Get language from metadata
    const lang = currentData?.metadata?.language || 'it';
    const voiceLang = VoiceController.mapLanguageCode(lang);
    
    voiceController.speak(textToRead, voiceLang);
  }
}

/**
 * Handle TTS pause
 */
function handleTTSPause() {
  if (!voiceController) return;
  voiceController.pauseSpeaking();
}

/**
 * Handle TTS stop
 */
function handleTTSStop() {
  if (!voiceController) return;
  voiceController.stopSpeaking();
}

/**
 * Get text from current active tab
 */
function getCurrentTabText() {
  // Find active tab
  const activeTab = document.querySelector('.summary-tab.active');
  if (!activeTab) return null;
  
  const tabName = activeTab.dataset.tab;
  
  switch (tabName) {
    case 'summary':
      return currentData?.summary || null;
      
    case 'keypoints':
      if (!currentData?.keyPoints) return null;
      return currentData.keyPoints
        .map((point, index) => `${index + 1}. ${point.title}. ${point.description}`)
        .join('. ');
      
    case 'translation':
      return currentData?.translation || null;
      
    case 'citations':
      if (!currentData?.citations?.citations) return null;
      return currentData.citations.citations
        .map((citation, index) => {
          let text = `Citazione ${index + 1}. `;
          if (citation.author) text += `${citation.author}. `;
          if (citation.quote_text) text += citation.quote_text;
          return text;
        })
        .join('. ');
      
    case 'qa':
      if (!currentData?.qa || currentData.qa.length === 0) return null;
      return currentData.qa
        .map(item => `Domanda: ${item.question}. Risposta: ${item.answer}`)
        .join('. ');
      
    default:
      return null;
  }
}

/**
 * Handle voice input for Q&A
 */
async function handleVoiceInput() {
  if (!voiceController) {
    alert('Controller vocale non inizializzato');
    return;
  }
  
  if (!STTManager.isSupported()) {
    alert('Il riconoscimento vocale non è supportato in questo browser. Usa Chrome, Edge o Safari.');
    return;
  }
  
  const sttState = voiceController.getSTTState();
  
  if (sttState.isListening) {
    // Stop listening
    voiceController.stopListening();
    return;
  }
  
  try {
    // Get language from metadata
    const lang = currentData?.metadata?.language || 'it';
    const voiceLang = VoiceController.mapLanguageCode(lang);
    
    // Start listening
    const transcript = await voiceController.startListening(voiceLang);
    
    // Transcript is already set in input by event listener
    // User can now click "Chiedi" or press Enter
    
  } catch (error) {
    console.error('Voice input error:', error);
    // Error is already shown by event listener
  }
}

// Font Size Management
const FONT_SIZES = ['S', 'M', 'L', 'XL'];
let currentFontSizeIndex = 1; // Default: M

/**
 * Load saved font size
 */
function loadFontSize() {
  const savedSize = localStorage.getItem('readingModeFontSize') || 'M';
  const index = FONT_SIZES.indexOf(savedSize);
  currentFontSizeIndex = index >= 0 ? index : 1;
  applyFontSize();
}

/**
 * Apply font size to body
 */
function applyFontSize() {
  const size = FONT_SIZES[currentFontSizeIndex];
  document.body.setAttribute('data-font-size', size);
  
  if (elements.fontSizeLabel) {
    elements.fontSizeLabel.textContent = size;
  }
  
  // Update button states
  if (elements.fontDecreaseBtn) {
    elements.fontDecreaseBtn.disabled = currentFontSizeIndex === 0;
  }
  if (elements.fontIncreaseBtn) {
    elements.fontIncreaseBtn.disabled = currentFontSizeIndex === FONT_SIZES.length - 1;
  }
  
  // Save to localStorage
  localStorage.setItem('readingModeFontSize', size);
}

/**
 * Increase font size
 */
function increaseFontSize() {
  if (currentFontSizeIndex < FONT_SIZES.length - 1) {
    currentFontSizeIndex++;
    applyFontSize();
  }
}

/**
 * Decrease font size
 */
function decreaseFontSize() {
  if (currentFontSizeIndex > 0) {
    currentFontSizeIndex--;
    applyFontSize();
  }
}
