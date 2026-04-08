// Popup Voice Module - Estratto da popup.js
// Gestisce: VoiceController, handleVoiceQuestion, addTTSButtons, createTTSButton, showVoiceSelector, speakQAAnswer

import { state, elements } from './state.js';
import { translationState } from './features.js';
import { HtmlSanitizer } from '../../utils/security/html-sanitizer.js';
import { Modal } from '../../utils/core/modal.js';
import { VoiceController } from '../../utils/voice/voice-controller.js';
import { STTManager } from '../../utils/voice/stt-manager.js';
import { askQuestion } from './features.js';

// Voice Controller
let voiceController = null;

// Inizializza Voice Controller
export async function initVoiceController() {
  if (!voiceController) {
    voiceController = new VoiceController();
    await voiceController.initialize();
    console.log('🎤 Voice Controller inizializzato');
  }
}

// Voice Question Handler
export async function handleVoiceQuestion() {
  const voiceBtn = document.getElementById('voiceQuestionBtn');
  const listeningIndicator = document.getElementById('listeningIndicator');
  const interimTranscript = document.getElementById('interimTranscript');

  if (!voiceController) {
    await Modal.error('Voice Controller non inizializzato', 'Errore');
    return;
  }

  if (!STTManager.isSupported()) {
    await Modal.error(
      'Il riconoscimento vocale non è supportato in questo browser. Usa Chrome o Edge.',
      'Funzionalità Non Supportata'
    );
    return;
  }

  try {
    // Mostra indicatore ascolto
    voiceBtn.classList.add('listening');
    listeningIndicator.classList.add('active');
    interimTranscript.style.display = 'block';

    // Listener per trascrizione provvisoria
    const handleInterim = (event) => {
      interimTranscript.textContent = event.detail.transcript;
    };
    window.addEventListener('stt:interim', handleInterim);

    // Mappa lingua output a lingua vocale
    const voiceLang = VoiceController.mapLanguageCode(state.selectedLanguage);

    // Avvia ascolto
    const transcript = await voiceController.startListening(voiceLang);

    // Rimuovi listener
    window.removeEventListener('stt:interim', handleInterim);

    // Nascondi indicatori
    voiceBtn.classList.remove('listening');
    listeningIndicator.classList.remove('active');
    interimTranscript.style.display = 'none';

    // Inserisci la domanda nell'input
    elements.questionInput.value = transcript;

    // Invia automaticamente la domanda
    await askQuestion();

  } catch (error) {
    console.error('Errore domanda vocale:', error);

    // Nascondi indicatori
    voiceBtn.classList.remove('listening');
    listeningIndicator.classList.remove('active');
    interimTranscript.style.display = 'none';

    await Modal.error(error.message, 'Errore Riconoscimento Vocale');
  }
}

// Aggiungi pulsanti TTS ai contenuti
export function addTTSButtons() {
  if (!voiceController) return;

  const voiceLang = VoiceController.mapLanguageCode(state.selectedLanguage);

  // TTS per riassunto
  const summaryContent = document.getElementById('summaryContent');
  if (summaryContent && !summaryContent.querySelector('.tts-button')) {
    const ttsBtn = createTTSButton(state.currentResults.summary, voiceLang, 'Leggi Riassunto');
    summaryContent.insertBefore(ttsBtn, summaryContent.firstChild);
  }

  // TTS per punti chiave
  const keypointsContent = document.getElementById('keypointsContent');
  if (keypointsContent && !keypointsContent.querySelector('.tts-button')) {
    const keypointsText = state.currentResults.keyPoints
      .map((kp, i) => `${i + 1}. ${kp.title}. ${kp.description}`)
      .join('. ');
    const ttsBtn = createTTSButton(keypointsText, voiceLang, 'Leggi Punti Chiave');
    keypointsContent.insertBefore(ttsBtn, keypointsContent.firstChild);
  }

  // TTS per traduzione (se presente)
  if (translationState.value) {
    const translationText = document.querySelector('.translation-text');
    if (translationText && !translationText.parentElement.querySelector('.tts-button')) {
      const ttsBtn = createTTSButton(translationState.value, voiceLang, 'Leggi Traduzione');
      translationText.parentElement.insertBefore(ttsBtn, translationText);
    }
  }
}

// Crea pulsante TTS con selezione voce
export function createTTSButton(text, lang, label = 'Leggi') {
  const container = document.createElement('div');
  container.className = 'tts-button-container';

  const button = document.createElement('button');
  button.className = 'tts-button';
  button.innerHTML = `🔊 <span>${label}</span>`;
  button.title = label;

  button.addEventListener('click', () => {
    const ttsState = voiceController.getTTSState();

    if (ttsState.isSpeaking) {
      // Se sta parlando, ferma
      voiceController.stopSpeaking();
      button.classList.remove('active');
      button.innerHTML = `🔊 <span>${label}</span>`;
    } else {
      // Altrimenti, inizia a parlare
      voiceController.speak(text, lang);
      button.classList.add('active');
      button.innerHTML = `⏹️ <span>Stop</span>`;
    }
  });

  // Listener per quando TTS termina
  const handleTTSEnd = () => {
    button.classList.remove('active');
    button.innerHTML = `🔊 <span>${label}</span>`;
  };
  window.addEventListener('tts:ended', handleTTSEnd);
  window.addEventListener('tts:stopped', handleTTSEnd);

  // Aggiungi pulsante per selezione voce
  const voiceBtn = document.createElement('button');
  voiceBtn.className = 'tts-voice-select-btn';
  voiceBtn.innerHTML = '⚙️';
  voiceBtn.title = 'Seleziona voce';
  voiceBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showVoiceSelector(lang);
  });

  container.appendChild(button);
  container.appendChild(voiceBtn);

  return container;
}

// Mostra selettore voce
export async function showVoiceSelector(lang) {
  const voices = voiceController.ttsManager.getVoicesForLanguage(lang);
  const currentVoice = voiceController.ttsManager.getPreferredVoice(lang);

  if (voices.length === 0) {
    await Modal.alert('Nessuna voce disponibile per questa lingua', 'Selezione Voce', '🔊');
    return;
  }

  // Crea lista voci
  let voiceList = '<div class="voice-list">';
  voices.forEach(voice => {
    const isSelected = voice.voiceName === currentVoice;
    const localBadge = voice.localService ? '<span class="badge-local">Locale</span>' : '<span class="badge-remote">Remota</span>';
    voiceList += `
      <div class="voice-item ${isSelected ? 'selected' : ''}" data-voice="${HtmlSanitizer.escape(voice.voiceName)}">
        <div class="voice-info">
          <div class="voice-name">${HtmlSanitizer.escape(voice.voiceName)}</div>
          <div class="voice-meta">
            <span class="voice-lang">${HtmlSanitizer.escape(voice.lang)}</span>
            ${localBadge}
          </div>
        </div>
        ${isSelected ? '<span class="voice-check">✓</span>' : ''}
      </div>
    `;
  });
  voiceList += '</div>';

  // Mostra modal personalizzato
  const modal = document.getElementById('customModal');
  const icon = document.getElementById('modalIcon');
  const title = document.getElementById('modalTitle');
  const message = document.getElementById('modalMessage');
  const confirmBtn = document.getElementById('modalConfirmBtn');
  const cancelBtn = document.getElementById('modalCancelBtn');

  icon.textContent = '🔊';
  title.textContent = 'Seleziona Voce TTS';
  message.innerHTML = voiceList;
  confirmBtn.textContent = 'Chiudi';
  cancelBtn.classList.add('hidden');

  modal.classList.remove('hidden');

  // Aggiungi event listeners alle voci
  let selectedVoice = currentVoice;
  document.querySelectorAll('.voice-item').forEach(item => {
    item.addEventListener('click', () => {
      // Rimuovi selezione precedente
      document.querySelectorAll('.voice-item').forEach(i => {
        i.classList.remove('selected');
        const check = i.querySelector('.voice-check');
        if (check) check.remove();
      });

      // Aggiungi nuova selezione
      item.classList.add('selected');
      const check = document.createElement('span');
      check.className = 'voice-check';
      check.textContent = '✓';
      item.appendChild(check);

      selectedVoice = item.dataset.voice;
    });
  });

  // Handler conferma
  const handleConfirm = async () => {
    if (selectedVoice) {
      await voiceController.ttsManager.setPreferredVoice(lang, selectedVoice);
      console.log(`✓ Voce impostata per ${lang}:`, selectedVoice);
    }
    modal.classList.add('hidden');
    confirmBtn.removeEventListener('click', handleConfirm);
  };

  confirmBtn.addEventListener('click', handleConfirm);

  // Close on overlay click
  const overlay = modal.querySelector('.custom-modal-overlay');
  overlay.addEventListener('click', handleConfirm, { once: true });
}

// Leggi risposta Q&A ad alta voce
export async function speakQAAnswer(answer) {
  if (!voiceController) return;

  const voiceLang = VoiceController.mapLanguageCode(state.selectedLanguage);
  voiceController.speak(answer, voiceLang);
}
