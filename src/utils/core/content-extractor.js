// Content Extractor - Estrazione e parsing articoli
import { Readability } from '@mozilla/readability';

const MIN_ARTICLE_WORDS = 200;
const MIN_PARAGRAPH_LENGTH = 20;
const WORDS_PER_MINUTE = 225;

export class ContentExtractor {
  static extract(document) {
    // Prova prima con Readability
    try {
      if (typeof Readability !== 'undefined') {
        const documentClone = document.cloneNode(true);
        const reader = new Readability(documentClone);
        const article = reader.parse();

        if (article && article.content) {
          return this.processReadabilityArticle(article, document);
        }
      }
    } catch (error) {
      console.warn('Readability fallito:', error);
    }

    // Fallback: estrazione manuale
    return this.fallbackExtraction(document);
  }

  static processReadabilityArticle(article, document) {
    // Estrai paragrafi numerati
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = article.content;

    const paragraphs = [];
    const paragraphElements = tempDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');

    let validIndex = 0;
    paragraphElements.forEach((el) => {
      const text = el.textContent.trim();
      if (text.length > MIN_PARAGRAPH_LENGTH) {
        // Ignora paragrafi troppo corti
        validIndex++;
        paragraphs.push({
          id: validIndex,
          text: text,
        });
      }
    });

    // Calcola statistiche
    const fullText = paragraphs.map((p) => p.text).join(' ');
    const wordCount = fullText.split(/\s+/).filter((w) => w.length > 0).length;
    const readingTimeMinutes = Math.ceil(wordCount / WORDS_PER_MINUTE);

    // Verifica lunghezza minima
    if (wordCount < MIN_ARTICLE_WORDS) {
      throw new Error('Article too short');
    }

    return {
      title: article.title || document.title,
      author: article.byline || 'Sconosciuto',
      publishedDate: article.publishedTime || null,
      url: window.location.href,
      content: fullText,
      paragraphs: paragraphs,
      wordCount: wordCount,
      readingTimeMinutes: readingTimeMinutes,
      excerpt: article.excerpt || fullText.substring(0, 200) + '...',
    };
  }

  static fallbackExtraction(document) {
    // Cerca il contenuto principale in vari modi
    let mainContent = null;

    // Prova selettori comuni per articoli
    const selectors = [
      'article',
      '[role="main"]',
      'main',
      '.article-content',
      '.post-content',
      '.entry-content',
      '.content',
      '#content',
      '.story-body',
      '.article-body',
    ];

    for (const selector of selectors) {
      mainContent = document.querySelector(selector);
      if (mainContent) {
        break;
      }
    }

    // Se non trova nulla, usa body
    if (!mainContent) {
      mainContent = document.body;
    }

    // Clona e pulisci
    const clone = mainContent.cloneNode(true);

    // Rimuovi elementi indesiderati
    const unwanted = clone.querySelectorAll(
      'script, style, nav, header, footer, aside, iframe, ' +
        '.ad, .ads, .advertisement, .sidebar, .comments, ' +
        '.social-share, .related-posts, .navigation, ' +
        '[class*="ad-"], [id*="ad-"], [class*="banner"]',
    );
    unwanted.forEach((el) => el.remove());

    // Estrai paragrafi
    const paragraphs = [];
    const textElements = clone.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');

    let validIndex = 0;
    textElements.forEach((el) => {
      const text = el.textContent.trim();
      // Ignora paragrafi troppo corti o che sembrano menu/link
      if (text.length > 30 && !text.match(/^(Home|Menu|Login|Sign|Share|Tweet|Like)/i)) {
        validIndex++;
        paragraphs.push({
          id: validIndex,
          text: text,
        });
      }
    });

    // Se non trova abbastanza paragrafi, prova a estrarre tutto il testo
    if (paragraphs.length < 3) {
      const allText = clone.textContent || clone.innerText || '';
      const sentences = allText.split(/[.!?]+/).filter((s) => s.trim().length > 50);

      sentences.forEach((sentence, index) => {
        paragraphs.push({
          id: index + 1,
          text: sentence.trim(),
        });
      });
    }

    const fullText = paragraphs.map((p) => p.text).join(' ');
    const wordCount = fullText.split(/\s+/).filter((w) => w.length > 0).length;

    if (wordCount < MIN_ARTICLE_WORDS) {
      throw new Error('Article too short');
    }

    return {
      title: document.title,
      author: 'Sconosciuto',
      publishedDate: null,
      url: window.location.href,
      content: fullText,
      paragraphs: paragraphs,
      wordCount: wordCount,
      readingTimeMinutes: Math.ceil(wordCount / WORDS_PER_MINUTE),
      excerpt: fullText.substring(0, 200) + '...',
    };
  }
}
