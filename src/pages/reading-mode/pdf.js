// Reading Mode - PDF Module
// Funzioni helper per operazioni AI su documenti PDF:
// traduzione, estrazione citazioni, Q&A

import { APIClient } from '../../utils/ai/api-client.js';
import { parseLLMJson } from '../../utils/ai/json-repair.js';
import { StorageManager } from '../../utils/storage/storage-manager.js';
import { Logger } from '../../utils/core/logger.js';
import { getLanguageNameForPrompt } from '../../utils/i18n/language-names.js';

// Translate PDF text
export async function translatePDFText(
  text,
  targetLanguage,
  provider,
  apiKey,
  forceTranslate = false,
) {
  Logger.info('Translating PDF text to:', targetLanguage, 'Force:', forceTranslate);

  const targetLangName = getLanguageNameForPrompt(targetLanguage);

  // Build prompt
  let systemPrompt, userPrompt;

  if (forceTranslate) {
    // Prompt per forzare la traduzione anche se già nella lingua corretta
    systemPrompt = `Sei un traduttore professionale.
Il tuo compito è riformattare e migliorare il testo in ${targetLangName}, anche se è già in quella lingua.
Mantieni il significato originale ma migliora la formattazione, correggi errori e rendi il testo più fluente.`;

    userPrompt = `Riformatta e migliora questo testo in ${targetLangName}:

${text}`;
  } else {
    // Prompt normale con rilevamento lingua
    systemPrompt = `Sei un traduttore professionale.
Se il testo è già in ${targetLangName}, rispondi ESATTAMENTE con: "SAME_LANGUAGE"
Altrimenti, traduci il testo in ${targetLangName} mantenendo formattazione e struttura.`;

    userPrompt = `Traduci questo testo in ${targetLangName}:

${text}`;
  }

  // Call API
  try {
    const translation = await APIClient.generateCompletion(
      provider,
      apiKey,
      systemPrompt,
      userPrompt,
      {
        temperature: 0.3,
        maxTokens: 4000,
      },
    );

    // Check if same language detected
    if (!forceTranslate && translation.includes('SAME_LANGUAGE')) {
      return { sameLanguage: true };
    }

    return { sameLanguage: false, translation };
  } catch (error) {
    Logger.error('API translation error:', error);
    throw new Error('Errore durante la traduzione: ' + error.message);
  }
}

// Extract citations from PDF text
export async function extractPDFCitations(text, filename, provider, _settings) {
  Logger.info('Extracting citations from PDF:', filename);

  const apiKey = await StorageManager.getApiKey(provider);
  if (!apiKey) {
    throw new Error('API key non configurata per ' + provider);
  }

  // Build prompt for citation extraction
  const systemPrompt = `Sei un esperto nell'analisi di documenti accademici e scientifici.
Il tuo compito è identificare ed estrarre tutte le citazioni, riferimenti bibliografici e fonti presenti nel testo.

Estrai:
- Citazioni dirette (tra virgolette)
- Riferimenti bibliografici
- Menzioni di autori e opere
- Dati e statistiche con fonte

Rispondi in formato JSON:
{
  "citations": [
    {
      "quote_text": "testo citazione",
      "author": "autore (se presente)",
      "source": "fonte (se presente)",
      "type": "direct_quote | reference | statistic"
    }
  ],
  "total_citations": numero
}`;

  const userPrompt = `Analizza questo documento PDF ed estrai tutte le citazioni e riferimenti:

${text}

Rispondi in formato JSON come specificato.`;

  try {
    const response = await APIClient.generateCompletion(
      provider,
      apiKey,
      systemPrompt,
      userPrompt,
      {
        temperature: 0.1,
        maxTokens: 2000,
      },
    );

    try {
      return parseLLMJson(response);
    } catch {
      return { citations: [], total_citations: 0 };
    }
  } catch (error) {
    Logger.error('Error extracting PDF citations:', error);
    throw new Error('Errore estrazione citazioni: ' + error.message);
  }
}

// Ask question about PDF
export async function askQuestionPDF(question, extractedText, summary, provider, apiKey) {
  Logger.info('Asking question about PDF:', question);

  // Build prompt
  const systemPrompt = `Sei un assistente esperto nell'analisi di documenti.
Rispondi alle domande basandoti ESCLUSIVAMENTE sul contenuto del documento fornito.

REGOLE:
1. Usa solo informazioni presenti nel documento
2. Se l'informazione non è nel documento, dillo chiaramente
3. Sii preciso e conciso
4. Cita parti specifiche del documento quando possibile`;

  const userPrompt = `DOCUMENTO:
${extractedText}

RIASSUNTO:
${summary}

DOMANDA:
${question}

Rispondi alla domanda basandoti sul documento sopra.`;

  try {
    const answer = await APIClient.generateCompletion(provider, apiKey, systemPrompt, userPrompt, {
      temperature: 0.3,
      maxTokens: 1000,
    });

    return answer;
  } catch (error) {
    Logger.error('Error asking question about PDF:', error);
    throw new Error('Errore durante la risposta: ' + error.message);
  }
}
