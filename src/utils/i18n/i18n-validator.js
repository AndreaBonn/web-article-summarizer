// i18n Validator - Verifica completezza traduzioni
import { Logger } from '../core/logger.js';
import { I18n } from './i18n-extended.js';

export const I18nValidator = {
  // Verifica che tutte le lingue abbiano le stesse chiavi
  validateTranslations() {
    const languages = Object.keys(I18n.translations);
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      stats: {},
    };

    // Usa italiano come riferimento
    const referenceKeys = this.getAllKeys(I18n.translations.it);
    results.stats.referenceKeys = referenceKeys.length;

    // Verifica ogni lingua
    languages.forEach((lang) => {
      if (lang === 'it') return; // Skip reference

      const langKeys = this.getAllKeys(I18n.translations[lang]);
      results.stats[lang] = langKeys.length;

      // Chiavi mancanti
      const missingKeys = referenceKeys.filter((key) => !langKeys.includes(key));
      if (missingKeys.length > 0) {
        results.valid = false;
        results.errors.push({
          language: lang,
          type: 'missing_keys',
          keys: missingKeys,
          count: missingKeys.length,
        });
      }

      // Chiavi extra
      const extraKeys = langKeys.filter((key) => !referenceKeys.includes(key));
      if (extraKeys.length > 0) {
        results.warnings.push({
          language: lang,
          type: 'extra_keys',
          keys: extraKeys,
          count: extraKeys.length,
        });
      }
    });

    return results;
  },

  // Ottieni tutte le chiavi da un oggetto (ricorsivo)
  getAllKeys(obj, prefix = '') {
    let keys = [];

    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        keys = keys.concat(this.getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }

    return keys;
  },

  // Stampa report di validazione
  printReport(results) {
    Logger.info('='.repeat(60));
    Logger.info('📊 I18N VALIDATION REPORT');
    Logger.info('='.repeat(60));

    Logger.info('\n📈 Statistics:');
    Logger.info(`  Reference keys (it): ${results.stats.referenceKeys}`);
    Object.keys(results.stats).forEach((lang) => {
      if (lang !== 'referenceKeys') {
        const count = results.stats[lang];
        const diff = count - results.stats.referenceKeys;
        const status = diff === 0 ? '✅' : diff < 0 ? '❌' : '⚠️';
        Logger.info(`  ${status} ${lang}: ${count} keys (${diff >= 0 ? '+' : ''}${diff})`);
      }
    });

    if (results.errors.length > 0) {
      Logger.warn('\n❌ ERRORS:');
      results.errors.forEach((error) => {
        Logger.warn(`\n  Language: ${error.language}`);
        Logger.warn(`  Missing ${error.count} keys:`);
        error.keys.forEach((key) => Logger.warn(`    - ${key}`));
      });
    }

    if (results.warnings.length > 0) {
      Logger.warn('\n⚠️  WARNINGS:');
      results.warnings.forEach((warning) => {
        Logger.warn(`\n  Language: ${warning.language}`);
        Logger.warn(`  Extra ${warning.count} keys:`);
        warning.keys.forEach((key) => Logger.warn(`    - ${key}`));
      });
    }

    if (results.valid && results.warnings.length === 0) {
      Logger.info('\n✅ All translations are complete and consistent!');
    } else if (results.valid) {
      Logger.info('\n✅ All required translations present (with warnings)');
    } else {
      Logger.warn('\n❌ Translation validation FAILED');
    }

    Logger.info('\n' + '='.repeat(60));

    return results.valid;
  },

  // Genera template per chiavi mancanti
  generateMissingTemplate(results) {
    if (results.errors.length === 0) {
      Logger.info('✅ No missing translations to generate');
      return;
    }

    Logger.info('\n📝 MISSING TRANSLATIONS TEMPLATE:');
    Logger.info('Copy and paste into utils/i18n.js\n');

    results.errors.forEach((error) => {
      Logger.info(`\n// ${error.language.toUpperCase()} - Missing translations:`);
      error.keys.forEach((key) => {
        const value = this.getValueByKey(I18n.translations.it, key);
        Logger.info(`'${key}': '${value}', // TODO: Translate`);
      });
    });
  },

  // Ottieni valore da chiave (supporta notazione a punti)
  getValueByKey(obj, key) {
    const keys = key.split('.');
    let value = obj;

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return undefined;
      }
    }

    return value;
  },
};

// Auto-esegui validazione se caricato in console
if (typeof window !== 'undefined' && window.I18n) {
  Logger.info(
    '🔍 I18n Validator loaded. Run I18nValidator.validateTranslations() to check translations.',
  );
}
