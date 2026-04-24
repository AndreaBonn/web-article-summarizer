import { describe, it, expect } from 'vitest';
import { KeypointsPromptBuilder } from '@utils/ai/keypoints-prompt-builder.js';

describe('KeypointsPromptBuilder', () => {
  const mockOutputLang = {
    name: 'Italiano',
    instruction: 'Scrivi in italiano',
  };

  const mockArticle = {
    title: 'Test Article',
    url: 'https://example.com/test',
  };

  const formattedArticle = '§1 Primo paragrafo.\n§2 Secondo paragrafo.';

  describe('buildKeyPointsUserPrompt()', () => {
    it('test_buildKeyPointsUserPrompt_general_includesArticleAndInstructions', () => {
      const result = KeypointsPromptBuilder.buildKeyPointsUserPrompt(
        'general',
        formattedArticle,
        mockArticle,
        mockOutputLang
      );

      expect(result).toContain(formattedArticle);
      expect(result).toContain('ITALIANO');
      expect(result).toContain('SCRIVI IN ITALIANO');
      expect(result).toContain('7-12 punti chiave');
      expect(result).toContain('Criteri di Qualità');
      expect(result).toContain('FORMATO OUTPUT');
    });

    it('test_buildKeyPointsUserPrompt_scientific_includesScientificInstructions', () => {
      const result = KeypointsPromptBuilder.buildKeyPointsUserPrompt(
        'scientific',
        formattedArticle,
        mockArticle,
        mockOutputLang
      );

      expect(result).toContain('ARTICOLI SCIENTIFICI');
      expect(result).toContain('Domanda di ricerca');
      expect(result).toContain('p-value');
      expect(result).toContain('Cohen\'s d');
    });

    it('test_buildKeyPointsUserPrompt_news_includesJournalisticInstructions', () => {
      const result = KeypointsPromptBuilder.buildKeyPointsUserPrompt(
        'news',
        formattedArticle,
        mockArticle,
        mockOutputLang
      );

      expect(result).toContain('NEWS');
      expect(result).toContain('CHI ha fatto/detto COSA');
      expect(result).toContain('Distingui fatti verificati da allegazioni');
    });

    it('test_buildKeyPointsUserPrompt_tutorial_includesTutorialInstructions', () => {
      const result = KeypointsPromptBuilder.buildKeyPointsUserPrompt(
        'tutorial',
        formattedArticle,
        mockArticle,
        mockOutputLang
      );

      expect(result).toContain('TUTORIAL');
      expect(result).toContain('Prerequisiti e Setup');
      expect(result).toContain('Comandi/Codice Fondamentali');
    });

    it('test_buildKeyPointsUserPrompt_business_includesBusinessInstructions', () => {
      const result = KeypointsPromptBuilder.buildKeyPointsUserPrompt(
        'business',
        formattedArticle,
        mockArticle,
        mockOutputLang
      );

      expect(result).toContain('BUSINESS');
      expect(result).toContain('KPI');
      expect(result).toContain('ROI');
    });

    it('test_buildKeyPointsUserPrompt_opinion_includesOpinionInstructions', () => {
      const result = KeypointsPromptBuilder.buildKeyPointsUserPrompt(
        'opinion',
        formattedArticle,
        mockArticle,
        mockOutputLang
      );

      expect(result).toContain('OPINION');
      expect(result).toContain('Tesi Principale');
      expect(result).toContain('Distingui chiaramente fatti da opinioni');
    });

    it('test_buildKeyPointsUserPrompt_unknownType_fallsBackToGeneral', () => {
      const result = KeypointsPromptBuilder.buildKeyPointsUserPrompt(
        'unknown-type',
        formattedArticle,
        mockArticle,
        mockOutputLang
      );

      expect(result).toContain('Cosa Includere nei Punti Chiave');
      expect(result).not.toContain('ARTICOLI SCIENTIFICI');
      expect(result).not.toContain('NEWS');
    });

    it('test_buildKeyPointsUserPrompt_outputLangAppearsInReminder', () => {
      const englishLang = { name: 'English', instruction: 'Write in English' };
      const result = KeypointsPromptBuilder.buildKeyPointsUserPrompt(
        'general',
        formattedArticle,
        mockArticle,
        englishLang
      );

      expect(result).toContain('ENGLISH');
      expect(result).toContain('WRITE IN ENGLISH');
      expect(result).toContain('Scrivi TUTTI i punti chiave in ENGLISH');
    });

    it('test_buildKeyPointsUserPrompt_structureOrder_articleFirstThenInstructions', () => {
      const result = KeypointsPromptBuilder.buildKeyPointsUserPrompt(
        'general',
        formattedArticle,
        mockArticle,
        mockOutputLang
      );

      const articlePos = result.indexOf('ARTICOLO DA ANALIZZARE');
      const criteriaPos = result.indexOf('Criteri di Qualità');
      const formatPos = result.indexOf('FORMATO OUTPUT');

      expect(articlePos).toBeLessThan(criteriaPos);
      expect(criteriaPos).toBeLessThan(formatPos);
    });

    it('test_buildKeyPointsUserPrompt_emptyFormattedArticle_stillBuildsPrompt', () => {
      const result = KeypointsPromptBuilder.buildKeyPointsUserPrompt(
        'general',
        '',
        mockArticle,
        mockOutputLang
      );

      expect(result).toContain('ARTICOLO DA ANALIZZARE');
      expect(result).toContain('Criteri di Qualità');
    });
  });
});
