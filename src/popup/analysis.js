// Popup Analysis Module - Estratto da popup.js
// Gestisce: analyzeArticle, generateSummary, displayResults, switchTab, copyToClipboard

async function analyzeArticle() {
  showState('loading');
  elements.loadingText.textContent = I18n.t('loading.extract');

  try {
    // Ottieni tab corrente
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Verifica che non sia una pagina chrome://
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      throw new Error('Impossibile analizzare pagine interne di Chrome');
    }

    // Estrai articolo
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractArticle' });

    if (!response || !response.success) {
      throw new Error(response?.error || 'Errore durante l\'estrazione');
    }

    currentArticle = response.article;
    currentArticle.url = tab.url;

    // Mostra info articolo
    elements.articleTitle.textContent = currentArticle.title;
    elements.articleStats.textContent = `${currentArticle.wordCount} ${I18n.t('article.words')} • ${currentArticle.readingTimeMinutes} ${I18n.t('article.readingTime')}`;

    // 🔍 Controlla se l'articolo è già stato analizzato in precedenza
    const history = await HistoryManager.getHistory();
    const previousAnalysis = history.find(entry => entry.article.url === currentArticle.url);

    if (previousAnalysis && previousAnalysis.metadata && previousAnalysis.metadata.contentType) {
      // Se l'articolo è già stato analizzato e ha un contentType salvato
      const savedContentType = previousAnalysis.metadata.contentType;

      // Imposta il tipo di articolo salvato nei select
      selectedContentType = savedContentType;
      elements.contentTypeSelect.value = savedContentType;
      elements.contentTypeSelectReady.value = savedContentType;

      console.log('📋 Tipo di articolo recuperato dalla cronologia:', savedContentType);

      // Mostra un feedback visivo temporaneo
      elements.loadingText.textContent = `${I18n.t('loading.articleType')} ${ContentClassifier.getCategoryLabel(savedContentType)} (${I18n.t('loading.fromHistory')})`;
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    showState('ready');

  } catch (error) {
    console.error('Errore analisi:', error);
    // 🆕 Usa ErrorHandler per gestione errori migliorata
    await ErrorHandler.showError(error, 'Analisi articolo');
  }
}

async function generateSummary() {
  if (!currentArticle) {
    await ErrorHandler.showError(new Error('Nessun articolo estratto'), 'Generazione riassunto');
    return;
  }

  showState('loading');
  progressTracker.start();

  try {
    const settings = await StorageManager.getSettings();
    const provider = elements.providerSelect.value;

    // Aggiungi la lingua selezionata alle impostazioni
    settings.outputLanguage = selectedLanguage;

    // Aggiungi la lunghezza del riassunto selezionata
    const summaryLengthSelect = document.getElementById('summaryLengthSelect');
    if (summaryLengthSelect) {
      settings.summaryLength = summaryLengthSelect.value;
    }

    // STEP 1: Classificazione del tipo di contenuto
    progressTracker.setStep('classify');
    let finalContentType = selectedContentType;

    console.log('🎯 selectedContentType:', selectedContentType);

    if (selectedContentType === 'auto') {
      console.log('🔄 Avvio classificazione automatica...');
      progressTracker.setStep('classify', '🔍 Analisi contenuto con AI...');

      console.log('📋 currentArticle:', currentArticle);

      try {
        const classification = await ContentClassifier.classifyArticle(currentArticle, 'auto');
        finalContentType = classification.category;

        console.log('✅ Classificazione completata:', classification);

        // Mostra la categoria rilevata
        const categoryLabel = ContentClassifier.getCategoryLabel(finalContentType);
        progressTracker.setStep('classify', `✓ Rilevato: ${categoryLabel}`);
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (error) {
        console.error('❌ Errore classificazione:', error);
        await ErrorHandler.logError(error, 'Classificazione contenuto');
        finalContentType = 'general'; // Fallback
      }
    } else {
      console.log('👤 Tipo già impostato (manuale o da cronologia):', selectedContentType);
      progressTracker.setStep('classify', '✓ Tipo già impostato');
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // STEP 2: Generazione riassunto
    progressTracker.setStep('generate');
    settings.contentType = finalContentType;

    const response = await chrome.runtime.sendMessage({
      action: 'generateSummary',
      article: currentArticle,
      provider: provider,
      settings: settings
    });

    if (!response.success) {
      throw new Error(response.error);
    }

    currentResults = response.result;

    // STEP 3: Punti chiave (già inclusi, ma mostriamo lo step)
    progressTracker.setStep('keypoints');
    await new Promise(resolve => setTimeout(resolve, 300));

    // STEP 4: Salvataggio
    progressTracker.setStep('save');

    if (selectedContentType === 'auto') {
      currentResults.detectedContentType = finalContentType;
      currentResults.contentTypeMethod = 'auto';
    } else {
      currentResults.detectedContentType = selectedContentType;
      currentResults.contentTypeMethod = 'manual';
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    progressTracker.complete();
    displayResults();

  } catch (error) {
    progressTracker.error(error.message);
    // 🆕 Usa ErrorHandler per gestione errori migliorata
    await ErrorHandler.showError(error, 'Generazione riassunto');
    setTimeout(() => {
      showState('error');
    }, 2000);
  }
}

async function displayResults() {
  // Mostra riassunto (contenuto AI sanitizzato)
  let summaryHtml = `<p>${HtmlSanitizer.escape(currentResults.summary)}</p>`;
  if (currentResults.fromCache) {
    summaryHtml = `<span class="cache-badge">Da cache</span>` + summaryHtml;
  }
  elements.summaryContent.innerHTML = summaryHtml;

  // Mostra punti chiave
  let keypointsHtml = '';
  currentResults.keyPoints.forEach((point, index) => {
    keypointsHtml += `
      <div class="keypoint" data-paragraph="${HtmlSanitizer.escape(String(point.paragraphs))}">
        <div class="keypoint-header">
          <div class="keypoint-title">${index + 1}. ${HtmlSanitizer.escape(point.title)}</div>
          <div class="keypoint-ref">§${HtmlSanitizer.escape(String(point.paragraphs))}</div>
        </div>
        <div class="keypoint-desc">${HtmlSanitizer.escape(point.description)}</div>
      </div>
    `;
  });
  elements.keypointsContent.innerHTML = keypointsHtml;

  // Aggiungi click handler per highlight
  document.querySelectorAll('.keypoint').forEach(el => {
    el.addEventListener('click', async () => {
      const paragraph = el.dataset.paragraph;
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, {
        action: 'highlightParagraph',
        paragraphNumber: paragraph
      });
    });
  });

  // Salva nella cronologia
  try {
    const metadata = {
      provider: elements.providerSelect.value,
      language: selectedLanguage,
      contentType: currentResults.detectedContentType || selectedContentType,
      contentTypeMethod: currentResults.contentTypeMethod || 'manual',
      fromCache: currentResults.fromCache || false
    };

    await HistoryManager.saveSummary(
      currentArticle,
      currentResults.summary,
      currentResults.keyPoints,
      metadata
    );
  } catch (error) {
    console.error('Errore salvataggio cronologia:', error);
  }

  showState('results');

  // Aggiungi pulsanti TTS dopo aver mostrato i risultati
  setTimeout(() => {
    addTTSButtons();
  }, 100);
}

function switchTab(tabName) {
  // Aggiorna tab attivi
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    }
  });

  // Aggiorna contenuto
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });

  if (tabName === 'summary') {
    document.getElementById('summaryTab').classList.add('active');
  } else if (tabName === 'keypoints') {
    document.getElementById('keypointsTab').classList.add('active');
  } else if (tabName === 'translation') {
    document.getElementById('translationTab').classList.add('active');
  } else if (tabName === 'citations') {
    document.getElementById('citationsTab').classList.add('active');
  }
}

async function copyToClipboard() {
  if (!currentResults) return;

  let text = `RIASSUNTO:\n${currentResults.summary}\n\n`;
  text += `PUNTI CHIAVE:\n`;
  currentResults.keyPoints.forEach((point, index) => {
    text += `${index + 1}. ${point.title} (§${point.paragraphs})\n   ${point.description}\n\n`;
  });

  // Aggiungi traduzione se presente
  if (currentTranslation) {
    text += `\n${'='.repeat(50)}\n\n`;
    text += `TRADUZIONE:\n${currentTranslation}\n`;
  }

  // Aggiungi Q&A se presenti
  if (currentQA && currentQA.length > 0) {
    text += `\n${'='.repeat(50)}\n\n`;
    text += `DOMANDE E RISPOSTE:\n\n`;
    currentQA.forEach((qa, index) => {
      text += `Q${index + 1}: ${qa.question}\n`;
      text += `R${index + 1}: ${qa.answer}\n\n`;
    });
  }

  // Aggiungi citazioni se presenti
  if (currentCitations && currentCitations.citations && currentCitations.citations.length > 0) {
    text += `\n${'='.repeat(50)}\n\n`;
    text += `CITAZIONI E BIBLIOGRAFIA:\n\n`;
    const style = document.getElementById('citationStyleSelect')?.value || 'apa';
    text += CitationExtractor.generateBibliography(currentArticle, currentCitations.citations, style);
  }

  try {
    await navigator.clipboard.writeText(text);
    elements.copyBtn.textContent = I18n.t('feedback.copied');
    setTimeout(() => {
      elements.copyBtn.textContent = I18n.t('action.copy');
    }, 2000);
  } catch (error) {
    console.error('Errore copia:', error);
  }
}
