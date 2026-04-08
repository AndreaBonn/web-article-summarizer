// PDFCacheManager - Gestione cache e cronologia PDF
class PDFCacheManager {
  constructor() {
    this.STORAGE_KEY = 'pdf_analysis_history';
    this.MAX_ENTRIES = 50;
    this.DAYS_TO_KEEP = 30;
  }

  /**
   * Calcola hash SHA-256 del file PDF
   * @param {File} file - File PDF
   * @returns {Promise<string>} Hash esadecimale
   */
  async calculateFileHash(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      console.error('Errore calcolo hash:', error);
      throw new Error('Impossibile calcolare hash del file');
    }
  }

  /**
   * Verifica se il PDF è già in cache
   * @param {File} file - File PDF
   * @returns {Promise<{found: boolean, data?: object, fileHash?: string}>}
   */
  async checkCache(file) {
    try {
      const fileHash = await this.calculateFileHash(file);
      const history = await this.getHistory();
      
      const cached = history.find(entry => entry.fileHash === fileHash);
      
      if (cached) {
        console.log('✓ PDF trovato in cache:', cached.filename);
        return { found: true, data: cached, fileHash };
      }
      
      return { found: false, fileHash };
    } catch (error) {
      console.error('Errore check cache:', error);
      return { found: false };
    }
  }

  /**
   * Salva analisi PDF nella cronologia
   * @param {File} file - File PDF
   * @param {string} extractedText - Testo estratto
   * @param {object} analysis - Risultati analisi
   * @param {string} apiProvider - Provider API usato
   * @param {string} fileHash - Hash del file (opzionale)
   * @returns {Promise<object>} Entry salvato
   */
  async saveAnalysis(file, extractedText, analysis, apiProvider, fileHash = null) {
    try {
      if (!fileHash) {
        fileHash = await this.calculateFileHash(file);
      }
      
      const entry = {
        id: `pdf_${Date.now()}`,
        type: 'pdf',
        fileHash,
        filename: file.name,
        fileSize: file.size,
        pageCount: analysis.pageCount || 0,
        extractedText,
        analysis: {
          summary: analysis.summary,
          keyPoints: analysis.keyPoints,
          quotes: analysis.quotes || [],
          translation: analysis.translation || null
        },
        timestamp: Date.now(),
        apiProvider,
        hasLivePreview: false
      };
      
      const history = await this.getHistory();
      history.unshift(entry);
      
      // Limita a MAX_ENTRIES
      if (history.length > this.MAX_ENTRIES) {
        history.splice(this.MAX_ENTRIES);
      }
      
      await this.saveHistory(history);
      console.log('✓ Analisi PDF salvata:', entry.filename);
      
      return entry;
    } catch (error) {
      console.error('Errore salvataggio analisi:', error);
      throw error;
    }
  }

  /**
   * Ottieni cronologia PDF
   * @returns {Promise<Array>}
   */
  async getHistory() {
    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEY]);
      return result[this.STORAGE_KEY] || [];
    } catch (error) {
      console.error('Errore lettura cronologia:', error);
      return [];
    }
  }

  /**
   * Salva cronologia
   * @param {Array} history
   */
  async saveHistory(history) {
    try {
      await chrome.storage.local.set({ [this.STORAGE_KEY]: history });
    } catch (error) {
      console.error('Errore salvataggio cronologia:', error);
      throw error;
    }
  }

  /**
   * Elimina singolo elemento
   * @param {string} entryId
   */
  async deleteEntry(entryId) {
    try {
      const history = await this.getHistory();
      const filtered = history.filter(entry => entry.id !== entryId);
      await this.saveHistory(filtered);
      console.log('✓ Entry eliminato:', entryId);
    } catch (error) {
      console.error('Errore eliminazione entry:', error);
      throw error;
    }
  }

  /**
   * Pulisci elementi vecchi
   * @param {number} daysToKeep - Giorni da mantenere
   */
  async cleanOldEntries(daysToKeep = 30) {
    try {
      const history = await this.getHistory();
      const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      
      const filtered = history.filter(entry => entry.timestamp > cutoffTime);
      
      if (filtered.length < history.length) {
        await this.saveHistory(filtered);
        console.log(`✓ Puliti ${history.length - filtered.length} elementi vecchi`);
      }
    } catch (error) {
      console.error('Errore pulizia cronologia:', error);
    }
  }

  /**
   * Ottieni statistiche storage
   * @returns {Promise<object>}
   */
  async getStorageStats() {
    try {
      const history = await this.getHistory();
      const bytesInUse = await chrome.storage.local.getBytesInUse(this.STORAGE_KEY);
      
      return {
        totalEntries: history.length,
        bytesInUse,
        maxEntries: this.MAX_ENTRIES,
        daysToKeep: this.DAYS_TO_KEEP
      };
    } catch (error) {
      console.error('Errore statistiche storage:', error);
      return null;
    }
  }
}
