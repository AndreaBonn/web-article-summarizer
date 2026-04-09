import js from '@eslint/js';
import globals from 'globals';

export default [
  // File ignorati
  {
    ignores: ['dist/', 'node_modules/', 'public/workers/'],
  },

  // Configurazione base per tutto il codice sorgente
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser standard
        ...globals.browser,
        // Chrome Extension API
        chrome: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      // Disabilitato: il codice esistente ricompila errori nel catch senza propagare la cause.
      // È un pattern diffuso nel codebase — abilitare quando si fa cleanup degli error handler.
      'no-throw-literal': 'off',
      'preserve-caught-error': 'off',
    },
  },

  // Configurazione per i test (globals vitest disponibili)
  {
    files: ['tests/**/*.test.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // vitest globals (describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll)
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },
];
