// Event Cleanup Manager - Gestisce la rimozione automatica degli event listeners
class EventCleanupManager {
  constructor() {
    this.listeners = new Map(); // Map<element, Array<{event, handler}>>
    this.setupUnloadHandler();
  }
  
  /**
   * Registra un event listener per cleanup automatico
   */
  addEventListener(element, event, handler, options = {}) {
    if (!element) {
      console.warn('EventCleanupManager: elemento non valido');
      return;
    }
    
    // Aggiungi listener
    element.addEventListener(event, handler, options);
    
    // Registra per cleanup
    if (!this.listeners.has(element)) {
      this.listeners.set(element, []);
    }
    
    this.listeners.get(element).push({ event, handler, options });
    
    console.log(`✅ Listener registrato: ${event} su`, element);
  }
  
  /**
   * Rimuovi un listener specifico
   */
  removeEventListener(element, event, handler) {
    if (!element) return;
    
    element.removeEventListener(event, handler);
    
    // Rimuovi dalla registrazione
    if (this.listeners.has(element)) {
      const elementListeners = this.listeners.get(element);
      const index = elementListeners.findIndex(
        l => l.event === event && l.handler === handler
      );
      
      if (index !== -1) {
        elementListeners.splice(index, 1);
        console.log(`🧹 Listener rimosso: ${event} da`, element);
      }
      
      // Se non ci sono più listener per questo elemento, rimuovi la entry
      if (elementListeners.length === 0) {
        this.listeners.delete(element);
      }
    }
  }
  
  /**
   * Rimuovi tutti i listener da un elemento
   */
  removeAllListeners(element) {
    if (!this.listeners.has(element)) return;
    
    const elementListeners = this.listeners.get(element);
    
    elementListeners.forEach(({ event, handler }) => {
      element.removeEventListener(event, handler);
    });
    
    this.listeners.delete(element);
    console.log(`🧹 Tutti i listener rimossi da`, element);
  }
  
  /**
   * Cleanup completo di tutti i listener registrati
   */
  cleanupAll() {
    console.log('🧹 Cleanup di tutti i listener...');
    
    let count = 0;
    this.listeners.forEach((elementListeners, element) => {
      elementListeners.forEach(({ event, handler }) => {
        try {
          element.removeEventListener(event, handler);
          count++;
        } catch (error) {
          console.warn('Errore rimozione listener:', error);
        }
      });
    });
    
    this.listeners.clear();
    console.log(`✅ ${count} listener rimossi`);
  }
  
  /**
   * Setup handler per cleanup automatico su unload
   */
  setupUnloadHandler() {
    window.addEventListener('unload', () => {
      this.cleanupAll();
    });
    
    // Per popup che si chiudono senza unload
    window.addEventListener('beforeunload', () => {
      this.cleanupAll();
    });
  }
  
  /**
   * Ottieni statistiche sui listener registrati
   */
  getStats() {
    let totalListeners = 0;
    const eventTypes = {};
    
    this.listeners.forEach((elementListeners) => {
      elementListeners.forEach(({ event }) => {
        totalListeners++;
        eventTypes[event] = (eventTypes[event] || 0) + 1;
      });
    });
    
    return {
      totalElements: this.listeners.size,
      totalListeners,
      eventTypes
    };
  }
}

// Istanza globale
const eventCleanup = new EventCleanupManager();
