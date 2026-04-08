// i18n Validator - Verifica completezza traduzioni
const I18nValidator = {
  
  // Verifica che tutte le lingue abbiano le stesse chiavi
  validateTranslations() {
    const languages = Object.keys(I18n.translations);
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      stats: {}
    };
    
    // Usa italiano come riferimento
    const referenceKeys = this.getAllKeys(I18n.translations.it);
    results.stats.referenceKeys = referenceKeys.length;
    
    // Verifica ogni lingua
    languages.forEach(lang => {
      if (lang === 'it') return; // Skip reference
      
      const langKeys = this.getAllKeys(I18n.translations[lang]);
      results.stats[lang] = langKeys.length;
      
      // Chiavi mancanti
      const missingKeys = referenceKeys.filter(key => !langKeys.includes(key));
      if (missingKeys.length > 0) {
        results.valid = false;
        results.errors.push({
          language: lang,
          type: 'missing_keys',
          keys: missingKeys,
          count: missingKeys.length
        });
      }
      
      // Chiavi extra
      const extraKeys = langKeys.filter(key => !referenceKeys.includes(key));
      if (extraKeys.length > 0) {
        results.warnings.push({
          language: lang,
          type: 'extra_keys',
          keys: extraKeys,
          count: extraKeys.length
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
    console.log('='.repeat(60));
    console.log('📊 I18N VALIDATION REPORT');
    console.log('='.repeat(60));
    
    console.log('\n📈 Statistics:');
    console.log(`  Reference keys (it): ${results.stats.referenceKeys}`);
    Object.keys(results.stats).forEach(lang => {
      if (lang !== 'referenceKeys') {
        const count = results.stats[lang];
        const diff = count - results.stats.referenceKeys;
        const status = diff === 0 ? '✅' : diff < 0 ? '❌' : '⚠️';
        console.log(`  ${status} ${lang}: ${count} keys (${diff >= 0 ? '+' : ''}${diff})`);
      }
    });
    
    if (results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      results.errors.forEach(error => {
        console.log(`\n  Language: ${error.language}`);
        console.log(`  Missing ${error.count} keys:`);
        error.keys.forEach(key => console.log(`    - ${key}`));
      });
    }
    
    if (results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      results.warnings.forEach(warning => {
        console.log(`\n  Language: ${warning.language}`);
        console.log(`  Extra ${warning.count} keys:`);
        warning.keys.forEach(key => console.log(`    - ${key}`));
      });
    }
    
    if (results.valid && results.warnings.length === 0) {
      console.log('\n✅ All translations are complete and consistent!');
    } else if (results.valid) {
      console.log('\n✅ All required translations present (with warnings)');
    } else {
      console.log('\n❌ Translation validation FAILED');
    }
    
    console.log('\n' + '='.repeat(60));
    
    return results.valid;
  },
  
  // Genera template per chiavi mancanti
  generateMissingTemplate(results) {
    if (results.errors.length === 0) {
      console.log('✅ No missing translations to generate');
      return;
    }
    
    console.log('\n📝 MISSING TRANSLATIONS TEMPLATE:');
    console.log('Copy and paste into utils/i18n.js\n');
    
    results.errors.forEach(error => {
      console.log(`\n// ${error.language.toUpperCase()} - Missing translations:`);
      error.keys.forEach(key => {
        const value = this.getValueByKey(I18n.translations.it, key);
        console.log(`'${key}': '${value}', // TODO: Translate`);
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
  }
};

// Auto-esegui validazione se caricato in console
if (typeof window !== 'undefined' && window.I18n) {
  console.log('🔍 I18n Validator loaded. Run I18nValidator.validateTranslations() to check translations.');
}
