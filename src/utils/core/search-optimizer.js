// Search Optimizer - Ottimizzazione ricerca incrementale
// Riduce il carico di lavoro per ricerche successive
import { Logger } from './logger.js';

export class SearchOptimizer {
  constructor() {
    this.cache = new Map();
    this.lastQuery = '';
    this.lastResults = null;
  }

  /**
   * Ricerca ottimizzata con strategia incrementale
   * Se la nuova query è un'estensione della precedente,
   * filtra solo i risultati precedenti invece di tutti gli items
   */
  search(items, query, options = {}) {
    const { searchInTitle = true, searchInUrl = false, searchInContent = false } = options;

    // Query vuota = ritorna tutti
    if (!query || query.trim() === '') {
      this.reset();
      return items;
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Ricerca incrementale: se la nuova query è estensione della precedente
    if (this.canUseIncrementalSearch(normalizedQuery)) {
      Logger.debug('Ricerca incrementale:', this.lastQuery, '→', normalizedQuery);
      const filtered = this.filterItems(this.lastResults, normalizedQuery, {
        searchInTitle,
        searchInUrl,
        searchInContent,
      });

      this.lastQuery = normalizedQuery;
      this.lastResults = filtered;
      return filtered;
    }

    // Ricerca completa
    Logger.debug('Ricerca completa:', normalizedQuery);
    const filtered = this.filterItems(items, normalizedQuery, {
      searchInTitle,
      searchInUrl,
      searchInContent,
    });

    this.lastQuery = normalizedQuery;
    this.lastResults = filtered;
    return filtered;
  }

  /**
   * Verifica se possiamo usare ricerca incrementale
   */
  canUseIncrementalSearch(newQuery) {
    return (
      this.lastResults !== null &&
      this.lastQuery.length > 0 &&
      newQuery.startsWith(this.lastQuery) &&
      newQuery.length > this.lastQuery.length
    );
  }

  /**
   * Filtra gli items in base alla query
   */
  filterItems(items, query, options) {
    const { searchInTitle, searchInUrl, searchInContent } = options;

    return items.filter((item) => {
      // Ricerca in titolo
      if (searchInTitle && item.article.title.toLowerCase().includes(query)) {
        return true;
      }

      // Ricerca in URL
      if (searchInUrl && item.article.url.toLowerCase().includes(query)) {
        return true;
      }

      // Ricerca in contenuto (primi 500 caratteri per performance)
      if (searchInContent && item.summary) {
        const summaryPreview = item.summary.substring(0, 500).toLowerCase();
        if (summaryPreview.includes(query)) {
          return true;
        }
      }

      return false;
    });
  }

  /**
   * Reset dello stato
   */
  reset() {
    this.lastQuery = '';
    this.lastResults = null;
    this.cache.clear();
  }

  /**
   * Ottieni statistiche
   */
  getStats() {
    return {
      lastQuery: this.lastQuery,
      lastResultsCount: this.lastResults ? this.lastResults.length : 0,
      cacheSize: this.cache.size,
    };
  }
}
