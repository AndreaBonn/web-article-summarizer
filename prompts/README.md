# Sistema di Prompt per AI Article Summarizer

Questo documento spiega come funziona il sistema di prompt dell'estensione e come vengono utilizzati i diversi prompt in base al modello e al tipo di articolo.

## Struttura

Il sistema di prompt è organizzato in due file:

1. **`summary.md`** - Contiene tutti i prompt in formato markdown per riferimento e documentazione
2. **`utils/api-client.js`** - Implementa la logica di selezione e utilizzo dei prompt

## Tipi di Contenuto Supportati

L'estensione supporta 6 tipi di contenuto, ognuno con prompt specializzati:

### 1. 📄 Articolo Generico (general)
Prompt predefinito per articoli che non rientrano in categorie specifiche.

**Focus:**
- Completezza del riassunto
- Preservazione di tutti i concetti principali
- Struttura logica e flusso narrativo
- Dati e esempi concreti

### 2. 🔬 Articolo Scientifico (scientific)
Per paper accademici, studi di ricerca, pubblicazioni scientifiche.

**Focus:**
- Metodologia dettagliata
- Risultati con dati numerici specifici
- Validità statistica e limitazioni
- Contesto nella letteratura esistente
- Riproducibilità

### 3. 📰 Notizia (news)
Per articoli di attualità, breaking news, reportage giornalistici.

**Focus:**
- 5W1H (Who, What, When, Where, Why, How)
- Fonti e attribuzione
- Cronologia degli eventi
- Contesto storico/politico/economico
- Implicazioni e conseguenze

### 4. 📚 Tutorial/Guida (tutorial)
Per guide tecniche, how-to, tutorial step-by-step.

**Focus:**
- Obiettivo e risultato finale
- Prerequisiti e setup
- Procedura passo-passo
- Comandi/codice chiave
- Troubleshooting

### 5. 💼 Business/Case Study (business)
Per contenuti aziendali, casi studio, analisi di mercato.

**Focus:**
- Strategia e decisioni
- Metriche e KPI
- Contesto di mercato
- Implementazione
- Risultati misurabili
- Lessons learned

### 6. 💭 Opinione/Editoriale (opinion)
Per articoli di opinione, saggi argomentativi, editoriali.

**Focus:**
- Tesi principale dell'autore
- Struttura argomentativa
- Evidenze a supporto
- Contro-argomenti
- Tecniche retoriche
- Conclusioni e implicazioni

## Provider AI Supportati

Ogni tipo di contenuto ha prompt ottimizzati per 3 provider:

### 🟢 Groq
- Prompt in italiano
- Stile diretto ed efficiente
- Ottimizzato per velocità

### 🔵 OpenAI
- Prompt in inglese
- Stile preciso e dettagliato
- Bilanciato tra velocità e qualità

### 🟣 Anthropic (Claude)
- Prompt in inglese
- Stile molto dettagliato e analitico
- Massima qualità e profondità

## Rilevamento Automatico

### Rilevamento Tipo di Contenuto

Il sistema può rilevare automaticamente il tipo di contenuto analizzando:

- **Scientific:** termini come "methodology", "hypothesis", "participants", valori p
- **News:** riferimenti temporali, date specifiche, fonti
- **Tutorial:** parole come "step", "how to", "install", "configure"
- **Business:** termini come "revenue", "market", "strategy", "ROI"
- **Opinion:** uso prima persona, "I believe", "in my view"

### Rilevamento Lingua

Il sistema rileva automaticamente la lingua dell'articolo per:
- Italiano (it)
- Inglese (en)
- Spagnolo (es)
- Francese (fr)
- Tedesco (de)

**IMPORTANTE:** La lingua di output è controllata dall'utente tramite le impostazioni. Il sistema aggiunge istruzioni esplicite sia nel system prompt che nel user prompt per garantire che il riassunto sia generato nella lingua selezionata, indipendentemente dalla lingua dell'articolo originale.

## Calcolo Lunghezza Riassunto

La lunghezza del riassunto viene calcolata automaticamente in base alla lunghezza dell'articolo:

- **< 500 parole:** 40% dell'originale
- **500-1500 parole:** 30% dell'originale
- **1500-3000 parole:** 25% dell'originale
- **> 3000 parole:** 20% dell'originale

**Limiti:** minimo 200 parole, massimo 1200 parole

L'utente può anche scegliere manualmente:
- **Short:** ~250 parole
- **Medium:** ~500 parole
- **Detailed:** ~800 parole

## Come Funziona

### 1. Selezione del Prompt

```javascript
// In api-client.js
const contentType = settings.contentType || detectContentType(article);
const systemPrompt = getSystemPrompt(provider, contentType);
```

### 2. Costruzione del Prompt Utente

Il prompt utente include:
- Titolo e metadati dell'articolo
- Contenuto formattato con paragrafi numerati (§1, §2, etc.)
- Istruzioni specifiche per lunghezza e formato
- Linee guida per la qualità
- Formato output richiesto

### 3. Chiamata API

```javascript
const response = await callAPI(provider, apiKey, article, settings);
```

### 4. Parsing della Risposta

Il sistema estrae:
- Il riassunto completo
- I punti chiave con riferimenti ai paragrafi

## Formato Output

Tutti i prompt richiedono questo formato standardizzato:

```
## RIASSUNTO

[Riassunto completo in prosa fluida]

## PUNTI CHIAVE

1. **[Titolo]** (§N)
   [Descrizione dettagliata]

2. **[Titolo]** (§N-M)
   [Descrizione dettagliata]

[...]
```

## Personalizzazione

### Aggiungere un Nuovo Tipo di Contenuto

1. Aggiungi i prompt per i 3 provider in `getSystemPrompt()` in `api-client.js`
2. Aggiungi la logica di rilevamento in `detectContentType()`
3. Aggiungi l'opzione nel menu in `options.html`
4. Documenta il nuovo tipo in `summary.md`

### Modificare un Prompt Esistente

1. Modifica il prompt in `api-client.js` nella funzione `getSystemPrompt()`
2. Aggiorna la documentazione in `summary.md`
3. Testa con diversi articoli del tipo specifico

## Best Practices

### Per Ottenere Riassunti Migliori

1. **Usa il rilevamento automatico** quando non sei sicuro del tipo
2. **Seleziona manualmente** il tipo per articoli ambigui
3. **Scegli il provider giusto:**
   - Groq: veloce per articoli semplici
   - OpenAI: bilanciato per la maggior parte dei casi
   - Claude: massima qualità per contenuti complessi

### Linee Guida per i Prompt

I prompt devono:
- Essere chiari e specifici
- Includere esempi di cosa fare e cosa evitare
- Specificare la struttura attesa
- Mantenere coerenza tra provider
- Adattarsi al tipo di contenuto

## Esempi di Utilizzo

### Esempio 1: Articolo Scientifico con Groq

```javascript
const article = {
  title: "Neural Correlates of Mindfulness Meditation",
  content: "Recent advances in neuroimaging...",
  wordCount: 3200
};

const settings = {
  selectedProvider: 'groq',
  contentType: 'scientific',
  summaryLength: 'medium'
};

const result = await APIClient.callAPI('groq', apiKey, article, settings);
```

### Esempio 2: News con Rilevamento Automatico

```javascript
const article = {
  title: "Tech Giants Announce Climate Agreement",
  content: "In an unprecedented move today...",
  wordCount: 1200
};

const settings = {
  selectedProvider: 'openai',
  contentType: 'auto', // Rileverà automaticamente 'news'
  summaryLength: 'medium'
};

const result = await APIClient.callAPI('openai', apiKey, article, settings);
```

## Troubleshooting

### Il riassunto non segue il formato richiesto
- Verifica che il prompt includa chiaramente il formato output
- Aumenta la temperatura se troppo rigido
- Prova un provider diverso

### Il riassunto è troppo breve/lungo
- Controlla il calcolo della lunghezza target
- Verifica che le istruzioni sulla lunghezza siano chiare
- Considera di usare "adaptive" invece di lunghezze fisse

### Il tipo di contenuto non viene rilevato correttamente
- Aggiungi più pattern di rilevamento in `detectContentType()`
- Usa la selezione manuale per articoli ambigui
- Migliora i pattern di riconoscimento

## Sistema Q&A

### Prompt Strutturati per Modello

Il sistema Q&A (Domande e Risposte) utilizza prompt ottimizzati per ogni provider AI, documentati in `prompts/Q&A.md`.

**Caratteristiche:**
- Prompt specifici per Groq, OpenAI e Anthropic
- Supporto multilingua (IT, EN, ES, FR, DE)
- Citazioni precise dei paragrafi (§N)
- Distinzione tra fatti espliciti e inferenze
- Gestione informazioni mancanti

**Implementazione:**
- File prompt: `prompts/Q&A.md`
- Codice: `utils/advanced-analysis.js`
- Metodo: `AdvancedAnalysis.askQuestion()`

**Differenze tra Provider:**
- **Groq**: Risposte dirette e concise, stile conversazionale
- **OpenAI**: Risposte bilanciate con citazioni precise
- **Anthropic**: Risposte approfondite con alta fedeltà alla fonte

## Riferimenti

- **Documentazione prompt riassunti:** `prompts/summary.md`
- **Documentazione prompt punti chiave:** `prompts/estrazione_punti_chiave.md`
- **Documentazione prompt Q&A:** `prompts/Q&A.md`
- **Documentazione prompt traduzione:** `prompts/traduzione.md`
- **Implementazione riassunti:** `utils/api-client.js`
- **Implementazione Q&A:** `utils/advanced-analysis.js`
- **Implementazione traduzione:** `utils/translator.js`
- **Configurazione UI:** `options.html` e `options.js`
- **Storage:** `utils/storage-manager.js`
