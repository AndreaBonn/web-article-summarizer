// History Manager — Facade retrocompatibile che delega a BaseHistoryRepository
import { Logger } from '../core/logger.js';
import { BaseHistoryRepository } from './base-history-repository.js';

const summaryRepo = new BaseHistoryRepository('summaryHistory', 50);
const multiRepo = new BaseHistoryRepository('multiAnalysisHistory', 30);
const pdfRepo = new BaseHistoryRepository('pdfHistory', 30);

export class HistoryManager {
  // ===== SUMMARY (singoli articoli) =====

  static async saveSummary(article, summary, keyPoints, metadata) {
    const entry = {
      article: {
        title: article.title,
        url: article.url,
        content: article.content,
        excerpt: article.excerpt,
        wordCount: article.wordCount,
        readingTimeMinutes: article.readingTimeMinutes,
        paragraphs: article.paragraphs,
      },
      summary,
      keyPoints,
      translation: null,
      notes: null,
      metadata: {
        provider: metadata.provider,
        language: metadata.language,
        contentType: metadata.contentType,
        fromCache: metadata.fromCache || false,
      },
    };
    return summaryRepo.save(entry);
  }

  static async getHistory() {
    return summaryRepo.getAll();
  }

  static async getSummaryById(id) {
    return summaryRepo.getById(id);
  }

  static async deleteSummary(id) {
    return summaryRepo.delete(id);
  }

  static async toggleFavorite(entryId) {
    return summaryRepo.toggleFavorite(entryId);
  }

  static async clearHistory() {
    return summaryRepo.clear();
  }

  static async updateSummaryWithTranslation(
    articleUrl,
    translation,
    targetLanguage,
    originalLanguage,
  ) {
    return summaryRepo.updateByField('article.url', articleUrl, 'translation', {
      text: translation,
      targetLanguage,
      originalLanguage,
      timestamp: Date.now(),
    });
  }

  static async updateSummaryWithQA(articleUrl, qaList) {
    return summaryRepo.updateByField('article.url', articleUrl, 'qa', qaList);
  }

  static async updateSummaryNotes(entryId, notes) {
    return summaryRepo.updateField(entryId, 'notes', notes);
  }

  static async updateSummaryWithCitations(articleUrl, citations) {
    return summaryRepo.updateByField('article.url', articleUrl, 'citations', citations);
  }

  static async searchHistory(query, options = {}) {
    const history = await summaryRepo.getAll();
    const lowerQuery = query.toLowerCase();
    const { searchInTitle = true, searchInUrl = true, searchInContent = true } = options;

    return history.filter((entry) => {
      if (searchInTitle && entry.article.title.toLowerCase().includes(lowerQuery)) return true;
      if (searchInUrl && entry.article.url.toLowerCase().includes(lowerQuery)) return true;

      if (searchInContent) {
        if (entry.summary?.toLowerCase().includes(lowerQuery)) return true;
        if (
          entry.keyPoints?.some(
            (p) =>
              p.title?.toLowerCase().includes(lowerQuery) ||
              p.description?.toLowerCase().includes(lowerQuery),
          )
        )
          return true;
        if (entry.notes?.toLowerCase().includes(lowerQuery)) return true;
        if (entry.translation?.text?.toLowerCase().includes(lowerQuery)) return true;
        if (
          entry.qa?.some(
            (qa) =>
              qa.question.toLowerCase().includes(lowerQuery) ||
              qa.answer.toLowerCase().includes(lowerQuery),
          )
        )
          return true;
      }

      return false;
    });
  }

  static async filterHistory(filters) {
    const history = await summaryRepo.getAll();

    return history.filter((entry) => {
      if (filters.provider && entry.metadata.provider !== filters.provider) return false;
      if (filters.language && entry.metadata.language !== filters.language) return false;
      if (filters.contentType && entry.metadata.contentType !== filters.contentType) return false;
      if (filters.dateFrom && entry.timestamp < filters.dateFrom) return false;
      if (filters.dateTo && entry.timestamp > filters.dateTo) return false;
      return true;
    });
  }

  // ===== MULTI-ANALYSIS =====

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

    const id = await multiRepo.save(entry);
    Logger.info('✓ Analisi multi-articolo salvata.');
    return id;
  }

  static async getMultiAnalysisHistory() {
    return multiRepo.getAll();
  }

  static async getMultiAnalysisById(id) {
    return multiRepo.getById(id);
  }

  static async deleteMultiAnalysis(id) {
    return multiRepo.delete(id);
  }

  static async toggleMultiAnalysisFavorite(analysisId) {
    return multiRepo.toggleFavorite(analysisId);
  }

  static async clearMultiAnalysisHistory() {
    return multiRepo.clear();
  }

  static async updateMultiAnalysisWithQA(analysisId, question, answer) {
    const history = await multiRepo.getAll();
    const entry = history.find((e) => e.id === analysisId);

    if (entry) {
      if (!entry.analysis.qa.questions) {
        entry.analysis.qa.questions = [];
      }
      entry.analysis.qa.questions.push({ question, answer, timestamp: Date.now() });
      await multiRepo._saveAll(history);
    }
  }

  // ===== PDF =====

  static async savePDFAnalysis(pdfInfo, summary, keyPoints, metadata) {
    const entry = {
      pdf: {
        name: pdfInfo.name,
        size: pdfInfo.size,
        pages: pdfInfo.pages,
        text: pdfInfo.text,
        metadata: pdfInfo.metadata || {},
      },
      summary,
      keyPoints,
      translation: null,
      qa: null,
      citations: null,
      notes: null,
      metadata: {
        provider: metadata.provider,
        language: metadata.language,
        summaryLength: metadata.summaryLength,
        fromCache: metadata.fromCache || false,
      },
    };

    const id = await pdfRepo.save(entry);
    Logger.info('✓ PDF salvato in cronologia.');
    return id;
  }

  static async getPDFHistory() {
    return pdfRepo.getAll();
  }

  static async getPDFById(id) {
    return pdfRepo.getById(id);
  }

  static async deletePDF(id) {
    return pdfRepo.delete(id);
  }

  static async togglePDFFavorite(pdfId) {
    return pdfRepo.toggleFavorite(pdfId);
  }

  static async clearPDFHistory() {
    return pdfRepo.clear();
  }

  static async updatePDFWithTranslation(pdfId, translation, targetLanguage, originalLanguage) {
    return pdfRepo.updateField(pdfId, 'translation', {
      text: translation,
      targetLanguage,
      originalLanguage,
      timestamp: Date.now(),
    });
  }

  static async updatePDFWithQA(pdfId, qaList) {
    return pdfRepo.updateField(pdfId, 'qa', qaList);
  }

  static async updatePDFWithCitations(pdfId, citations) {
    return pdfRepo.updateField(pdfId, 'citations', citations);
  }

  static async updatePDFNotes(pdfId, notes) {
    return pdfRepo.updateField(pdfId, 'notes', notes);
  }

  static async searchPDFHistory(query) {
    const history = await pdfRepo.getAll();
    const lowerQuery = query.toLowerCase();

    return history.filter((entry) => {
      if (entry.pdf.name.toLowerCase().includes(lowerQuery)) return true;
      if (entry.summary?.toLowerCase().includes(lowerQuery)) return true;
      if (
        entry.keyPoints?.some(
          (p) =>
            p.title?.toLowerCase().includes(lowerQuery) ||
            p.description?.toLowerCase().includes(lowerQuery),
        )
      )
        return true;
      if (entry.notes?.toLowerCase().includes(lowerQuery)) return true;
      return false;
    });
  }

  // ===== UTILITY =====

  static formatDate(timestamp) {
    return BaseHistoryRepository.formatDate(timestamp);
  }

  static formatFileSize(bytes) {
    return BaseHistoryRepository.formatFileSize(bytes);
  }
}
