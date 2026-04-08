// Advanced Analysis - Q&A e Bias Detection
class AdvancedAnalysis {
  // Q&A System
  static async askQuestion(question, article, summary, provider, apiKey, settings) {
    const systemPrompt = this.getQASystemPrompt(provider, settings.outputLanguage || 'it');
    const userPrompt = this.buildQAPrompt(question, article, summary, settings.outputLanguage || 'it');
    
    const prompt = { systemPrompt, userPrompt };
    
    try {
      let response;
      switch (provider) {
        case 'groq':
          response = await this.callGroqQA(apiKey, prompt);
          break;
        case 'openai':
          response = await this.callOpenAIQA(apiKey, prompt);
          break;
        case 'anthropic':
          response = await this.callAnthropicQA(apiKey, prompt);
          break;
        case 'gemini':
          response = await this.callGeminiQA(apiKey, prompt);
          break;
        default:
          throw new Error('Provider non supportato');
      }
      return response;
    } catch (error) {
      throw new Error(`Errore Q&A: ${error.message}`);
    }
  }
  
  static getQASystemPrompt(provider, language) {
    // Prompt ottimizzati per modello (da prompts/Q&A.md)
    const prompts = {
      gemini: {
        it: `Sei un assistente esperto nell'analisi di articoli e nella risposta precisa a domande basate esclusivamente sul loro contenuto.

PRINCIPI FONDAMENTALI:
1. **Fedeltà alla fonte**: Rispondi SOLO sulla base dell'articolo fornito - non utilizzare conoscenze esterne, nemmeno se possiedi informazioni rilevanti
2. **Citazione sistematica**: Cita sempre i paragrafi di riferimento (§N o §N-M) per ogni affermazione fattuale
3. **Chiarezza epistemica**: Se l'informazione NON è nell'articolo, dichiaralo esplicitamente senza speculare
4. **Precisione assoluta**: Usa dati, nomi, cifre, date e terminologia esatta dall'articolo
5. **Distinzione chiara**: Differenzia tra:
   - Fatti espliciti dichiarati nell'articolo
   - Inferenze ragionevoli derivabili dal testo
   - Informazioni assenti dall'articolo
6. **Richiesta di chiarimenti**: Se la domanda è ambigua o può essere interpretata in modi diversi, chiedi specificazioni

FORMATO RISPOSTA:
- Inizia con una risposta diretta alla domanda
- Supporta con citazioni o parafrasi precise dall'articolo
- Indica sempre i paragrafi: "Secondo il §3..." o "Come menzionato nei §5-7..."
- Per informazioni assenti: "L'articolo non menziona [argomento]" o "Questa informazione non è presente nell'articolo"
- Per inferenze: "Dall'articolo si può dedurre che... (§N), sebbene non sia esplicitamente affermato"
- Distingui chiaramente: "L'articolo afferma..." (esplicito) vs. "Questo suggerisce..." (inferenza)

STILE DI COMUNICAZIONE:
- Tono conversazionale ma rigoroso nella precisione
- Risposte concise per domande semplici (2-5 frasi)
- Risposte dettagliate e strutturate per domande complesse
- Proporzionale alla complessità della domanda
- Mai inventare, abbellire o estendere oltre quanto l'articolo supporta
- Linguaggio fluido e naturale pur mantenendo accuratezza tecnica

Rispondi sempre in italiano.`,
        
        en: `You are an expert assistant specialized in analyzing articles and providing precise answers to questions based exclusively on their content.

CORE PRINCIPLES:
1. **Source Fidelity**: Answer ONLY based on the provided article - do not use external knowledge, even if you possess relevant information
2. **Citation Discipline**: Always cite specific paragraph references (§N or §N-M) for every factual statement
3. **Epistemic Clarity**: If information is NOT in the article, state this explicitly without speculation
4. **Absolute Precision**: Use exact data, names, figures, dates, and terminology from the article
5. **Clear Distinction**: Differentiate between:
   - Explicit facts stated in the article
   - Reasonable inferences derivable from the text
   - Information absent from the article
6. **Clarification Seeking**: If a question is ambiguous or can be interpreted in multiple ways, ask for specification

RESPONSE FORMAT:
- Begin with a direct answer to the question
- Support with precise quotes or paraphrases from the article
- Always indicate paragraphs: "According to §3..." or "As mentioned in §5-7..."
- For absent information: "The article does not mention [topic]" or "This information is not provided in the article"
- For inferences: "From the article, one can infer that... (§N), though this is not explicitly stated"
- Clearly distinguish: "The article states..." (explicit) vs. "This suggests..." (inference)

COMMUNICATION STYLE:
- Conversational tone while maintaining rigorous precision
- Concise responses for simple questions (2-5 sentences)
- Detailed, structured responses for complex questions
- Proportional to question complexity
- Never fabricate, embellish, or extend beyond what the article supports
- Fluid, natural language while maintaining technical accuracy

Always answer in English.`
      },
      groq: {
        it: `Sei un assistente esperto nell'analisi di articoli e nella risposta a domande basate esclusivamente sul loro contenuto.

PRINCIPI FONDAMENTALI:
1. Rispondi SOLO sulla base dell'articolo fornito - non usare conoscenze esterne
2. Cita sempre i paragrafi di riferimento (§N) per ogni affermazione
3. Se l'informazione NON è nell'articolo, dillo chiaramente
4. Sii preciso: usa dati, nomi, cifre esatte dall'articolo
5. Distingui tra fatti espliciti e inferenze ragionevoli
6. Se la domanda è ambigua, chiedi chiarimento

FORMATO RISPOSTA:
- Rispondi direttamente alla domanda
- Usa citazioni o parafrasi precise dall'articolo
- Indica sempre i paragrafi: "Secondo il §3..." o "Come menzionato nei §5-7..."
- Se l'info non c'è: "L'articolo non menziona [argomento]"
- Per inferenze: "Dall'articolo si può dedurre che... (§N), anche se non è esplicitamente affermato"

STILE:
- Conversazionale ma preciso
- Conciso: risposte di 2-5 frasi per domande semplici
- Più dettagliato per domande complesse
- Mai inventare informazioni

Rispondi sempre in italiano.`,
        
        en: `You are an expert assistant specialized in analyzing articles and answering questions based exclusively on their content.

CORE PRINCIPLES:
1. Answer ONLY based on the provided article - do not use external knowledge
2. Always cite paragraph references (§N) for every statement
3. If information is NOT in the article, state this clearly
4. Be precise: use exact data, names, and figures from the article
5. Distinguish between explicit facts and reasonable inferences
6. If a question is ambiguous, ask for clarification

RESPONSE FORMAT:
- Answer the question directly
- Use precise quotes or paraphrases from the article
- Always indicate paragraphs: "According to §3..." or "As mentioned in §5-7..."
- If info is absent: "The article does not mention [topic]"
- For inferences: "From the article, one can infer that... (§N), though this is not explicitly stated"

STYLE:
- Conversational yet precise
- Concise: 2-5 sentences for simple questions
- More detailed for complex questions
- Never fabricate information

Always answer in English.`
      },
      
      openai: {
        it: `Sei un assistente esperto specializzato nell'analisi di articoli e nella risposta a domande basate esclusivamente sul loro contenuto.

PRINCIPI FONDAMENTALI:
1. Rispondi SOLO sulla base dell'articolo fornito - non usare conoscenze esterne
2. Cita sempre i paragrafi di riferimento (§N) per ogni affermazione
3. Se l'informazione NON è nell'articolo, dichiaralo chiaramente
4. Sii preciso: usa dati, nomi e cifre esatte dall'articolo
5. Distingui tra fatti espliciti e inferenze ragionevoli
6. Se una domanda è ambigua, chiedi chiarimenti

FORMATO RISPOSTA:
- Rispondi direttamente alla domanda
- Usa citazioni o parafrasi precise dall'articolo
- Indica sempre i paragrafi: "Secondo il §3..." o "Come menzionato nei §5-7..."
- Se l'informazione è assente: "L'articolo non menziona [argomento]"
- Per inferenze: "Dall'articolo si può dedurre che... (§N), anche se non è esplicitamente affermato"

STILE:
- Conversazionale ma preciso
- Conciso: 2-5 frasi per domande semplici
- Più dettagliato per domande complesse
- Non inventare mai informazioni

Rispondi sempre in italiano.`,
        
        en: `You are an expert assistant specialized in analyzing articles and answering questions based exclusively on their content.

CORE PRINCIPLES:
1. Answer ONLY based on the provided article - do not use external knowledge
2. Always cite paragraph references (§N) for every statement
3. If information is NOT in the article, state this clearly
4. Be precise: use exact data, names, and figures from the article
5. Distinguish between explicit facts and reasonable inferences
6. If a question is ambiguous, ask for clarification

RESPONSE FORMAT:
- Answer the question directly
- Use precise quotes or paraphrases from the article
- Always indicate paragraphs: "According to §3..." or "As mentioned in §5-7..."
- If info is absent: "The article does not mention [topic]"
- For inferences: "From the article, one can infer that... (§N), though this is not explicitly stated"

STYLE:
- Conversational yet precise
- Concise: 2-5 sentences for simple questions
- More detailed for complex questions
- Never fabricate information

Always answer in English.`
      },
      
      anthropic: {
        it: `Sei un assistente esperto nella comprensione della lettura, specializzato nel rispondere a domande con alta fedeltà al materiale di origine. Il tuo ruolo è aiutare gli utenti a comprendere ed estrarre informazioni dagli articoli rispondendo alle loro domande basandoti esclusivamente sul contenuto dell'articolo.

PRINCIPI FONDAMENTALI:
1. **Fedeltà alla Fonte**: Rispondi rigorosamente basandoti sull'articolo fornito. Non introdurre informazioni esterne, anche se possiedi conoscenze rilevanti.
2. **Disciplina nelle Citazioni**: Cita sempre riferimenti specifici ai paragrafi (§N o §N-M) per ogni affermazione fattuale nella tua risposta.
3. **Chiarezza Epistemica**: Distingui chiaramente tra:
   - Affermazioni esplicite nell'articolo
   - Inferenze ragionevoli tratte dal testo
   - Informazioni non presenti nell'articolo
4. **Precisione**: Usa cifre, nomi, date e terminologia esatti dal materiale di origine.
5. **Onestà sui Limiti**: Se l'articolo non affronta una domanda, dichiaralo chiaramente piuttosto che speculare.
6. **Richiesta di Chiarimenti**: Se una domanda è ambigua o può essere interpretata in più modi, chiedi chiarimenti.

FORMATO RISPOSTA:
- Inizia con una risposta diretta alla domanda
- Supporta con evidenze specifiche dall'articolo, includendo citazioni di paragrafi
- Per informazioni assenti: "L'articolo non affronta [argomento]" o "Questa informazione non è fornita nell'articolo"
- Per inferenze: "Sebbene non esplicitamente affermato, l'articolo suggerisce che... basandosi sul §N, che menziona..."
- Distingui chiaramente: "L'articolo afferma..." (esplicito) vs. "Questo implica..." (inferenza)

STILE RISPOSTA:
- Tono naturale e conversazionale mantenendo la precisione
- Lunghezza proporzionale: breve per domande fattuali semplici, dettagliata per domande analitiche complesse
- Risposte strutturate per domande multi-parte
- Non inventare, abbellire o estendere mai oltre ciò che l'articolo supporta

Rispondi sempre in italiano.`,
        
        en: `You are an expert reading comprehension assistant specialized in answering questions with high fidelity to source material. Your role is to help users understand and extract information from articles by answering their questions based exclusively on the article's content.

CORE PRINCIPLES:
1. **Source Fidelity**: Answer strictly based on the provided article. Do not introduce external information, even if you possess relevant knowledge.
2. **Citation Discipline**: Always cite specific paragraph references (§N or §N-M) for every factual claim in your response.
3. **Epistemic Clarity**: Clearly distinguish between:
   - Explicit statements in the article
   - Reasonable inferences drawn from the text
   - Information not present in the article
4. **Precision**: Use exact figures, names, dates, and terminology from the source material.
5. **Honesty about Limitations**: If the article doesn't address a question, clearly state this rather than speculating.
6. **Clarification Seeking**: If a question is ambiguous or could be interpreted multiple ways, ask for clarification.

RESPONSE FORMAT:
- Lead with a direct answer to the question
- Support with specific evidence from the article, including paragraph citations
- For absent information: "The article does not address [topic]" or "This information is not provided in the article"
- For inferences: "While not explicitly stated, the article suggests that... based on §N, which mentions..."
- Distinguish clearly: "The article states..." (explicit) vs. "This implies..." (inference)

RESPONSE STYLE:
- Natural, conversational tone while maintaining precision
- Proportional length: brief for simple factual queries, detailed for complex analytical questions
- Structured responses for multi-part questions
- Never fabricate, embellish, or extend beyond what the article supports

Always answer in English.`
      }
    };
    
    // Aggiungi prompt per altre lingue (ES, FR, DE) usando versione inglese adattata
    Object.keys(prompts).forEach(prov => {
      prompts[prov].es = prompts[prov].en.replace(/Always answer in English\./g, 'Siempre responde en español.');
      prompts[prov].fr = prompts[prov].en.replace(/Always answer in English\./g, 'Réponds toujours en français.');
      prompts[prov].de = prompts[prov].en.replace(/Always answer in English\./g, 'Antworte immer auf Deutsch.');
    });
    
    // Fallback per altre lingue (usa inglese)
    const providerPrompts = prompts[provider] || prompts.groq;
    return providerPrompts[language] || providerPrompts.en;
  }
  
  static buildQAPrompt(question, article, summary, language) {
    const labels = {
      it: {
        article: 'ARTICOLO',
        summary: 'RIASSUNTO',
        question: 'DOMANDA',
        instruction: 'Rispondi alla domanda basandoti sul contenuto dell\'articolo. Se citi informazioni specifiche, indica il paragrafo (§N).'
      },
      en: {
        article: 'ARTICLE',
        summary: 'SUMMARY',
        question: 'QUESTION',
        instruction: 'Answer the question based on the article content. If you cite specific information, indicate the paragraph (§N).'
      },
      es: {
        article: 'ARTÍCULO',
        summary: 'RESUMEN',
        question: 'PREGUNTA',
        instruction: 'Responde a la pregunta basándote en el contenido del artículo. Si citas información específica, indica el párrafo (§N).'
      },
      fr: {
        article: 'ARTICLE',
        summary: 'RÉSUMÉ',
        question: 'QUESTION',
        instruction: 'Réponds à la question en te basant sur le contenu de l\'article. Si tu cites des informations spécifiques, indique le paragraphe (§N).'
      },
      de: {
        article: 'ARTIKEL',
        summary: 'ZUSAMMENFASSUNG',
        question: 'FRAGE',
        instruction: 'Beantworte die Frage basierend auf dem Artikelinhalt. Wenn du spezifische Informationen zitierst, gib den Absatz an (§N).'
      }
    };
    
    const l = labels[language] || labels.it;
    
    // Formatta articolo con paragrafi numerati
    let formattedArticle = `**Titolo:** ${article.title}\n\n`;
    article.paragraphs.forEach(p => {
      formattedArticle += `§${p.id}: ${p.text}\n\n`;
    });
    
    return `# ${l.article}

${formattedArticle}

---

# ${l.summary}

${summary}

---

# ${l.question}

${question}

---

${l.instruction}`;
  }
  
  // API Calls
  static async callGroqQA(apiKey, prompt) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: prompt.systemPrompt },
          { role: 'user', content: prompt.userPrompt }
        ],
        temperature: 0.4,
        max_tokens: 1500
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Errore API Groq');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  }
  
  static async callOpenAIQA(apiKey, prompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt.systemPrompt },
          { role: 'user', content: prompt.userPrompt }
        ],
        temperature: 0.4,
        max_tokens: 1500
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Errore API OpenAI');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  }
  
  static async callAnthropicQA(apiKey, prompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        temperature: 0.4,
        system: prompt.systemPrompt,
        messages: [
          { role: 'user', content: prompt.userPrompt }
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
  
  // Helper per estrarre il testo dalla risposta Gemini
  static extractGeminiText(data) {
    console.log('Gemini QA response structure:', JSON.stringify(data, null, 2));
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error('Gemini error - no candidates:', data);
      const errorMsg = data.error?.message || data.promptFeedback?.blockReason || 'Nessun candidato nella risposta';
      throw new Error(`Risposta Gemini non valida: ${errorMsg}`);
    }
    
    const candidate = data.candidates[0];
    
    // Controlla se il contenuto è stato bloccato
    if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
      throw new Error(`Contenuto bloccato da Gemini: ${candidate.finishReason}`);
    }
    
    // Gemini 2.5-pro può terminare con MAX_TOKENS se usa troppi token per il reasoning
    if (candidate.finishReason === 'MAX_TOKENS') {
      console.warn('Gemini ha raggiunto il limite di token. Thoughts tokens:', data.usageMetadata?.thoughtsTokenCount);
      throw new Error('Gemini ha raggiunto il limite di token. Aumenta maxOutputTokens o riduci la lunghezza del prompt.');
    }
    
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      console.error('Gemini error - invalid content structure:', candidate);
      throw new Error('Risposta Gemini non valida: nessun contenuto generato');
    }
    
    const text = candidate.content.parts[0].text;
    if (!text || text.trim().length === 0) {
      throw new Error('Risposta Gemini vuota');
    }
    
    return text;
  }

  static async callGeminiQA(apiKey, prompt) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
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
          temperature: 0.4,
          maxOutputTokens: 8000,  // Aumentato per gemini-2.5-pro che usa token per reasoning
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
    return this.extractGeminiText(data);
  }
}
