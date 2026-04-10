// Popup Features Module - Estratto da popup.js
// Gestisce: Q&A e traduzione

import { state, elements, showError } from './state.js';
import { HtmlSanitizer } from '../../utils/security/html-sanitizer.js';
import { StorageManager } from '../../utils/storage/storage-manager.js';
import { I18n } from '../../utils/i18n/i18n.js';
import { HistoryManager } from '../../utils/storage/history-manager.js';
import { InputSanitizer } from '../../utils/security/input-sanitizer.js';
import { AdvancedAnalysis } from '../../utils/ai/advanced-analysis.js';
import { ContentDetector } from '../../utils/ai/content-detector.js';
import { Translator } from '../../utils/core/translator.js';
import { Modal } from '../../utils/core/modal.js';
import { VoiceController } from '../../utils/voice/voice-controller.js';
import { createTTSButton } from './voice.js';
import { Logger } from '../../utils/core/logger.js';

// Translation System — usa un oggetto wrapper per permettere la mutazione cross-modulo
export const translationState = { value: null };

// Citations System — stesso pattern
export const citationsState = { value: null };

// Getter/setter per compatibilità con i moduli che importano i valori
export function getCurrentTranslation() {
  return translationState.value;
}
export function setCurrentTranslation(val) {
  translationState.value = val;
}
export function getCurrentCitations() {
  return citationsState.value;
}
export function setCurrentCitations(val) {
  citationsState.value = val;
}

// Q&A System
export async function askQuestion() {
  const question = elements.questionInput.value.trim();

  if (!question) {
    return;
  }

  if (!state.currentArticle || !state.currentResults) {
    showError('Nessun articolo analizzato');
    return;
  }

  // ✅ SANITIZZA LA DOMANDA UTENTE
  let cleanQuestion;
  try {
    cleanQuestion = InputSanitizer.sanitizeUserPrompt(question, {
      maxLength: 500,
      minLength: 3,
    });
  } catch (error) {
    await Modal.error(I18n.t('qa.invalidQuestion') + error.message, I18n.t('common.invalidInput'));
    return;
  }

  elements.askBtn.disabled = true;
  elements.askBtn.textContent = I18n.t('feedback.loading');
  elements.qaAnswer.classList.remove('hidden');
  elements.qaAnswer.classList.add('loading');
  elements.qaAnswer.textContent = I18n.t('feedback.thinking');

  try {
    const settings = await StorageManager.getSettings();
    const provider = elements.providerSelect.value;
    const apiKey = await StorageManager.getApiKey(provider);

    if (!apiKey) {
      throw new Error('API key non configurata per ' + provider);
    }

    settings.outputLanguage = state.selectedLanguage;

    const answer = await AdvancedAnalysis.askQuestion(
      cleanQuestion, // ← Usa versione sanitizzata
      state.currentArticle,
      state.currentResults.summary,
      provider,
      apiKey,
      settings,
    );

    elements.qaAnswer.classList.remove('loading');

    // Crea contenitore per risposta con pulsante TTS
    const answerContainer = document.createElement('div');
    answerContainer.className = 'qa-answer-container';

    const answerText = document.createElement('div');
    answerText.className = 'qa-answer-text';
    answerText.textContent = answer;

    const voiceLang = VoiceController.mapLanguageCode(state.selectedLanguage);
    const ttsBtn = createTTSButton(answer, voiceLang, 'Leggi Risposta');
    ttsBtn.style.marginTop = '8px';

    answerContainer.appendChild(answerText);
    answerContainer.appendChild(ttsBtn);

    elements.qaAnswer.innerHTML = '';
    elements.qaAnswer.appendChild(answerContainer);

    // Salva la Q&A nell'array (usa la domanda sanitizzata)
    state.currentQA.push({
      question: cleanQuestion,
      answer: answer,
      timestamp: new Date().toISOString(),
    });

    // Aggiorna anche la cronologia con le Q&A
    if (state.currentArticle && state.currentArticle.url) {
      await HistoryManager.updateSummaryWithQA(state.currentArticle.url, state.currentQA);
    }

    elements.questionInput.value = '';
  } catch (error) {
    Logger.error('Errore Q&A:', error);
    elements.qaAnswer.classList.remove('loading');
    elements.qaAnswer.textContent = I18n.t('feedback.error') + ' ' + error.message;
  } finally {
    elements.askBtn.disabled = false;
    elements.askBtn.textContent = I18n.t('qa.ask');
  }
}

export async function translateArticle() {
  if (!state.currentArticle) {
    showError('Nessun articolo da tradurre');
    return;
  }

  elements.translateBtn.disabled = true;
  elements.translateBtn.textContent = I18n.t('feedback.translating');

  // Mostra loading
  elements.translationContent.innerHTML =
    '<div class="translation-loading">Traduzione in corso... Questo potrebbe richiedere 10-30 secondi.</div>';

  try {
    const provider = elements.providerSelect.value;
    const apiKey = await StorageManager.getApiKey(provider);

    if (!apiKey) {
      throw new Error('API key non configurata per ' + provider);
    }

    const targetLanguage = state.selectedLanguage;

    // Rileva lingua originale (semplice detection)
    const originalLanguage = ContentDetector.detectLanguage(state.currentArticle.content);

    // Controlla cache prima
    const cached = await StorageManager.getCachedTranslation(
      state.currentArticle.url,
      provider,
      targetLanguage,
    );

    let translation;
    let fromCache = false;

    if (cached) {
      translation = cached.translation;
      fromCache = true;
      Logger.info('Traduzione caricata da cache');
    } else {
      // Se la lingua è già quella target, avvisa
      if (originalLanguage === targetLanguage) {
        const confirmed = await Modal.confirm(
          `L'articolo sembra già essere in ${targetLanguage}. Vuoi comunque tradurlo?`,
          'Conferma Traduzione',
          '🌍',
        );

        if (!confirmed) {
          resetTranslationButton();
          elements.translationContent.innerHTML = `
            <div class="translation-empty">
              <p>Clicca sul pulsante per tradurre l'articolo completo</p>
              <button id="translateBtn" class="btn btn-primary">🌍 Traduci Articolo</button>
            </div>
          `;
          document.getElementById('translateBtn').addEventListener('click', translateArticle);
          return;
        }
      }

      translation = await Translator.translateArticle(
        state.currentArticle,
        targetLanguage,
        provider,
        apiKey,
      );

      // Salva in cache
      await StorageManager.saveCachedTranslation(
        state.currentArticle.url,
        provider,
        targetLanguage,
        translation,
        originalLanguage,
      );

      // Salva nello storico
      await HistoryManager.updateSummaryWithTranslation(
        state.currentArticle.url,
        translation,
        targetLanguage,
        originalLanguage,
      );
    }

    translationState.value = translation;
    displayTranslation(translation, targetLanguage, originalLanguage, fromCache);
  } catch (error) {
    Logger.error('Errore traduzione:', error);
    elements.translationContent.innerHTML = `
      <div class="translation-empty">
        <p class="translation-error">❌ Errore durante la traduzione: ${HtmlSanitizer.escape(error.message)}</p>
        <button id="translateBtn" class="btn btn-primary">🔄 Riprova</button>
      </div>
    `;
    // Re-attach event listener
    document.getElementById('translateBtn').addEventListener('click', translateArticle);
  } finally {
    resetTranslationButton();
  }
}

function displayTranslation(translation, targetLang, originalLang, fromCache = false) {
  const languageNames = {
    it: 'Italiano',
    en: 'Inglese',
    es: 'Spagnolo',
    fr: 'Francese',
    de: 'Tedesco',
  };

  const targetName = languageNames[targetLang] || targetLang;
  const originalName = languageNames[originalLang] || originalLang;

  const cacheBadge = fromCache ? '<span class="cache-badge">Da cache</span>' : '';

  elements.translationContent.innerHTML = `
    <div class="translation-header">
      <div class="translation-info">
        📝 Tradotto da ${originalName} a ${targetName} ${cacheBadge}
      </div>
      <div class="translation-actions">
        <button id="copyTranslationBtn" class="btn-icon" title="Copia traduzione">📋</button>
        <button id="retranslateBtn" class="btn-icon" title="Traduci di nuovo">🔄</button>
      </div>
    </div>
    <div class="translation-text">${HtmlSanitizer.escape(translation)}</div>
  `;

  // Add event listeners
  document.getElementById('copyTranslationBtn').addEventListener('click', copyTranslation);
  document.getElementById('retranslateBtn').addEventListener('click', async () => {
    const confirmed = await Modal.confirm(
      'Vuoi generare una nuova traduzione? Quella in cache verrà sostituita.',
      'Rigenera Traduzione',
      '🔄',
    );

    if (confirmed) {
      // Forza rigenerazione rimuovendo dalla cache
      clearTranslationCache().then(() => translateArticle());
    }
  });
}

async function clearTranslationCache() {
  const provider = elements.providerSelect.value;
  await StorageManager.clearTranslationCacheEntry(
    state.currentArticle.url,
    provider,
    state.selectedLanguage,
  );
}

function resetTranslationButton() {
  elements.translateBtn.disabled = false;
  elements.translateBtn.textContent = '🌍 Traduci Articolo';
}

async function copyTranslation() {
  if (!translationState.value) return;

  try {
    await navigator.clipboard.writeText(translationState.value);
    const btn = document.getElementById('copyTranslationBtn');
    const originalText = btn.textContent;
    btn.textContent = '✓';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  } catch (error) {
    Logger.error('Errore copia:', error);
  }
}
