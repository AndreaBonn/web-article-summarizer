// History Voice Module - Estratto da history.js
// Gestisce: TTS controls nel modal dettaglio
// Dipende da: voiceController, currentEntry (globals in history.js)

// ============================================
// VOICE CONTROLS
// ============================================

/**
 * Setup voice event listeners
 */
function setupVoiceEventListeners() {
  // TTS events
  window.addEventListener('tts:started', () => {
    updateModalTTSButtons('playing');
  });

  window.addEventListener('tts:paused', () => {
    updateModalTTSButtons('paused');
  });

  window.addEventListener('tts:resumed', () => {
    updateModalTTSButtons('playing');
  });

  window.addEventListener('tts:stopped', () => {
    updateModalTTSButtons('stopped');
  });

  window.addEventListener('tts:ended', () => {
    updateModalTTSButtons('stopped');
  });

  window.addEventListener('tts:error', (event) => {
    console.error('TTS Error:', event.detail);
    updateModalTTSButtons('stopped');
    Modal.error('Errore nella lettura vocale: ' + event.detail.error);
  });
}

/**
 * Update TTS button states in modal
 */
function updateModalTTSButtons(state) {
  const playBtn = document.getElementById('modalTtsPlayBtn');
  const pauseBtn = document.getElementById('modalTtsPauseBtn');
  const stopBtn = document.getElementById('modalTtsStopBtn');

  if (!playBtn || !pauseBtn || !stopBtn) return;

  switch (state) {
    case 'playing':
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'inline-block';
      stopBtn.style.display = 'inline-block';
      pauseBtn.classList.add('active');
      break;

    case 'paused':
      playBtn.style.display = 'inline-block';
      pauseBtn.style.display = 'none';
      stopBtn.style.display = 'inline-block';
      playBtn.textContent = '▶️';
      playBtn.title = 'Riprendi';
      break;

    case 'stopped':
      playBtn.style.display = 'inline-block';
      pauseBtn.style.display = 'none';
      stopBtn.style.display = 'none';
      playBtn.textContent = '🔊';
      playBtn.title = 'Leggi ad alta voce';
      pauseBtn.classList.remove('active');
      break;
  }
}

/**
 * Handle TTS play/resume in modal
 */
function handleModalTTSPlay() {
  if (!voiceController || !currentEntry) return;

  const ttsState = voiceController.getTTSState();

  if (ttsState.isPaused) {
    // Resume
    voiceController.resumeSpeaking();
  } else {
    // Start new reading
    const textToRead = getCurrentModalTabText();
    if (!textToRead) {
      Modal.alert('Nessun testo da leggere', 'Lettura Vocale', 'ℹ️');
      return;
    }

    // Get language from metadata
    const lang = currentEntry.metadata?.language || 'it';
    const voiceLang = VoiceController.mapLanguageCode(lang);

    voiceController.speak(textToRead, voiceLang);
  }
}

/**
 * Handle TTS pause in modal
 */
function handleModalTTSPause() {
  if (!voiceController) return;
  voiceController.pauseSpeaking();
}

/**
 * Handle TTS stop in modal
 */
function handleModalTTSStop() {
  if (!voiceController) return;
  voiceController.stopSpeaking();
}

/**
 * Get text from current active modal tab
 */
function getCurrentModalTabText() {
  if (!currentEntry) return null;

  // Find active tab
  const activeTab = document.querySelector('.modal-tab.active');
  if (!activeTab) return null;

  const tabName = activeTab.dataset.tab;

  switch (tabName) {
    case 'summary':
      return currentEntry.summary || null;

    case 'keypoints':
      if (!currentEntry.keyPoints) return null;
      return currentEntry.keyPoints
        .map((point, index) => `${index + 1}. ${point.title}. ${point.description}`)
        .join('. ');

    case 'translation':
      if (!currentEntry.translation) return null;
      return currentEntry.translation.text || currentEntry.translation;

    case 'citations':
      if (!currentEntry.citations?.citations) return null;
      return currentEntry.citations.citations
        .map((citation, index) => {
          let text = `Citazione ${index + 1}. `;
          if (citation.author) text += `${citation.author}. `;
          if (citation.quote_text || citation.text) text += citation.quote_text || citation.text;
          return text;
        })
        .join('. ');

    case 'qa':
      if (!currentEntry.qa || currentEntry.qa.length === 0) return null;
      return currentEntry.qa
        .map(item => `Domanda: ${item.question}. Risposta: ${item.answer}`)
        .join('. ');

    case 'notes':
      return currentEntry.notes || null;

    default:
      return null;
  }
}
