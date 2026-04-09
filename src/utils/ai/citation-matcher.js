// Citation Matcher - Localizzazione citazioni nei paragrafi dell'articolo
import { Logger } from '../core/logger.js';

export const SIMILARITY_EXACT_THRESHOLD = 0.8;
export const SIMILARITY_MIN_THRESHOLD = 0.3;
export const MIN_KEYWORD_MATCHES = 2;

// Italian + English stopwords for keyword extraction
export const STOPWORDS = new Set([
  'il',
  'lo',
  'la',
  'i',
  'gli',
  'le',
  'un',
  'uno',
  'una',
  'di',
  'a',
  'da',
  'in',
  'con',
  'su',
  'per',
  'tra',
  'fra',
  'e',
  'o',
  'ma',
  'se',
  'che',
  'chi',
  'cui',
  'non',
  'più',
  'anche',
  'come',
  'quando',
  'è',
  'sono',
  'ha',
  'hanno',
  'essere',
  'avere',
  'fare',
  'dire',
  'questo',
  'quello',
  'sua',
  'suo',
  'the',
  'an',
  'and',
  'or',
  'but',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
]);

export const CitationMatcher = {
  /**
   * Trova il paragrafo corretto cercando la citazione nel testo
   */
  findParagraphForCitation(citation, article) {
    // Estrai i paragrafi dall'articolo
    let paragraphs = [];

    if (article.paragraphs && Array.isArray(article.paragraphs)) {
      paragraphs = article.paragraphs.map((p, i) => ({
        id: i + 1,
        text: typeof p === 'string' ? p : p.text || '',
      }));
    } else if (article.content) {
      paragraphs = article.content
        .split('\n\n')
        .filter((p) => p.trim().length > 0)
        .map((p, i) => ({
          id: i + 1,
          text: p.trim(),
        }));
    }

    if (paragraphs.length === 0) {
      return '1'; // Fallback
    }

    // Estrai il testo della citazione
    const quoteText = citation.quote_text || '';

    if (!quoteText || quoteText.length < 10) {
      return citation.paragraph || '1'; // Usa il paragrafo suggerito dall'AI se la citazione è troppo corta
    }

    // Normalizza il testo della citazione per la ricerca
    const normalizedQuote = this.normalizeText(quoteText);

    // Cerca la citazione nei paragrafi
    let bestMatch = null;
    let bestScore = 0;

    for (const para of paragraphs) {
      const normalizedPara = this.normalizeText(para.text);

      // Calcola similarity score
      const score = this.calculateSimilarity(normalizedQuote, normalizedPara);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = para.id;
      }

      // Se troviamo una corrispondenza esatta o molto alta, fermiamoci
      if (score > SIMILARITY_EXACT_THRESHOLD) {
        break;
      }
    }

    // Se abbiamo trovato un match con score > 0.3, usalo
    if (bestMatch && bestScore > SIMILARITY_MIN_THRESHOLD) {
      Logger.debug(
        `Citazione trovata nel paragrafo §${bestMatch} (score: ${bestScore.toFixed(2)})`,
      );
      return bestMatch.toString();
    }

    // Altrimenti, cerca parole chiave
    const keywords = this.extractKeywords(quoteText);

    for (const para of paragraphs) {
      const paraLower = para.text.toLowerCase();
      let keywordMatches = 0;

      for (const keyword of keywords) {
        if (paraLower.includes(keyword.toLowerCase())) {
          keywordMatches++;
        }
      }

      // Se troviamo almeno 2 keyword match, probabilmente è il paragrafo giusto
      if (keywordMatches >= Math.min(MIN_KEYWORD_MATCHES, keywords.length)) {
        Logger.debug(
          `Citazione trovata nel paragrafo §${para.id} (keyword match: ${keywordMatches}/${keywords.length})`,
        );
        return para.id.toString();
      }
    }

    // Fallback: usa il paragrafo suggerito dall'AI o il primo
    Logger.warn(
      `Impossibile trovare il paragrafo esatto per la citazione: "${quoteText.substring(0, 50)}..."`,
    );
    return citation.paragraph || '1';
  },

  /**
   * Normalizza testo per confronto
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[""''«»]/g, '"') // Normalizza virgolette
      .replace(/[^\w\s]/g, ' ') // Rimuovi punteggiatura
      .replace(/\s+/g, ' ') // Normalizza spazi
      .trim();
  },

  /**
   * Calcola similarity tra due testi usando Jaccard similarity
   */
  calculateSimilarity(text1, text2) {
    const words1 = new Set(text1.split(' ').filter((w) => w.length > 2));
    const words2 = new Set(text2.split(' ').filter((w) => w.length > 2));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  },

  /**
   * Estrae parole chiave significative da un testo
   */
  extractKeywords(text) {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w));

    // Prendi le prime 5 parole più lunghe (probabilmente più significative)
    return words.sort((a, b) => b.length - a.length).slice(0, 5);
  },
};
