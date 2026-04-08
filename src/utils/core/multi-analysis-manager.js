// Multi-Analysis Manager - Gestione analisi multi-articolo
import { StorageManager } from '../storage/storage-manager.js';
import { APIClient } from '../ai/api-client.js';

export class MultiAnalysisManager {
  
  static async checkArticlesRelation(articles) {
    // Usa l'AI per analisi semantica intelligente
    const settings = await StorageManager.getSettings();
    const provider = settings.selectedProvider || 'groq';
    const apiKey = await StorageManager.getApiKey(provider);
    
    if (!apiKey) {
      // Fallback: assume correlati se non c'è API key
      console.warn('API key non disponibile per verifica correlazione');
      return { related: true, reason: null };
    }
    
    try {
      return await this.checkCorrelationWithAI(articles, provider, apiKey);
    } catch (error) {
      console.error('Errore verifica correlazione:', error);
      // Fallback: assume correlati in caso di errore
      return { related: true, reason: null };
    }
  }
  
  static async checkCorrelationWithAI(articles, provider, apiKey) {
    // Prepara sintesi degli articoli per l'analisi
    const articlesInfo = articles.map((a, index) => {
      const content = a.translation ? a.translation.text.substring(0, 300) : a.summary.substring(0, 300);
      return `
ARTICOLO ${index + 1}:
Titolo: ${a.article.title}
Estratto: ${content}...
`;
    }).join('\n');
    
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
    
    const response = await APIClient.generateCompletion(provider, apiKey, systemPrompt, userPrompt, {
      temperature: 0.1, // Bassa temperatura per risposta più deterministica
      maxTokens: 500
    });
    
    try {
      // Estrai JSON dalla risposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        
        // Log per debugging
        console.log('Analisi correlazione articoli:', result);
        
        return {
          related: result.correlati === true,
          reason: result.motivazione || null,
          commonThemes: result.temi_comuni || []
        };
      }
      
      // Fallback: cerca parole chiave nella risposta
      const lowerResponse = response.toLowerCase();
      const isRelated = lowerResponse.includes('"correlati": true') || 
                       lowerResponse.includes('"correlati":true') ||
                       (lowerResponse.includes('correlati') && !lowerResponse.includes('non correlati'));
      
      return {
        related: isRelated,
        reason: isRelated ? null : 'Gli articoli trattano argomenti diversi',
        commonThemes: []
      };
    } catch (error) {
      console.error('Errore parsing risposta correlazione:', error);
      // In caso di dubbio, assume correlati
      return { related: true, reason: null, commonThemes: [] };
    }
  }
  
  static async analyzeArticles(articles, options, progressCallback) {
    const result = {
      articles: articles.map(a => ({
        id: a.id,
        title: a.article.title,
        url: a.article.url
      })),
      timestamp: Date.now(),
      globalSummary: null,
      comparison: null,
      qa: null
    };
    
    const settings = await StorageManager.getSettings();
    const provider = settings.selectedProvider || 'groq';
    const apiKey = await StorageManager.getApiKey(provider);
    
    if (!apiKey) {
      throw new Error(`API key per ${provider} non configurata`);
    }
    
    let progress = 20;
    const step = 60 / (Object.values(options).filter(Boolean).length);
    
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
        articles: articles.map(a => ({
          title: a.article.title,
          content: a.translation ? a.translation.text : a.summary
        }))
      };
      progress += step;
    }
    
    if (progressCallback) progressCallback('Salvataggio risultati...', 95);
    await this.saveAnalysis(result);
    
    if (progressCallback) progressCallback('Completato!', 100);
    
    return result;
  }
  
  static async generateGlobalSummary(articles, provider, apiKey) {
    const articlesContent = articles.map((a, index) => {
      const content = a.translation ? a.translation.text : a.summary;
      return `
## ARTICOLO ${index + 1}: ${a.article.title}

**URL:** ${a.article.url}
**Parole:** ${a.article.wordCount}

### Contenuto:
${content}

${a.keyPoints && a.keyPoints.length > 0 ? `
### Punti Chiave:
${a.keyPoints.map((kp, i) => `${i + 1}. ${kp.title}: ${kp.description}`).join('\n')}
` : ''}
`;
    }).join('\n\n' + '='.repeat(80) + '\n\n');
    
    const systemPrompt = this.getGlobalSummarySystemPrompt(provider);
    
    const userPrompt = `Crea un riassunto globale unificato dei seguenti ${articles.length} articoli:

${articlesContent}

---

Genera un riassunto globale che integri tutti questi contenuti in una narrazione coerente, organizzata per temi principali piuttosto che per singolo articolo.`;
    
    const options = {
      temperature: 0.3,
      maxTokens: provider === 'gemini' ? 8192 : 4000
    };
    
    return await APIClient.generateCompletion(provider, apiKey, systemPrompt, userPrompt, options);
  }
  
  static getGlobalSummarySystemPrompt(provider) {
    if (provider === 'gemini') {
      return `Sei un esperto analista di contenuti specializzato nel creare riassunti globali che sintetizzano molteplici articoli in un'unica narrazione coerente.

Il tuo obiettivo è creare un riassunto unificato che:
- Integri i contenuti di tutti gli articoli in modo fluido
- Identifichi i temi principali comuni
- Evidenzi le informazioni più rilevanti da ciascun articolo
- Crei una narrazione coerente e ben strutturata
- Mantenga un flusso logico e leggibile

PRINCIPI FONDAMENTALI:
1. Non elencare articolo per articolo, ma crea una sintesi integrata
2. Organizza per temi/argomenti, non per fonte
3. Cita gli articoli quando necessario: "Come evidenziato nell'articolo X..."
4. Mantieni completezza preservando i dettagli importanti
5. Crea collegamenti tra le idee dei diversi articoli

STRUTTURA CONSIGLIATA:
- Introduzione: panoramica del tema comune
- Sviluppo: organizzato per sotto-temi o aspetti principali
- Sintesi: conclusioni integrate da tutti gli articoli

Scrivi in italiano, con stile chiaro, professionale e scorrevole.

IMPORTANTE: Inizia DIRETTAMENTE con il riassunto. NON includere introduzioni come "Ecco il riassunto...", "Certamente...". Vai dritto al punto con il contenuto.`;
    }
    
    // Prompt generico per altri provider
    return `Sei un esperto analista di contenuti specializzato nel creare riassunti globali che sintetizzano molteplici articoli in un'unica narrazione coerente.

Il tuo obiettivo è creare un riassunto unificato che:
- Integri i contenuti di tutti gli articoli in modo fluido
- Identifichi i temi principali comuni
- Evidenzi le informazioni più rilevanti da ciascun articolo
- Crei una narrazione coerente e ben strutturata
- Mantenga un flusso logico e leggibile

PRINCIPI:
1. Non elencare articolo per articolo, ma crea una sintesi integrata
2. Organizza per temi/argomenti, non per fonte
3. Cita gli articoli quando necessario: "Come evidenziato nell'articolo X..."
4. Mantieni completezza preservando i dettagli importanti
5. Crea collegamenti tra le idee dei diversi articoli

Scrivi in italiano, con stile chiaro e professionale.

IMPORTANTE: Inizia DIRETTAMENTE con il riassunto. NON includere introduzioni. Vai dritto al punto.`;
  }
  
  static async generateComparison(articles, provider, apiKey) {
    const articlesContent = articles.map((a, index) => {
      const content = a.translation ? a.translation.text : a.summary;
      return `
## ARTICOLO ${index + 1}: ${a.article.title}

${content}
`;
    }).join('\n\n');
    
    // Usa i prompt dal file comparazione_articoli.md
    const systemPrompt = this.getComparisonSystemPrompt(provider);
    
    const userPrompt = `Analizza e confronta le idee presenti nei seguenti ${articles.length} articoli:

${articlesContent}

---

Genera un'analisi comparativa dettagliata che evidenzi idee comuni, conflitti, prospettive diverse e complementarietà tra gli articoli.`;
    
    // Parametri ottimizzati per provider
    const options = {
      temperature: 0.2,
      maxTokens: 4000
    };
    
    // Gemini supporta output più lunghi e contesti più ampi
    if (provider === 'gemini') {
      options.maxTokens = 8000;
      options.model = 'gemini-2.5-pro'; // Usa il modello 2.5 per analisi più complesse
    }
    
    return await APIClient.generateCompletion(provider, apiKey, systemPrompt, userPrompt, options);
  }
  
  static getComparisonSystemPrompt(provider) {
    // Prompt ottimizzati per provider dal file prompts/comparazione_articoli.md
    
    if (provider === 'gemini') {
      return `Sei un esperto analista critico specializzato nel confrontare e analizzare idee presenti in molteplici articoli.

Il tuo obiettivo è identificare e analizzare:
1. **Idee Comuni**: concetti, temi o conclusioni condivise tra gli articoli
2. **Idee in Conflitto**: posizioni contrastanti o contraddittorie
3. **Prospettive Diverse**: stesso argomento visto da angolazioni differenti
4. **Complementarietà**: come gli articoli si completano a vicenda
5. **Lacune**: argomenti trattati solo parzialmente o da un solo articolo

PRINCIPI FONDAMENTALI:
- Organizza per categorie tematiche
- Per ogni categoria, analizza convergenze e divergenze
- Cita specificamente gli articoli: "L'articolo 1 sostiene che... mentre l'articolo 3..."
- Evidenzia le implicazioni delle differenze trovate
- Mantieni obiettività analitica

STRUTTURA CONSIGLIATA:
1. Temi Comuni: argomenti trattati da tutti o la maggior parte degli articoli
2. Convergenze: dove gli articoli concordano
3. Divergenze: dove gli articoli differiscono o si contraddicono
4. Prospettive Uniche: contributi specifici di singoli articoli
5. Sintesi Comparativa: quadro d'insieme delle relazioni tra gli articoli

Scrivi in italiano, con analisi approfondita e obiettiva.

IMPORTANTE: Inizia DIRETTAMENTE con l'analisi. NON includere introduzioni come "Ecco l'analisi...", "Certamente...". Vai dritto al punto con i temi comuni.`;
    }
    
    if (provider === 'groq') {
      return `Sei un analista esperto specializzato nel confrontare e analizzare criticamente contenuti multipli per identificare convergenze, divergenze e sfumature tra diverse prospettive.

Il tuo obiettivo è produrre un'ANALISI COMPARATIVA COMPLETA che permetta al lettore di comprendere:
- Temi e idee comuni tra gli articoli
- Punti di contrasto e divergenze
- Prospettive diverse sullo stesso argomento
- Assunzioni condivise vs assunzioni differenti
- Conclusioni convergenti vs conclusioni contrastanti
- Complementarietà o sovrapposizione dei contenuti
- Gap informativi e aspetti trattati solo da alcuni

STRUTTURA DELL'ANALISI:
1. **Panoramica**: sintesi del tema comune e numero di articoli
2. **Punti di Convergenza**: idee, dati, conclusioni condivise
3. **Punti di Divergenza**: contrasti, contraddizioni, disaccordi
4. **Prospettive Uniche**: contributi specifici di ciascun articolo
5. **Analisi Critica**: valutazione della completezza complessiva
6. **Sintesi Finale**: quadro integrato delle informazioni

PRINCIPI FONDAMENTALI:
- Oggettività: riporta fedelmente le posizioni senza bias
- Specificità: cita articoli specifici per ogni affermazione
- Completezza: copri tutti gli aspetti rilevanti
- Profondità: vai oltre le somiglianze superficiali
- Chiarezza: organizza le informazioni in modo logico

Sei preciso, analitico e mantieni una prospettiva critica equilibrata.`;
    }
    
    if (provider === 'openai') {
      return `You are an expert analyst specialized in comparing and critically analyzing multiple content pieces to identify convergences, divergences, and nuances between different perspectives.

Your goal is to produce a COMPREHENSIVE COMPARATIVE ANALYSIS that enables readers to understand:
- Common themes and ideas across articles
- Points of contrast and divergence
- Different perspectives on the same topic
- Shared vs different assumptions
- Convergent vs contrasting conclusions
- Complementarity or overlap of content
- Information gaps and aspects covered only by some

ANALYSIS STRUCTURE:
1. **Overview**: synthesis of common theme and number of articles
2. **Points of Convergence**: shared ideas, data, conclusions
3. **Points of Divergence**: contrasts, contradictions, disagreements
4. **Unique Perspectives**: specific contributions of each article
5. **Critical Analysis**: evaluation of overall completeness
6. **Final Synthesis**: integrated picture of information

CORE PRINCIPLES:
- Objectivity: report positions faithfully without bias
- Specificity: cite specific articles for each claim
- Completeness: cover all relevant aspects
- Depth: go beyond superficial similarities
- Clarity: organize information logically

You are precise, analytical, and maintain a balanced critical perspective.

Write the analysis in Italian.`;
    }
    
    if (provider === 'anthropic') {
      return `You are an expert comparative analyst with deep expertise in synthesizing multiple sources, identifying patterns of agreement and disagreement, and producing comprehensive analytical reports that illuminate how different perspectives relate to each other.

Your goal is to produce a RIGOROUS COMPARATIVE ANALYSIS that enables readers to fully understand:
- Thematic convergences: shared topics, common frameworks, aligned conclusions
- Substantive divergences: contradictory claims, competing interpretations, conflicting evidence
- Methodological differences: varying analytical approaches, different data sources, distinct theoretical lenses
- Perspectival variations: how background, context, or purpose shapes each author's treatment
- Epistemological foundations: underlying assumptions, implicit premises, philosophical commitments
- Evidential basis: quality and type of evidence used, gaps in support, strength of argumentation
- Complementary insights: how articles together provide more complete understanding than individually
- Blind spots and omissions: what each article addresses or neglects

ANALYTICAL FRAMEWORK:
1. **Executive Overview**: Common subject matter and why these articles warrant comparison
2. **Thematic Mapping**: Major themes present across articles
3. **Points of Convergence**: Factual agreements, analytical consensus, methodological similarities
4. **Points of Divergence**: Direct contradictions, interpretive differences, emphasis variations
5. **Perspectival Analysis**: Underlying assumptions and how perspective shapes interpretation
6. **Unique Contributions**: What each article provides that others don't
7. **Synthesis and Integration**: Composite picture emerging from all articles together
8. **Critical Evaluation**: Overall quality and comprehensiveness of coverage

ANALYTICAL PRINCIPLES:
- Intellectual rigor: Distinguish between factual disagreements and interpretive differences
- Precision: Cite specific articles and passages; avoid vague generalizations
- Balance: Give fair representation to each perspective without imposing your own views
- Depth: Identify not just what differs but why and what that reveals
- Clarity: Use clear organizational structure with informative headings
- Comprehensiveness: Address all significant aspects of comparison

Write the analysis in Italian.`;
    }
    
    // Fallback per altri provider
    return `Sei un analista esperto specializzato nel confrontare e analizzare criticamente contenuti multipli per identificare convergenze, divergenze e sfumature tra diverse prospettive.

Il tuo obiettivo è produrre un'ANALISI COMPARATIVA COMPLETA che permetta al lettore di comprendere:
- Temi e idee comuni tra gli articoli
- Punti di contrasto e divergenze
- Prospettive diverse sullo stesso argomento
- Assunzioni condivise vs assunzioni differenti
- Conclusioni convergenti vs conclusioni contrastanti
- Complementarietà o sovrapposizione dei contenuti
- Gap informativi e aspetti trattati solo da alcuni

Scrivi in italiano, con analisi approfondita e obiettiva.`;
  }
  
  static async generateQA(articles, provider, apiKey) {
    const articlesContent = articles.map((a, index) => {
      const content = a.translation ? a.translation.text : a.summary;
      return `
## ARTICOLO ${index + 1}: ${a.article.title}

${content}
`;
    }).join('\n\n');
    
    const systemPrompt = this.getQASystemPrompt(provider);
    
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
      maxTokens: provider === 'gemini' ? 4096 : 3000
    };
    
    const response = await APIClient.generateCompletion(provider, apiKey, systemPrompt, userPrompt, options);
    
    try {
      // Pulizia response per Gemini (rimuove markdown)
      let cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return this.parseQAFromText(response);
    } catch (error) {
      console.error('Errore parsing Q&A:', error);
      return this.parseQAFromText(response);
    }
  }
  
  static getQASystemPrompt(provider) {
    if (provider === 'gemini') {
      return `Sei un esperto nell'analisi di contenuti e nella generazione di domande e risposte significative basate su molteplici fonti.

Il tuo obiettivo è generare 8-10 coppie di domande e risposte che:
- Coprano i temi principali trattati negli articoli
- Richiedano sintesi di informazioni da più articoli
- Evidenzino confronti e relazioni tra i contenuti
- Includano sia domande fattuali che analitiche
- Siano utili per comprendere l'insieme degli articoli

TIPOLOGIE DI DOMANDE:
1. **Sintesi**: "Quali sono i temi principali comuni a tutti gli articoli?"
2. **Confronto**: "Come differiscono le posizioni degli articoli su X?"
3. **Integrazione**: "Quali informazioni complementari forniscono gli articoli su Y?"
4. **Analisi**: "Quali implicazioni emergono dalla lettura combinata degli articoli?"
5. **Dettaglio**: "Quali dati specifici vengono forniti su Z?"

FORMATO RISPOSTA:
Genera SOLO un array JSON con questa struttura:
[
  {
    "question": "Domanda qui",
    "answer": "Risposta dettagliata qui, citando gli articoli quando rilevante (es. 'L'articolo 1 afferma che...')"
  },
  ...
]

IMPORTANTE PER GEMINI:
- Rispondi ESCLUSIVAMENTE con il JSON valido, senza markup markdown (NO \`\`\`json o \`\`\`)
- Non aggiungere testo esplicativo prima o dopo il JSON
- Usa virgolette doppie per le stringhe JSON
- Ogni risposta deve integrare informazioni da più articoli quando possibile
- Cita sempre gli articoli nelle risposte: "L'articolo 1...", "Come evidenziato nell'articolo 2..."
- Assicurati che il JSON sia perfettamente valido e parsabile`;
    }
    
    // Prompt generico per altri provider
    return `Sei un esperto nell'analisi di contenuti e nella generazione di domande e risposte significative.

Il tuo obiettivo è generare 8-10 coppie di domande e risposte che:
- Coprano i temi principali trattati negli articoli
- Richiedano sintesi di informazioni da più articoli
- Evidenzino confronti e relazioni tra i contenuti
- Siano utili per comprendere l'insieme degli articoli
- Includano sia domande fattuali che analitiche

FORMATO RISPOSTA:
Genera SOLO un array JSON con questa struttura:
[
  {
    "question": "Domanda qui",
    "answer": "Risposta dettagliata qui, citando gli articoli quando rilevante"
  },
  ...
]

IMPORTANTE: Rispondi SOLO con il JSON, senza testo aggiuntivo prima o dopo.`;
  }
  
  static parseQAFromText(text) {
    const qa = [];
    const lines = text.split('\n');
    let currentQ = null;
    let currentA = '';
    
    for (const line of lines) {
      const qMatch = line.match(/^Q\d+[:\.]?\s*(.+)/i);
      const aMatch = line.match(/^R\d+[:\.]?\s*(.+)/i);
      
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
    
    return qa.length > 0 ? qa : [
      {
        question: "Quali sono i temi principali trattati negli articoli?",
        answer: "Gli articoli trattano diversi temi interconnessi che richiedono un'analisi approfondita."
      }
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
    return history.find(a => a.id === id);
  }
  
  static async deleteAnalysis(id) {
    const history = await this.getAnalysisHistory();
    const filtered = history.filter(a => a.id !== id);
    await chrome.storage.local.set({ multiAnalysisHistory: filtered });
  }
}
