import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentClassifier } from '@utils/ai/content-classifier.js';

// Mock Chrome APIs usate da saveUserCorrection
beforeEach(() => {
  global.chrome = {
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn(),
      },
    },
    runtime: { id: 'test-id' },
  };
});

// ---------------------------------------------------------------------------
// getCategoryLabel
// ---------------------------------------------------------------------------

describe('ContentClassifier.getCategoryLabel()', () => {
  it('test_getCategoryLabel_withAuto_returnsRilevamentoAutomatico', () => {
    expect(ContentClassifier.getCategoryLabel('auto')).toBe('Rilevamento Automatico');
  });

  it('test_getCategoryLabel_withScientific_returnsScientifico', () => {
    expect(ContentClassifier.getCategoryLabel('scientific')).toBe('Scientifico');
  });

  it('test_getCategoryLabel_withNews_returnsNews', () => {
    expect(ContentClassifier.getCategoryLabel('news')).toBe('News');
  });

  it('test_getCategoryLabel_withTutorial_returnsTutorial', () => {
    expect(ContentClassifier.getCategoryLabel('tutorial')).toBe('Tutorial');
  });

  it('test_getCategoryLabel_withBusiness_returnsBusiness', () => {
    expect(ContentClassifier.getCategoryLabel('business')).toBe('Business');
  });

  it('test_getCategoryLabel_withOpinion_returnsOpinione', () => {
    expect(ContentClassifier.getCategoryLabel('opinion')).toBe('Opinione');
  });

  it('test_getCategoryLabel_withGeneral_returnsGenerico', () => {
    expect(ContentClassifier.getCategoryLabel('general')).toBe('Generico');
  });

  it('test_getCategoryLabel_withUnknownCategory_returnsCategoryAsIs', () => {
    expect(ContentClassifier.getCategoryLabel('unknown-cat')).toBe('unknown-cat');
  });

  it('test_getCategoryLabel_withEmptyString_returnsEmptyString', () => {
    expect(ContentClassifier.getCategoryLabel('')).toBe('');
  });

  it('test_getCategoryLabel_withUndefined_returnsUndefined', () => {
    // Labels map non ha la chiave undefined → fallback al valore stesso
    expect(ContentClassifier.getCategoryLabel(undefined)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// classifyArticle — rami senza API call (manual + fallback)
// ---------------------------------------------------------------------------

describe('ContentClassifier.classifyArticle() — selezione manuale', () => {
  it('test_classifyArticle_withManualSelection_returnsManualMethodWithCategory', async () => {
    // Arrange
    const article = { title: 'Test', content: 'Contenuto di prova' };

    // Act
    const result = await ContentClassifier.classifyArticle(article, 'scientific');

    // Assert
    expect(result).toEqual({ category: 'scientific', method: 'manual' });
  });

  it('test_classifyArticle_withManualNews_returnsNewsCategory', async () => {
    const article = { title: 'Notizia', content: 'Contenuto news' };
    const result = await ContentClassifier.classifyArticle(article, 'news');
    expect(result.category).toBe('news');
    expect(result.method).toBe('manual');
  });

  it('test_classifyArticle_withAutoAndNoApiKey_returnsFallbackGeneral', async () => {
    // Arrange: StorageManager restituirà undefined → aiClassification lancia
    // Non mocchiamo StorageManager direttamente: lo importiamo e mocchiamo qui
    const { StorageManager } = await import('@utils/storage/storage-manager.js');
    vi.spyOn(StorageManager, 'getSettings').mockResolvedValue({ selectedProvider: 'groq' });
    vi.spyOn(StorageManager, 'getApiKey').mockResolvedValue(null);

    const article = { title: 'Test', content: 'parola '.repeat(10) };

    // Act
    const result = await ContentClassifier.classifyArticle(article, 'auto');

    // Assert
    expect(result.category).toBe('general');
    expect(result.method).toBe('fallback');
    expect(result.error).toBeDefined();

    vi.restoreAllMocks();
  });
});

// ---------------------------------------------------------------------------
// saveUserCorrection — verifica interazione con chrome.storage
// ---------------------------------------------------------------------------

describe('ContentClassifier.saveUserCorrection()', () => {
  it('test_saveUserCorrection_withEmptyStorage_savesFirstCorrection', async () => {
    // Arrange
    chrome.storage.local.get.mockResolvedValue({ classificationCorrections: [] });
    chrome.storage.local.set.mockResolvedValue(undefined);

    // Act
    await ContentClassifier.saveUserCorrection('https://example.com', 'general', 'scientific');

    // Assert
    expect(chrome.storage.local.set).toHaveBeenCalledOnce();
    const [savedData] = chrome.storage.local.set.mock.calls[0];
    const corrections = savedData.classificationCorrections;
    expect(corrections).toHaveLength(1);
    expect(corrections[0]).toMatchObject({
      url: 'https://example.com',
      detected: 'general',
      corrected: 'scientific',
    });
    expect(corrections[0].timestamp).toBeTypeOf('number');
  });

  it('test_saveUserCorrection_withMissingStorageKey_initializesArray', async () => {
    // Arrange: nessuna chiave in storage
    chrome.storage.local.get.mockResolvedValue({});
    chrome.storage.local.set.mockResolvedValue(undefined);

    // Act
    await ContentClassifier.saveUserCorrection('https://test.com', 'news', 'opinion');

    // Assert
    const [savedData] = chrome.storage.local.set.mock.calls[0];
    expect(savedData.classificationCorrections).toHaveLength(1);
  });

  it('test_saveUserCorrection_withFullStorage_keepsLast100Corrections', async () => {
    // Arrange: 100 correzioni già presenti
    const existing = Array.from({ length: 100 }, (_, i) => ({
      url: `https://example.com/${i}`,
      detected: 'general',
      corrected: 'news',
      timestamp: Date.now() - i * 1000,
    }));
    chrome.storage.local.get.mockResolvedValue({ classificationCorrections: existing });
    chrome.storage.local.set.mockResolvedValue(undefined);

    // Act
    await ContentClassifier.saveUserCorrection('https://new.com', 'tutorial', 'scientific');

    // Assert
    const [savedData] = chrome.storage.local.set.mock.calls[0];
    const corrections = savedData.classificationCorrections;
    expect(corrections).toHaveLength(100);
    // La nuova correzione è l'ultima
    expect(corrections[corrections.length - 1].url).toBe('https://new.com');
    // La prima (più vecchia) è stata rimossa
    expect(corrections[0].url).toBe('https://example.com/1');
  });
});
