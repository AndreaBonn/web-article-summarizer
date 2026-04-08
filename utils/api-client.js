// API Client - Gestione chiamate ai provider LLM
class APIClient {
  static async callAPI(provider, apiKey, article, settings) {
    const prompt = this.buildPrompt(provider, article, settings);
    return await this.generateCompletion(
      provider, apiKey, prompt.systemPrompt, prompt.userPrompt,
      { temperature: 0.3, maxTokens: provider === 'gemini' ? 8000 : 4096 }
    );
  }
  
  static detectContentType(article) {
    const titleLower = article.title.toLowerCase();
    const contentSample = article.content.toLowerCase().slice(0, 2000);
    
    // Scientific: presenza di termini accademici
    if (
      contentSample.includes('methodology') || 
      contentSample.includes('hypothesis') ||
      contentSample.includes('participants') ||
      contentSample.includes('p <') ||
      contentSample.includes('study') ||
      /\bp\s*=\s*0\.\d+/.test(contentSample)
    ) return 'scientific';
    
    // News: riferimenti temporali recenti e fonti
    if (
      /\b(today|yesterday|breaking|reported|according to|oggi|ieri)\b/.test(contentSample) ||
      /\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december|gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+\d{4}/i.test(contentSample)
    ) return 'news';
    
    // Tutorial: presenza di istruzioni step-by-step
    if (
      /\b(step|how to|tutorial|guide|install|configure|setup|guida|installare|configurare)\b/.test(titleLower) ||
      /\b(first|second|third|next|then|finally|primo|secondo|terzo|poi|infine)\b/.test(contentSample)
    ) return 'tutorial';
    
    // Business: termini aziendali
    if (
      /\b(revenue|market|strategy|roi|growth|company|business|ceo|azienda|mercato|strategia)\b/.test(contentSample) ||
      /\$\d+[MBK]|€\d+[MBK]/.test(contentSample)
    ) return 'business';
    
    // Opinion: prima persona e argomenti
    if (
      /\b(i believe|in my view|i think|we should|we must|credo che|penso che|dovremmo)\b/.test(contentSample) ||
      /\b(opinion|editorial|commentary|opinione|editoriale)\b/.test(titleLower)
    ) return 'opinion';
    
    return 'general';
  }
  
  static detectLanguage(text) {
    const sample = text.toLowerCase().slice(0, 1000);

    const patterns = {
      it: ['che', 'della', 'degli', 'delle', 'questo', 'questa', 'sono', 'essere', 'nell', 'alla'],
      en: ['the', 'and', 'that', 'this', 'with', 'from', 'have', 'been', 'which', 'their'],
      es: ['que', 'del', 'los', 'las', 'esta', 'este', 'para', 'con', 'una', 'por'],
      fr: ['que', 'les', 'des', 'cette', 'dans', 'pour', 'avec', 'sont', 'qui', 'pas'],
      de: ['der', 'die', 'das', 'und', 'ist', 'des', 'dem', 'den', 'nicht', 'sich']
    };

    let maxScore = 0;
    let detectedLang = 'en';

    for (const [lang, words] of Object.entries(patterns)) {
      const score = words.filter(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'g');
        return regex.test(sample);
      }).length;
      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    }

    return detectedLang;
  }
  
  static getSystemPrompt(provider, contentType) {
    return PromptRegistry.getSummarySystemPrompt(provider, contentType);
  }


  // Funzione per estrarre solo i punti chiave (senza riassunto)
  static async extractKeyPoints(provider, apiKey, article, settings) {
    const prompt = this.buildKeyPointsPrompt(provider, article, settings);
    return await this.generateCompletion(
      provider, apiKey, prompt.systemPrompt, prompt.userPrompt,
      { temperature: 0.3, maxTokens: provider === 'gemini' ? 8000 : 4096 }
    );
  }

  static getKeyPointsSystemPrompt(provider, contentType) {
    return PromptRegistry.getKeyPointsSystemPrompt(provider, contentType);
  }

  static buildKeyPointsPrompt(provider, article, settings) {
    // Rileva tipo di contenuto e lingua
    const contentType = settings.contentType || this.detectContentType(article);
    const detectedLanguage = this.detectLanguage(article.content);
    
    // Mappa lingua output
    const languageMap = {
      it: { 
        name: 'italiano', 
        instruction: 'Scrivi i punti chiave in italiano',
        systemAddition: '\n\nIMPORTANTE: Devi scrivere i punti chiave ESCLUSIVAMENTE in ITALIANO, indipendentemente dalla lingua dell\'articolo originale.'
      },
      en: { 
        name: 'English', 
        instruction: 'Write the key points in English',
        systemAddition: '\n\nIMPORTANT: You MUST write the key points EXCLUSIVELY in ENGLISH, regardless of the original article language.'
      },
      es: { 
        name: 'español', 
        instruction: 'Escribe los puntos clave en español',
        systemAddition: '\n\nIMPORTANTE: Debes escribir los puntos clave EXCLUSIVAMENTE en ESPAÑOL, independientemente del idioma del artículo original.'
      },
      fr: { 
        name: 'français', 
        instruction: 'Écris les points clés en français',
        systemAddition: '\n\nIMPORTANT: Tu DOIS écrire les points clés EXCLUSIVEMENT en FRANÇAIS, quelle que soit la langue de l\'article original.'
      },
      de: { 
        name: 'Deutsch', 
        instruction: 'Schreibe die Schlüsselpunkte auf Deutsch',
        systemAddition: '\n\nWICHTIG: Du MUSST die Schlüsselpunkte AUSSCHLIESSLICH auf DEUTSCH schreiben, unabhängig von der Sprache des Originalartikels.'
      }
    };
    
    const outputLang = languageMap[settings.outputLanguage] || languageMap[detectedLanguage] || languageMap.it;
    
    // Ottieni system prompt appropriato e aggiungi istruzione lingua
    let systemPrompt = this.getKeyPointsSystemPrompt(provider, contentType);
    systemPrompt += outputLang.systemAddition;
    
    // Formatta articolo
    const formattedArticle = this.formatArticleForPrompt(article);
    
    // Costruisci user prompt basato sul tipo di contenuto
    let userPrompt = this.buildKeyPointsUserPrompt(contentType, formattedArticle, article, outputLang);
    
    return { systemPrompt, userPrompt, metadata: { contentType, detectedLanguage } };
  }
  
  static buildKeyPointsUserPrompt(contentType, formattedArticle, article, outputLang) {
    const baseInstructions = `# ARTICOLO DA ANALIZZARE

${formattedArticle}

---

# ISTRUZIONI PER L'ESTRAZIONE

## ⚠️ LINGUA DI OUTPUT RICHIESTA: ${outputLang.name.toUpperCase()}
${outputLang.instruction.toUpperCase()}

## Obiettivo
Estrai 7-12 punti chiave che catturino TUTTE le informazioni importanti e interessanti dell'articolo. Ogni punto deve essere conciso (2-4 frasi) ma esaustivo.`;

    const qualityCriteria = `
## Criteri di Qualità

Ogni punto chiave deve:
1. **Essere specifico**: usa dati concreti, non generalizzazioni
2. **Essere autosufficiente**: comprensibile senza leggere altri punti
3. **Avere riferimenti**: indicare sempre §N o §N-M
4. **Essere sostanziale**: fornire informazioni di valore
5. **Essere conciso**: 2-4 frasi, non di più

## Struttura di Ogni Punto

**[Titolo descrittivo e specifico del concetto]** (§N o §N-M)
Spiegazione in 2-4 frasi che include: (1) il concetto principale, (2) dettagli specifici concreti, (3) contesto o implicazioni se rilevanti. Usa dati numerici precisi quando disponibili.`;

    const outputFormat = `
---

# FORMATO OUTPUT

## PUNTI CHIAVE

1. **[Titolo chiaro e descrittivo]** (§N)
   [Prima frase: concetto principale]. [Seconda frase: dettagli specifici con dati]. [Terza frase opzionale: contesto o implicazioni].

2. **[Titolo]** (§N-M)
   [Spiegazione completa ma concisa]

...

---

⚠️ REMINDER: Scrivi TUTTI i punti chiave in ${outputLang.name.toUpperCase()}.

Inizia ora con l'estrazione dei punti chiave.`;

    // Istruzioni specifiche per tipo di contenuto
    const specificInstructions = {
      scientific: `
## Cosa Includere (ARTICOLI SCIENTIFICI)

**OBBLIGATORI:**
1. **Domanda di ricerca/Ipotesi principale** (§N)
2. **Design dello studio e metodologia** (§N-M): tipo studio, N campione, caratteristiche partecipanti
3. **Procedure e misure** (§N): strumenti utilizzati, variabili misurate
4. **Risultato principale** (§N): con statistiche complete (M, SD, p-value, effect size)
5. **Risultati secondari significativi** (§N): tutti i risultati statisticamente significativi
6. **Limitazioni riconosciute** (§N)
7. **Implicazioni e direzioni future** (§N)

**FORMATO PER RISULTATI:**
Includi SEMPRE: media (M), deviazione standard (SD), valore p, dimensione effetto (Cohen's d, η², etc.), intervalli di confidenza quando disponibili.`,

      news: `
## Cosa Includere (NEWS)

**STRUTTURA OBBLIGATORIA:**
1. **Fatto Principale** (§N): CHI ha fatto/detto COSA, QUANDO e DOVE
2. **Sviluppi Chiave in Ordine Cronologico** (§N-M)
3. **Dichiarazioni delle Parti Coinvolte** (§N): con attribuzione chiara della fonte
4. **Contesto e Background** (§N)
5. **Dati e Cifre** (§N): tutti i numeri significativi
6. **Reazioni e Commenti** (§N)
7. **Implicazioni e Conseguenze** (§N)

**REGOLE SPECIFICHE:**
- Distingui fatti verificati da allegazioni
- Attribuisci SEMPRE le informazioni: "Secondo X", "Come riportato da Y"
- Include timestamp precisi quando disponibili`,

      tutorial: `
## Cosa Includere (TUTORIAL)

**STRUTTURA OBBLIGATORIA:**
1. **Obiettivo e Risultato Finale** (§N)
2. **Prerequisiti e Setup Iniziale** (§N): conoscenze, software/tools con versioni
3. **Passi Procedurali Chiave** (§N-M): sequenza logica
4. **Comandi/Codice Fondamentali** (§N): sintassi esatte
5. **Concetti Tecnici Importanti** (§N): principi sottostanti
6. **Configurazioni Critiche** (§N)
7. **Problemi Comuni e Soluzioni** (§N)
8. **Verifica del Successo** (§N)`,

      business: `
## Cosa Includere (BUSINESS)

**STRUTTURA OBBLIGATORIA:**
1. **Context** (§N): azienda, industria, situazione iniziale
2. **Sfida o Opportunità** (§N)
3. **Strategia e Approccio** (§N-M)
4. **Implementazione e Tattiche** (§N)
5. **Risultati e Metriche** (§N): KPI specifici, ROI
6. **Insights e Implicazioni** (§N)

**FOCUS:**
- Dati quantitativi specifici (revenue, market share, growth %)
- Metriche di successo misurabili
- Actionable insights`,

      opinion: `
## Cosa Includere (OPINION)

**STRUTTURA OBBLIGATORIA:**
1. **Tesi Principale** (§N): posizione dell'autore
2. **Contesto e Motivazione** (§N)
3. **Argomenti Principali** (§N-M): con evidenze a supporto
4. **Contro-argomenti Affrontati** (§N): se presenti
5. **Conclusioni e Call-to-Action** (§N)

**REGOLE:**
- Distingui chiaramente fatti da opinioni
- Riporta la posizione dell'autore in modo neutrale
- Includi le evidenze usate a supporto`,

      general: `
## Cosa Includere nei Punti Chiave

✅ **SEMPRE:**
- Concetti centrali e argomenti principali
- Dati quantitativi specifici (numeri, percentuali, statistiche)
- Nomi propri, date, luoghi rilevanti
- Esempi concreti che illustrano concetti
- Citazioni o affermazioni chiave di esperti/fonti
- Conclusioni e take-away principali
- Implicazioni pratiche o teoriche
- Informazioni sorprendenti o contro-intuitive
- Dettagli tecnici rilevanti
- Background o contesto essenziale

❌ **MAI:**
- Punti troppo vaghi o generici
- Informazioni ridondanti o ripetitive
- Dettagli marginali o irrilevanti
- Opinioni personali non nell'articolo
- Interpretazioni non supportate dal testo`
    };

    return baseInstructions + 
           (specificInstructions[contentType] || specificInstructions.general) + 
           qualityCriteria + 
           outputFormat;
  }
  
  static parseResponse(responseText) {
    const parts = responseText.split('## PUNTI CHIAVE');
    
    const summary = parts[0]
      .replace('## RIASSUNTO', '')
      .trim();
    
    const keyPointsText = parts[1] || '';
    const keyPointsRegex = /\d+\.\s+\*\*(.+?)\*\*\s+\(§(\d+(?:-\d+)?)\)\s+(.+?)(?=\n\d+\.|$)/gs;
    
    const keyPoints = [];
    let match;
    
    while ((match = keyPointsRegex.exec(keyPointsText)) !== null) {
      keyPoints.push({
        title: match[1].trim(),
        paragraphs: match[2],
        description: match[3].trim()
      });
    }
    
    return { summary, keyPoints };
  }
  
  static parseKeyPointsResponse(responseText) {
    // Parse solo i punti chiave (senza riassunto)
    const keyPointsText = responseText.replace('## PUNTI CHIAVE', '').trim();
    const keyPointsRegex = /\d+\.\s+\*\*(.+?)\*\*\s+\(§(\d+(?:-\d+)?)\)\s+(.+?)(?=\n\d+\.|$)/gs;
    
    const keyPoints = [];
    let match;
    
    while ((match = keyPointsRegex.exec(keyPointsText)) !== null) {
      keyPoints.push({
        title: match[1].trim(),
        paragraphs: match[2],
        description: match[3].trim()
      });
    }
    
    return keyPoints;
  }
  
  /**
   * Chiama API con resilienza completa (retry, fallback, cache, rate limiting)
   * @param {Object} params - Parametri della chiamata
   * @returns {Promise} Risultato con metadata
   */
  static async callAPIResilient(params) {
    const {
      provider,
      apiKeys,
      article,
      settings,
      enableCache = true,
      enableFallback = false,
      onProgress = null
    } = params;

    // Inizializza manager
    const resilience = new APIResilience();
    const cacheManager = new CacheManager();

    // 1. Controlla cache
    if (enableCache) {
      if (onProgress) onProgress({ stage: 'cache', message: 'Controllo cache...' });
      
      const cached = await cacheManager.get(article.url, provider, settings);
      if (cached) {
        if (onProgress) onProgress({ stage: 'cache', message: 'Risultato trovato in cache!' });
        return {
          result: cached,
          fromCache: true,
          provider: provider
        };
      }
    }

    // 2. Chiama API con resilienza
    if (onProgress) onProgress({ stage: 'api', message: 'Chiamata API in corso...' });

    const result = await resilience.callWithFallback({
      primaryProvider: provider,
      apiKeys,
      article,
      settings,
      enableFallback,
      onRetry: (attempt, maxAttempts, delay) => {
        if (onProgress) {
          onProgress({
            stage: 'retry',
            message: `Tentativo ${attempt}/${maxAttempts}... (attesa ${Math.round(delay/1000)}s)`
          });
        }
      },
      onFallback: (fallbackProvider, index) => {
        if (onProgress) {
          onProgress({
            stage: 'fallback',
            message: `Passaggio a provider alternativo: ${fallbackProvider}`
          });
        }
      }
    });

    // 3. Salva in cache
    if (enableCache && result.result) {
      await cacheManager.set(article.url, result.usedProvider, settings, result.result);
    }

    if (onProgress) onProgress({ stage: 'complete', message: 'Completato!' });

    return {
      result: result.result,
      fromCache: false,
      provider: result.usedProvider
    };
  }

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Metodo generico per generare completion con parametri personalizzabili
  static async generateCompletion(provider, apiKey, systemPrompt, userPrompt, options = {}) {
    const {
      temperature = 0.3,
      maxTokens = 4096,
      model = null,
      responseFormat = null  // Può essere 'json' per forzare output JSON
    } = options;
    
    switch (provider) {
      case 'groq':
        return await this.callGroqCompletion(apiKey, systemPrompt, userPrompt, {
          temperature,
          maxTokens,
          model: model || 'llama-3.3-70b-versatile',
          responseFormat
        });
      case 'openai':
        return await this.callOpenAICompletion(apiKey, systemPrompt, userPrompt, {
          temperature,
          maxTokens,
          model: model || 'gpt-4o',
          responseFormat
        });
      case 'anthropic':
        return await this.callAnthropicCompletion(apiKey, systemPrompt, userPrompt, {
          temperature,
          maxTokens,
          model: model || 'claude-3-5-sonnet-20241022',
          responseFormat
        });
      case 'gemini':
        return await this.callGeminiCompletion(apiKey, systemPrompt, userPrompt, {
          temperature,
          maxTokens,
          model: model || 'gemini-2.5-pro',
          responseFormat
        });
      default:
        throw new Error('Provider non supportato');
    }
  }
  
  static async callGroqCompletion(apiKey, systemPrompt, userPrompt, options) {
    const requestBody = {
      model: options.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: options.temperature,
      max_tokens: options.maxTokens
    };
    
    // Aggiungi response_format se richiesto JSON
    if (options.responseFormat === 'json') {
      requestBody.response_format = { type: 'json_object' };
    }
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Errore API Groq');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  }
  
  static async callOpenAICompletion(apiKey, systemPrompt, userPrompt, options) {
    const requestBody = {
      model: options.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: options.temperature,
      max_tokens: options.maxTokens
    };
    
    // Aggiungi response_format se richiesto JSON
    if (options.responseFormat === 'json') {
      requestBody.response_format = { type: 'json_object' };
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Errore API OpenAI');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  }
  
  static async callAnthropicCompletion(apiKey, systemPrompt, userPrompt, options) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Errore API Claude');
    }
    
    const data = await response.json();
    return data.content[0].text;
  }
  
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
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
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
    return this.extractGeminiText(data);
  }
}
