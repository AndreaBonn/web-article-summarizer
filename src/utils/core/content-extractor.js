// Content Extractor - Estrazione e parsing articoli
import { Readability } from '@mozilla/readability';
import { Logger } from './logger.js';

const MIN_ARTICLE_WORDS = 200;
const MIN_PARAGRAPH_LENGTH = 20;
const WORDS_PER_MINUTE = 225;

// Selectors for DOM elements that are never article content
const NOISE_SELECTORS = [
  'script',
  'style',
  'nav',
  'header',
  'footer',
  'aside',
  'iframe',
  'form',
  '[role="complementary"]',
  '[role="navigation"]',
  '[role="banner"]',
  '.ad, .ads, .advertisement, .sidebar, .comments, .comment-section',
  '.social-share, .related-posts, .related-articles, .navigation',
  '.newsletter, .subscribe, .subscription, .paywall, .piano-offer',
  '.cookie-banner, .consent-banner, .gdpr',
  '[class*="ad-"], [id*="ad-"], [class*="banner"], [class*="promo"]',
  '[class*="subscribe"], [class*="paywall"], [class*="newsletter"]',
  '[class*="widget"], [class*="popup"], [class*="modal"]',
  '[class*="share"], [class*="social"], [class*="follow"]',
  '[class*="related"], [class*="recommended"], [class*="suggestion"]',
  '[class*="footer"], [class*="sidebar"]',
].join(', ');

// Regex patterns for text-level noise detection
const NOISE_PATTERNS = [
  // Subscription / paywall / pricing
  /€\s*\d+[\s,.]*\d*\s*[/\\]?\s*(anno|mese|year|month)/i,
  /€\s*[\d,.]+.*\b(anno|mese|year|month)\b/i,
  /\b(abbonati|subscribe|iscriviti)\b/i,
  /rinnovo\s+automatico/i,
  /disattiva\s+quando\s+vuoi/i,
  // CTA / promo / benefit lists
  /accedere\s+a\s+tutti\s+gli\s+articoli/i,
  /navigare?\s+senza\s+pubblicit/i,
  /sconto\s+del\s+\d+%/i,
  /sfoglia\s+ogni\s+giorno/i,
  /\b(annuale|mensile)\s+(annuale|mensile)\b/i,
  // Cookie / consent / login
  /\b(cookie|gdpr|privacy\s+policy|terms\s+of\s+service)\b/i,
  /\b(log\s*in|sign\s*(up|in)|crea\s+account)\b/i,
  // English equivalents
  /\$([\d,.]+)\s*[/\\]?\s*(year|month|mo)\b/i,
  /\bfree\s+trial\b/i,
  /\bunsubscribe\s+anytime\b/i,
  /\bcancel\s+anytime\b/i,
];

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
      Logger.warn('Readability fallito:', error);
    }

    // Fallback: estrazione manuale
    return this.fallbackExtraction(document);
  }

  static processReadabilityArticle(article, document) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = article.content;

    // DOM-level cleanup: remove noisy containers from Readability output
    this._removeNoiseElements(tempDiv);

    // Text-level filtering: keep only real article paragraphs
    const paragraphs = this._extractCleanParagraphs(tempDiv);

    // Deduplicate near-identical paragraphs (subscription blocks repeat)
    const deduplicated = this._deduplicateParagraphs(paragraphs);

    const fullText = deduplicated.map((p) => p.text).join(' ');
    const wordCount = fullText.split(/\s+/).filter((w) => w.length > 0).length;

    if (wordCount < MIN_ARTICLE_WORDS) {
      throw new Error('Article too short');
    }

    return {
      title: article.title || document.title,
      author: article.byline || 'Sconosciuto',
      publishedDate: article.publishedTime || null,
      url: window.location.href,
      content: fullText,
      paragraphs: deduplicated,
      wordCount: wordCount,
      readingTimeMinutes: Math.ceil(wordCount / WORDS_PER_MINUTE),
      excerpt: article.excerpt || fullText.substring(0, 200) + '...',
    };
  }

  static fallbackExtraction(document) {
    let mainContent = null;

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
      if (mainContent) break;
    }

    if (!mainContent) {
      mainContent = document.body;
    }

    const clone = mainContent.cloneNode(true);
    this._removeNoiseElements(clone);

    const paragraphs = this._extractCleanParagraphs(clone);

    // If not enough paragraphs, try raw text splitting
    if (paragraphs.length < 3) {
      const allText = clone.textContent || clone.innerText || '';
      const sentences = allText.split(/[.!?]+/).filter((s) => s.trim().length > 50);

      sentences.forEach((sentence, index) => {
        const text = sentence.trim();
        if (!this._isNoiseParagraph(text)) {
          paragraphs.push({ id: index + 1, text });
        }
      });
    }

    const deduplicated = this._deduplicateParagraphs(paragraphs);
    const fullText = deduplicated.map((p) => p.text).join(' ');
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
      paragraphs: deduplicated,
      wordCount: wordCount,
      readingTimeMinutes: Math.ceil(wordCount / WORDS_PER_MINUTE),
      excerpt: fullText.substring(0, 200) + '...',
    };
  }

  // --- Private helpers ---

  /** Remove noisy DOM elements (ads, paywall, subscription, social, etc.) */
  static _removeNoiseElements(container) {
    const unwanted = container.querySelectorAll(NOISE_SELECTORS);
    unwanted.forEach((el) => el.remove());

    // Also remove elements whose text is entirely a noise pattern
    container.querySelectorAll('div, section, span').forEach((el) => {
      const text = el.textContent.trim();
      if (text.length > 0 && this._isNoiseParagraph(text)) {
        // Only remove leaf-ish containers (avoid nuking the whole article tree)
        const childParagraphs = el.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
        const cleanChildren = [...childParagraphs].filter(
          (p) => !this._isNoiseParagraph(p.textContent.trim()),
        );
        if (cleanChildren.length === 0) {
          el.remove();
        }
      }
    });
  }

  /** Extract paragraphs from a cleaned container, filtering noise at text level */
  static _extractCleanParagraphs(container) {
    const paragraphs = [];
    const elements = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');

    let validIndex = 0;
    elements.forEach((el) => {
      const text = el.textContent.trim();
      if (text.length <= MIN_PARAGRAPH_LENGTH) return;
      if (this._isNoiseParagraph(text)) return;

      validIndex++;
      paragraphs.push({ id: validIndex, text });
    });

    return paragraphs;
  }

  /** Check if a paragraph matches known noise patterns */
  static _isNoiseParagraph(text) {
    return NOISE_PATTERNS.some((pattern) => pattern.test(text));
  }

  /** Remove near-duplicate paragraphs (subscription blocks often repeat) */
  static _deduplicateParagraphs(paragraphs) {
    const seen = new Set();
    const result = [];

    for (const p of paragraphs) {
      // Normalize: lowercase, collapse whitespace, trim
      const key = p.text.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(p);
    }

    // Re-index after dedup
    return result.map((p, i) => ({ id: i + 1, text: p.text }));
  }
}
