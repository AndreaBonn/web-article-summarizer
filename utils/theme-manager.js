// Theme Manager - Gestione Dark Mode
const ThemeManager = {
  async init() {
    try {
      // Attendi che StorageManager sia disponibile
      if (typeof StorageManager === 'undefined') {
        console.warn('StorageManager non ancora caricato, riprovo...');
        setTimeout(() => this.init(), 100);
        return;
      }
      
      const settings = await StorageManager.getSettings();
      console.log('Theme settings loaded:', settings.darkMode);
      this.applyTheme(settings.darkMode || false);
    } catch (error) {
      console.error('Errore caricamento tema:', error);
    }
  },
  
  applyTheme(isDark) {
    console.log('Applying theme, dark mode:', isDark);
    if (isDark) {
      document.body.classList.add('dark-mode');
      console.log('Dark mode class added');
    } else {
      document.body.classList.remove('dark-mode');
      console.log('Dark mode class removed');
    }
  }
};

// Auto-inizializza quando il DOM è pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
  ThemeManager.init();
}
