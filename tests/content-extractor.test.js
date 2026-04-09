import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock di @mozilla/readability — non disponibile in jsdom senza browser reale
vi.mock('@mozilla/readability', () => ({
  Readability: class {
    constructor(_doc) {}
    parse() {
      // Ritorna null di default; i singoli test possono sovrascrivere
      return null;
    }
  },
}));

import { ContentExtractor } from '@utils/core/content-extractor.js';

/**
 * Crea un document jsdom minimale con un articolo a n parole.
 */
function buildDocument({ wordCount = 300, useArticleTag = true, title = 'Titolo Test' } = {}) {
  document.title = title;

  // Ripulisce body
  document.body.innerHTML = '';

  const words = Array.from({ length: wordCount }, (_, i) => `parola${i}`).join(' ');

  // Divide in 5 paragrafi da wordCount/5 parole ciascuno (min 20 char garantito)
  const chunkSize = Math.ceil(wordCount / 5);
  const wordArray = words.split(' ');
  const paragraphs = [];
  for (let i = 0; i < 5; i++) {
    paragraphs.push(wordArray.slice(i * chunkSize, (i + 1) * chunkSize).join(' '));
  }

  const container = useArticleTag ? document.createElement('article') : document.createElement('main');
  paragraphs.forEach((text) => {
    const p = document.createElement('p');
    p.textContent = text;
    container.appendChild(p);
  });
  document.body.appendChild(container);

  return document;
}

describe('ContentExtractor.extract() — fallback extraction (Readability ritorna null)', () => {
  beforeEach(() => {
    // window.location.href è read-only in jsdom, ma ContentExtractor lo legge
    // Non serve impostarlo — jsdom usa "about:blank" di default
  });

  it('estrae contenuto da un <article> con paragrafi sufficienti', () => {
    buildDocument({ wordCount: 300, useArticleTag: true });
    const result = ContentExtractor.extract(document);

    expect(result).toBeTruthy();
    expect(result.paragraphs.length).toBeGreaterThan(0);
    expect(result.wordCount).toBeGreaterThanOrEqual(200);
    expect(result.title).toBe('Titolo Test');
  });

  it('usa fallback su <main> se non esiste <article>', () => {
    buildDocument({ wordCount: 300, useArticleTag: false });
    const result = ContentExtractor.extract(document);

    expect(result).toBeTruthy();
    expect(result.wordCount).toBeGreaterThanOrEqual(200);
  });

  it('filtra paragrafi troppo corti (<30 caratteri nel fallback)', () => {
    document.body.innerHTML = '';
    const article = document.createElement('article');

    // Paragrafo corto — deve essere filtrato
    const short = document.createElement('p');
    short.textContent = 'Corto';
    article.appendChild(short);

    // 5 paragrafi lunghi con abbastanza parole
    for (let i = 0; i < 5; i++) {
      const p = document.createElement('p');
      p.textContent = Array.from({ length: 50 }, (_, j) => `word${i}_${j}`).join(' ');
      article.appendChild(p);
    }

    document.body.appendChild(article);
    const result = ContentExtractor.extract(document);

    // Il paragrafo "Corto" non deve essere nei paragrafi estratti
    const shortParagraphs = result.paragraphs.filter((p) => p.text === 'Corto');
    expect(shortParagraphs).toHaveLength(0);
  });

  it('lancia errore "Article too short" con meno di 200 parole', () => {
    buildDocument({ wordCount: 50, useArticleTag: true });
    expect(() => ContentExtractor.extract(document)).toThrow('Article too short');
  });

  it('include readingTimeMinutes calcolato correttamente', () => {
    buildDocument({ wordCount: 450, useArticleTag: true }); // 450 / 225 = 2 min
    const result = ContentExtractor.extract(document);
    expect(result.readingTimeMinutes).toBeGreaterThanOrEqual(1);
  });
});

describe('ContentExtractor.extract() — con Readability che restituisce contenuto', () => {
  it('usa Readability quando disponibile e ritorna articolo strutturato', async () => {
    // Sovrascrive il mock per questo test con Readability funzionante
    const { Readability } = await import('@mozilla/readability');

    // Costruisce HTML sufficiente nel document
    document.body.innerHTML = '';
    const article = document.createElement('article');
    // 300 parole nei paragrafi
    for (let i = 0; i < 5; i++) {
      const p = document.createElement('p');
      p.textContent = Array.from({ length: 60 }, (_, j) => `testo${i}_${j}`).join(' ');
      article.appendChild(p);
    }
    document.body.appendChild(article);
    document.title = 'Titolo da Readability';

    // Fa fallire Readability (ritorna null) → usa fallback
    vi.spyOn(Readability.prototype, 'parse').mockReturnValue(null);

    const result = ContentExtractor.extract(document);

    // Anche con fallback, l'estrazione funziona
    expect(result).toBeTruthy();
    expect(result.title).toBe('Titolo da Readability');
  });
});

describe('ContentExtractor — struttura dati risultante', () => {
  it('restituisce oggetto con tutte le proprietà attese', () => {
    buildDocument({ wordCount: 300 });
    const result = ContentExtractor.extract(document);

    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('author');
    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('paragraphs');
    expect(result).toHaveProperty('wordCount');
    expect(result).toHaveProperty('readingTimeMinutes');
    expect(result).toHaveProperty('excerpt');
    expect(Array.isArray(result.paragraphs)).toBe(true);
  });

  it('ogni paragrafo ha id numerico e testo non vuoto', () => {
    buildDocument({ wordCount: 300 });
    const result = ContentExtractor.extract(document);

    result.paragraphs.forEach((p) => {
      expect(typeof p.id).toBe('number');
      expect(p.id).toBeGreaterThan(0);
      expect(typeof p.text).toBe('string');
      expect(p.text.length).toBeGreaterThan(0);
    });
  });
});
