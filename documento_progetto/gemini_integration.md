# Integrazione Google Gemini API

## Panoramica

Questa documentazione descrive l'integrazione completa delle API di Google Gemini nel progetto AI Article Summarizer, permettendo agli utenti di utilizzare i modelli Gemini come alternativa a Groq, OpenAI e Anthropic.

## Modifiche Implementate

### 1. Manifest (manifest.json)

**Permessi Host Aggiunti:**
```json
"host_permissions": [
  "https://generativelanguage.googleapis.com/*"
]
```

**Descrizione Aggiornata:**
```json
"description": "Riassumi articoli web con AI (Groq, OpenAI, Claude, Gemini) - Ottieni punti chiave e risparmia tempo"
```

### 2. Interfaccia Utente

#### Options Page (options.html)

**Nuovo Campo API Key:**
```html
<div class="api-key-group">
  <label>
    <span class="provider-name">🔷 Google Gemini API Key</span>
    <span class="provider-desc" data-i18n="settings.provider.gemini">Multimodale e versatile</span>
  </label>
  <div class="input-group">
    <input type="password" id="geminiKey" placeholder="AIza..." />
    <button class="btn-test" data-provider="gemini" data-i18n="settings.test">🧪 Test</button>
  </div>
  <div id="geminiStatus" class="status"></div>
</div>
```

**Sezione Help Aggiunta:**
```html
<div class="help-item">
  <h3>🔷 Google Gemini</h3>
  <ol>
    <li>Visita <a href="https://aistudio.google.com/app/apikey">aistudio.google.com/app/apikey</a></li>
    <li>Accedi con il tuo account Google</li>
    <li>Clicca su "Create API Key" per generare una nuova chiave</li>
    <li>Nota: Gemini offre un tier gratuito generoso per iniziare</li>
  </ol>
</div>
```

**Provider Predefinito:**
```html
<select id="defaultProvider">
  <option value="groq">Groq</option>
  <option value="openai">OpenAI</option>
  <option value="anthropic">Claude</option>
  <option value="gemini">Google Gemini</option>
</select>
```

#### Popup (popup.html)

Aggiunto Gemini al select dei provider:
```html
<select id="providerSelect">
  <option value="groq">Groq</option>
  <option value="openai">OpenAI</option>
  <option value="anthropic">Claude</option>
  <option value="gemini">Gemini</option>
</select>
```

#### History (history.html)

Aggiunto Gemini ai filtri:
```html
<select id="providerFilter">
  <option value="">Tutti i provider</option>
  <option value="groq">Groq</option>
  <option value="openai">OpenAI</option>
  <option value="anthropic">Claude</option>
  <option value="gemini">Gemini</option>
</select>
```

#### Multi-Analysis (multi-analysis.html)

Aggiunto Gemini ai filtri provider.

#### PDF Analysis (pdf-analysis.html)

Aggiunto Gemini al select provider.

### 3. Backend Logic

#### API Client (utils/api-client.js)

**Metodo callAPI Aggiornato:**
```javascript
static async callAPI(provider, apiKey, article, settings) {
  const prompt = this.buildPrompt(provider, article, settings);
  
  switch (provider) {
    case 'groq':
      return await this.callGroq(apiKey, prompt, settings);
    case 'openai':
      return await this.callOpenAI(apiKey, prompt, settings);
    case 'anthropic':
      return await this.callAnthropic(apiKey, prompt, settings);
    case 'gemini':
      return await this.callGemini(apiKey, prompt, settings);
    default:
      throw new Error('Provider non supportato');
  }
}
```

**Nuovo Metodo callGemini:**
```javascript
static async callGemini(apiKey, prompt, settings) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${prompt.systemPrompt}\n\n${prompt.userPrompt}`
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000,
        topP: 0.95,
        topK: 40
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE'
        }
      ]
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Errore API Gemini');
  }
  
  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Risposta Gemini non valida');
  }
  
  return data.candidates[0].content.parts[0].text;
}
```

**Nuovo Metodo callGeminiCompletion:**
```javascript
static async callGeminiCompletion(apiKey, systemPrompt, userPrompt, options) {
  const requestBody = {
    contents: [{
      parts: [{
        text: `${systemPrompt}\n\n${userPrompt}`
      }]
    }],
    generationConfig: {
      temperature: options.temperature,
      maxOutputTokens: options.maxTokens,
      topP: 0.95,
      topK: 40
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE'
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE'
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE'
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE'
      }
    ]
  };
  
  // Aggiungi response_mime_type se richiesto JSON
  if (options.responseFormat === 'json') {
    requestBody.generationConfig.responseMimeType = 'application/json';
  }
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Errore API Gemini');
  }
  
  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Risposta Gemini non valida');
  }
  
  return data.candidates[0].content.parts[0].text;
}
```

**System Prompts Aggiunti:**

Aggiunti system prompt specifici per Gemini in tutte le categorie di contenuto:
- `general`: Riassunti generici
- `scientific`: Articoli scientifici
- `news`: Notizie
- `tutorial`: Guide e tutorial
- `business`: Contenuti business
- `opinion`: Articoli di opinione

I prompt per Gemini sono identici a quelli di Groq per mantenere coerenza nell'output.

**Metodo extractKeyPoints Aggiornato:**
```javascript
static async extractKeyPoints(provider, apiKey, article, settings) {
  const prompt = this.buildKeyPointsPrompt(provider, article, settings);
  
  switch (provider) {
    case 'groq':
      return await this.callGroq(apiKey, prompt, settings);
    case 'openai':
      return await this.callOpenAI(apiKey, prompt, settings);
    case 'anthropic':
      return await this.callAnthropic(apiKey, prompt, settings);
    case 'gemini':
      return await this.callGemini(apiKey, prompt, settings);
    default:
      throw new Error('Provider non supportato');
  }
}
```

**Metodo generateCompletion Aggiornato:**
```javascript
static async generateCompletion(provider, apiKey, systemPrompt, userPrompt, options = {}) {
  // ...
  switch (provider) {
    case 'groq':
      return await this.callGroqCompletion(/* ... */);
    case 'openai':
      return await this.callOpenAICompletion(/* ... */);
    case 'anthropic':
      return await this.callAnthropicCompletion(/* ... */);
    case 'gemini':
      return await this.callGeminiCompletion(apiKey, systemPrompt, userPrompt, {
        temperature,
        maxTokens,
        model: model || 'gemini-1.5-flash',
        responseFormat
      });
    default:
      throw new Error('Provider non supportato');
  }
}
```

#### Background Service Worker (background.js)

**API Keys Aggiornate:**
```javascript
const apiKeys = {
  groq: await StorageManager.getApiKey('groq'),
  openai: await StorageManager.getApiKey('openai'),
  anthropic: await StorageManager.getApiKey('anthropic'),
  gemini: await StorageManager.getApiKey('gemini')
};
```

#### Options Script (options.js)

**Provider Array Aggiornato:**
```javascript
const providers = ['groq', 'openai', 'anthropic', 'gemini'];
```

Questo array viene utilizzato in:
- `loadApiKeys()`: Carica le chiavi salvate
- `saveApiKeys()`: Salva le nuove chiavi

## Come Ottenere una API Key di Gemini

1. **Visita Google AI Studio:**
   - Vai su [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

2. **Accedi con Google:**
   - Usa il tuo account Google esistente

3. **Crea una API Key:**
   - Clicca su "Create API Key"
   - Seleziona un progetto Google Cloud esistente o creane uno nuovo
   - La chiave verrà generata immediatamente

4. **Copia la Chiave:**
   - La chiave inizia con `AIza...`
   - Copiala e incollala nelle impostazioni dell'estensione

5. **Tier Gratuito:**
   - Gemini offre un tier gratuito generoso
   - 60 richieste al minuto
   - 1500 richieste al giorno
   - Perfetto per uso personale

## Modelli Gemini Utilizzati

### Modello Predefinito: gemini-2.5-pro

**Caratteristiche:**
- Veloce e efficiente (ultima generazione)
- Ottimo rapporto qualità/prezzo
- Context window: 1M token
- Output: fino a 8K token
- Multimodale (testo, immagini, video, audio)
- Reasoning migliorato rispetto a 1.5

**Parametri di Generazione:**
```javascript
{
  temperature: 0.3,        // Bassa per output più deterministico
  maxOutputTokens: 2000,   // Limite output
  topP: 0.95,              // Nucleus sampling
  topK: 40                 // Top-K sampling
}
```

**Safety Settings:**
Tutti i filtri di sicurezza sono impostati su `BLOCK_NONE` per evitare blocchi su contenuti accademici o tecnici che potrebbero essere erroneamente classificati come sensibili.

### Modelli Alternativi Disponibili

L'implementazione supporta anche:
- `gemini-1.5-pro-002`: Più potente, migliore per task molto complessi
- `gemini-1.5-flash`: Versione precedente, stabile
- `gemini-1.0-pro`: Versione legacy

**Nota:** Per l'analisi multi-articolo (comparazione), il sistema passa automaticamente a `gemini-2.5-pro` per sfruttare le capacità analitiche avanzate.

Per cambiare modello, modificare il parametro `model` in `generateCompletion()`.

## Differenze con Altri Provider

### Formato API

**Gemini:**
- API Key passata come query parameter: `?key=${apiKey}`
- System prompt e user prompt combinati in un unico testo
- Struttura `contents` con `parts`

**OpenAI/Groq:**
- API Key nell'header `Authorization: Bearer ${apiKey}`
- System e user prompt separati in `messages`

**Anthropic:**
- API Key nell'header `x-api-key`
- System prompt separato, user prompt in `messages`

### Response Format

**Gemini:**
```javascript
{
  candidates: [{
    content: {
      parts: [{
        text: "..."
      }]
    }
  }]
}
```

**OpenAI/Groq:**
```javascript
{
  choices: [{
    message: {
      content: "..."
    }
  }]
}
```

**Anthropic:**
```javascript
{
  content: [{
    text: "..."
  }]
}
```

### JSON Mode

**Gemini:**
```javascript
generationConfig: {
  responseMimeType: 'application/json'
}
```

**OpenAI/Groq:**
```javascript
response_format: { type: 'json_object' }
```

**Anthropic:**
Non supportato nativamente, richiede prompt engineering.

## Testing

### Test Manuale

1. Apri le impostazioni dell'estensione
2. Inserisci la tua API Key di Gemini
3. Clicca su "🧪 Test"
4. Verifica che appaia "✅ Chiave verificata"

### Test Funzionale

1. Vai su un articolo web
2. Apri il popup dell'estensione
3. Seleziona "Gemini" come provider
4. Clicca su "Analizza Pagina"
5. Verifica che il riassunto venga generato correttamente

### Test di Fallback

Se abilitato il fallback automatico nelle impostazioni:
1. Configura solo Gemini
2. Inserisci una chiave non valida per Gemini
3. Configura correttamente un altro provider
4. Verifica che il sistema passi automaticamente al provider alternativo

## Limitazioni e Considerazioni

### Rate Limits (Tier Gratuito)

- **RPM (Requests Per Minute):** 60
- **RPD (Requests Per Day):** 1500
- **TPM (Tokens Per Minute):** 4M input + 16K output

### Gestione Errori

L'implementazione gestisce:
- Errori di rete
- Risposte non valide
- Rate limiting (429)
- Errori di autenticazione (401)

### Cache

Le risposte di Gemini sono cachate come quelle degli altri provider:
- Cache basata su URL + provider + settings
- TTL configurabile (default 7 giorni)
- Validazione hash contenuto

### Costi

**Tier Gratuito:**
- Completamente gratuito fino ai limiti
- Nessuna carta di credito richiesta

**Tier a Pagamento:**
- gemini-1.5-flash: $0.075 / 1M input tokens, $0.30 / 1M output tokens
- gemini-1.5-pro: $1.25 / 1M input tokens, $5.00 / 1M output tokens

## Compatibilità

### Funzionalità Supportate

✅ **Riassunti articoli web** (con prompt ottimizzati)
✅ **Estrazione punti chiave** (con prompt ottimizzato)
✅ Classificazione contenuto
✅ Traduzione articoli
✅ **Q&A su articoli** (con prompt ottimizzato)
✅ Estrazione citazioni
✅ Analisi PDF
✅ **Analisi multi-articolo** (con prompt ottimizzato)
✅ Cache e retry
✅ Fallback automatico

**Note sulle Ottimizzazioni:**

1. **Riassunti Articoli:**
   - Prompt specifici ottimizzati per ogni tipo di contenuto (general, scientific, news, tutorial, business, opinion)
   - Maggiore enfasi su completezza e preservazione dettagli
   - Strutture più dettagliate (6-8 sezioni vs 5-6 degli altri provider)
   - Sfrutta il context window ampio (1M token) per articoli lunghi
   - Fonte: `prompts/summary__gemini.md`

2. **Estrazione Punti Chiave:**
   - Prompt ottimizzato con enfasi su "completezza assoluta"
   - Specificità massima: "67%" NON "maggioranza"
   - Struttura rigorosa: esattamente 2-4 frasi per punto
   - Tracciabilità precisa con (§N) o (§N-M)
   - Esempi espliciti di cosa fare/non fare
   - Fonte: `prompts/estrazione_punti_chiave__gemini.md`

3. **Q&A su Articoli:**
   - Prompt specifico ottimizzato con enfasi su fedeltà alla fonte
   - Citazioni sistematiche con riferimenti ai paragrafi (§N)
   - Chiarezza epistemica: distinzione tra fatti espliciti, inferenze e informazioni assenti
   - Proattività nel richiedere chiarimenti per domande ambigue
   - Fonte: `prompts/Q&A__gemini.md`

4. **Analisi Multi-Articolo (Comparazione):**
   - Prompt specifico ottimizzato per analisi comparative dettagliate
   - Passa automaticamente al modello `gemini-1.5-pro-002` per maggiore capacità analitica
   - Output fino a 8000 token per analisi più approfondite (doppio degli altri provider)
   - Struttura in 9 sezioni invece di 6
   - Eccellente per confrontare 5+ articoli simultaneamente
   - Fonte: `prompts/comparazione_articoli__gemini.md`

### Funzionalità Future

🔜 Analisi immagini (Gemini è multimodale)
🔜 Analisi video
🔜 Context caching (per ridurre costi)
🔜 Streaming responses

## Troubleshooting

### Errore: "API key non configurata"

**Soluzione:**
1. Vai nelle impostazioni
2. Inserisci la tua API Key di Gemini
3. Clicca su "Salva API Keys"

### Errore: "Errore API Gemini"

**Possibili cause:**
1. API Key non valida
2. Rate limit raggiunto
3. Problemi di rete

**Soluzione:**
1. Verifica la chiave su [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Attendi qualche minuto se hai raggiunto il rate limit
3. Controlla la connessione internet

### Errore: "Risposta Gemini non valida"

**Possibili cause:**
1. Contenuto bloccato dai safety filters
2. Risposta malformata

**Soluzione:**
1. Prova con un articolo diverso
2. Riprova dopo qualche secondo
3. Usa un provider alternativo

### Performance Lenta

**Possibili cause:**
1. Articolo molto lungo
2. Rete lenta
3. Server Gemini sovraccarico

**Soluzione:**
1. Usa "Breve" come lunghezza riassunto
2. Attendi qualche secondo
3. Prova con un provider alternativo

## Manutenzione

### Aggiornamento Modelli

Per aggiornare il modello predefinito:

```javascript
// In utils/api-client.js
case 'gemini':
  return await this.callGeminiCompletion(apiKey, systemPrompt, userPrompt, {
    temperature,
    maxTokens,
    model: model || 'gemini-2.0-flash', // ← Cambia qui
    responseFormat
  });
```

### Aggiornamento Parametri

Per modificare i parametri di generazione:

```javascript
// In utils/api-client.js, metodo callGemini
generationConfig: {
  temperature: 0.5,        // ← Aumenta per output più creativi
  maxOutputTokens: 4000,   // ← Aumenta per output più lunghi
  topP: 0.95,
  topK: 40
}
```

### Monitoraggio Utilizzo

Per monitorare l'utilizzo:
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Seleziona il tuo progetto
3. Vai su "APIs & Services" > "Dashboard"
4. Cerca "Generative Language API"
5. Visualizza metriche e quote

## Conclusioni

L'integrazione di Gemini è completa e funzionale. Gli utenti possono ora:

1. ✅ Configurare la API Key di Gemini
2. ✅ Selezionare Gemini come provider
3. ✅ Generare riassunti con Gemini
4. ✅ Usare tutte le funzionalità dell'estensione
5. ✅ Beneficiare del tier gratuito generoso

Gemini offre un'ottima alternativa agli altri provider, con:
- Tier gratuito generoso
- Buona qualità di output
- Velocità competitiva
- Supporto multimodale (per future implementazioni)

## Ottimizzazioni Specifiche per Gemini

### Analisi Multi-Articolo (Comparazione)

Quando Gemini viene selezionato per l'analisi multi-articolo, il sistema utilizza configurazioni ottimizzate:

**Prompt Specifico:**
- Prompt dettagliato da `prompts/comparazione_articoli__gemini.md`
- Struttura analitica in 9 sezioni per massima profondità
- Focus su pattern recognition e meta-insights
- Ottimizzato per il processing di grandi volumi di testo

**Modello Utilizzato:**
```javascript
model: 'gemini-2.5-pro'  // Ultima generazione con reasoning avanzato
```

**Parametri:**
```javascript
{
  temperature: 0.2,      // Bassa per analisi rigorosa
  maxTokens: 8000,       // Doppio rispetto ad altri provider
  topP: 0.95,
  topK: 40
}
```

**Vantaggi per Comparazione:**
- ✅ Context window 1M token: può processare molti articoli lunghi
- ✅ Output 8K token: analisi molto dettagliate
- ✅ Eccellente per 5+ articoli simultaneamente
- ✅ Pattern recognition avanzato
- ✅ Sintesi multi-dimensionale

**Struttura Analisi Gemini:**
1. Comprehensive Overview
2. Multi-Dimensional Thematic Analysis
3. Convergence Analysis
4. Divergence Analysis
5. Contextual and Perspectival Analysis
6. Unique Contributions Mapping
7. Evidence and Quality Assessment
8. Integrative Synthesis
9. Meta-Analysis and Critical Evaluation

Questa struttura è più approfondita rispetto agli altri provider, sfruttando le capacità di Gemini nel processare e sintetizzare grandi quantità di informazioni.

## Riferimenti

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini Pricing](https://ai.google.dev/pricing)
- [Gemini Models](https://ai.google.dev/models/gemini)
