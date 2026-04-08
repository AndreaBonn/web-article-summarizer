// History Voice Module - Estratto da history.js
// Gestisce: TTS controls nel modal dettaglio

import { state } from './state.js';
import { Modal } from '../../utils/modal.js';
import { VoiceController } from '../../utils/voice-controller.js';

// ============================================
// VOICE CONTROLS
// ============================================

/**
 * Setup voice event listeners
 */
export function setupVoiceEventListeners() {
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
function updateModalTTSButtons(buttonState) {
  const playBtn = document.getElementById('modalTtsPlayBtn');
  const pauseBtn = document.getElementById('modalTtsPauseBtn');
  const stopBtn = document.getElementById('modalTtsStopBtn');

  if (!playBtn || !pauseBtn || !stopBtn) return;

  switch (buttonState) {
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
export function handleModalTTSPlay() {
  if (!state.voiceController || !state.currentEntry) return;

  const ttsState = state.voiceController.getTTSState();

  if (ttsState.isPaused) {
    // Resume
    state.voiceController.resumeSpeaking();
  } else {
    // Start new reading
    const textToRead = getCurrentModalTabText();
    if (!textToRead) {
      Modal.alert('Nessun testo da leggere', 'Lettura Vocale', 'ℹ️');
      return;
    }

    // Get language from metadata
    const lang = state.currentEntry.metadata?.language || 'it';
    const voiceLang = VoiceController.mapLanguageCode(lang);

    state.voiceController.speak(textToRead, voiceLang);
  }
}

/**
 * Handle TTS pause in modal
 */
export function handleModalTTSPause() {
  if (!state.voiceController) return;
  state.voiceController.pauseSpeaking();
}

/**
 * Handle TTS stop in modal
 */
export function handleModalTTSStop() {
  if (!state.voiceController) return;
  state.voiceController.stopSpeaking();
}

/**
 * Get text from current active modal tab
 */
function getCurrentModalTabText() {
  if (!state.currentEntry) return null;

  // Find active tab
  const activeTab = document.querySelector('.modal-tab.active');
  if (!activeTab) return null;

  const tabName = activeTab.dataset.tab;

  switch (tabName) {
    case 'summary':
      return state.currentEntry.summary || null;

    case 'keypoints':
      if (!state.currentEntry.keyPoints) return null;
      return state.currentEntry.keyPoints
        .map((point, index) => `${index + 1}. ${point.title}. ${point.description}`)
        .join('. ');

    case 'translation':
      if (!state.currentEntry.translation) return null;
      return state.currentEntry.translation.text || state.currentEntry.translation;

    case 'citations':
      if (!state.currentEntry.citations?.citations) return null;
      return state.currentEntry.citations.citations
        .map((citation, index) => {
          let text = `Citazione ${index + 1}. `;
          if (citation.author) text += `${citation.author}. `;
          if (citation.quote_text || citation.text) text += citation.quote_text || citation.text;
          return text;
        })
        .join('. ');

    case 'qa':
      if (!state.currentEntry.qa || state.currentEntry.qa.length === 0) return null;
      return state.currentEntry.qa
        .map(item => `Domanda: ${item.question}. Risposta: ${item.answer}`)
        .join('. ');

    case 'notes':
      return state.currentEntry.notes || null;

    default:
      return null;
  }
}
