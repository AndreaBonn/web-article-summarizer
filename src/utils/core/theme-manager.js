// Theme Manager - Gestione Dark Mode centralizzata per tutte le pagine
import { StorageManager } from '../storage/storage-manager.js';
import { Logger } from './logger.js';

export const ThemeManager = {
  async init() {
    try {
      const settings = await StorageManager.getSettings();
      this.applyTheme(settings.darkMode || false);
    } catch (error) {
      Logger.error('Errore caricamento tema:', error);
    }
  },

  applyTheme(isDark) {
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    this._updateIcon(isDark);
  },

  async toggle() {
    const settings = await StorageManager.getSettings();
    const newDarkMode = !settings.darkMode;

    settings.darkMode = newDarkMode;
    await StorageManager.saveSettings(settings);

    this.applyTheme(newDarkMode);
    return newDarkMode;
  },

  _updateIcon(isDark) {
    const btn =
      document.getElementById('themeToggleBtn') || document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    btn.textContent = isDark ? '◐' : '◑';
    btn.title = isDark ? 'Tema Chiaro' : 'Tema Scuro';
  },
};

// Auto-inizializza quando il DOM è pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
  ThemeManager.init();
}
