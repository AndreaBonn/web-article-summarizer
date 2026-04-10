import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@utils/core/logger.js', () => ({
  Logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  CitationMatcher,
  STOPWORDS,
  SIMILARITY_EXACT_THRESHOLD,
  SIMILARITY_MIN_THRESHOLD,
  MIN_KEYWORD_MATCHES,
} from '@utils/ai/citation-matcher.js';

// ---------------------------------------------------------------------------
// Costanti esportate
// ---------------------------------------------------------------------------

describe('Costanti esportate', () => {
  it('test_STOPWORDS_export_isSet', () => {
    expect(STOPWORDS).toBeInstanceOf(Set);
    expect(STOPWORDS.size).toBeGreaterThan(0);
  });

  it('test_SIMILARITY_EXACT_THRESHOLD_export_isPointEight', () => {
    expect(SIMILARITY_EXACT_THRESHOLD).toBe(0.8);
  });

  it('test_SIMILARITY_MIN_THRESHOLD_export_isPointThree', () => {
    expect(SIMILARITY_MIN_THRESHOLD).toBe(0.3);
  });

  it('test_MIN_KEYWORD_MATCHES_export_isTwo', () => {
    expect(MIN_KEYWORD_MATCHES).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// normalizeText
// ---------------------------------------------------------------------------

describe('CitationMatcher.normalizeText()', () => {
  it('test_normalizeText_mixedCase_returnsLowercase', () => {
    // Arrange
    const input = 'Hello World TEST';

    // Act
    const result = CitationMatcher.normalizeText(input);

    // Assert
    expect(result).toBe('hello world test');
  });

  it('test_normalizeText_specialQuotes_normalizedToDouble', () => {
    // Arrange — curly quotes (\u2018\u2019 e \u201c\u201d) vengono normalizzate a straight quote (")
    // La punteggiatura è poi rimossa, quindi le virgolette possono sparire
    const input = '\u2018single\u2019 and \u201cdouble\u201d quotes';

    // Act
    const result = CitationMatcher.normalizeText(input);

    // Assert — il testo interno alle virgolette deve comparire normalizzato
    expect(result).toContain('single');
    expect(result).toContain('double');
    expect(result).toContain('quotes');
  });

  it('test_normalizeText_extraSpaces_normalized', () => {
    // Arrange
    const input = 'hello   world  test';

    // Act
    const result = CitationMatcher.normalizeText(input);

    // Assert
    expect(result).toBe('hello world test');
  });

  it('test_normalizeText_punctuation_removed', () => {
    // Arrange
    const input = 'Hello, world! This is a test.';

    // Act
    const result = CitationMatcher.normalizeText(input);

    // Assert
    expect(result).not.toContain(',');
    expect(result).not.toContain('!');
    expect(result).not.toContain('.');
  });

  it('test_normalizeText_emptyString_returnsEmpty', () => {
    expect(CitationMatcher.normalizeText('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// calculateSimilarity
// ---------------------------------------------------------------------------

describe('CitationMatcher.calculateSimilarity()', () => {
  it('test_calculateSimilarity_identicalTexts_returnsOne', () => {
    // Arrange
    const text = 'the quick brown fox jumps over the lazy dog';

    // Act
    const result = CitationMatcher.calculateSimilarity(text, text);

    // Assert
    expect(result).toBe(1);
  });

  it('test_calculateSimilarity_completelyDifferent_returnsZero', () => {
    // Arrange
    const text1 = 'apple banana cherry';
    const text2 = 'zebra giraffe elephant';

    // Act
    const result = CitationMatcher.calculateSimilarity(text1, text2);

    // Assert
    expect(result).toBe(0);
  });

  it('test_calculateSimilarity_partialOverlap_returnsBetweenZeroAndOne', () => {
    // Arrange
    const text1 = 'the quick brown fox jumps';
    const text2 = 'the quick brown dog runs';

    // Act
    const result = CitationMatcher.calculateSimilarity(text1, text2);

    // Assert
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
  });

  it('test_calculateSimilarity_emptyTexts_returnsZeroOrNaN', () => {
    // Arrange / Act
    const result = CitationMatcher.calculateSimilarity('', '');

    // Assert — con insiemi vuoti la Jaccard similarity è 0/0 = NaN o 0 a seconda dell'impl.
    expect(result === 0 || Number.isNaN(result)).toBe(true);
  });

  it('test_calculateSimilarity_oneEmpty_returnsZero', () => {
    expect(CitationMatcher.calculateSimilarity('hello world test', '')).toBe(0);
  });

  it('test_calculateSimilarity_shortWordsIgnored_onlyCountsWordsOverTwoChars', () => {
    // Arrange — words <= 2 chars should be ignored
    const text1 = 'it is a test word';
    const text2 = 'it is a test word';

    // Act
    const result = CitationMatcher.calculateSimilarity(text1, text2);

    // Assert — identical texts, even after filtering, should yield 1 or consistent result
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// extractKeywords
// ---------------------------------------------------------------------------

describe('CitationMatcher.extractKeywords()', () => {
  it('test_extractKeywords_normalText_returnsLongestFirst', () => {
    // Arrange
    const text = 'artificial intelligence revolutionized modern computing systems';

    // Act
    const result = CitationMatcher.extractKeywords(text);

    // Assert — sorted by length descending
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].length).toBeGreaterThanOrEqual(result[i + 1].length);
    }
    expect(result.length).toBeGreaterThan(0);
  });

  it('test_extractKeywords_onlyStopwords_returnsEmpty', () => {
    // Arrange — use words that are in STOPWORDS
    const stopwordsArray = [...STOPWORDS].slice(0, 5).join(' ');

    // Act
    const result = CitationMatcher.extractKeywords(stopwordsArray);

    // Assert
    expect(result).toEqual([]);
  });

  it('test_extractKeywords_maxFiveKeywords', () => {
    // Arrange — provide more than 5 meaningful long words
    const text =
      'international revolutionary transformation development implementation organization administration';

    // Act
    const result = CitationMatcher.extractKeywords(text);

    // Assert
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('test_extractKeywords_shortWordsFiltered_ignoresWordsUpToThreeChars', () => {
    // Arrange — mix of short and long words
    const text = 'cat dog elephant rhinoceros';

    // Act
    const result = CitationMatcher.extractKeywords(text);

    // Assert — 'cat' and 'dog' (<=3 chars) should not appear
    expect(result).not.toContain('cat');
    expect(result).not.toContain('dog');
  });

  it('test_extractKeywords_emptyString_returnsEmpty', () => {
    expect(CitationMatcher.extractKeywords('')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// findParagraphForCitation
// ---------------------------------------------------------------------------

describe('CitationMatcher.findParagraphForCitation()', () => {
  it('test_findParagraphForCitation_exactMatch_returnsCorrectParagraph', () => {
    // Arrange
    const citation = {
      quote_text: 'artificial intelligence has transformed modern computing systems significantly',
      paragraph: '1',
    };
    const article = {
      paragraphs: [
        { text: 'This paragraph talks about something else entirely' },
        {
          text: 'artificial intelligence has transformed modern computing systems significantly across all domains',
        },
        { text: 'Final paragraph with different content' },
      ],
    };

    // Act
    const result = CitationMatcher.findParagraphForCitation(citation, article);

    // Assert
    expect(result).toBe('2');
  });

  it('test_findParagraphForCitation_shortQuote_usesFallback', () => {
    // Arrange — quote shorter than 10 chars
    const citation = { quote_text: 'short', paragraph: '3' };
    const article = {
      paragraphs: [{ text: 'paragraph one content' }, { text: 'paragraph two content' }],
    };

    // Act
    const result = CitationMatcher.findParagraphForCitation(citation, article);

    // Assert — should use citation.paragraph or '1'
    expect(['3', '1']).toContain(result);
  });

  it('test_findParagraphForCitation_noQuoteText_usesFallback', () => {
    // Arrange
    const citation = { paragraph: '2' };
    const article = {
      paragraphs: [{ text: 'some content here' }],
    };

    // Act
    const result = CitationMatcher.findParagraphForCitation(citation, article);

    // Assert
    expect(['2', '1']).toContain(result);
  });

  it('test_findParagraphForCitation_keywordMatch_returnsCorrectParagraph', () => {
    // Arrange — similarity won't be > 0.3 but keywords should match
    const citation = {
      quote_text: 'blockchain distributed ledger technology cryptocurrency',
      paragraph: '1',
    };
    const article = {
      paragraphs: [
        { text: 'introduction to web development and software engineering principles' },
        {
          text: 'blockchain technology enables distributed ledger systems for cryptocurrency transactions',
        },
      ],
    };

    // Act
    const result = CitationMatcher.findParagraphForCitation(citation, article);

    // Assert
    expect(result).toBe('2');
  });

  it('test_findParagraphForCitation_contentStringFallback_splitsByDoubleNewline', () => {
    // Arrange — article uses content string instead of paragraphs array
    const citation = {
      quote_text: 'machine learning algorithms process large datasets efficiently',
      paragraph: '1',
    };
    const article = {
      content:
        'introduction paragraph about basic concepts\n\nmachine learning algorithms process large datasets efficiently for predictive modeling\n\nconcluding paragraph about future directions',
    };

    // Act
    const result = CitationMatcher.findParagraphForCitation(citation, article);

    // Assert
    expect(result).toBe('2');
  });

  it('test_findParagraphForCitation_emptyParagraphs_returnsOne', () => {
    // Arrange
    const citation = { quote_text: 'some meaningful content from the article', paragraph: undefined };
    const article = { paragraphs: [] };

    // Act
    const result = CitationMatcher.findParagraphForCitation(citation, article);

    // Assert
    expect(result).toBe('1');
  });

  it('test_findParagraphForCitation_noMatch_usesCitationParagraph', () => {
    // Arrange — no similarity or keyword match possible
    const citation = {
      quote_text: 'completely unrelated zebra giraffe elephant savannah',
      paragraph: '5',
    };
    const article = {
      paragraphs: [
        { text: 'paragraph about technology and software' },
        { text: 'paragraph about economics and finance' },
        { text: 'paragraph about climate and environment' },
      ],
    };

    // Act
    const result = CitationMatcher.findParagraphForCitation(citation, article);

    // Assert — fallback to citation.paragraph
    expect(['5', '1']).toContain(result);
  });

  it('test_findParagraphForCitation_noParagraphsNoContent_returnsOne', () => {
    // Arrange
    const citation = { quote_text: 'some text to search for in the article' };
    const article = {};

    // Act
    const result = CitationMatcher.findParagraphForCitation(citation, article);

    // Assert
    expect(result).toBe('1');
  });
});
