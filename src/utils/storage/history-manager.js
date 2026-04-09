// History Manager - Gestione cronologia riassunti
export class HistoryManager {
  static async _safeStorageSet(data) {
    try {
      await chrome.storage.local.set(data);
    } catch (error) {
      if (error.message?.includes('QUOTA_BYTES')) {
        throw new Error(
          'Spazio di archiviazione esaurito. Pulisci la cronologia nelle impostazioni.',
        );
      }
      throw new Error(`Errore salvataggio: ${error.message}`);
    }
  }

  static async saveSummary(article, summary, keyPoints, metadata) {
    const result = await chrome.storage.local.get(['summaryHistory']);
    let history = result.summaryHistory || [];

    const entry = {
      id: Date.now(),
      timestamp: Date.now(),
      article: {
        title: article.title,
        url: article.url,
        content: article.content, // IMPORTANTE: Salva il contenuto per reading mode
        excerpt: article.excerpt,
        wordCount: article.wordCount,
        readingTimeMinutes: article.readingTimeMinutes,
        paragraphs: article.paragraphs, // Salva anche i paragrafi se presenti
      },
      summary: summary,
      keyPoints: keyPoints,
      translation: null, // Sarà aggiunta dopo se generata
      notes: null, // Note personali dell'utente
      metadata: {
        provider: metadata.provider,
        language: metadata.language,
        contentType: metadata.contentType,
        fromCache: metadata.fromCache || false,
      },
    };

    // Aggiungi all'inizio
    history.unshift(entry);

    // Mantieni solo gli ultimi 50
    if (history.length > 50) {
      history = history.slice(0, 50);
    }

    await this._safeStorageSet({ summaryHistory: history });
    return entry.id;
  }

  static async updateSummaryWithTranslation(
    articleUrl,
    translation,
    targetLanguage,
    originalLanguage,
  ) {
    const history = await this.getHistory();

    // Trova l'entry più recente per questo URL
    const entry = history.find((e) => e.article.url === articleUrl);

    if (entry) {
      entry.translation = {
        text: translation,
        targetLanguage,
        originalLanguage,
        timestamp: Date.now(),
      };

      await this._safeStorageSet({ summaryHistory: history });
    }
  }

  static async getHistory() {
    const result = await chrome.storage.local.get(['summaryHistory']);
    return result.summaryHistory || [];
  }

  static async getSummaryById(id) {
    const history = await this.getHistory();
    return history.find((entry) => entry.id === id);
  }

  static async deleteSummary(id) {
    const history = await this.getHistory();
    const filtered = history.filter((entry) => entry.id !== id);
    await this._safeStorageSet({ summaryHistory: filtered });
  }

  static async searchHistory(query, options = {}) {
    const history = await this.getHistory();
    const lowerQuery = query.toLowerCase();

    // Default: cerca in tutto
    const { searchInTitle = true, searchInUrl = true, searchInContent = true } = options;

    return history.filter((entry) => {
      let matches = false;

      // Cerca nel titolo
      if (searchInTitle && entry.article.title.toLowerCase().includes(lowerQuery)) {
        matches = true;
      }

      // Cerca nell'URL
      if (searchInUrl && entry.article.url.toLowerCase().includes(lowerQuery)) {
        matches = true;
      }

      // Cerca nel contenuto (riassunto, punti chiave, note)
      if (searchInContent) {
        // Cerca nel riassunto
        if (entry.summary && entry.summary.toLowerCase().includes(lowerQuery)) {
          matches = true;
        }

        // Cerca nei punti chiave
        if (entry.keyPoints) {
          const keypointsMatch = entry.keyPoints.some(
            (point) =>
              point.title.toLowerCase().includes(lowerQuery) ||
              point.description.toLowerCase().includes(lowerQuery),
          );
          if (keypointsMatch) matches = true;
        }

        // Cerca nelle note
        if (entry.notes && entry.notes.toLowerCase().includes(lowerQuery)) {
          matches = true;
        }

        // Cerca nella traduzione
        if (
          entry.translation &&
          entry.translation.text &&
          entry.translation.text.toLowerCase().includes(lowerQuery)
        ) {
          matches = true;
        }

        // Cerca nelle Q&A
        if (entry.qa) {
          const qaMatch = entry.qa.some(
            (qa) =>
              qa.question.toLowerCase().includes(lowerQuery) ||
              qa.answer.toLowerCase().includes(lowerQuery),
          );
          if (qaMatch) matches = true;
        }
      }

      return matches;
    });
  }

  static async filterHistory(filters) {
    const history = await this.getHistory();

    return history.filter((entry) => {
      if (filters.provider && entry.metadata.provider !== filters.provider) {
        return false;
      }
      if (filters.language && entry.metadata.language !== filters.language) {
        return false;
      }
      if (filters.contentType && entry.metadata.contentType !== filters.contentType) {
        return false;
      }
      if (filters.dateFrom && entry.timestamp < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && entry.timestamp > filters.dateTo) {
        return false;
      }
      return true;
    });
  }

  static formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ora';
    if (diffMins < 60) return `${diffMins} min fa`;
    if (diffHours < 24) return `${diffHours} ore fa`;
    if (diffDays < 7) return `${diffDays} giorni fa`;

    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  static async updateSummaryWithQA(articleUrl, qaList) {
    const history = await this.getHistory();

    // Trova l'entry più recente per questo URL
    const entry = history.find((e) => e.article.url === articleUrl);

    if (entry) {
      entry.qa = qaList;

      // Salva
      await this._safeStorageSet({ summaryHistory: history });
    }
  }

  static async updateSummaryNotes(entryId, notes) {
    const history = await this.getHistory();

    // Trova l'entry per ID
    const entry = history.find((e) => e.id === entryId);

    if (entry) {
      entry.notes = notes;

      // Salva
      await this._safeStorageSet({ summaryHistory: history });
    }
  }

  static async toggleFavorite(entryId) {
    const history = await this.getHistory();
    const entry = history.find((e) => e.id === entryId);

    if (entry) {
      entry.favorite = !entry.favorite;
      await this._safeStorageSet({ summaryHistory: history });
      return entry.favorite;
    }
    return false;
  }

  static async clearHistory() {
    const history = await this.getHistory();
    // Mantieni solo i preferiti
    const favorites = history.filter((entry) => entry.favorite);
    await this._safeStorageSet({ summaryHistory: favorites });
  }

  // ===== MULTI-ANALYSIS HISTORY =====

  static async saveMultiAnalysis(analysis, articles) {
    console.log('saveMultiAnalysis chiamato con:', { analysis, articles });
    const result = await chrome.storage.local.get(['multiAnalysisHistory']);
    let history = result.multiAnalysisHistory || [];
    console.log('Cronologia esistente:', history.length, 'items');

    const entry = {
      id: Date.now(),
      timestamp: Date.now(),
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

    // Aggiungi all'inizio
    history.unshift(entry);

    // Mantieni solo le ultime 30 analisi multi-articolo
    if (history.length > 30) {
      history = history.slice(0, 30);
    }

    await this._safeStorageSet({ multiAnalysisHistory: history });
    console.log('✓ Analisi multi-articolo salvata. Totale:', history.length);
    return entry.id;
  }

  static async getMultiAnalysisHistory() {
    const result = await chrome.storage.local.get(['multiAnalysisHistory']);
    return result.multiAnalysisHistory || [];
  }

  static async getMultiAnalysisById(id) {
    const history = await this.getMultiAnalysisHistory();
    return history.find((entry) => entry.id === id);
  }

  static async deleteMultiAnalysis(id) {
    const history = await this.getMultiAnalysisHistory();
    const filtered = history.filter((entry) => entry.id !== id);
    await this._safeStorageSet({ multiAnalysisHistory: filtered });
  }

  static async clearMultiAnalysisHistory() {
    await this._safeStorageSet({ multiAnalysisHistory: [] });
  }

  static async updateMultiAnalysisWithQA(analysisId, question, answer) {
    const history = await this.getMultiAnalysisHistory();
    const entry = history.find((e) => e.id === analysisId);

    if (entry) {
      if (!entry.analysis.qa.questions) {
        entry.analysis.qa.questions = [];
      }

      entry.analysis.qa.questions.push({
        question,
        answer,
        timestamp: Date.now(),
      });

      await this._safeStorageSet({ multiAnalysisHistory: history });
    }
  }

  static async toggleMultiAnalysisFavorite(analysisId) {
    const history = await this.getMultiAnalysisHistory();
    const entry = history.find((e) => e.id === analysisId);

    if (entry) {
      entry.favorite = !entry.favorite;
      await this._safeStorageSet({ multiAnalysisHistory: history });
      return entry.favorite;
    }
    return false;
  }

  static async clearMultiAnalysisHistory() {
    const history = await this.getMultiAnalysisHistory();
    // Mantieni solo i preferiti
    const favorites = history.filter((entry) => entry.favorite);
    await this._safeStorageSet({ multiAnalysisHistory: favorites });
  }

  static async updateSummaryWithCitations(articleUrl, citations) {
    const history = await this.getHistory();

    // Trova l'entry più recente per questo URL
    const entry = history.find((e) => e.article.url === articleUrl);

    if (entry) {
      entry.citations = citations;

      // Salva
      await this._safeStorageSet({ summaryHistory: history });
    }
  }

  // ===== PDF ANALYSIS HISTORY =====

  static async savePDFAnalysis(pdfInfo, summary, keyPoints, metadata) {
    const result = await chrome.storage.local.get(['pdfHistory']);
    let history = result.pdfHistory || [];

    const entry = {
      id: Date.now(),
      timestamp: Date.now(),
      pdf: {
        name: pdfInfo.name,
        size: pdfInfo.size,
        pages: pdfInfo.pages,
        text: pdfInfo.text, // Salva il testo per reading mode
        metadata: pdfInfo.metadata || {},
      },
      summary: summary,
      keyPoints: keyPoints,
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

    // Aggiungi all'inizio
    history.unshift(entry);

    // Mantieni solo gli ultimi 30 PDF
    if (history.length > 30) {
      history = history.slice(0, 30);
    }

    await this._safeStorageSet({ pdfHistory: history });
    console.log('✓ PDF salvato in cronologia. Totale:', history.length);
    return entry.id;
  }

  static async getPDFHistory() {
    const result = await chrome.storage.local.get(['pdfHistory']);
    return result.pdfHistory || [];
  }

  static async getPDFById(id) {
    const history = await this.getPDFHistory();
    return history.find((entry) => entry.id === id);
  }

  static async deletePDF(id) {
    const history = await this.getPDFHistory();
    const filtered = history.filter((entry) => entry.id !== id);
    await this._safeStorageSet({ pdfHistory: filtered });
  }

  static async updatePDFWithTranslation(pdfId, translation, targetLanguage, originalLanguage) {
    const history = await this.getPDFHistory();
    const entry = history.find((e) => e.id === pdfId);

    if (entry) {
      entry.translation = {
        text: translation,
        targetLanguage,
        originalLanguage,
        timestamp: Date.now(),
      };

      await this._safeStorageSet({ pdfHistory: history });
    }
  }

  static async updatePDFWithQA(pdfId, qaList) {
    const history = await this.getPDFHistory();
    const entry = history.find((e) => e.id === pdfId);

    if (entry) {
      entry.qa = qaList;
      await this._safeStorageSet({ pdfHistory: history });
    }
  }

  static async updatePDFWithCitations(pdfId, citations) {
    const history = await this.getPDFHistory();
    const entry = history.find((e) => e.id === pdfId);

    if (entry) {
      entry.citations = citations;
      await this._safeStorageSet({ pdfHistory: history });
    }
  }

  static async updatePDFNotes(pdfId, notes) {
    const history = await this.getPDFHistory();
    const entry = history.find((e) => e.id === pdfId);

    if (entry) {
      entry.notes = notes;
      await this._safeStorageSet({ pdfHistory: history });
    }
  }

  static async togglePDFFavorite(pdfId) {
    const history = await this.getPDFHistory();
    const entry = history.find((e) => e.id === pdfId);

    if (entry) {
      entry.favorite = !entry.favorite;
      await this._safeStorageSet({ pdfHistory: history });
      return entry.favorite;
    }
    return false;
  }

  static async searchPDFHistory(query) {
    const history = await this.getPDFHistory();
    const lowerQuery = query.toLowerCase();

    return history.filter((entry) => {
      // Cerca nel nome del file
      if (entry.pdf.name.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Cerca nel riassunto
      if (entry.summary && entry.summary.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Cerca nei punti chiave
      if (entry.keyPoints) {
        const keypointsMatch = entry.keyPoints.some(
          (point) =>
            point.title.toLowerCase().includes(lowerQuery) ||
            point.description.toLowerCase().includes(lowerQuery),
        );
        if (keypointsMatch) return true;
      }

      // Cerca nelle note
      if (entry.notes && entry.notes.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      return false;
    });
  }

  static async clearPDFHistory() {
    const history = await this.getPDFHistory();
    // Mantieni solo i preferiti
    const favorites = history.filter((entry) => entry.favorite);
    await this._safeStorageSet({ pdfHistory: favorites });
  }

  static formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
