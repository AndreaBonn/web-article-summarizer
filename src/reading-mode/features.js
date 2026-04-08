// Reading Mode - Features Module
// Gestisce traduzioni, citazioni, Q&A e aggiornamento storage
// Funzioni helper PDF (translatePDFText, extractPDFCitations, askQuestionPDF) → reading-mode-pdf.js

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
