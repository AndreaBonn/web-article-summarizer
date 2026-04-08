# Funzionalità Analisi Multi-Articolo

## Panoramica

La funzionalità di **Analisi Multi-Articolo** permette agli utenti di selezionare e analizzare contemporaneamente più articoli dalla cronologia, generando:
- Un riassunto globale unificato
- Un confronto delle idee presenti negli articoli
- Un sistema Q&A basato su tutti gli articoli selezionati

## Caratteristiche Principali

### 1. Selezione Articoli

**Interfaccia:**
- Lista di tutti gli articoli salvati nella cronologia
- Checkbox per selezione multipla
- Filtri per provider e ricerca testuale
- Contatore articoli selezionati
- Pulsanti "Seleziona Tutti" / "Deseleziona Tutti"

**Requisiti:**
- Minimo 2 articoli per avviare l'analisi
- Massimo consigliato: 10 articoli (per limiti di token)

### 2. Opzioni di Analisi

L'utente può scegliere quali analisi generare:

#### a) Riassunto Globale
- Sintesi unificata di tutti gli articoli
- Organizzata per temi, non per singolo articolo
- Integra i contenuti in una narrazione coerente
- Cita gli articoli quando necessario

#### b) Confronto Idee
- Identifica idee comuni tra gli articoli
- Evidenzia posizioni in conflitto
- Analizza prospettive diverse sullo stesso argomento
- Mostra come gli articoli si completano a vicenda

#### c) Q&A Multi-Articolo
- Genera 8-10 domande e risposte
- Richiede sintesi di informazioni da più articoli
- Include domande fattuali e analitiche
- Utile per comprendere l'insieme degli articoli

### 3. Verifica Correlazione (Analisi Semantica AI)

Prima di procedere con l'analisi completa, il sistema verifica se gli articoli sono correlati usando **analisi semantica tramite LLM**.

**Metodo Intelligente:**
Il sistema invia all'AI i titoli e gli estratti degli articoli chiedendo:
- Gli articoli trattano argomenti correlati o completamente scollegati?
- Quali sono i temi comuni (se presenti)?
- Motivazione della decisione

**Vantaggi dell'Approccio AI:**
- ✅ **Comprensione semantica**: riconosce che "automobile" e "veicolo" sono correlati
- ✅ **Analisi contestuale**: capisce il contesto oltre le singole parole
- ✅ **Flessibilità**: articoli sullo stesso tema con terminologia diversa vengono riconosciuti
- ✅ **Gestione multilingua**: funziona anche con articoli in lingue diverse
- ✅ **Soglia intelligente**: valuta la correlazione in modo sfumato, non binario

**Prompt di Verifica:**
```
Sei un esperto analista di contenuti specializzato nell'identificare 
relazioni tematiche tra articoli.

Determina se questi N articoli trattano argomenti correlati o 
completamente scollegati.

CORRELATI: condividono temi, argomenti, settori o contesti comuni
NON CORRELATI: argomenti completamente diversi senza legame tematico

Rispondi con JSON:
{
  "correlati": true/false,
  "motivazione": "...",
  "temi_comuni": [...]
}
```

**Se articoli NON correlati:**
- Mostra modal di avviso con la motivazione dell'AI
- Opzioni:
  - **Solo Q&A**: genera solo domande e risposte (utile anche per articoli scollegati)
  - **Analisi Completa**: procedi comunque con tutte le analisi
  - **Annulla**: torna alla selezione

**Motivazione:**
- Riassunto globale e confronto hanno poco senso per articoli completamente scollegati
- Q&A può essere utile anche per articoli non correlati
- L'AI fornisce una spiegazione del perché gli articoli sono/non sono correlati

**Fallback:**
- Se l'API non è disponibile o c'è un errore, assume articoli correlati (per non bloccare l'utente)
- Log dell'errore per debugging

### 4. Utilizzo Contenuti

Per ogni articolo, il sistema utilizza in ordine di priorità:

1. **Traduzione** (se disponibile): più dettagliata e nella lingua target
2. **Riassunto** (se traduzione non disponibile): versione condensata
3. **Punti Chiave** (come supplemento): per evidenziare aspetti specifici

### 5. Processo di Analisi

**Flusso:**
1. Selezione articoli (minimo 2)
2. Scelta opzioni di analisi
3. Click su "Avvia Analisi"
4. Verifica correlazione articoli
5. (Se non correlati) Scelta modalità
6. Generazione analisi con progress bar
7. Visualizzazione risultati in modal

**Progress Bar:**
- 10%: Verifica correlazione
- 20-80%: Generazione analisi (diviso per numero di opzioni)
- 95%: Salvataggio risultati
- 100%: Completato

### 6. Visualizzazione Risultati

**Modal con Tabs:**
- Tab "Riassunto": riassunto globale
- Tab "Confronto": confronto idee
- Tab "Q&A": domande e risposte

**Azioni Disponibili:**
- Esporta PDF
- Esporta Markdown
- Invia Email
- Copia negli appunti

### 7. Esportazione

#### PDF
- Header con metadata (data, numero articoli)
- Lista articoli analizzati
- Sezioni per ciascuna analisi generata
- Footer con numerazione pagine

#### Markdown
- Struttura gerarchica con headers
- Lista articoli con link
- Sezioni ben formattate
- Compatibile con editor Markdown

#### Email
- Contenuto formattato in HTML
- Include tutte le sezioni generate
- Link agli articoli originali

### 8. Salvataggio Cronologia

Le analisi multi-articolo vengono salvate separatamente:

**Storage:**
- `multiAnalysisHistory`: array di analisi
- Limite: 30 analisi più recenti
- Ogni analisi include:
  - ID univoco (timestamp)
  - Lista articoli (ID, titolo, URL)
  - Risultati delle analisi
  - Timestamp creazione

## Architettura Tecnica

### File Creati

1. **multi-analysis.html**: Pagina principale
2. **multi-analysis.css**: Stili
3. **multi-analysis.js**: Logica UI
4. **utils/multi-analysis-manager.js**: Gestione analisi
5. **prompts/multi-analysis.md**: Documentazione prompt

### File Modificati

1. **popup.html**: Aggiunto bottone "Analisi Multi-Articolo"
2. **popup.js**: Aggiunto event listener per nuovo bottone
3. **utils/pdf-exporter.js**: Aggiunto metodo `exportMultiAnalysisToPDF`
4. **utils/markdown-exporter.js**: Aggiunto metodo `exportMultiAnalysisToMarkdown`

### Classi e Metodi Principali

#### MultiAnalysisManager

```javascript
class MultiAnalysisManager {
  // Verifica se articoli sono correlati (usa AI per analisi semantica)
  static async checkArticlesRelation(articles)
  
  // Verifica correlazione tramite LLM con analisi semantica
  static async checkCorrelationWithAI(articles, provider, apiKey)
  
  // Analizza articoli con opzioni specificate
  static async analyzeArticles(articles, options, progressCallback)
  
  // Genera riassunto globale
  static async generateGlobalSummary(articles, provider, apiKey)
  
  // Genera confronto idee
  static async generateComparison(articles, provider, apiKey)
  
  // Genera Q&A
  static async generateQA(articles, provider, apiKey)
  
  // Salva analisi in storage
  static async saveAnalysis(analysis)
  
  // Recupera cronologia analisi
  static async getAnalysisHistory()
}
```

#### APIClient (Nuovi Metodi)

```javascript
class APIClient {
  // Metodo generico per generare completion con parametri personalizzabili
  static async generateCompletion(provider, apiKey, systemPrompt, userPrompt, options = {})
  
  // Chiamate specifiche per provider con parametri custom
  static async callGroqCompletion(apiKey, systemPrompt, userPrompt, options)
  static async callOpenAICompletion(apiKey, systemPrompt, userPrompt, options)
  static async callAnthropicCompletion(apiKey, systemPrompt, userPrompt, options)
}
```

### Prompt System

#### Riassunto Globale
- Integra contenuti in narrazione coerente
- Organizza per temi, non per articolo
- Cita fonti quando necessario

#### Confronto Idee
- Identifica convergenze e divergenze
- Analizza prospettive diverse
- Evidenzia complementarietà

#### Q&A
- Genera JSON con domande e risposte
- Richiede sintesi multi-articolo
- Include citazioni alle fonti

## Casi d'Uso

### 1. Ricerca Accademica
**Scenario:** Studente che analizza 5 paper su un argomento specifico

**Utilizzo:**
- Seleziona i 5 articoli dalla cronologia
- Genera riassunto globale per overview
- Usa confronto idee per identificare consenso/dissenso
- Consulta Q&A per approfondimenti specifici

### 2. Analisi di Mercato
**Scenario:** Analista che confronta 3 report su un settore

**Utilizzo:**
- Seleziona i 3 report
- Confronto idee per identificare trend comuni
- Riassunto globale per sintesi esecutiva
- Esporta PDF per presentazione

### 3. Rassegna Stampa
**Scenario:** Giornalista che analizza 7 articoli su un evento

**Utilizzo:**
- Seleziona articoli da diverse fonti
- Confronto idee per identificare narrazioni diverse
- Q&A per fact-checking rapido
- Esporta Markdown per articolo di sintesi

### 4. Apprendimento Personale
**Scenario:** Utente che studia un nuovo argomento

**Utilizzo:**
- Seleziona articoli introduttivi e avanzati
- Riassunto globale per comprensione generale
- Q&A per testare la comprensione
- Salva per riferimento futuro

## Limitazioni e Considerazioni

### Limitazioni Tecniche

1. **Token Limit**: 
   - Limite combinato di ~8000 token per input
   - Soluzione: usare riassunti invece di traduzioni se necessario

2. **Numero Articoli**:
   - Consigliato max 10 articoli
   - Oltre questo limite, rischio di superare token limit

3. **Tempo di Elaborazione**:
   - Proporzionale al numero di articoli e opzioni
   - 3 articoli con tutte le opzioni: ~30-60 secondi

### Considerazioni UX

1. **Selezione Articoli**:
   - Fornire feedback visivo chiaro
   - Mostrare contatore sempre visibile
   - Disabilitare bottone se < 2 articoli

2. **Progress Feedback**:
   - Progress bar con messaggi descrittivi
   - Non bloccare UI durante elaborazione
   - Permettere cancellazione (future enhancement)

3. **Gestione Errori**:
   - Messaggi chiari in caso di errore API
   - Suggerimenti per risolvere (es. "riduci numero articoli")
   - Possibilità di retry

## Metriche di Successo

### Metriche Quantitative

1. **Utilizzo**:
   - Numero di analisi multi-articolo generate
   - Numero medio di articoli per analisi
   - Opzioni più utilizzate

2. **Performance**:
   - Tempo medio di elaborazione
   - Tasso di successo (vs errori)
   - Utilizzo token medio

3. **Engagement**:
   - Tasso di esportazione (PDF/MD)
   - Tasso di condivisione (email)
   - Analisi salvate vs eliminate

### Metriche Qualitative

1. **Utilità**:
   - Feedback utenti sulla qualità delle analisi
   - Casi d'uso reali identificati
   - Richieste di miglioramento

2. **Usabilità**:
   - Facilità di selezione articoli
   - Chiarezza delle opzioni
   - Comprensibilità dei risultati

## Sviluppi Futuri

### Funzionalità Aggiuntive

1. **Cronologia Analisi**:
   - Pagina dedicata per visualizzare analisi passate
   - Filtri e ricerca
   - Possibilità di ri-eseguire analisi

2. **Analisi Incrementale**:
   - Aggiungere articoli a un'analisi esistente
   - Confrontare due analisi multi-articolo

3. **Personalizzazione**:
   - Template di domande personalizzabili
   - Focus su aspetti specifici (es. "confronta solo metodologie")
   - Lunghezza output configurabile

4. **Visualizzazioni**:
   - Grafico delle relazioni tra articoli
   - Word cloud dei temi comuni
   - Timeline per articoli news

5. **Collaborazione**:
   - Condivisione analisi con altri utenti
   - Commenti e annotazioni
   - Workspace condivisi

### Ottimizzazioni

1. **Performance**:
   - Caching risultati intermedi
   - Elaborazione parallela quando possibile
   - Compressione contenuti per ridurre token

2. **Intelligenza**:
   - Clustering automatico articoli simili
   - Suggerimenti articoli correlati
   - Rilevamento automatico tipo di analisi più adatta

3. **Integrazione**:
   - Export verso note-taking apps (Notion, Obsidian)
   - Integrazione con reference managers (Zotero)
   - API per automazione

## Conclusioni

La funzionalità di Analisi Multi-Articolo rappresenta un'evoluzione significativa dell'estensione, permettendo agli utenti di:

- **Sintetizzare** informazioni da molteplici fonti
- **Confrontare** prospettive diverse
- **Approfondire** la comprensione attraverso Q&A

Questa funzionalità è particolarmente utile per:
- Ricercatori e studenti
- Analisti e professionisti
- Giornalisti e content creator
- Chiunque debba processare grandi quantità di informazioni

L'implementazione modulare e l'architettura estensibile permettono facili miglioramenti futuri e l'aggiunta di nuove tipologie di analisi.

---

*Documento creato: 21 Novembre 2025*
*Versione: 1.0*
