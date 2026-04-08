// Reading Mode - Voice Module
// Gestisce TTS, STT e controllo dimensione font

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

// ============================================
// FONT SIZE MANAGEMENT
// ============================================

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
