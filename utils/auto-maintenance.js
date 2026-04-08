// Auto Maintenance - Cleanup automatico in background
class AutoMaintenance {
  constructor() {
    this.maintenanceInterval = 24 * 60 * 60 * 1000; // 24 ore
    this.lastMaintenanceKey = 'lastMaintenanceRun';
  }

  /**
   * Inizializza il sistema di manutenzione automatica
   */
  async initialize() {
    // Controlla se è necessario eseguire la manutenzione
    const shouldRun = await this.shouldRunMaintenance();
    
    if (shouldRun) {
      await this.runMaintenance();
    }
    
    // Programma la prossima manutenzione
    this.scheduleMaintenance();
  }

  /**
   * Controlla se è necessario eseguire la manutenzione
   */
  async shouldRunMaintenance() {
    try {
      const result = await chrome.storage.local.get([this.lastMaintenanceKey]);
      const lastRun = result[this.lastMaintenanceKey];
      
      if (!lastRun) {
        return true; // Prima esecuzione
      }
      
      const timeSinceLastRun = Date.now() - lastRun;
      return timeSinceLastRun >= this.maintenanceInterval;
    } catch (error) {
      console.error('Errore nel controllare ultima manutenzione:', error);
      return false;
    }
  }

  /**
   * Esegue la manutenzione completa
   */
  async runMaintenance() {
    console.log('🧹 Avvio manutenzione automatica...');
    
    try {
      // Ottieni impostazioni
      const settings = await this.getSettings();
      
      if (!settings.autoCleanup) {
        console.log('⏭️ Auto cleanup disabilitato, skip manutenzione');
        return;
      }
      
      const results = {
        timestamp: Date.now(),
        cacheExpired: 0,
        cacheLRU: 0,
        historyCompressed: 0,
        cacheCompressed: 0,
        historyDeleted: 0,
        errors: []
      };
      
      // 1. Pulisci cache scadute
      try {
        const cacheManager = new CacheManager();
        results.cacheExpired = await cacheManager.cleanExpired();
        console.log(`✅ Cache scadute pulite: ${results.cacheExpired}`);
      } catch (error) {
        console.error('Errore pulizia cache scadute:', error);
        results.errors.push({ step: 'cleanExpired', error: error.message });
      }
      
      // 2. Pulisci cache LRU
      try {
        const cacheManager = new CacheManager();
        results.cacheLRU = await cacheManager.cleanLRU(100);
        console.log(`✅ Cache LRU pulite: ${results.cacheLRU}`);
      } catch (error) {
        console.error('Errore pulizia cache LRU:', error);
        results.errors.push({ step: 'cleanLRU', error: error.message });
      }
      
      // 3. Comprimi dati vecchi (se abilitato)
      if (settings.enableCompression) {
        try {
          const compressionManager = new CompressionManager();
          
          // Comprimi cronologia > 30 giorni
          results.historyCompressed = await compressionManager.compressOldHistory(30);
          console.log(`✅ Cronologie compresse: ${results.historyCompressed}`);
          
          // Comprimi cache > 7 giorni
          results.cacheCompressed = await compressionManager.compressOldCache(7);
          console.log(`✅ Cache compresse: ${results.cacheCompressed}`);
        } catch (error) {
          console.error('Errore compressione:', error);
          results.errors.push({ step: 'compression', error: error.message });
        }
      }
      
      // 4. Elimina cronologia molto vecchia (> 180 giorni)
      try {
        results.historyDeleted = await this.deleteOldHistory(180);
        console.log(`✅ Cronologie eliminate: ${results.historyDeleted}`);
      } catch (error) {
        console.error('Errore eliminazione cronologia:', error);
        results.errors.push({ step: 'deleteHistory', error: error.message });
      }
      
      // Salva timestamp ultima manutenzione
      await chrome.storage.local.set({
        [this.lastMaintenanceKey]: Date.now(),
        lastMaintenanceResults: results
      });
      
      console.log('✅ Manutenzione completata:', results);
      
      return results;
    } catch (error) {
      console.error('Errore durante manutenzione:', error);
      throw error;
    }
  }

  /**
   * Elimina cronologia vecchia
   */
  async deleteOldHistory(daysOld) {
    try {
      const result = await chrome.storage.local.get(['summaryHistory']);
      const history = result.summaryHistory || [];
      
      const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      const filteredHistory = history.filter(entry => entry.timestamp >= cutoffDate);
      
      const deletedCount = history.length - filteredHistory.length;
      
      if (deletedCount > 0) {
        await chrome.storage.local.set({ summaryHistory: filteredHistory });
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Errore eliminazione cronologia:', error);
      return 0;
    }
  }

  /**
   * Ottieni impostazioni
   */
  async getSettings() {
    try {
      const result = await chrome.storage.local.get(['settings']);
      return result.settings || {
        autoCleanup: true,
        enableCompression: true
      };
    } catch (error) {
      console.error('Errore lettura impostazioni:', error);
      return {
        autoCleanup: true,
        enableCompression: true
      };
    }
  }

  /**
   * Programma la prossima manutenzione
   */
  scheduleMaintenance() {
    // Esegui manutenzione ogni 24 ore
    setTimeout(() => {
      this.runMaintenance().then(() => {
        this.scheduleMaintenance(); // Riprogramma
      });
    }, this.maintenanceInterval);
  }

  /**
   * Ottieni statistiche ultima manutenzione
   */
  async getLastMaintenanceStats() {
    try {
      const result = await chrome.storage.local.get(['lastMaintenanceResults', this.lastMaintenanceKey]);
      
      return {
        lastRun: result[this.lastMaintenanceKey],
        results: result.lastMaintenanceResults,
        nextRun: result[this.lastMaintenanceKey] 
          ? result[this.lastMaintenanceKey] + this.maintenanceInterval
          : null
      };
    } catch (error) {
      console.error('Errore lettura statistiche manutenzione:', error);
      return null;
    }
  }

  /**
   * Forza esecuzione manutenzione
   */
  async forceRun() {
    return await this.runMaintenance();
  }
}

// Inizializza al caricamento (se in background script)
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
  const autoMaintenance = new AutoMaintenance();
  
  // Inizializza dopo 1 minuto dal caricamento
  setTimeout(() => {
    autoMaintenance.initialize().catch(error => {
      console.error('Errore inizializzazione auto-maintenance:', error);
    });
  }, 60000); // 1 minuto
}
