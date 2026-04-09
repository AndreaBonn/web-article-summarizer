// Content Classifier - Sistema di riconoscimento automatico del tipo di articolo tramite AI
import { StorageManager } from '../storage/storage-manager.js';
import { APIClient } from './api-client.js';
import { Logger } from '../core/logger.js';

export class ContentClassifier {
  /**
   * Classifica un articolo
   */
  static async classifyArticle(article, userSelection = 'auto') {
    // Se l'utente ha selezionato manualmente, usa quella
    if (userSelection !== 'auto') {
      return { category: userSelection, method: 'manual' };
    }

    // Classificazione AI
    try {
      const aiResult = await this.aiClassification(article);
      return { ...aiResult, method: 'ai' };
    } catch (error) {
      Logger.error('Errore classificazione AI:', error);
      return { category: 'general', method: 'fallback', error: error.message };
    }
  }

  /**
   * Classificazione tramite AI
   */
  static async aiClassification(article) {
    Logger.debug('Inizio classificazione AI...');
    const settings = await StorageManager.getSettings();
    const provider = settings.selectedProvider || 'groq';
    const apiKey = await StorageManager.getApiKey(provider);

    if (!apiKey) {
      throw new Error('API key non configurata');
    }

    // Prendi le prime 500 parole del contenuto
    const words = article.content.split(/\s+/);
    const first500Words = words.slice(0, 500).join(' ');
    Logger.debug(
      'Estratto lunghezza:',
      words.length,
      'parole totali,',
      first500Words.split(/\s+/).length,
      'parole usate',
    );

    // System prompt dettagliato
    const systemPrompt = `Sei un esperto analista di contenuti specializzato nella classificazione di articoli e testi in base alla loro natura, scopo e struttura.

IL TUO COMPITO:
Analizza l'articolo fornito (basandoti sulle prime 500 parole) e classificalo in UNA delle seguenti categorie:

## CATEGORIE

### 1. SCIENTIFIC (Articolo scientifico/accademico)
**Caratteristiche:**
- Struttura formale: abstract, metodologia, risultati, discussione
- Linguaggio tecnico e terminologia specializzata
- Citazioni di studi, ricerche, paper
- Dati quantitativi, statistiche, analisi
- Riferimenti a metodologie scientifiche
- Pubblicato in journal o conference proceedings
- Presenza di grafici, tabelle, figure
- Autori con affiliazioni accademiche

**Indicatori chiave:** methodology, hypothesis, participants, p-value, significant, correlation, analysis, findings, implications

### 2. NEWS (Notizia/attualità)
**Caratteristiche:**
- Struttura 5W1H: Who, What, When, Where, Why, How
- Focus su eventi recenti o breaking news
- Riferimenti temporali specifici (oggi, ieri, questa settimana)
- Attribuzione di fonti (secondo, ha dichiarato, riporta)
- Linguaggio giornalistico diretto
- Aggiornamenti su situazioni in corso
- Citazioni di persone coinvolte
- Dateline geografico

**Indicatori chiave:** oggi, ieri, ha dichiarato, secondo fonti, breaking, conferma, annuncia, reportage

### 3. TUTORIAL (Guida/how-to)
**Caratteristiche:**
- Struttura step-by-step o procedurale
- Istruzioni pratiche e actionable
- Presenza di comandi, codice, configurazioni
- Sezioni: prerequisiti, setup, procedura, troubleshooting
- Linguaggio imperativo (installa, configura, esegui)
- Obiettivo finale chiaro
- Esempi pratici e screenshot
- Verifiche di successo

**Indicatori chiave:** come fare, passo, prima, poi, infine, installa, configura, clicca, esegui, tutorial, guida

### 4. BUSINESS (Contenuto economico/aziendale)
**Caratteristiche:**
- Focus su aziende, mercati, economia
- Dati finanziari: revenue, profitto, market cap, valuation
- Strategie aziendali e decisioni manageriali
- Analisi di mercato e trend
- Case study aziendali
- Metriche business: ROI, KPI, growth rate
- Citazioni di CEO, executive, analisti
- Implicazioni per investitori/business

**Indicatori chiave:** revenue, crescita, mercato, azienda, investimento, profitto, strategia, CEO, quarterly

### 5. OPINION (Editoriale/opinione)
**Caratteristiche:**
- Voce soggettiva e punto di vista personale
- Argomentazione e tesi dichiarata
- Linguaggio persuasivo e retorico
- Prima persona (io penso, credo, sostengo)
- Giudizi di valore e valutazioni
- Call-to-action o posizione politica
- Analisi critica con posizionamento
- Struttura argomentativa

**Indicatori chiave:** io penso, credo, dovremmo, bisogna, è inaccettabile, è necessario, la mia opinione

### 6. GENERAL (Generico)
**Caratteristiche:**
- Non rientra chiaramente nelle altre categorie
- Contenuto informativo generico
- Articoli enciclopedici
- Descrizioni, spiegazioni generali
- Mix di caratteristiche senza dominanza
- Contenuto educativo non specializzato
- Divulgazione generale

PRINCIPI:
- Scegli sempre UNA categoria primaria
- Basati sulle prime 500 parole dell'articolo
- Considera struttura, linguaggio, scopo, audience
- Rispondi SOLO con il nome della categoria in minuscolo, senza spiegazioni`;

    const userPrompt = `# ARTICOLO DA CLASSIFICARE

**Titolo:** ${article.title || 'N/A'}
${article.author ? `**Autore:** ${article.author}` : ''}
${article.siteName ? `**Pubblicazione:** ${article.siteName}` : ''}

---

## CONTENUTO (prime 500 parole)

${first500Words}

---

# ISTRUZIONI

Analizza questo articolo (basandoti sulle prime 500 parole fornite) e classificalo in UNA delle seguenti categorie:
- scientific: articolo scientifico/accademico
- news: notizia/attualità
- tutorial: guida/how-to
- business: contenuto economico/aziendale
- opinion: editoriale/opinione
- general: generico

Rispondi SOLO con il nome della categoria in minuscolo, esattamente come elencata sopra. Nessuna spiegazione, solo la categoria.`;

    Logger.debug('Invio richiesta a', provider);
    const response = await APIClient.generateCompletion(
      provider,
      apiKey,
      systemPrompt,
      userPrompt,
      {
        temperature: 0.1, // Bassa temperatura per risposte più deterministiche
        maxTokens: 20,
      },
    );

    Logger.debug('Risposta ricevuta:', response);
    const category = response.trim().toLowerCase();
    Logger.debug('Categoria estratta:', category);

    // Valida la risposta
    const validCategories = ['scientific', 'news', 'tutorial', 'business', 'opinion', 'general'];
    if (!validCategories.includes(category)) {
      Logger.warn('Categoria non valida:', category);
      throw new Error("Categoria non valida ricevuta dall'AI: " + category);
    }

    Logger.info('Classificazione completata:', category);
    return { category };
  }

  /**
   * Salva la correzione dell'utente per migliorare l'euristica
   */
  static async saveUserCorrection(articleUrl, detectedCategory, userCategory) {
    const result = await chrome.storage.local.get(['classificationCorrections']);
    const corrections = result.classificationCorrections || [];

    corrections.push({
      url: articleUrl,
      detected: detectedCategory,
      corrected: userCategory,
      timestamp: Date.now(),
    });

    // Mantieni solo le ultime 100 correzioni
    if (corrections.length > 100) {
      corrections.shift();
    }

    await chrome.storage.local.set({ classificationCorrections: corrections });
  }

  /**
   * Ottieni la categoria con label leggibile
   */
  static getCategoryLabel(category) {
    const labels = {
      auto: 'Rilevamento Automatico',
      scientific: 'Scientifico',
      news: 'News',
      tutorial: 'Tutorial',
      business: 'Business',
      opinion: 'Opinione',
      general: 'Generico',
    };
    return labels[category] || category;
  }
}
