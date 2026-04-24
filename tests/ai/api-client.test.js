import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dipendenze di provider-caller (unico modulo con side-effect reali)
vi.mock('@utils/core/logger.js', () => ({
  Logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Mock sub-modules usati da api-orchestrator
vi.mock('@utils/ai/content-detector.js', () => ({
  ContentDetector: {
    detectContentType: vi.fn().mockReturnValue('general'),
    detectLanguage: vi.fn().mockReturnValue('en'),
  },
}));
vi.mock('@utils/ai/prompt-builder.js', () => ({
  PromptBuilder: {
    buildPrompt: vi.fn().mockReturnValue({ systemPrompt: 'sys', userPrompt: 'usr' }),
    buildKeyPointsPrompt: vi.fn().mockReturnValue({ systemPrompt: 'sys', userPrompt: 'usr' }),
  },
}));
vi.mock('@utils/ai/response-parser.js', () => ({
  ResponseParser: {
    parseResponse: vi.fn((t) => ({ parsed: t })),
  },
}));

import { APIClient, DEFAULT_MODELS } from '@utils/ai/api-client.js';
import { ProviderCaller } from '@utils/ai/provider-caller.js';

// Helper per mock Response
function mockResponse({ status = 200, body = {}, contentType = 'application/json', ok } = {}) {
  return {
    ok: ok ?? (status >= 200 && status < 300),
    status,
    statusText: 'OK',
    headers: {
      get: (name) => (name === 'content-type' ? contentType : null),
    },
    json: vi.fn().mockResolvedValue(body),
  };
}

describe('api-client.js barrel exports', () => {
  it('APIClient è alias di APIOrchestrator con generateCompletion', () => {
    expect(typeof APIClient.generateCompletion).toBe('function');
  });

  it('APIClient espone callAPI', () => {
    expect(typeof APIClient.callAPI).toBe('function');
  });

  it('APIClient espone extractKeyPoints', () => {
    expect(typeof APIClient.extractKeyPoints).toBe('function');
  });

  it('APIClient espone parseResponse', () => {
    expect(typeof APIClient.parseResponse).toBe('function');
  });

  it('DEFAULT_MODELS contiene tutti i 4 provider', () => {
    expect(Object.keys(DEFAULT_MODELS)).toEqual(
      expect.arrayContaining(['groq', 'openai', 'anthropic', 'gemini']),
    );
  });

  it('DEFAULT_MODELS valori sono stringhe non vuote', () => {
    for (const [, model] of Object.entries(DEFAULT_MODELS)) {
      expect(typeof model).toBe('string');
      expect(model.length).toBeGreaterThan(0);
    }
  });
});

describe('APIClient.generateCompletion — integrazione con ProviderCaller', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Groq con responseFormat json
  // ---------------------------------------------------------------------------

  it('Groq: aggiunge response_format json_object quando responseFormat è json', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        body: { choices: [{ message: { content: '{"key":"val"}' } }] },
      }),
    );

    await APIClient.generateCompletion('groq', 'groq-key', 'sys', 'user', {
      responseFormat: 'json',
    });

    const [, opts] = global.fetch.mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  // ---------------------------------------------------------------------------
  // Provider routing end-to-end
  // ---------------------------------------------------------------------------

  it('Groq: invia a endpoint corretto con Authorization Bearer', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        body: { choices: [{ message: { content: 'result' } }] },
      }),
    );

    await APIClient.generateCompletion('groq', 'my-groq-key', 'sys prompt', 'user prompt');

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(opts.headers.Authorization).toBe('Bearer my-groq-key');
    const body = JSON.parse(opts.body);
    expect(body.messages[0].content).toBe('sys prompt');
    expect(body.messages[1].content).toBe('user prompt');
    expect(body.model).toBe(DEFAULT_MODELS.groq);
  });

  it('OpenAI: invia a endpoint corretto', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        body: { choices: [{ message: { content: 'openai result' } }] },
      }),
    );

    const result = await APIClient.generateCompletion('openai', 'oai-key', 'sys', 'user');

    expect(global.fetch.mock.calls[0][0]).toBe('https://api.openai.com/v1/chat/completions');
    expect(result).toBe('openai result');
  });

  it('Anthropic: invia a endpoint Anthropic con header x-api-key', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        body: { content: [{ text: 'claude result' }] },
      }),
    );

    const result = await APIClient.generateCompletion('anthropic', 'anth-key', 'sys', 'user');

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain('anthropic.com');
    expect(opts.headers['x-api-key']).toBe('anth-key');
    expect(result).toBe('claude result');
  });

  it('Gemini: invia a endpoint Google con x-goog-api-key', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        body: {
          candidates: [
            { content: { parts: [{ text: 'gemini result' }] }, finishReason: 'STOP' },
          ],
        },
      }),
    );

    const result = await APIClient.generateCompletion('gemini', 'gem-key', 'sys', 'user');

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(opts.headers['x-goog-api-key']).toBe('gem-key');
    expect(result).toBe('gemini result');
  });

  // ---------------------------------------------------------------------------
  // Provider non supportato
  // ---------------------------------------------------------------------------

  it('lancia errore per provider sconosciuto', async () => {
    await expect(
      APIClient.generateCompletion('mistral', 'key', 'sys', 'user'),
    ).rejects.toThrow('Provider non supportato');
  });

  // ---------------------------------------------------------------------------
  // Timeout / Abort
  // ---------------------------------------------------------------------------

  it('lancia errore di timeout su AbortError', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    });

    await expect(
      APIClient.generateCompletion('groq', 'key', 'sys', 'user'),
    ).rejects.toThrow('Timeout');
  });

  it('propaga errori di rete non-abort', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(
      APIClient.generateCompletion('groq', 'key', 'sys', 'user'),
    ).rejects.toThrow('Failed to fetch');
  });

  // ---------------------------------------------------------------------------
  // Rate limit
  // ---------------------------------------------------------------------------

  it('lancia errore rate limit su HTTP 429 per qualsiasi provider', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockResponse({ status: 429, ok: false }));

    await expect(
      APIClient.generateCompletion('openai', 'key', 'sys', 'user'),
    ).rejects.toThrow('[RATE_LIMIT:OpenAI]');
  });

  // ---------------------------------------------------------------------------
  // HTTP error con messaggio JSON
  // ---------------------------------------------------------------------------

  it('estrae messaggio errore dal body JSON su HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: { get: () => 'application/json' },
      json: vi.fn().mockResolvedValue({ error: { message: 'Invalid API key provided' } }),
    });

    await expect(
      APIClient.generateCompletion('groq', 'bad-key', 'sys', 'user'),
    ).rejects.toThrow('Invalid API key provided');
  });

  // ---------------------------------------------------------------------------
  // Opzioni default
  // ---------------------------------------------------------------------------

  it('usa temperature 0.3 e maxTokens 4096 come default', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        body: { choices: [{ message: { content: 'ok' } }] },
      }),
    );

    await APIClient.generateCompletion('groq', 'key', 'sys', 'user');

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.temperature).toBe(0.3);
    expect(body.max_tokens).toBe(4096);
  });

  it('sovrascrive temperature e maxTokens con opzioni custom', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        body: { choices: [{ message: { content: 'ok' } }] },
      }),
    );

    await APIClient.generateCompletion('openai', 'key', 'sys', 'user', {
      temperature: 0.9,
      maxTokens: 1024,
    });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.temperature).toBe(0.9);
    expect(body.max_tokens).toBe(1024);
  });

  it('usa modello custom quando specificato nelle opzioni', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        body: { choices: [{ message: { content: 'ok' } }] },
      }),
    );

    await APIClient.generateCompletion('groq', 'key', 'sys', 'user', {
      model: 'llama-3.1-8b-instant',
    });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.model).toBe('llama-3.1-8b-instant');
  });

  // ---------------------------------------------------------------------------
  // Risposta vuota
  // ---------------------------------------------------------------------------

  it('lancia errore su choices vuote', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({ body: { choices: [] } }),
    );

    await expect(
      APIClient.generateCompletion('groq', 'key', 'sys', 'user'),
    ).rejects.toThrow('risposta vuota');
  });

  it('lancia errore su content vuoto in choices', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        body: { choices: [{ message: { content: '' } }] },
      }),
    );

    await expect(
      APIClient.generateCompletion('groq', 'key', 'sys', 'user'),
    ).rejects.toThrow('risposta vuota');
  });

  // ---------------------------------------------------------------------------
  // Anthropic — risposta vuota
  // ---------------------------------------------------------------------------

  it('Anthropic: lancia errore su content array vuoto', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({ body: { content: [] } }),
    );

    await expect(
      APIClient.generateCompletion('anthropic', 'key', 'sys', 'user'),
    ).rejects.toThrow('risposta vuota');
  });

  // ---------------------------------------------------------------------------
  // Gemini — risposta bloccata
  // ---------------------------------------------------------------------------

  it('Gemini: lancia errore su contenuto bloccato per SAFETY', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        body: {
          candidates: [
            { finishReason: 'SAFETY', content: { parts: [{ text: 'x' }] } },
          ],
        },
      }),
    );

    await expect(
      APIClient.generateCompletion('gemini', 'key', 'sys', 'user'),
    ).rejects.toThrow('Contenuto bloccato');
  });

  it('Gemini: lancia errore su MAX_TOKENS', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        body: {
          candidates: [
            { finishReason: 'MAX_TOKENS', content: { parts: [{ text: 'x' }] } },
          ],
        },
      }),
    );

    await expect(
      APIClient.generateCompletion('gemini', 'key', 'sys', 'user'),
    ).rejects.toThrow('limite di token');
  });

  // ---------------------------------------------------------------------------
  // Content-Type non JSON
  // ---------------------------------------------------------------------------

  it('lancia errore se risposta ha Content-Type non JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'text/html' },
      json: vi.fn().mockResolvedValue({}),
    });

    await expect(
      APIClient.generateCompletion('groq', 'key', 'sys', 'user'),
    ).rejects.toThrow('risposta non JSON');
  });
});

describe('APIClient.parseResponse — proxy a ResponseParser', () => {
  it('delega a ResponseParser e restituisce risultato', () => {
    const result = APIClient.parseResponse('testo di test');
    expect(result).toEqual({ parsed: 'testo di test' });
  });
});
