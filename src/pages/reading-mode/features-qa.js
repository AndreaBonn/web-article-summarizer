// Reading Mode - Q&A Module
// Handles: askQuestion for both articles and PDFs

import { state, elements } from './state.js';
import { HtmlSanitizer } from '../../utils/security/html-sanitizer.js';
import { InputSanitizer } from '../../utils/security/input-sanitizer.js';
import { Logger } from '../../utils/core/logger.js';
import { StorageManager } from '../../utils/storage/storage-manager.js';
import { I18n } from '../../utils/i18n/i18n.js';
import { Modal } from '../../utils/core/modal.js';
import { askQuestionPDF } from './pdf.js';
import { updateDataInStorage } from './features.js';

// Ask question
export async function askQuestion() {
  const rawQuestion = elements.qaInput.value.trim();
  if (!rawQuestion || !state.currentData) return;

  // Sanitize user input before sending to AI
  let question;
  try {
    question = InputSanitizer.sanitizeUserPrompt(rawQuestion, {
      maxLength: 500,
      minLength: 3,
    });
  } catch (error) {
    await Modal.error(I18n.t('qa.invalidQuestion') + error.message, I18n.t('common.invalidInput'));
    return;
  }

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

    let answer;

    if (state.currentData.isPDF) {
      // For PDFs, use extracted text directly (needs API key for specialized PDF prompt)
      const apiKey = await StorageManager.getApiKey(provider);
      if (!apiKey) {
        throw new Error('API key non configurata per ' + provider);
      }
      answer = await askQuestionPDF(
        question,
        state.currentData.extractedText,
        state.currentData.summary,
        provider,
        apiKey,
      );
    } else {
      // For articles, prepare article with paragraphs structure
      const articleWithParagraphs = {
        ...state.currentData.article,
        paragraphs: [],
      };

      if (state.currentData.article.content && !state.currentData.article.paragraphs) {
        const paragraphs = state.currentData.article.content.split('\n\n');
        articleWithParagraphs.paragraphs = paragraphs
          .filter((p) => p.trim())
          .map((text, index) => ({
            id: index + 1,
            text: text.trim(),
          }));
      } else if (state.currentData.article.paragraphs) {
        articleWithParagraphs.paragraphs = state.currentData.article.paragraphs;
      }

      // Delegate to service worker (API key stays in background)
      const qaResponse = await chrome.runtime.sendMessage({
        action: 'askQuestion',
        question,
        article: articleWithParagraphs,
        summary: state.currentData.summary,
        provider,
        settings,
      });

      if (!qaResponse.success) {
        throw new Error(qaResponse.error);
      }

      answer = qaResponse.result.answer;
    }

    // Update answer
    qaItem.querySelector('.qa-answer').textContent = `A: ${answer}`;

    // Save to current data
    if (!state.currentData.qa) state.currentData.qa = [];
    state.currentData.qa.push({
      question,
      answer,
      timestamp: new Date().toISOString(),
    });

    // Update in storage
    await updateDataInStorage();
  } catch (error) {
    Logger.error('Q&A error:', error);
    qaItem.querySelector('.qa-answer').textContent = `❌ Errore: ${error.message}`;
  }
}
