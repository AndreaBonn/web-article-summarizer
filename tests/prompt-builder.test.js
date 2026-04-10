import { describe, it, expect, vi } from 'vitest';
import { PromptBuilder, buildLanguageMap, LANGUAGE_CONFIGS } from '@utils/ai/prompt-builder.js';

// ---------------------------------------------------------------------------
// Helpers — articolo di test minimale
// ---------------------------------------------------------------------------
function makeArticle(overrides = {}) {
  return {
    title: 'Titolo articolo di test',
    content: 'Contenuto dell\'articolo di test sufficientemente lungo.',
    paragraphs: [
      { id: 1, text: 'Primo paragrafo del testo abbastanza lungo per passare la validazione.' },
      { id: 2, text: 'Secondo paragrafo del testo abbastanza lungo per passare la validazione.' },
    ],
    wordCount: 500,
    readingTimeMinutes: 3,
    ...overrides,
  };
}

function makeSettings(overrides = {}) {
  return {
    summaryLength: 'medium',
    outputLanguage: 'it',
    contentType: null,
    ...overrides,
  };
}

const detectContentTypeMock = vi.fn(() => 'general');
const detectLanguageMock = vi.fn(() => 'it');

// ---------------------------------------------------------------------------
// buildLanguageMap()
// ---------------------------------------------------------------------------
describe('buildLanguageMap()', () => {
  it('test_buildLanguageMap_tipologiaSummary_contieneChiaviLingue', () => {
    const map = buildLanguageMap('summary');
    expect(Object.keys(map)).toEqual(expect.arrayContaining(['it', 'en', 'es', 'fr', 'de']));
  });

  it('test_buildLanguageMap_tipologiaSummary_ogniVoceHaProprietaRichieste', () => {
    const map = buildLanguageMap('summary');
    for (const lang of Object.keys(map)) {
      expect(map[lang]).toHaveProperty('name');
      expect(map[lang]).toHaveProperty('instruction');
      expect(map[lang]).toHaveProperty('systemAddition');
    }
  });

  it('test_buildLanguageMap_tipologiaKeypoints_usaNounKeyPoints', () => {
    const map = buildLanguageMap('keypoints');
    // Il noun per keypoints in italiano è "i punti chiave"
    expect(map.it.instruction).toContain('punti chiave');
  });

  it('test_buildLanguageMap_tipologiaSummary_usaNounRiassunto', () => {
    const map = buildLanguageMap('summary');
    // Il noun per summary in italiano è "il riassunto"
    expect(map.it.instruction).toContain('riassunto');
  });
});

// ---------------------------------------------------------------------------
// PromptBuilder.formatArticleForPrompt()
// ---------------------------------------------------------------------------
describe('PromptBuilder.formatArticleForPrompt()', () => {
  it('test_formatArticleForPrompt_articoloCorretto_contieneVociAttese', () => {
    const article = makeArticle();
    const result = PromptBuilder.formatArticleForPrompt(article);

    expect(result).toContain('TITOLO:');
    expect(result).toContain('ARTICOLO');
    expect(result).toContain('§1');
    expect(result).toContain('§2');
    expect(result).toContain('LUNGHEZZA:');
  });

  it('test_formatArticleForPrompt_articoloCorretto_contieneWordCount', () => {
    const article = makeArticle({ wordCount: 123, readingTimeMinutes: 2 });
    const result = PromptBuilder.formatArticleForPrompt(article);

    expect(result).toContain('123 parole');
    expect(result).toContain('2 minuti');
  });

  it('test_formatArticleForPrompt_moltiParagrafiSaltati_aggiungeNota', () => {
    // >30% paragrafi saltati → nota di avviso nel prompt
    const article = makeArticle({
      paragraphs: [
        { id: 1, text: 'ok questo paragrafo è abbastanza lungo per superare la soglia minima.' },
        { id: 2, text: 'x' }, // troppo corto → sarà saltato
        { id: 3, text: 'y' }, // troppo corto → sarà saltato
      ],
    });
    const result = PromptBuilder.formatArticleForPrompt(article);

    expect(result).toContain('NOTA:');
    expect(result).toContain('omessi');
  });
});

// ---------------------------------------------------------------------------
// PromptBuilder.buildPrompt()
// ---------------------------------------------------------------------------
describe('PromptBuilder.buildPrompt()', () => {
  it('test_buildPrompt_providerEArticolo_restittuisceOggettoConChiaviAttese', () => {
    const result = PromptBuilder.buildPrompt(
      'openai',
      makeArticle(),
      makeSettings(),
      detectContentTypeMock,
      detectLanguageMock,
    );

    expect(result).toHaveProperty('systemPrompt');
    expect(result).toHaveProperty('userPrompt');
    expect(result).toHaveProperty('metadata');
  });

  it('test_buildPrompt_lunghezzaShort_targetWordsMinoreCheMedium', () => {
    const short = PromptBuilder.buildPrompt(
      'openai',
      makeArticle(),
      makeSettings({ summaryLength: 'short' }),
      detectContentTypeMock,
      detectLanguageMock,
    );
    const medium = PromptBuilder.buildPrompt(
      'openai',
      makeArticle(),
      makeSettings({ summaryLength: 'medium' }),
      detectContentTypeMock,
      detectLanguageMock,
    );

    expect(short.metadata.targetWords).toBeLessThanOrEqual(medium.metadata.targetWords);
  });

  it('test_buildPrompt_linguaOutput_inclusa_inUserPrompt', () => {
    const result = PromptBuilder.buildPrompt(
      'openai',
      makeArticle(),
      makeSettings({ outputLanguage: 'en' }),
      detectContentTypeMock,
      vi.fn(() => 'en'),
    );

    // Il prompt deve menzionare ENGLISH
    expect(result.userPrompt.toUpperCase()).toContain('ENGLISH');
  });

  it('test_buildPrompt_contentTypeNelleSettings_usatoSenzaDetect', () => {
    const detectSpy = vi.fn(() => 'general');
    PromptBuilder.buildPrompt(
      'openai',
      makeArticle(),
      makeSettings({ contentType: 'scientific' }),
      detectSpy,
      detectLanguageMock,
    );

    // detectContentType NON deve essere chiamato se contentType è già nelle settings
    expect(detectSpy).not.toHaveBeenCalled();
  });

  it('test_buildPrompt_contentTypeAssente_chiamaDetect', () => {
    const detectSpy = vi.fn(() => 'news');
    PromptBuilder.buildPrompt(
      'openai',
      makeArticle(),
      makeSettings({ contentType: null }),
      detectSpy,
      detectLanguageMock,
    );

    expect(detectSpy).toHaveBeenCalledOnce();
  });

  it('test_buildPrompt_metadataContieneContentTypeELingua', () => {
    const result = PromptBuilder.buildPrompt(
      'groq',
      makeArticle(),
      makeSettings({ contentType: 'business' }),
      detectContentTypeMock,
      vi.fn(() => 'en'),
    );

    expect(result.metadata.contentType).toBe('business');
    expect(result.metadata.detectedLanguage).toBe('en');
    expect(result.metadata).toHaveProperty('targetWords');
  });
});

// ---------------------------------------------------------------------------
// PromptBuilder.buildKeyPointsPrompt()
// ---------------------------------------------------------------------------
describe('PromptBuilder.buildKeyPointsPrompt()', () => {
  it('test_buildKeyPointsPrompt_providerEArticolo_restittuisceOggettoConChiaviAttese', () => {
    const result = PromptBuilder.buildKeyPointsPrompt(
      'anthropic',
      makeArticle(),
      makeSettings(),
      detectContentTypeMock,
      detectLanguageMock,
    );

    expect(result).toHaveProperty('systemPrompt');
    expect(result).toHaveProperty('userPrompt');
    expect(result).toHaveProperty('metadata');
  });

  it('test_buildKeyPointsPrompt_metadataNonContieneTargetWords', () => {
    const result = PromptBuilder.buildKeyPointsPrompt(
      'gemini',
      makeArticle(),
      makeSettings(),
      detectContentTypeMock,
      detectLanguageMock,
    );

    // buildKeyPointsPrompt NON calcola targetWords
    expect(result.metadata).not.toHaveProperty('targetWords');
    expect(result.metadata.contentType).toBeTruthy();
  });
});
