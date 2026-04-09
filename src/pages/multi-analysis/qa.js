import { HtmlSanitizer } from '../../utils/security/html-sanitizer.js';
import { StorageManager } from '../../utils/storage/storage-manager.js';
import { APIClient } from '../../utils/ai/api-client.js';
import { HistoryManager } from '../../utils/storage/history-manager.js';
import { state } from './state.js';

export async function submitQuestion() {
  const input = document.getElementById('qaInput');
  const question = input.value.trim();

  if (!question) return;

  const chatContainer = document.getElementById('qaChatContainer');
  const questionEl = document.createElement('div');
  questionEl.className = 'qa-message qa-question-msg';
  questionEl.innerHTML = `<strong>Tu:</strong> ${HtmlSanitizer.escape(question)}`;
  chatContainer.appendChild(questionEl);

  const loadingEl = document.createElement('div');
  loadingEl.className = 'qa-message qa-loading';
  loadingEl.innerHTML = '⏳ Sto pensando...';
  chatContainer.appendChild(loadingEl);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  input.value = '';
  input.disabled = true;
  document.getElementById('qaSubmitBtn').disabled = true;

  try {
    const answer = await askQuestionToArticles(question);

    loadingEl.remove();

    const answerEl = document.createElement('div');
    answerEl.className = 'qa-message qa-answer-msg';
    answerEl.innerHTML = `<strong>Assistente:</strong> ${HtmlSanitizer.escape(answer)}`;
    chatContainer.appendChild(answerEl);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    if (!state.currentAnalysis.qa.questions) {
      state.currentAnalysis.qa.questions = [];
    }
    state.currentAnalysis.qa.questions.push({ question, answer });

    if (state.currentAnalysis.id) {
      try {
        await HistoryManager.updateMultiAnalysisWithQA(state.currentAnalysis.id, question, answer);
      } catch (error) {
        console.error('Errore aggiornamento cronologia:', error);
      }
    }
  } catch (error) {
    loadingEl.remove();
    const errorEl = document.createElement('div');
    errorEl.className = 'qa-message qa-error-msg';
    errorEl.innerHTML = `<strong>Errore:</strong> ${HtmlSanitizer.escape(error.message)}`;
    chatContainer.appendChild(errorEl);
  } finally {
    input.disabled = false;
    document.getElementById('qaSubmitBtn').disabled = false;
    input.focus();
  }
}

async function askQuestionToArticles(question) {
  const settings = await StorageManager.getSettings();
  const provider = settings.selectedProvider || 'groq';
  const apiKey = await StorageManager.getApiKey(provider);

  if (!apiKey) {
    throw new Error('API key non configurata');
  }

  const articlesContext = state.currentAnalysis.qa.articles
    .map(
      (a, index) => `
ARTICOLO ${index + 1}: ${a.title}

${a.content}
`,
    )
    .join('\n\n' + '='.repeat(80) + '\n\n');

  const systemPrompt = `Sei un esperto analista di contenuti specializzato nel rispondere a domande basandoti esclusivamente sul contenuto degli articoli forniti.

PRINCIPI FONDAMENTALI:
1. Rispondi SOLO sulla base degli articoli forniti - non usare conoscenze esterne
2. Cita sempre gli articoli di riferimento (es. "L'articolo 1 afferma che...")
3. Se l'informazione NON è negli articoli, dillo chiaramente
4. Sii preciso: usa dati, nomi, cifre esatte dagli articoli
5. Distingui tra fatti espliciti e inferenze ragionevoli
6. Se la domanda è ambigua, chiedi chiarimento

FORMATO RISPOSTA:
- Rispondi direttamente alla domanda
- Usa citazioni o parafrasi precise dagli articoli
- Indica sempre gli articoli: "Secondo l'articolo 1..." o "Come menzionato nell'articolo 2..."
- Se l'info non c'è: "Gli articoli non menzionano [argomento]"
- Per inferenze: "Dagli articoli si può dedurre che... anche se non è esplicitamente affermato"

STILE:
- Conversazionale ma preciso
- Conciso: risposte di 2-5 frasi per domande semplici
- Più dettagliato per domande complesse
- Mai inventare informazioni`;

  const userPrompt = `# ARTICOLI DI RIFERIMENTO

${articlesContext}

---

# DOMANDA DELL'UTENTE

${question}

---

Rispondi basandoti esclusivamente sugli articoli sopra. Cita gli articoli di riferimento.`;

  return await APIClient.generateCompletion(provider, apiKey, systemPrompt, userPrompt, {
    temperature: 0.1,
    maxTokens: 1000,
  });
}
