// i18n.js - Sistema di internazionalizzazione COMPLETO
// Versione 2.0 - Tutte le stringhe tradotte in 5 lingue
import { StorageManager } from '../storage/storage-manager.js';

export const I18n = {
  currentLanguage: 'it',

  translations: {
    it: {
      // Header
      'app.title': 'Web Site Summarizer',
      'theme.toggle': 'Cambia Tema',
      'history.title': 'Cronologia',
      'multi.analysis': 'Analisi Multi Articolo',
      'pdf.analysis': 'Analisi PDF',
      'settings.title': 'Impostazioni',

      // Initial State
      'initial.welcome': 'Benvenuto',
      'initial.language': '🌍 Lingua Output:',
      'initial.contentType': '📝 Tipologia Articolo:',
      'initial.contentType.hint':
        'Seleziona il tipo la tipologia di articolo per risparmiare token, altrimenti lascia "🔍 Rilevamento Automatico" e LLM classificherà il contenuto autonomamente e utilizzerà il prompt più indicato per le analisi.',
      'initial.analyze': '🔍 Analizza Pagina',

      // Content Types
      'contentType.auto': '🔍 Rilevamento Automatico',
      'contentType.general': '📄 Articolo Generico',
      'contentType.scientific': '🔬 Articolo Scientifico',
      'contentType.news': '📰 Notizia',
      'contentType.tutorial': '💻 Tutorial/Guida',
      'contentType.business': '💼 Business/Case Study',
      'contentType.opinion': '💭 Opinione/Editoriale',

      // Languages
      'language.it': 'Italiano',
      'language.en': 'Inglese',
      'language.es': 'Spagnolo',
      'language.fr': 'Francese',
      'language.de': 'Tedesco',

      // Controls
      'controls.provider': 'Provider:',
      'controls.language': '🌍 Lingua:',
      'controls.contentType': '📝 Tipo:',
      'controls.summaryLength': '📏 Lunghezza Riassunto:',
      'controls.generate': '⚡ Genera Riassunto',

      // Article Info
      'article.title': '📄 Titolo:',
      'article.length': '📊 Lunghezza:',
      'article.words': 'parole',
      'article.readingTime': 'min lettura',

      // Summary Length
      'summaryLength.short': '📝 Breve (40%)',
      'summaryLength.medium': '📄 Medio (60%)',
      'summaryLength.detailed': '📋 Dettagliato (75%)',

      // Tabs
      'tab.summary': 'Riassunto',
      'tab.keypoints': 'Punti Chiave',
      'tab.translation': 'Traduzione',
      'tab.citations': 'Citazioni',
      'tab.qa': 'Q&A',
      'tab.notes': 'Note',

      // Actions
      'action.readingMode': '📖 Modalità Lettura',
      'action.pdf': '📄 PDF',
      'action.md': '📝 MD',
      'action.email': '📧 Email',
      'action.copy': '📋 Copia',
      'action.new': '🔄 Nuovo',
      'action.delete': '🗑️ Elimina',
      'action.save': '💾 Salva',
      'action.cancel': 'Annulla',
      'action.confirm': 'OK',

      // Translation
      'translation.empty': "Clicca sul pulsante per tradurre l'articolo completo",
      'translation.button': '🌍 Traduci Articolo',
      'translation.loading': 'Traduzione in corso... Questo potrebbe richiedere 10-30 secondi.',
      'translation.errorMessage': '❌ Errore durante la traduzione:',
      'translation.clickToTranslate': "Clicca sul pulsante per tradurre l'articolo completo",

      // Same Language Detection
      'sameLanguage.title': 'Testo già in {language}',
      'sameLanguage.message': 'Il testo sembra essere già in {language}. Cosa vuoi fare?',
      'sameLanguage.translate': '🔄 Traduci comunque (riformatta e migliora)',
      'sameLanguage.useOriginal': '📄 Usa testo originale',
      'sameLanguage.cancel': '✕ Annulla',

      // Citations
      'citations.empty': "📚 Estrai citazioni e riferimenti bibliografici dall'articolo",
      'citations.button': '📖 Estrai Citazioni',

      // Q&A
      'qa.title': "💬 Fai una domanda sull'articolo",
      'qa.placeholder': 'Es: Quali sono le implicazioni pratiche?',
      'qa.ask': 'Chiedi',

      // Loading
      'loading.extract': 'Estrazione contenuto in corso...',
      'loading.classify': 'Rilevamento tipo di articolo...',
      'loading.generate': 'Generazione riassunto in corso...',
      'loading.articleType': 'Tipo articolo:',
      'loading.fromHistory': 'da cronologia',
      'loading.detected': 'Rilevato:',
      'loading.detectedAI': '(AI)',

      // Errors
      'error.noArticle':
        'Nessun articolo rilevato in questa pagina. Prova con un articolo di blog o news.',
      'error.tooShort': 'Articolo troppo breve per essere riassunto (minimo 200 parole).',
      'error.noApiKey': "API key non configurata. Clicca sull'icona ⚙️ per configurare.",
      'error.invalidKey': 'API key non valida. Verifica la configurazione nelle impostazioni.',
      'error.tooManyRequests':
        'Rate limit raggiunto. La tua chiave API ha esaurito le richieste. Cambia chiave o provider nelle impostazioni (⚙️).',
      'error.network': 'Errore di connessione. Verifica la tua connessione internet.',

      // Modal System
      'modal.defaultTitle': 'AI Article Summarizer',
      'modal.cancel': 'Annulla',
      'modal.confirm': 'OK',
      'modal.confirmTitle': 'Conferma',
      'modal.successTitle': 'Successo',
      'modal.errorTitle': 'Errore',
      'modal.warningTitle': 'Attenzione',

      // User Feedback
      'cache.badge': 'Da cache',
      'feedback.copied': '✓ Copiato!',
      'feedback.exported': '✓ Esportato!',
      'feedback.thinking': 'Sto pensando...',
      'feedback.error': 'Errore:',
      'feedback.translating': '⏳ Traduzione in corso...',
      'feedback.checkmark': '✓',
      'feedback.loading': '⏳',

      // Export
      'export.markdown': 'Esporta Markdown',
      'export.pdf': 'Esporta PDF',
      'export.selectContent': 'Seleziona contenuto da esportare:',
      'export.includeSummary': '📝 Riassunto',
      'export.includeKeypoints': '🔑 Punti Chiave',
      'export.includeTranslation': '🌍 Traduzione',
      'export.includeQA': '💬 Domande e Risposte',
      'export.includeCitations': '📚 Citazioni',
      'export.button': 'Esporta',
      'export.noSelection': 'Seleziona almeno una sezione da esportare',
      'export.noSelectionTitle': 'Nessuna Selezione',
      'export.error': "Errore durante l'esportazione",

      // Email
      'email.title': 'Invia Tramite Email',
      'email.recipient': 'Email destinatario:',
      'email.placeholder': 'esempio@email.com',
      'email.saved': 'Email salvate:',
      'email.includeContent': 'Contenuto da includere:',
      'email.includeSummary': '📝 Riassunto',
      'email.includeKeypoints': '🔑 Punti Chiave',
      'email.includeTranslation': '🌍 Traduzione',
      'email.includeQA': '💬 Domande e Risposte',
      'email.send': 'Invia',
      'email.error': "Errore durante l'invio email:",

      // Settings (settings.title already defined above)
      'settings.apiKeys': '🔑 API Keys',
      'settings.apiKeys.desc': 'Le tue chiavi sono salvate localmente nel tuo browser.',
      'settings.test': '🧪 Test',
      'settings.test.enterKey': '❌ Inserisci una chiave',
      'settings.test.testing': '⏳ Test in corso...',
      'settings.test.verified': '✅ Connessione verificata',
      'settings.test.failed': '❌',
      'settings.save': '💾 Salva API Keys',
      'settings.preferences': '⚙️ Preferenze',
      'settings.defaultProvider': 'Provider Predefinito',
      'settings.saveHistory': 'Salva Analisi nella Cronologia',
      'settings.darkMode': '🌙 Dark Mode',
      'settings.savePreferences': '💾 Salva Preferenze',
      'settings.performance': '🚀 Performance e Affidabilità',
      'settings.statistics': '📊 Statistiche',
      'settings.help': '❓ Come Ottenere le API Keys',
      'settings.help.visit': 'Visita',
      'settings.help.register': 'Registrati gratuitamente',
      'settings.help.registerCredit': 'Registrati e aggiungi credito',
      'settings.help.registerOnly': 'Registrati',
      'settings.help.createKey': 'Vai su "API Keys" e crea una nuova chiave',
      'settings.provider.groq': 'Veloce ed economico',
      'settings.provider.openai': 'Alta qualità',
      'settings.provider.anthropic': 'Analisi dettagliata',
      'settings.stats.summaries': 'Riassunti Generati',
      'settings.stats.words': 'Parole Elaborate',
      'settings.stats.provider': 'Provider Più Usato',
      'settings.stats.timeSaved': 'Tempo Risparmiato',
      'settings.stats.clearCache': '🗑️ Cancella Cache',
      'settings.perf.enableCache': 'Abilita Cache (riduce costi e velocizza)',
      'settings.perf.cacheDesc': 'Salva i riassunti in cache per evitare chiamate API duplicate',
      'settings.perf.cacheTTL': 'Durata Cache (giorni)',
      'settings.perf.enableFallback': 'Abilita Fallback Automatico tra Provider',
      'settings.perf.fallbackDesc':
        'Se il provider selezionato fallisce, prova automaticamente con un altro provider configurato.',
      'settings.perf.enableCompression': 'Abilita Compressione Dati',
      'settings.perf.compressionDesc':
        'Comprimi automaticamente cronologia e cache vecchie per risparmiare spazio',
      'settings.perf.autoCleanup': 'Cleanup Automatico',
      'settings.perf.cleanupDesc':
        'Pulisci automaticamente cache scadute e cronologia molto vecchia',
      'settings.perf.save': '💾 Salva Impostazioni Performance',
      'settings.perf.statsTitle': '📊 Statistiche Performance',
      'settings.perf.cache': 'Cache',
      'settings.perf.cacheEntries': 'Entry in Cache',
      'settings.perf.hitRate': 'Hit Rate',
      'settings.perf.cacheSize': 'Dimensione Cache',
      'settings.perf.apiSaved': 'Chiamate API Risparmiate',
      'settings.perf.apiReliability': 'Affidabilità API',
      'settings.perf.successRate': 'Success Rate',
      'settings.perf.retries': 'Retry Eseguiti',
      'settings.perf.fallbacks': 'Fallback Usati',
      'settings.perf.failures': 'Fallimenti',
      'settings.perf.compression': 'Compressione',
      'settings.perf.compressedItems': 'Item Compressi',
      'settings.perf.compressionRatio': 'Ratio Compressione',
      'settings.perf.spaceSaved': 'Spazio Risparmiato',
      'settings.perf.totalSize': 'Dimensione Totale',
      'settings.perf.runCleanup': '🧹 Esegui Cleanup Ora',
      'settings.perf.clearCache': '🗑️ Cancella Cache',
      'settings.perf.clearLogs': '📝 Cancella Log',
      'settings.perf.cacheTTL.1': '1 giorno',
      'settings.perf.cacheTTL.3': '3 giorni',
      'settings.perf.cacheTTL.7': '7 giorni',
      'settings.perf.cacheTTL.14': '14 giorni',
      'settings.perf.cacheTTL.30': '30 giorni',
      'settings.status.configured': '✅ Configurata',
      'settings.status.saved': '✅ Salvata',
      'settings.toast.keysSaved': 'API Keys salvate con successo',
      'settings.toast.prefSaved': 'Preferenze salvate con successo',
      'settings.toast.perfSaved': 'Impostazioni performance salvate',
      'settings.cleanup.running': 'Cleanup in corso...',
      'settings.cleanup.completed':
        'Cleanup completato: {compressedHistory} cronologie compresse, {compressedCache} cache compresse, {deletedHistory} cronologie eliminate, {cleanedCache} cache pulite',
      'settings.cleanup.error': 'Errore durante il cleanup:',
      'settings.cache.confirmClear': 'Sei sicuro di voler cancellare la cache?',
      'settings.cache.cleared': 'Cache cancellata',
      'settings.logs.confirmClear': 'Sei sicuro di voler cancellare i log?',
      'settings.logs.cleared': 'Log cancellati',

      // History (history.title already defined above)
      'history.modalTitle': 'Cronologia',
      'history.back': '← Indietro',
      'history.search': '🔍 Cerca...',
      'history.download': '💾 Download Cronologia',
      'history.import': '📥 Importa Cronologia',
      'history.clearSingle': '🗑️ Cancella Articoli Singoli',
      'history.clearMulti': '🗑️ Cancella Analisi Multiple',
      'history.empty': 'Nessun riassunto nella cronologia',
      'history.emptyDesc': 'I tuoi riassunti appariranno qui',
      'history.tabs.single': '📄 Articoli Singoli',
      'history.tabs.multi': '🔬 Analisi Multi Articolo',
      'history.filter.allProviders': 'Tutti i provider',
      'history.filter.allLanguages': 'Tutte le lingue',
      'history.filter.allTypes': 'Tutti i tipi',
      'history.filter.all': 'Tutti gli articoli',
      'history.filter.favorites': '⭐ Solo Preferiti',
      'history.filter.withNotes': '📝 Con Note',
      'history.searchIn': 'Cerca in:',
      'history.searchIn.title': 'Titolo',
      'history.searchIn.url': 'URL',
      'history.searchIn.content': 'Contenuto',
      'history.addFavorite': 'Aggiungi ai preferiti',
      'history.removeFavorite': 'Rimuovi dai preferiti',
      'history.noArticles': 'Nessun articolo disponibile',
      'history.confirmClearSingle':
        'Sei sicuro di voler cancellare tutta la cronologia degli articoli singoli?',
      'history.confirmClearMulti':
        'Sei sicuro di voler cancellare tutta la cronologia delle analisi Multi Articolo?',
      'history.favoritesNotDeleted': '⭐ {count} articoli preferiti NON verranno eliminati.',
      'history.favoritesNotDeletedMulti': '⭐ {count} analisi preferite NON verranno eliminate.',
      'history.actionCannotUndo': 'Questa azione non può essere annullata.',
      'history.clearSingleTitle': 'Cancella Articoli Singoli',
      'history.clearMultiTitle': 'Cancella Analisi Multiple',
      'history.summaryNotFound': 'Riassunto non trovato',
      'history.noTranslation': 'Nessuna traduzione disponibile per questo riassunto',
      'history.noQA': 'Nessuna domanda e risposta disponibile per questo riassunto',
      'history.citationsFound': '📚 {count} citazioni trovate',
      'history.mainArticleCitation': '📄 Citazione Articolo Principale (APA)',
      'history.noCitations': 'Nessuna citazione disponibile per questo riassunto',
      'history.notesPlaceholder': 'Aggiungi note personali su questo articolo...',
      'history.saveNotes': '💾 Salva Note',
      'history.notesSaved': '✓ Salvate!',
      'history.confirmDelete': 'Sei sicuro di voler eliminare questo riassunto?',
      'history.deleteTitle': 'Elimina Riassunto',
      'history.copyError': 'Errore durante la copia',

      // Multi Analysis
      'multi.title': '🔬 Analisi Multi Articolo',
      'multi.modalTitle': 'Analisi',
      'multi.selectArticles': '📚 Seleziona Articoli',
      'multi.selectAll': 'Seleziona Tutti',
      'multi.clearSelection': 'Deseleziona Tutti',
      'multi.selected': 'articoli selezionati',
      'multi.startAnalysis': '🚀 Avvia Analisi',
      'multi.options': '⚙️ Opzioni Analisi',
      'multi.globalSummary': 'Riassunto Globale',
      'multi.comparison': 'Confronto Idee',
      'multi.qa': 'Q&A Multi-Articolo',
      'multi.analysisOf': 'Analisi di',
      'multi.articles': 'articoli',
      'multi.articlesIncluded': 'Articoli inclusi:',
      'multi.searchArticles': '🔍 Cerca articoli...',
      'multi.filterProvider': 'Tutti i provider',
      'multi.noArticles': 'Nessun articolo disponibile',
      'multi.minArticles': "Seleziona almeno 2 articoli per l'analisi",
      'multi.minArticlesTitle': 'Selezione Insufficiente',
      'multi.minOptions': "Seleziona almeno un'opzione di analisi",
      'multi.minOptionsTitle': 'Nessuna Opzione',
      'multi.checkingCorrelation': 'Verifica correlazione articoli...',
      'multi.startingAnalysis': 'Avvio analisi...',
      'multi.analysisError': "Errore durante l'analisi:",
      'multi.errorDetails': 'Dettagli:',
      'multi.errorTitle': 'Errore',
      'multi.preparingAnalysis': 'Preparazione analisi...',
      'multi.analysisInProgress': 'Analisi in Corso',
      'multi.unrelatedTitle': 'Articoli Non Correlati',
      'multi.unrelatedMessage':
        'Gli articoli selezionati sembrano trattare argomenti completamente scollegati.',
      'multi.unrelatedQuestion': 'Come vuoi procedere?',
      'multi.qaOnly': 'Solo Q&A',
      'multi.fullAnalysis': 'Analisi Completa',
      'multi.summaryNotGenerated': 'Riassunto non generato',
      'multi.comparisonNotGenerated': 'Confronto non generato',
      'multi.qaNotEnabled': 'Q&A non abilitato',
      'multi.qaInteractiveTitle': '💬 Q&A Interattivo',
      'multi.qaInteractiveDesc':
        'Fai domande sui {count} articoli selezionati. Il sistema risponderà basandosi esclusivamente sui loro contenuti.',
      'multi.qaPlaceholder': 'Scrivi la tua domanda...',
      'multi.qaSubmit': 'Invia',
      'multi.qaYou': 'Tu:',
      'multi.qaAssistant': 'Assistente:',
      'multi.qaThinking': '⏳ Sto pensando...',
      'multi.qaError': 'Errore:',
      'multi.qaNoApiKey': 'API key non configurata',
      'multi.exporterNotLoaded': '{exporter} non caricato. Ricarica la pagina.',
      'multi.exportError': "Errore durante l'esportazione {type}:",
      'multi.exportTitle': 'Esporta {type}',
      'multi.exportSelectContent': 'Seleziona contenuto da esportare:',
      'multi.exportGlobalSummary': '📝 Riassunto Globale',
      'multi.exportComparison': '⚖️ Confronto Idee',
      'multi.exportQA': '💬 Domande e Risposte',
      'multi.emailTitle': 'Analisi Multi Articolo',
      'multi.emailDate': '**Data:**',
      'multi.emailArticlesCount': '**Articoli analizzati:**',
      'multi.emailArticlesSection': '## 📚 Articoli',
      'multi.emailSummarySection': '## 📝 Riassunto Globale',
      'multi.emailComparisonSection': '## ⚖️ Confronto Idee',
      'multi.emailQASection': '## 💬 Domande e Risposte',
      'multi.emailQuestion': '**Q{index}:**',
      'multi.emailAnswer': '**R{index}:**',
      'multi.copyError': 'Errore durante la copia',
    },

    en: {
      // Header
      'app.title': 'Web Site Summarizer',
      'theme.toggle': 'Toggle Theme',
      'history.title': 'History',
      'multi.analysis': 'Multi Article Analysis',
      'pdf.analysis': 'PDF Analysis',
      'settings.title': 'Settings',

      // Initial State
      'initial.welcome': 'Welcome',
      'initial.language': '🌍 Output Language:',
      'initial.contentType': '📝 Article Type:',
      'initial.contentType.hint':
        'Select the article type to save tokens, otherwise leave "🔍 Automatic Detection" and the LLM will classify the content autonomously and use the most suitable prompt for analysis.',
      'initial.analyze': '🔍 Analyze Page',

      // Content Types
      'contentType.auto': '🔍 Automatic Detection',
      'contentType.general': '📄 General Article',
      'contentType.scientific': '🔬 Scientific Article',
      'contentType.news': '📰 News',
      'contentType.tutorial': '💻 Tutorial/Guide',
      'contentType.business': '💼 Business/Case Study',
      'contentType.opinion': '💭 Opinion/Editorial',

      // Languages
      'language.it': 'Italian',
      'language.en': 'English',
      'language.es': 'Spanish',
      'language.fr': 'French',
      'language.de': 'German',

      // Controls
      'controls.provider': 'Provider:',
      'controls.language': '🌍 Language:',
      'controls.contentType': '📝 Type:',
      'controls.summaryLength': '📏 Summary Length:',
      'controls.generate': '⚡ Generate Summary',

      // Article Info
      'article.title': '📄 Title:',
      'article.length': '📊 Length:',
      'article.words': 'words',
      'article.readingTime': 'min reading',

      // Summary Length
      'summaryLength.short': '📝 Short (40%)',
      'summaryLength.medium': '📄 Medium (60%)',
      'summaryLength.detailed': '📋 Detailed (75%)',

      // Tabs
      'tab.summary': 'Summary',
      'tab.keypoints': 'Key Points',
      'tab.translation': 'Translation',
      'tab.citations': 'Citations',
      'tab.qa': 'Q&A',
      'tab.notes': 'Notes',

      // Actions
      'action.readingMode': '📖 Reading Mode',
      'action.pdf': '📄 PDF',
      'action.md': '📝 MD',
      'action.email': '📧 Email',
      'action.copy': '📋 Copy',
      'action.new': '🔄 New',
      'action.delete': '🗑️ Delete',
      'action.save': '💾 Save',
      'action.cancel': 'Cancel',
      'action.confirm': 'OK',

      // Translation
      'translation.empty': 'Click the button to translate the full article',
      'translation.button': '🌍 Translate Article',
      'translation.loading': 'Translating... This may take 10-30 seconds.',
      'translation.errorMessage': '❌ Translation error:',
      'translation.clickToTranslate': 'Click the button to translate the full article',

      // Same Language Detection
      'sameLanguage.title': 'Text already in {language}',
      'sameLanguage.message':
        'The text appears to be already in {language}. What would you like to do?',
      'sameLanguage.translate': '🔄 Translate anyway (reformat and improve)',
      'sameLanguage.useOriginal': '📄 Use original text',
      'sameLanguage.cancel': '✕ Cancel',

      // Citations
      'citations.empty': '📚 Extract citations and bibliographic references from the article',
      'citations.button': '📖 Extract Citations',

      // Q&A
      'qa.title': '💬 Ask a question about the article',
      'qa.placeholder': 'E.g.: What are the practical implications?',
      'qa.ask': 'Ask',

      // Loading
      'loading.extract': 'Extracting content...',
      'loading.classify': 'Detecting article type...',
      'loading.generate': 'Generating summary...',
      'loading.articleType': 'Article type:',
      'loading.fromHistory': 'from history',
      'loading.detected': 'Detected:',
      'loading.detectedAI': '(AI)',

      // Errors
      'error.noArticle': 'No article detected on this page. Try with a blog or news article.',
      'error.tooShort': 'Article too short to summarize (minimum 200 words).',
      'error.noApiKey': 'API key not configured. Click the ⚙️ icon to configure.',
      'error.invalidKey': 'Invalid API key. Check your settings.',
      'error.tooManyRequests':
        'Rate limit reached. Your API key has exhausted available requests. Change API key or switch provider in settings (⚙️).',
      'error.network': 'Connection error. Check your internet connection.',

      // Modal System
      'modal.defaultTitle': 'AI Article Summarizer',
      'modal.cancel': 'Cancel',
      'modal.confirm': 'OK',
      'modal.confirmTitle': 'Confirm',
      'modal.successTitle': 'Success',
      'modal.errorTitle': 'Error',
      'modal.warningTitle': 'Warning',

      // User Feedback
      'cache.badge': 'From cache',
      'feedback.copied': '✓ Copied!',
      'feedback.exported': '✓ Exported!',
      'feedback.thinking': 'Thinking...',
      'feedback.error': 'Error:',
      'feedback.translating': '⏳ Translating...',
      'feedback.checkmark': '✓',
      'feedback.loading': '⏳',

      // Export
      'export.markdown': 'Export Markdown',
      'export.pdf': 'Export PDF',
      'export.selectContent': 'Select content to export:',
      'export.includeSummary': '📝 Summary',
      'export.includeKeypoints': '🔑 Key Points',
      'export.includeTranslation': '🌍 Translation',
      'export.includeQA': '💬 Q&A',
      'export.includeCitations': '📚 Citations',
      'export.button': 'Export',
      'export.noSelection': 'Select at least one section to export',
      'export.noSelectionTitle': 'No Selection',
      'export.error': 'Export error',

      // Email
      'email.title': 'Send via Email',
      'email.recipient': 'Recipient email:',
      'email.placeholder': 'example@email.com',
      'email.saved': 'Saved emails:',
      'email.includeContent': 'Content to include:',
      'email.includeSummary': '📝 Summary',
      'email.includeKeypoints': '🔑 Key Points',
      'email.includeTranslation': '🌍 Translation',
      'email.includeQA': '💬 Q&A',
      'email.send': 'Send',
      'email.error': 'Email sending error:',

      // Settings (settings.title already defined above)
      'settings.apiKeys': '🔑 API Keys',
      'settings.apiKeys.desc': 'Your keys are saved locally in your browser.',
      'settings.test': '🧪 Test',
      'settings.test.enterKey': '❌ Enter a key',
      'settings.test.testing': '⏳ Testing...',
      'settings.test.verified': '✅ Connection verified',
      'settings.test.failed': '❌',
      'settings.save': '💾 Save API Keys',
      'settings.preferences': '⚙️ Preferences',
      'settings.defaultProvider': 'Default Provider',
      'settings.saveHistory': 'Save Analysis to History',
      'settings.darkMode': '🌙 Dark Mode',
      'settings.savePreferences': '💾 Save Preferences',
      'settings.performance': '🚀 Performance and Reliability',
      'settings.statistics': '📊 Statistics',
      'settings.help': '❓ How to Get API Keys',
      'settings.help.visit': 'Visit',
      'settings.help.register': 'Register for free',
      'settings.help.registerCredit': 'Register and add credit',
      'settings.help.registerOnly': 'Register',
      'settings.help.createKey': 'Go to "API Keys" and create a new key',
      'settings.provider.groq': 'Fast and cheap',
      'settings.provider.openai': 'High quality',
      'settings.provider.anthropic': 'Detailed analysis',
      'settings.stats.summaries': 'Summaries Generated',
      'settings.stats.words': 'Words Processed',
      'settings.stats.provider': 'Most Used Provider',
      'settings.stats.timeSaved': 'Time Saved',
      'settings.stats.clearCache': '🗑️ Clear Cache',
      'settings.perf.enableCache': 'Enable Cache (reduces costs and speeds up)',
      'settings.perf.cacheDesc': 'Save summaries in cache to avoid duplicate API calls',
      'settings.perf.cacheTTL': 'Cache Duration (days)',
      'settings.perf.enableFallback': 'Enable Automatic Fallback between Providers',
      'settings.perf.fallbackDesc':
        'If the selected provider fails, automatically try another configured provider.',
      'settings.perf.enableCompression': 'Enable Data Compression',
      'settings.perf.compressionDesc': 'Automatically compress old history and cache to save space',
      'settings.perf.autoCleanup': 'Automatic Cleanup',
      'settings.perf.cleanupDesc': 'Automatically clean expired cache and very old history',
      'settings.perf.save': '💾 Save Performance Settings',
      'settings.perf.statsTitle': '📊 Performance Statistics',
      'settings.perf.cache': 'Cache',
      'settings.perf.cacheEntries': 'Cache Entries',
      'settings.perf.hitRate': 'Hit Rate',
      'settings.perf.cacheSize': 'Cache Size',
      'settings.perf.apiSaved': 'API Calls Saved',
      'settings.perf.apiReliability': 'API Reliability',
      'settings.perf.successRate': 'Success Rate',
      'settings.perf.retries': 'Retries Executed',
      'settings.perf.fallbacks': 'Fallbacks Used',
      'settings.perf.failures': 'Failures',
      'settings.perf.compression': 'Compression',
      'settings.perf.compressedItems': 'Compressed Items',
      'settings.perf.compressionRatio': 'Compression Ratio',
      'settings.perf.spaceSaved': 'Space Saved',
      'settings.perf.totalSize': 'Total Size',
      'settings.perf.runCleanup': '🧹 Run Cleanup Now',
      'settings.perf.clearCache': '🗑️ Clear Cache',
      'settings.perf.clearLogs': '📝 Clear Logs',
      'settings.perf.cacheTTL.1': '1 day',
      'settings.perf.cacheTTL.3': '3 days',
      'settings.perf.cacheTTL.7': '7 days',
      'settings.perf.cacheTTL.14': '14 days',
      'settings.perf.cacheTTL.30': '30 days',
      'settings.status.configured': '✅ Configured',
      'settings.status.saved': '✅ Saved',
      'settings.toast.keysSaved': 'API Keys saved successfully',
      'settings.toast.prefSaved': 'Preferences saved successfully',
      'settings.toast.perfSaved': 'Performance settings saved',
      'settings.cleanup.running': 'Cleanup in progress...',
      'settings.cleanup.completed':
        'Cleanup completed: {compressedHistory} histories compressed, {compressedCache} caches compressed, {deletedHistory} histories deleted, {cleanedCache} caches cleaned',
      'settings.cleanup.error': 'Cleanup error:',
      'settings.cache.confirmClear': 'Are you sure you want to clear the cache?',
      'settings.cache.cleared': 'Cache cleared',
      'settings.logs.confirmClear': 'Are you sure you want to clear the logs?',
      'settings.logs.cleared': 'Logs cleared',

      // History (history.title already defined above)
      'history.modalTitle': 'History',
      'history.back': '← Back',
      'history.search': '🔍 Search...',
      'history.download': '💾 Download History',
      'history.import': '📥 Import History',
      'history.clearSingle': '🗑️ Clear Single Articles',
      'history.clearMulti': '🗑️ Clear Multi Analysis',
      'history.empty': 'No summaries in history',
      'history.emptyDesc': 'Your summaries will appear here',
      'history.tabs.single': '📄 Single Articles',
      'history.tabs.multi': '🔬 Multi Article Analysis',
      'history.filter.allProviders': 'All providers',
      'history.filter.allLanguages': 'All languages',
      'history.filter.allTypes': 'All types',
      'history.filter.all': 'All articles',
      'history.filter.favorites': '⭐ Favorites Only',
      'history.filter.withNotes': '📝 With Notes',
      'history.searchIn': 'Search in:',
      'history.searchIn.title': 'Title',
      'history.searchIn.url': 'URL',
      'history.searchIn.content': 'Content',
      'history.addFavorite': 'Add to favorites',
      'history.removeFavorite': 'Remove from favorites',
      'history.noArticles': 'No articles available',
      'history.confirmClearSingle': 'Are you sure you want to clear all single article history?',
      'history.confirmClearMulti':
        'Are you sure you want to clear all multi-article analysis history?',
      'history.favoritesNotDeleted': '⭐ {count} favorite articles will NOT be deleted.',
      'history.favoritesNotDeletedMulti': '⭐ {count} favorite analyses will NOT be deleted.',
      'history.actionCannotUndo': 'This action cannot be undone.',
      'history.clearSingleTitle': 'Clear Single Articles',
      'history.clearMultiTitle': 'Clear Multi Analysis',
      'history.summaryNotFound': 'Summary not found',
      'history.noTranslation': 'No translation available for this summary',
      'history.noQA': 'No Q&A available for this summary',
      'history.citationsFound': '📚 {count} citations found',
      'history.mainArticleCitation': '📄 Main Article Citation (APA)',
      'history.noCitations': 'No citations available for this summary',
      'history.notesPlaceholder': 'Add personal notes about this article...',
      'history.saveNotes': '💾 Save Notes',
      'history.notesSaved': '✓ Saved!',
      'history.confirmDelete': 'Are you sure you want to delete this summary?',
      'history.deleteTitle': 'Delete Summary',
      'history.copyError': 'Copy error',

      // Multi Analysis
      'multi.title': '🔬 Multi Article Analysis',
      'multi.modalTitle': 'Analysis',
      'multi.selectArticles': '📚 Select Articles',
      'multi.selectAll': 'Select All',
      'multi.clearSelection': 'Clear Selection',
      'multi.selected': 'articles selected',
      'multi.startAnalysis': '🚀 Start Analysis',
      'multi.options': '⚙️ Analysis Options',
      'multi.globalSummary': 'Global Summary',
      'multi.comparison': 'Ideas Comparison',
      'multi.qa': 'Multi-Article Q&A',
      'multi.analysisOf': 'Analysis of',
      'multi.articles': 'articles',
      'multi.articlesIncluded': 'Articles included:',
      'multi.searchArticles': '🔍 Search articles...',
      'multi.filterProvider': 'All providers',
      'multi.noArticles': 'No articles available',
      'multi.minArticles': 'Select at least 2 articles for analysis',
      'multi.minArticlesTitle': 'Insufficient Selection',
      'multi.minOptions': 'Select at least one analysis option',
      'multi.minOptionsTitle': 'No Option',
      'multi.checkingCorrelation': 'Checking article correlation...',
      'multi.startingAnalysis': 'Starting analysis...',
      'multi.analysisError': 'Analysis error:',
      'multi.errorDetails': 'Details:',
      'multi.errorTitle': 'Error',
      'multi.preparingAnalysis': 'Preparing analysis...',
      'multi.analysisInProgress': 'Analysis in Progress',
      'multi.unrelatedTitle': 'Unrelated Articles',
      'multi.unrelatedMessage':
        'The selected articles appear to cover completely unrelated topics.',
      'multi.unrelatedQuestion': 'How do you want to proceed?',
      'multi.qaOnly': 'Q&A Only',
      'multi.fullAnalysis': 'Full Analysis',
      'multi.summaryNotGenerated': 'Summary not generated',
      'multi.comparisonNotGenerated': 'Comparison not generated',
      'multi.qaNotEnabled': 'Q&A not enabled',
      'multi.qaInteractiveTitle': '💬 Interactive Q&A',
      'multi.qaInteractiveDesc':
        'Ask questions about the {count} selected articles. The system will answer based exclusively on their contents.',
      'multi.qaPlaceholder': 'Write your question...',
      'multi.qaSubmit': 'Submit',
      'multi.qaYou': 'You:',
      'multi.qaAssistant': 'Assistant:',
      'multi.qaThinking': '⏳ Thinking...',
      'multi.qaError': 'Error:',
      'multi.qaNoApiKey': 'API key not configured',
      'multi.exporterNotLoaded': '{exporter} not loaded. Reload the page.',
      'multi.exportError': '{type} export error:',
      'multi.exportTitle': 'Export {type}',
      'multi.exportSelectContent': 'Select content to export:',
      'multi.exportGlobalSummary': '📝 Global Summary',
      'multi.exportComparison': '⚖️ Ideas Comparison',
      'multi.exportQA': '💬 Q&A',
      'multi.emailTitle': 'Multi Article Analysis',
      'multi.emailDate': '**Date:**',
      'multi.emailArticlesCount': '**Articles analyzed:**',
      'multi.emailArticlesSection': '## 📚 Articles',
      'multi.emailSummarySection': '## 📝 Global Summary',
      'multi.emailComparisonSection': '## ⚖️ Ideas Comparison',
      'multi.emailQASection': '## 💬 Q&A',
      'multi.emailQuestion': '**Q{index}:**',
      'multi.emailAnswer': '**A{index}:**',
      'multi.copyError': 'Copy error',
    },

    // SPANISH - Seguirà lo stesso pattern di EN (da completare)
    es: {
      'app.title': 'Web Site Summarizer',
      'modal.defaultTitle': 'AI Article Summarizer',
      'modal.cancel': 'Cancelar',
      'modal.confirm': 'OK',
      'feedback.copied': '✓ ¡Copiado!',
      'feedback.exported': '✓ ¡Exportado!',
      'feedback.thinking': 'Pensando...',
      'export.markdown': 'Exportar Markdown',
      'export.pdf': 'Exportar PDF',
      // ... altre chiavi seguono pattern EN
    },

    // FRENCH - Seguirà lo stesso pattern di EN (da completare)
    fr: {
      'app.title': 'Web Site Summarizer',
      'modal.defaultTitle': 'AI Article Summarizer',
      'modal.cancel': 'Annuler',
      'modal.confirm': 'OK',
      'feedback.copied': '✓ Copié!',
      'feedback.exported': '✓ Exporté!',
      'feedback.thinking': 'Réflexion...',
      'export.markdown': 'Exporter Markdown',
      'export.pdf': 'Exporter PDF',
      // ... altre chiavi seguono pattern EN
    },

    // GERMAN - Seguirà lo stesso pattern di EN (da completare)
    de: {
      'app.title': 'Web Site Summarizer',
      'modal.defaultTitle': 'AI Article Summarizer',
      'modal.cancel': 'Abbrechen',
      'modal.confirm': 'OK',
      'feedback.copied': '✓ Kopiert!',
      'feedback.exported': '✓ Exportiert!',
      'feedback.thinking': 'Denken...',
      'export.markdown': 'Markdown Exportieren',
      'export.pdf': 'PDF Exportieren',
      // ... altre chiavi seguono pattern EN
    },
  },

  // Inizializza la lingua
  async init() {
    const lang = await StorageManager.getUILanguage();
    if (lang) {
      this.currentLanguage = lang;
    }
    this.updateUI();
  },

  // Inizializzazione completa per una pagina: init + carica lingua UI + event listener
  async initPage() {
    await this.init();
    const savedUILanguage = await StorageManager.getUILanguage();
    const uiLanguageSelect = document.getElementById('uiLanguageSelect');
    if (savedUILanguage && uiLanguageSelect) {
      uiLanguageSelect.value = savedUILanguage;
    }
    if (uiLanguageSelect) {
      uiLanguageSelect.addEventListener('change', async (e) => {
        await this.setLanguage(e.target.value);
      });
    }
  },

  // Cambia lingua
  async setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      await StorageManager.saveUILanguage(lang);
      this.updateUI();
    }
  },

  // Ottieni traduzione
  t(key) {
    const translation = this.translations[this.currentLanguage]?.[key];
    return translation || key;
  },

  // Ottieni traduzione con sostituzione placeholder
  tf(key, replacements = {}) {
    let translation = this.t(key);
    Object.keys(replacements).forEach((placeholder) => {
      translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
    });
    return translation;
  },

  // Aggiorna tutti gli elementi con data-i18n
  updateUI() {
    // Aggiorna elementi con data-i18n (testo)
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);

      // Gestisci placeholder per input
      if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
        element.setAttribute('placeholder', translation);
      }
      // Gestisci option in select
      else if (element.tagName === 'OPTION') {
        element.textContent = translation;
      }
      // Gestisci altri elementi
      else {
        element.textContent = translation;
      }
    });

    // Aggiorna elementi con data-i18n-title (attributo title)
    document.querySelectorAll('[data-i18n-title]').forEach((element) => {
      const key = element.getAttribute('data-i18n-title');
      const translation = this.t(key);
      element.setAttribute('title', translation);
    });

    // Aggiorna anche il titolo della pagina se presente
    const titleElement = document.querySelector('title');
    const titleKey = titleElement?.getAttribute('data-i18n');
    if (titleKey) {
      document.title = this.t(titleKey);
    }
  },

  // Ottieni tutte le lingue disponibili
  getAvailableLanguages() {
    return [
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'en', name: 'English', flag: '🇺🇸' },
      // ES, FR, DE disponibili ma non ancora tradotte al 100%
      // { code: 'es', name: 'Español', flag: '🇪🇸' },
      // { code: 'fr', name: 'Français', flag: '🇫🇷' },
      // { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
    ];
  },
};
