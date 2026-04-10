// PDF History Repository — gestione cronologia analisi PDF
import { BaseHistoryRepository } from './base-history-repository.js';
import { Logger } from '../core/logger.js';

const repo = new BaseHistoryRepository('pdfHistory', 30);

export class PDFHistory {
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

    const id = await repo.save(entry);
    Logger.info('✓ PDF salvato in cronologia.');
    return id;
  }

  static async getPDFHistory() {
    return repo.getAll();
  }

  static async getPDFById(id) {
    return repo.getById(id);
  }

  static async deletePDF(id) {
    return repo.delete(id);
  }

  static async togglePDFFavorite(pdfId) {
    return repo.toggleFavorite(pdfId);
  }

  static async clearPDFHistory() {
    return repo.clear();
  }

  static async updatePDFWithTranslation(pdfId, translation, targetLanguage, originalLanguage) {
    return repo.updateField(pdfId, 'translation', {
      text: translation,
      targetLanguage,
      originalLanguage,
      timestamp: Date.now(),
    });
  }

  static async updatePDFWithQA(pdfId, qaList) {
    return repo.updateField(pdfId, 'qa', qaList);
  }

  static async updatePDFWithCitations(pdfId, citations) {
    return repo.updateField(pdfId, 'citations', citations);
  }

  static async updatePDFNotes(pdfId, notes) {
    return repo.updateField(pdfId, 'notes', notes);
  }

  static async searchPDFHistory(query) {
    const history = await repo.getAll();
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
}
