// History Voice Module
// Gestisce: TTS controls nel modal dettaglio

import { state } from './state.js';
import { Modal } from '../../utils/core/modal.js';
import { VoiceController } from '../../utils/voice/voice-controller.js';
import {
  setupTTSEventListeners,
  handleTTSPlay as helperTTSPlay,
  handleTTSPause as helperTTSPause,
  handleTTSStop as helperTTSStop,
} from '../../shared/voice-page-helper.js';

// ============================================
// VOICE CONTROLS
// ============================================

/**
 * Setup voice event listeners (solo TTS, nessun STT nella history)
 */
export function setupVoiceEventListeners() {
  // I pulsanti TTS sono nel modal e vengono risolti a runtime via getElementById
  setupTTSEventListeners({
    getButtons: () => ({
      playBtn: document.getElementById('modalTtsPlayBtn'),
      pauseBtn: document.getElementById('modalTtsPauseBtn'),
      stopBtn: document.getElementById('modalTtsStopBtn'),
    }),
    onError: (errorDetail) => {
      Modal.error('Errore nella lettura vocale: ' + errorDetail.error);
    },
  });
}

/**
 * Handle TTS play/resume in modal
 */
export function handleModalTTSPlay() {
  if (!state.currentEntry) return;

  const lang = state.currentEntry.metadata?.language || 'it';
  const voiceLang = VoiceController.mapLanguageCode(lang);

  helperTTSPlay(state.voiceController, getCurrentModalTabText, voiceLang, () => {
    Modal.alert('Nessun testo da leggere', 'Lettura Vocale', 'ℹ️');
  });
}

/**
 * Handle TTS pause in modal
 */
export function handleModalTTSPause() {
  helperTTSPause(state.voiceController);
}

/**
 * Handle TTS stop in modal
 */
export function handleModalTTSStop() {
  helperTTSStop(state.voiceController);
}

/**
 * Get text from current active modal tab
 */
function getCurrentModalTabText() {
  if (!state.currentEntry) return null;

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
        .map((item) => `Domanda: ${item.question}. Risposta: ${item.answer}`)
        .join('. ');

    case 'notes':
      return state.currentEntry.notes || null;

    default:
      return null;
  }
}
