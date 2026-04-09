// Theme Manager - Gestione Dark Mode
import { StorageManager } from '../storage/storage-manager.js';
import { Logger } from './logger.js';

export const ThemeManager = {
  async init() {
    try {
      // Attendi che StorageManager sia disponibile
      if (typeof StorageManager === 'undefined') {
        Logger.warn('StorageManager non ancora caricato, riprovo...');
        setTimeout(() => this.init(), 100);
        return;
      }

      const settings = await StorageManager.getSettings();
      Logger.info('Theme settings loaded:', settings.darkMode);
      this.applyTheme(settings.darkMode || false);
    } catch (error) {
      Logger.error('Errore caricamento tema:', error);
    }
  },

  applyTheme(isDark) {
    Logger.debug('Applying theme, dark mode:', isDark);
    if (isDark) {
      document.body.classList.add('dark-mode');
      Logger.debug('Dark mode class added');
    } else {
      document.body.classList.remove('dark-mode');
      Logger.debug('Dark mode class removed');
    }
  },
};

// Auto-inizializza quando il DOM è pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
  ThemeManager.init();
}
