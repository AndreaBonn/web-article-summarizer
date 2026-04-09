// Provider Caller - Comunicazione con i provider LLM (Groq, OpenAI, Anthropic, Gemini)
export class ProviderCaller {
  static async _fetchWithTimeout(url, options, timeoutMs = 60000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Timeout: il provider non ha risposto entro 60 secondi. Riprova.');
      }
      throw error;
    }
  }

  static _validateChoicesResponse(data, provider) {
    if (!data.choices || data.choices.length === 0) {
      const reason = data.choices?.[0]?.finish_reason || data.error?.message;
      throw new Error(
        `${provider} ha restituito una risposta vuota${reason ? ` (${reason})` : ''}. ` +
          'Riprova o cambia provider.',
      );
    }
    const content = data.choices[0].message?.content;
    if (!content || content.trim().length === 0) {
      throw new Error(`${provider} ha restituito una risposta vuota.`);
    }
    return content;
  }

  static async callGroqCompletion(apiKey, systemPrompt, userPrompt, options) {
    const requestBody = {
      model: options.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    };

    // Aggiungi response_format se richiesto JSON
    if (options.responseFormat === 'json') {
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await this._fetchWithTimeout(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Errore API Groq');
    }

    const data = await response.json();
    return this._validateChoicesResponse(data, 'Groq');
  }

  static async callOpenAICompletion(apiKey, systemPrompt, userPrompt, options) {
    const requestBody = {
      model: options.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    };

    // Aggiungi response_format se richiesto JSON
    if (options.responseFormat === 'json') {
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await this._fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Errore API OpenAI');
    }

    const data = await response.json();
    return this._validateChoicesResponse(data, 'OpenAI');
  }

  static async callAnthropicCompletion(apiKey, systemPrompt, userPrompt, options) {
    const response = await this._fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Errore API Claude');
    }

    const data = await response.json();
    if (!data.content || data.content.length === 0 || !data.content[0].text) {
      throw new Error('Claude ha restituito una risposta vuota. Riprova o cambia provider.');
    }
    return data.content[0].text;
  }

  // Helper per estrarre il testo dalla risposta Gemini
  static extractGeminiText(data) {
    console.log('Gemini response structure:', JSON.stringify(data, null, 2));

    if (!data.candidates || data.candidates.length === 0) {
      console.error('Gemini error - no candidates:', data);
      const errorMsg =
        data.error?.message ||
        data.promptFeedback?.blockReason ||
        'Nessun candidato nella risposta';
      throw new Error(`Risposta Gemini non valida: ${errorMsg}`);
    }

    const candidate = data.candidates[0];

    // Controlla se il contenuto è stato bloccato
    if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
      throw new Error(`Contenuto bloccato da Gemini: ${candidate.finishReason}`);
    }

    // Gemini 2.5-pro può terminare con MAX_TOKENS se usa troppi token per il reasoning
    if (candidate.finishReason === 'MAX_TOKENS') {
      console.warn(
        'Gemini ha raggiunto il limite di token. Thoughts tokens:',
        data.usageMetadata?.thoughtsTokenCount,
      );
      throw new Error(
        'Gemini ha raggiunto il limite di token. Aumenta maxOutputTokens o riduci la lunghezza del prompt.',
      );
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

  static async callGeminiCompletion(apiKey, systemPrompt, userPrompt, options) {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\n${userPrompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
        topP: 0.95,
        topK: 40,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    };

    // Aggiungi response_mime_type se richiesto JSON
    if (options.responseFormat === 'json') {
      requestBody.generationConfig.responseMimeType = 'application/json';
    }

    const response = await this._fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Errore API Gemini');
    }

    const data = await response.json();
    return this.extractGeminiText(data);
  }
}
