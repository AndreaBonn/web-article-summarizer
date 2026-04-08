// Reading Mode - Voice Module
// Gestisce TTS, STT e controllo dimensione font

import { state, elements } from './state.js';
import { VoiceController } from '../../utils/voice/voice-controller.js';
import { STTManager } from '../../utils/voice/stt-manager.js';

// ============================================
// VOICE CONTROLS
// ============================================

/**
 * Setup voice event listeners
 */
export function setupVoiceEventListeners() {
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
function updateTTSButtons(buttonState) {
  if (!elements.ttsPlayBtn || !elements.ttsPauseBtn || !elements.ttsStopBtn) return;

  switch (buttonState) {
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
export function handleTTSPlay() {
  if (!state.voiceController) return;

  const ttsState = state.voiceController.getTTSState();

  if (ttsState.isPaused) {
    // Resume
    state.voiceController.resumeSpeaking();
  } else {
    // Start new reading
    const textToRead = getCurrentTabText();
    if (!textToRead) {
      alert('Nessun testo da leggere');
      return;
    }

    // Get language from metadata
    const lang = state.currentData?.metadata?.language || 'it';
    const voiceLang = VoiceController.mapLanguageCode(lang);

    state.voiceController.speak(textToRead, voiceLang);
  }
}

/**
 * Handle TTS pause
 */
export function handleTTSPause() {
  if (!state.voiceController) return;
  state.voiceController.pauseSpeaking();
}

/**
 * Handle TTS stop
 */
export function handleTTSStop() {
  if (!state.voiceController) return;
  state.voiceController.stopSpeaking();
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
      return state.currentData?.summary || null;

    case 'keypoints':
      if (!state.currentData?.keyPoints) return null;
      return state.currentData.keyPoints
        .map((point, index) => `${index + 1}. ${point.title}. ${point.description}`)
        .join('. ');

    case 'translation':
      return state.currentData?.translation || null;

    case 'citations':
      if (!state.currentData?.citations?.citations) return null;
      return state.currentData.citations.citations
        .map((citation, index) => {
          let text = `Citazione ${index + 1}. `;
          if (citation.author) text += `${citation.author}. `;
          if (citation.quote_text) text += citation.quote_text;
          return text;
        })
        .join('. ');

    case 'qa':
      if (!state.currentData?.qa || state.currentData.qa.length === 0) return null;
      return state.currentData.qa
        .map(item => `Domanda: ${item.question}. Risposta: ${item.answer}`)
        .join('. ');

    default:
      return null;
  }
}

/**
 * Handle voice input for Q&A
 */
export async function handleVoiceInput() {
  if (!state.voiceController) {
    alert('Controller vocale non inizializzato');
    return;
  }

  if (!STTManager.isSupported()) {
    alert('Il riconoscimento vocale non è supportato in questo browser. Usa Chrome, Edge o Safari.');
    return;
  }

  const sttState = state.voiceController.getSTTState();

  if (sttState.isListening) {
    // Stop listening
    state.voiceController.stopListening();
    return;
  }

  try {
    // Get language from metadata
    const lang = state.currentData?.metadata?.language || 'it';
    const voiceLang = VoiceController.mapLanguageCode(lang);

    // Start listening
    const transcript = await state.voiceController.startListening(voiceLang);

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
export function loadFontSize() {
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
export function increaseFontSize() {
  if (currentFontSizeIndex < FONT_SIZES.length - 1) {
    currentFontSizeIndex++;
    applyFontSize();
  }
}

/**
 * Decrease font size
 */
export function decreaseFontSize() {
  if (currentFontSizeIndex > 0) {
    currentFontSizeIndex--;
    applyFontSize();
  }
}
