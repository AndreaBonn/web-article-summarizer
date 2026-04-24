import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchOptimizer } from '@utils/core/search-optimizer.js';

vi.spyOn(console, 'debug').mockImplementation(() => {});

describe('SearchOptimizer', () => {
  let optimizer;
  const items = [
    { article: { title: 'React Hooks Tutorial', url: 'https://example.com/react' }, summary: 'Learn about useState and useEffect hooks in React' },
    { article: { title: 'Python Machine Learning', url: 'https://example.com/python-ml' }, summary: 'Introduction to scikit-learn and pandas' },
    { article: { title: 'JavaScript Best Practices', url: 'https://example.com/js' }, summary: 'Tips for writing clean JavaScript code' },
  ];

  beforeEach(() => {
    optimizer = new SearchOptimizer();
  });

  describe('search()', () => {
    it('test_search_emptyQuery_returnsAllItems', () => {
      const result = optimizer.search(items, '');
      expect(result).toEqual(items);
    });

    it('test_search_nullQuery_returnsAllItems', () => {
      const result = optimizer.search(items, null);
      expect(result).toEqual(items);
    });

    it('test_search_whitespaceQuery_returnsAllItems', () => {
      const result = optimizer.search(items, '   ');
      expect(result).toEqual(items);
    });

    it('test_search_byTitle_findsMatch', () => {
      const result = optimizer.search(items, 'React');
      expect(result).toHaveLength(1);
      expect(result[0].article.title).toBe('React Hooks Tutorial');
    });

    it('test_search_caseInsensitive_findsMatch', () => {
      const result = optimizer.search(items, 'react');
      expect(result).toHaveLength(1);
    });

    it('test_search_noMatch_returnsEmpty', () => {
      const result = optimizer.search(items, 'Rust');
      expect(result).toHaveLength(0);
    });

    it('test_search_byUrl_whenEnabled_findsMatch', () => {
      const result = optimizer.search(items, 'python-ml', { searchInUrl: true });
      expect(result).toHaveLength(1);
      expect(result[0].article.title).toBe('Python Machine Learning');
    });

    it('test_search_byUrl_whenDisabled_doesNotMatch', () => {
      const result = optimizer.search(items, 'python-ml', { searchInUrl: false });
      expect(result).toHaveLength(0);
    });

    it('test_search_byContent_whenEnabled_findsMatch', () => {
      const result = optimizer.search(items, 'scikit-learn', {
        searchInTitle: false,
        searchInContent: true,
      });
      expect(result).toHaveLength(1);
      expect(result[0].article.title).toBe('Python Machine Learning');
    });

    it('test_search_multipleMatches_returnsAll', () => {
      const result = optimizer.search(items, 'a');
      expect(result.length).toBeGreaterThan(1);
    });
  });

  describe('ricerca incrementale', () => {
    it('test_search_incrementalQuery_filtersFromPreviousResults', () => {
      // Prima ricerca: "a" matches all 3 titles (reAct, pythOn mAchine, jAvAscript)
      const first = optimizer.search(items, 'a');
      expect(first).toHaveLength(3);
      // Ricerca incrementale (estende la query): "ac" filtra dai risultati precedenti
      // "reACt", "mAChiné", "prACtices" → still 3
      const second = optimizer.search(items, 'ac');
      expect(second).toHaveLength(3);
      // "act" → "reACT", "prACTices" → 2
      const third = optimizer.search(items, 'act');
      expect(third).toHaveLength(2);
    });

    it('test_search_newQuery_notIncremental_doesFullSearch', () => {
      optimizer.search(items, 'React');
      // Query completamente diversa
      const result = optimizer.search(items, 'Python');
      expect(result).toHaveLength(1);
      expect(result[0].article.title).toBe('Python Machine Learning');
    });
  });

  describe('canUseIncrementalSearch()', () => {
    it('test_canUseIncrementalSearch_noLastResults_returnsFalse', () => {
      expect(optimizer.canUseIncrementalSearch('test')).toBe(false);
    });

    it('test_canUseIncrementalSearch_queryIsExtension_returnsTrue', () => {
      optimizer.lastResults = [items[0]];
      optimizer.lastQuery = 'rea';
      expect(optimizer.canUseIncrementalSearch('reac')).toBe(true);
    });

    it('test_canUseIncrementalSearch_sameQuery_returnsFalse', () => {
      optimizer.lastResults = [items[0]];
      optimizer.lastQuery = 'react';
      expect(optimizer.canUseIncrementalSearch('react')).toBe(false);
    });

    it('test_canUseIncrementalSearch_differentQuery_returnsFalse', () => {
      optimizer.lastResults = [items[0]];
      optimizer.lastQuery = 'react';
      expect(optimizer.canUseIncrementalSearch('python')).toBe(false);
    });
  });

  describe('reset()', () => {
    it('test_reset_clearsState', () => {
      optimizer.search(items, 'react');
      optimizer.reset();

      expect(optimizer.lastQuery).toBe('');
      expect(optimizer.lastResults).toBeNull();
    });
  });

  describe('getStats()', () => {
    it('test_getStats_afterSearch_returnsCorrectData', () => {
      optimizer.search(items, 'react');
      const stats = optimizer.getStats();

      expect(stats.lastQuery).toBe('react');
      expect(stats.lastResultsCount).toBe(1);
    });

    it('test_getStats_noSearch_returnsZero', () => {
      const stats = optimizer.getStats();
      expect(stats.lastResultsCount).toBe(0);
    });
  });
});
