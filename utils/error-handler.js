// Error Handler - Gestione centralizzata degli errori con feedback utente
class ErrorHandler {
  /**
   * Mostra un errore all'utente con feedback visivo
   */
  static async showError(error, context = '') {
    const errorMessage = this.getErrorMessage(error);
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;
    
    console.error('❌ Errore:', error);
    
    // Mostra notifica visiva all'utente
    if (typeof Modal !== 'undefined') {
      await Modal.error(fullMessage, 'Errore');
    } else {
      // Fallback se Modal non è disponibile
      alert(fullMessage);
    }
    
    // Log per telemetria
    await this.logError(error, context);
    
    return errorMessage;
  }
  
  /**
   * Converte errori tecnici in messaggi user-friendly
   */
  static getErrorMessage(error) {
    const message = error.message || error.toString();
    
    // Errori di estrazione articolo
    if (message.includes('No article found')) {
      return 'Nessun articolo rilevato in questa pagina. Prova con un articolo di blog o news.';
    }
    if (message.includes('Article too short')) {
      return 'Articolo troppo breve per essere riassunto (minimo 200 parole).';
    }
    
    // Errori API
    if (message.includes('API key non configurata')) {
      return 'API key non configurata. Clicca sull\'icona ⚙️ per configurare.';
    }
    if (message.includes('401') || message.includes('Unauthorized')) {
      return 'API key non valida. Verifica la configurazione nelle impostazioni.';
    }
    if (message.includes('429') || message.includes('Too Many Requests')) {
      return 'Troppe richieste. Riprova tra qualche secondo.';
    }
    if (message.includes('403') || message.includes('Forbidden')) {
      return 'Accesso negato. Verifica i permessi della tua API key.';
    }
    if (message.includes('500') || message.includes('Internal Server Error')) {
      return 'Errore del server API. Riprova tra qualche minuto.';
    }
    if (message.includes('503') || message.includes('Service Unavailable')) {
      return 'Servizio temporaneamente non disponibile. Riprova più tardi.';
    }
    
    // Errori di rete
    if (message.includes('Network') || message.includes('fetch')) {
      return 'Errore di connessione. Verifica la tua connessione internet.';
    }
    if (message.includes('timeout')) {
      return 'Richiesta scaduta. Il server ha impiegato troppo tempo a rispondere.';
    }
    
    // Errori di Chrome Extension
    if (message.includes('chrome://') || message.includes('chrome-extension://')) {
      return 'Impossibile analizzare pagine interne di Chrome.';
    }
    
    // Errori di cache
    if (message.includes('QUOTA_BYTES')) {
      return 'Spazio di archiviazione esaurito. Pulisci la cache nelle impostazioni.';
    }
    
    // Errore generico
    return message;
  }
  
  /**
   * Log errore per telemetria
   */
  static async logError(error, context = '') {
    try {
      const result = await chrome.storage.local.get(['errorLogs']);
      const logs = result.errorLogs || [];
      
      logs.push({
        message: error.message || error.toString(),
        context,
        stack: error.stack,
        timestamp: Date.now(),
        url: window.location.href
      });
      
      // Mantieni solo gli ultimi 50 errori
      if (logs.length > 50) {
        logs.shift();
      }
      
      await chrome.storage.local.set({ errorLogs: logs });
    } catch (logError) {
      console.error('Impossibile salvare log errore:', logError);
    }
  }
  
  /**
   * Ottieni statistiche errori
   */
  static async getErrorStats() {
    try {
      const result = await chrome.storage.local.get(['errorLogs']);
      const logs = result.errorLogs || [];
      
      const last24h = logs.filter(log => 
        Date.now() - log.timestamp < 24 * 60 * 60 * 1000
      );
      
      const errorTypes = {};
      last24h.forEach(log => {
        const type = this.categorizeError(log.message);
        errorTypes[type] = (errorTypes[type] || 0) + 1;
      });
      
      return {
        total: logs.length,
        last24h: last24h.length,
        errorTypes
      };
    } catch (error) {
      console.error('Errore nel calcolare statistiche errori:', error);
      return null;
    }
  }
  
  /**
   * Categorizza errore per statistiche
   */
  static categorizeError(message) {
    if (message.includes('API') || message.includes('401') || message.includes('429')) {
      return 'API';
    }
    if (message.includes('Network') || message.includes('fetch')) {
      return 'Network';
    }
    if (message.includes('article') || message.includes('extract')) {
      return 'Extraction';
    }
    if (message.includes('cache') || message.includes('storage')) {
      return 'Storage';
    }
    return 'Other';
  }
  
  /**
   * Pulisci log errori
   */
  static async clearErrorLogs() {
    await chrome.storage.local.remove(['errorLogs']);
  }
  
  /**
   * Wrapper per try-catch con gestione automatica errori
   */
  static async handleAsync(asyncFn, context = '', fallbackValue = null) {
    try {
      return await asyncFn();
    } catch (error) {
      await this.showError(error, context);
      return fallbackValue;
    }
  }
}
