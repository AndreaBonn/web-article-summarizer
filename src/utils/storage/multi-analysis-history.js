// Multi-Analysis History Repository — gestione cronologia analisi multi-articolo
import { BaseHistoryRepository } from './base-history-repository.js';
import { Logger } from '../core/logger.js';

const repo = new BaseHistoryRepository('multiAnalysisHistory', 30);

export class MultiAnalysisHistory {
  static async saveMultiAnalysis(analysis, articles) {
    Logger.debug('saveMultiAnalysis chiamato con:', { analysis, articles });
    const entry = {
      articles: articles.map((a) => ({
        id: a.id,
        title: a.article.title,
        url: a.article.url,
        wordCount: a.article.wordCount,
      })),
      analysis: {
        globalSummary: analysis.globalSummary || null,
        comparison: analysis.comparison || null,
        qa: {
          interactive: analysis.qa?.interactive || false,
          articles: analysis.qa?.articles || [],
          questions: analysis.qa?.questions || [],
        },
      },
      metadata: {
        articlesCount: articles.length,
        provider: analysis.metadata?.provider || 'unknown',
      },
    };

    const id = await repo.save(entry);
    Logger.info('✓ Analisi multi-articolo salvata.');
    return id;
  }

  static async getMultiAnalysisHistory() {
    return repo.getAll();
  }

  static async getMultiAnalysisById(id) {
    return repo.getById(id);
  }

  static async deleteMultiAnalysis(id) {
    return repo.delete(id);
  }

  static async toggleMultiAnalysisFavorite(analysisId) {
    return repo.toggleFavorite(analysisId);
  }

  static async clearMultiAnalysisHistory() {
    return repo.clear();
  }

  static async updateMultiAnalysisWithQA(analysisId, question, answer) {
    const history = await repo.getAll();
    const entry = history.find((e) => e.id === analysisId);

    if (entry) {
      if (!entry.analysis.qa.questions) {
        entry.analysis.qa.questions = [];
      }
      entry.analysis.qa.questions.push({ question, answer, timestamp: Date.now() });
      await repo._saveAll(history);
    }
  }
}
