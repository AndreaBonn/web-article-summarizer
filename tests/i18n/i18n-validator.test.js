import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@utils/core/logger.js', () => ({
  Logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@utils/i18n/i18n-extended.js', () => ({
  I18n: {
    translations: {
      it: { common: { save: 'Salva', cancel: 'Annulla' }, nav: { home: 'Home' } },
      en: { common: { save: 'Save', cancel: 'Cancel' }, nav: { home: 'Home' } },
      es: { common: { save: 'Guardar' }, nav: { home: 'Inicio' } },
    },
  },
}));

const store = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  global.chrome = {
    storage: {
      local: {
        get: vi.fn((keys) => {
          const result = {};
          for (const key of keys) {
            if (store[key] !== undefined) result[key] = JSON.parse(JSON.stringify(store[key]));
          }
          return Promise.resolve(result);
        }),
        set: vi.fn((data) => {
          const serialized = JSON.parse(JSON.stringify(data));
          Object.assign(store, serialized);
          return Promise.resolve();
        }),
        remove: vi.fn((keys) => {
          const keyList = Array.isArray(keys) ? keys : [keys];
          keyList.forEach((k) => delete store[k]);
          return Promise.resolve();
        }),
      },
    },
  };
  vi.clearAllMocks();
});

import { I18nValidator } from '@utils/i18n/i18n-validator.js';

describe('I18nValidator', () => {
  describe('getAllKeys', () => {
    it('test_getAllKeys_nestedObject_returnsAllDottedKeys', () => {
      // Arrange
      const obj = { common: { save: 'Salva', cancel: 'Annulla' }, nav: { home: 'Home' } };

      // Act
      const keys = I18nValidator.getAllKeys(obj);

      // Assert
      expect(keys).toContain('common.save');
      expect(keys).toContain('common.cancel');
      expect(keys).toContain('nav.home');
      expect(keys).toHaveLength(3);
    });

    it('test_getAllKeys_emptyObject_returnsEmpty', () => {
      // Arrange
      const obj = {};

      // Act
      const keys = I18nValidator.getAllKeys(obj);

      // Assert
      expect(keys).toEqual([]);
    });
  });

  describe('getValueByKey', () => {
    it('test_getValueByKey_validKey_returnsValue', () => {
      // Arrange
      const obj = { common: { save: 'Salva' } };

      // Act
      const value = I18nValidator.getValueByKey(obj, 'common.save');

      // Assert
      expect(value).toBe('Salva');
    });

    it('test_getValueByKey_invalidKey_returnsUndefined', () => {
      // Arrange
      const obj = { common: { save: 'Salva' } };

      // Act
      const value = I18nValidator.getValueByKey(obj, 'common.nonexistent');

      // Assert
      expect(value).toBeUndefined();
    });
  });

  describe('validateTranslations', () => {
    // validateTranslations() ritorna: { valid: bool, errors: [], warnings: [], stats: {} }
    // errors: [{ language, type: 'missing_keys', keys, count }]
    // warnings: [{ language, type: 'extra_keys', keys, count }]

    it('test_validateTranslations_allComplete_isValid', () => {
      // Arrange — 'en' ha tutte le chiavi di 'it' (la lingua di riferimento)

      // Act
      const report = I18nValidator.validateTranslations();

      // Assert — 'en' non genera errori, quindi nessun errore con language='en'
      const enError = report.errors.find((e) => e.language === 'en');
      expect(enError).toBeUndefined();
    });

    it('test_validateTranslations_missingKeys_reportsErrors', () => {
      // Arrange — 'es' manca di 'common.cancel' rispetto a 'it'

      // Act
      const report = I18nValidator.validateTranslations();

      // Assert
      expect(report.valid).toBe(false);
      const esError = report.errors.find((e) => e.language === 'es');
      expect(esError).toBeDefined();
      expect(esError.keys).toContain('common.cancel');
    });

    it('test_validateTranslations_extraKeys_reportsWarnings', () => {
      // Arrange — 'en' ha tutte le chiavi, nessuna in più → nessun warning per 'en'
      // 'es' manca di una chiave ma non ne ha in più → nessun warning per 'es'

      // Act
      const report = I18nValidator.validateTranslations();

      // Assert — la struttura è un oggetto con errors/warnings/valid/stats
      expect(report).toHaveProperty('valid');
      expect(report).toHaveProperty('errors');
      expect(report).toHaveProperty('warnings');
      expect(report).toHaveProperty('stats');
      // Nessun warning atteso per il mock corrente (nessuna lingua ha chiavi extra)
      expect(report.warnings).toHaveLength(0);
    });
  });
});
