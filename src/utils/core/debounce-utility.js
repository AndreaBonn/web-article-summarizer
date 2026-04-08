// Debounce Utility - Ottimizzazione performance per eventi frequenti
// Riduce il numero di chiamate a funzioni costose

export class DebounceUtility {
  /**
   * Debounce classico - esegue la funzione dopo N ms di inattività
   * Perfetto per: ricerca, resize, scroll
   * 
   * @param {Function} func - Funzione da eseguire
   * @param {number} wait - Millisecondi di attesa (default: 300)
   * @returns {Function} - Funzione debounced
   * 
   * Esempio:
   * const debouncedSearch = DebounceUtility.debounce(search, 300);
   * input.addEventListener('input', debouncedSearch);
   */
  static debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const context = this;
      
      const later = () => {
        clearTimeout(timeout);
        func.apply(context, args);
      };
      
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * Throttle - esegue la funzione max una volta ogni N ms
   * Perfetto per: scroll events, mouse move, window resize
   * 
   * @param {Function} func - Funzione da eseguire
   * @param {number} limit - Millisecondi tra esecuzioni (default: 300)
   * @returns {Function} - Funzione throttled
   * 
   * Esempio:
   * const throttledScroll = DebounceUtility.throttle(onScroll, 100);
   * window.addEventListener('scroll', throttledScroll);
   */
  static throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
      const context = this;
      
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  /**
   * Debounce con feedback visivo immediato
   * Mostra indicatore "Ricerca in corso..." mentre aspetta
   * 
   * @param {Function} func - Funzione da eseguire
   * @param {number} wait - Millisecondi di attesa (default: 300)
   * @param {HTMLElement} feedbackEl - Elemento per feedback visivo
   * @returns {Function} - Funzione debounced con feedback
   * 
   * Esempio:
   * const debouncedSearch = DebounceUtility.debounceWithFeedback(
   *   search, 
   *   300, 
   *   document.getElementById('searchInput')
   * );
   */
  static debounceWithFeedback(func, wait = 300, feedbackEl = null) {
    let timeout;
    return function executedFunction(...args) {
      const context = this;
      
      // Aggiungi classe "searching" per feedback visivo
      if (feedbackEl) {
        feedbackEl.classList.add('searching');
      }
      
      const later = () => {
        clearTimeout(timeout);
        
        // Rimuovi classe "searching"
        if (feedbackEl) {
          feedbackEl.classList.remove('searching');
        }
        
        func.apply(context, args);
      };
      
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * Debounce con esecuzione immediata alla prima chiamata
   * Utile quando vuoi feedback immediato ma poi debounce
   * 
   * @param {Function} func - Funzione da eseguire
   * @param {number} wait - Millisecondi di attesa (default: 300)
   * @param {boolean} immediate - Esegui immediatamente la prima volta
   * @returns {Function} - Funzione debounced
   */
  static debounceImmediate(func, wait = 300, immediate = true) {
    let timeout;
    return function executedFunction(...args) {
      const context = this;
      
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      
      const callNow = immediate && !timeout;
      
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      
      if (callNow) func.apply(context, args);
    };
  }
  
  /**
   * Debounce con promise - utile per async/await
   * 
   * @param {Function} func - Funzione async da eseguire
   * @param {number} wait - Millisecondi di attesa (default: 300)
   * @returns {Function} - Funzione debounced che ritorna Promise
   * 
   * Esempio:
   * const debouncedFetch = DebounceUtility.debouncePromise(fetchData, 300);
   * await debouncedFetch(query);
   */
  static debouncePromise(func, wait = 300) {
    let timeout;
    let rejectPrevious;
    
    return function executedFunction(...args) {
      return new Promise((resolve, reject) => {
        // Cancella promise precedente
        if (rejectPrevious) {
          rejectPrevious({ cancelled: true });
        }
        
        rejectPrevious = reject;
        
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          rejectPrevious = null;
          try {
            const result = await func(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, wait);
      });
    };
  }
  
  /**
   * Crea un debouncer riutilizzabile con stato
   * Utile per gestire multiple istanze
   * 
   * @returns {Object} - Oggetto con metodi debounce
   * 
   * Esempio:
   * const debouncer = DebounceUtility.createDebouncer();
   * debouncer.debounce('search', searchFunc, 300);
   * debouncer.cancel('search');
   */
  static createDebouncer() {
    const timeouts = new Map();
    
    return {
      debounce(key, func, wait = 300) {
        if (timeouts.has(key)) {
          clearTimeout(timeouts.get(key));
        }
        
        const timeout = setTimeout(() => {
          timeouts.delete(key);
          func();
        }, wait);
        
        timeouts.set(key, timeout);
      },
      
      cancel(key) {
        if (timeouts.has(key)) {
          clearTimeout(timeouts.get(key));
          timeouts.delete(key);
        }
      },
      
      cancelAll() {
        timeouts.forEach(timeout => clearTimeout(timeout));
        timeouts.clear();
      },
      
      isPending(key) {
        return timeouts.has(key);
      }
    };
  }
}
