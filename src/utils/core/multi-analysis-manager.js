// Multi-Analysis Manager - Gestione analisi multi-articolo
import { StorageManager } from '../storage/storage-manager.js';
import { APIClient } from '../ai/api-client.js';
import { parseLLMJson } from '../ai/json-repair.js';
import { Logger } from './logger.js';
import {
  getGlobalSummaryPrompt,
  getComparisonPrompt,
  getQAPrompt,
} from '../ai/prompts/multi-analysis-prompts.js';

export class MultiAnalysisManager {
  static async checkArticlesRelation(articles) {
    // Usa l'AI per analisi semantica intelligente
    const settings = await StorageManager.getSettings();
    const provider = settings.selectedProvider || 'groq';
    const apiKey = await StorageManager.getApiKey(provider);

    if (!apiKey) {
      // Fallback: assume correlati se non c'è API key
      Logger.warn('API key non disponibile per verifica correlazione');
      return { related: true, reason: null };
    }

    try {
      return await this.checkCorrelationWithAI(articles, provider, apiKey);
    } catch (error) {
      Logger.error('Errore verifica correlazione:', error);
      // Fallback: assume correlati in caso di errore
      return { related: true, reason: null };
    }
  }

  static async checkCorrelationWithAI(articles, provider, apiKey) {
    // Prepara sintesi degli articoli per l'analisi
    const articlesInfo = articles
      .map((a, index) => {
        const content = a.translation
          ? a.translation.text.substring(0, 300)
          : a.summary.substring(0, 300);
        return `
ARTICOLO ${index + 1}:
Titolo: ${a.article.title}
Estratto: ${content}...
`;
      })
      .join('\n');

    const systemPrompt = `Sei un esperto analista di contenuti specializzato nell'identificare relazioni tematiche tra articoli.

Il tuo compito è determinare se un gruppo di articoli tratta argomenti correlati o completamente scollegati.

DEFINIZIONI:
- **CORRELATI**: Gli articoli condividono temi, argomenti, settori o contesti comuni. Possono avere prospettive diverse ma trattano argomenti che hanno senso analizzare insieme.
- **NON CORRELATI**: Gli articoli trattano argomenti completamente diversi senza alcun legame tematico, settoriale o contestuale.

ESEMPI DI ARTICOLI CORRELATI:
- Tutti parlano di intelligenza artificiale (anche se da prospettive diverse)
- Tutti riguardano lo stesso settore (es. finanza, salute, tecnologia)
- Tutti trattano lo stesso evento o fenomeno
- Tutti affrontano temi sociali/politici interconnessi
- Condividono un contesto geografico o temporale rilevante

ESEMPI DI ARTICOLI NON CORRELATI:
- Uno parla di cucina, uno di fisica quantistica, uno di calcio
- Argomenti completamente diversi senza alcun punto di contatto
- Settori e contesti totalmente scollegati

IMPORTANTE:
- Sii generoso: se c'è anche solo un legame tematico ragionevole, considera gli articoli correlati
- Considera correlati anche articoli che trattano lo stesso tema da angolazioni molto diverse
- Considera il contesto: articoli su aziende diverse dello stesso settore sono correlati

FORMATO RISPOSTA:
Rispondi SOLO con un JSON in questo formato:
{
  "correlati": true/false,
  "motivazione": "Breve spiegazione della decisione",
  "temi_comuni": ["tema1", "tema2", ...] oppure []
}`;

    const userPrompt = `Analizza i seguenti ${articles.length} articoli e determina se sono correlati:

${articlesInfo}

---

Rispondi SOLO con il JSON nel formato specificato.`;

    const response = await APIClient.generateCompletion(
      provider,
      apiKey,
      systemPrompt,
      userPrompt,
      {
        temperature: 0.1, // Bassa temperatura per risposta più deterministica
        maxTokens: 500,
      },
    );

    try {
      const result = parseLLMJson(response);
      if (result) {
        // Log per debugging
        Logger.debug('Analisi correlazione articoli:', result);

        return {
          related: result.correlati === true,
          reason: result.motivazione || null,
          commonThemes: result.temi_comuni || [],
        };
      }

      // Fallback: cerca parole chiave nella risposta
      const lowerResponse = response.toLowerCase();
      const isRelated =
        lowerResponse.includes('"correlati": true') ||
        lowerResponse.includes('"correlati":true') ||
        (lowerResponse.includes('correlati') && !lowerResponse.includes('non correlati'));

      return {
        related: isRelated,
        reason: isRelated ? null : 'Gli articoli trattano argomenti diversi',
        commonThemes: [],
      };
    } catch (error) {
      Logger.error('Errore parsing risposta correlazione:', error);
      // In caso di dubbio, assume correlati
      return { related: true, reason: null, commonThemes: [] };
    }
  }

  static async analyzeArticles(articles, options, progressCallback) {
    const result = {
      articles: articles.map((a) => ({
        id: a.id,
        title: a.article.title,
        url: a.article.url,
      })),
      timestamp: Date.now(),
      globalSummary: null,
      comparison: null,
      qa: null,
    };

    const settings = await StorageManager.getSettings();
    const provider = settings.selectedProvider || 'groq';
    const apiKey = await StorageManager.getApiKey(provider);

    if (!apiKey) {
      throw new Error(`API key per ${provider} non configurata`);
    }

    let progress = 20;
    const step = 60 / Object.values(options).filter(Boolean).length;

    if (options.globalSummary) {
      if (progressCallback) progressCallback('Generazione riassunto globale...', progress);
      result.globalSummary = await this.generateGlobalSummary(articles, provider, apiKey);
      progress += step;
    }

    if (options.comparison) {
      if (progressCallback) progressCallback('Analisi confronto idee...', progress);
      result.comparison = await this.generateComparison(articles, provider, apiKey);
      progress += step;
    }

    if (options.qa) {
      if (progressCallback) progressCallback('Preparazione Q&A interattivo...', progress);
      // Q&A interattivo - non genera domande, prepara il contesto
      result.qa = {
        interactive: true,
        articles: articles.map((a) => ({
          title: a.article.title,
          content: a.translation ? a.translation.text : a.summary,
        })),
      };
    }

    if (progressCallback) progressCallback('Salvataggio risultati...', 95);
    await this.saveAnalysis(result);

    if (progressCallback) progressCallback('Completato!', 100);

    return result;
  }

  static async generateGlobalSummary(articles, provider, apiKey) {
    const articlesContent = articles
      .map((a, index) => {
        const content = a.translation ? a.translation.text : a.summary;
        return `
## ARTICOLO ${index + 1}: ${a.article.title}

**URL:** ${a.article.url}
**Parole:** ${a.article.wordCount}

### Contenuto:
${content}

${
  a.keyPoints && a.keyPoints.length > 0
    ? `
### Punti Chiave:
${a.keyPoints.map((kp, i) => `${i + 1}. ${kp.title}: ${kp.description}`).join('\n')}
`
    : ''
}
`;
      })
      .join('\n\n' + '='.repeat(80) + '\n\n');

    const systemPrompt = getGlobalSummaryPrompt(provider);

    const userPrompt = `Crea un riassunto globale unificato dei seguenti ${articles.length} articoli:

${articlesContent}

---

Genera un riassunto globale che integri tutti questi contenuti in una narrazione coerente, organizzata per temi principali piuttosto che per singolo articolo.`;

    const options = {
      temperature: 0.3,
      maxTokens: provider === 'gemini' ? 8192 : 4000,
    };

    return await APIClient.generateCompletion(provider, apiKey, systemPrompt, userPrompt, options);
  }

  static async generateComparison(articles, provider, apiKey) {
    const articlesContent = articles
      .map((a, index) => {
        const content = a.translation ? a.translation.text : a.summary;
        return `
## ARTICOLO ${index + 1}: ${a.article.title}

${content}
`;
      })
      .join('\n\n');

    // Usa i prompt dal file comparazione_articoli.md
    const systemPrompt = getComparisonPrompt(provider);

    const userPrompt = `Analizza e confronta le idee presenti nei seguenti ${articles.length} articoli:

${articlesContent}

---

Genera un'analisi comparativa dettagliata che evidenzi idee comuni, conflitti, prospettive diverse e complementarietà tra gli articoli.`;

    // Parametri ottimizzati per provider
    const options = {
      temperature: 0.2,
      maxTokens: 4000,
    };

    // Gemini supporta output più lunghi e contesti più ampi
    if (provider === 'gemini') {
      options.maxTokens = 8000;
      options.model = 'gemini-2.5-pro'; // Usa il modello 2.5 per analisi più complesse
    }

    return await APIClient.generateCompletion(provider, apiKey, systemPrompt, userPrompt, options);
  }

  static async generateQA(articles, provider, apiKey) {
    const articlesContent = articles
      .map((a, index) => {
        const content = a.translation ? a.translation.text : a.summary;
        return `
## ARTICOLO ${index + 1}: ${a.article.title}

${content}
`;
      })
      .join('\n\n');

    const systemPrompt = getQAPrompt(provider);

    const userPrompt = `Genera 8-10 domande e risposte basate sui seguenti ${articles.length} articoli:

${articlesContent}

---

Genera domande che richiedano di:
- Sintetizzare informazioni da più articoli
- Confrontare posizioni e prospettive diverse
- Integrare contenuti complementari
- Analizzare implicazioni complessive

IMPORTANTE: Rispondi SOLO con il JSON nel formato specificato, senza markup markdown o testo aggiuntivo.`;

    const options = {
      temperature: 0.2,
      maxTokens: provider === 'gemini' ? 4096 : 3000,
    };

    const response = await APIClient.generateCompletion(
      provider,
      apiKey,
      systemPrompt,
      userPrompt,
      options,
    );

    try {
      // Pulizia response per Gemini (rimuove markdown)
      let cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      try {
        return parseLLMJson(cleanedResponse);
      } catch {
        // Fall through to text parsing
      }

      return this.parseQAFromText(response);
    } catch (error) {
      Logger.error('Errore parsing Q&A:', error);
      return this.parseQAFromText(response);
    }
  }

  static parseQAFromText(text) {
    const qa = [];
    const lines = text.split('\n');
    let currentQ = null;
    let currentA = '';

    for (const line of lines) {
      const qMatch = line.match(/^Q\d+[:.]?\s*(.+)/i);
      const aMatch = line.match(/^R\d+[:.]?\s*(.+)/i);

      if (qMatch) {
        if (currentQ && currentA) {
          qa.push({ question: currentQ, answer: currentA.trim() });
        }
        currentQ = qMatch[1].trim();
        currentA = '';
      } else if (aMatch) {
        currentA = aMatch[1].trim();
      } else if (currentA && line.trim()) {
        currentA += ' ' + line.trim();
      }
    }

    if (currentQ && currentA) {
      qa.push({ question: currentQ, answer: currentA.trim() });
    }

    return qa.length > 0
      ? qa
      : [
          {
            question: 'Quali sono i temi principali trattati negli articoli?',
            answer:
              "Gli articoli trattano diversi temi interconnessi che richiedono un'analisi approfondita.",
          },
        ];
  }

  static async saveAnalysis(analysis) {
    const result = await chrome.storage.local.get(['multiAnalysisHistory']);
    let history = result.multiAnalysisHistory || [];

    analysis.id = Date.now();

    history.unshift(analysis);

    if (history.length > 30) {
      history = history.slice(0, 30);
    }

    await chrome.storage.local.set({ multiAnalysisHistory: history });
  }

  static async getAnalysisHistory() {
    const result = await chrome.storage.local.get(['multiAnalysisHistory']);
    return result.multiAnalysisHistory || [];
  }

  static async getAnalysisById(id) {
    const history = await this.getAnalysisHistory();
    return history.find((a) => a.id === id);
  }

  static async deleteAnalysis(id) {
    const history = await this.getAnalysisHistory();
    const filtered = history.filter((a) => a.id !== id);
    await chrome.storage.local.set({ multiAnalysisHistory: filtered });
  }
}
