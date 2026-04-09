// Translator - Gestione traduzione articoli completi
import { APIClient } from '../ai/api-client.js';
import { PromptRegistry } from '../ai/prompt-registry.js';
import { InputSanitizer } from '../security/input-sanitizer.js';
import { Logger } from './logger.js';

export class Translator {
  static async translateArticle(article, targetLanguage, provider, apiKey, contentType = null) {
    const detectedType = contentType || APIClient.detectContentType(article);
    const systemPrompt = PromptRegistry.getTranslationSystemPrompt(provider, detectedType);
    const userPrompt = this.buildUserPrompt(article, targetLanguage, detectedType);
    try {
      return await APIClient.generateCompletion(provider, apiKey, systemPrompt, userPrompt, {
        temperature: 0.3,
        maxTokens: provider === 'gemini' ? 8000 : 4096,
      });
    } catch (error) {
      throw new Error(`Errore traduzione: ${error.message}`);
    }
  }

  static buildUserPrompt(article, targetLanguage, contentType) {
    const languageNames = {
      it: 'Italiano',
      en: 'English',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
    };

    const langName = languageNames[targetLanguage] || targetLanguage;

    // ✅ SANITIZZA IL TITOLO
    let cleanTitle;
    try {
      cleanTitle = InputSanitizer.sanitizeForAI(article.title, {
        maxLength: 500,
        minLength: 1,
        removeHTML: true,
        preserveNewlines: false,
      });
    } catch (error) {
      Logger.warn('Errore sanitizzazione titolo:', error);
      cleanTitle = article.title.substring(0, 500);
    }

    // Costruisci il testo completo dell'articolo
    let fullText = `# ${cleanTitle}\n\n`;

    // ✅ SANITIZZA OGNI PARAGRAFO
    article.paragraphs.forEach((p) => {
      try {
        const cleanText = InputSanitizer.sanitizeForAI(p.text, {
          maxLength: 5000,
          minLength: 5,
          removeHTML: true,
          preserveNewlines: true,
          removeCitations: false,
        });
        fullText += `${cleanText}\n\n`;
      } catch (error) {
        Logger.warn('Paragrafo troppo corto o invalido, saltato');
      }
    });

    // Template specifico per tipo di contenuto
    const templates = {
      general: `Traduci il seguente articolo in ${langName}.

ISTRUZIONI:
- Traduci TUTTO il contenuto senza omettere nulla
- Mantieni la struttura paragrafo per paragrafo
- Preserva formattazione, link, e riferimenti
- Non aggiungere commenti o note tue
- La traduzione deve essere completa e fedele

ARTICOLO DA TRADURRE:

${fullText}`,

      tutorial: `Traduci il seguente tutorial/guida tecnica in ${langName}.

ISTRUZIONI:
- Traduci TUTTO il testo esplicativo
- NON tradurre: codice, comandi, nomi di funzioni, path, URL
- Mantieni la struttura e formattazione
- Preserva tutti i blocchi di codice intatti
- Traduci solo commenti esplicativi e istruzioni

CONTENUTO DA TRADURRE:

${fullText}`,

      scientific: `Traduci il seguente articolo scientifico in ${langName}.

ISTRUZIONI:
- Traduci mantenendo massima precisione terminologica
- Preserva TUTTI i dati numerici, statistiche, valori p
- NON tradurre: nomi latini di specie, formule chimiche, simboli
- Mantieni formato delle citazioni bibliografiche
- Usa terminologia scientifica standard nella lingua target

ARTICOLO DA TRADURRE:

${fullText}`,

      news: `Traduci il seguente articolo giornalistico in ${langName}.

ISTRUZIONI:
- Mantieni tutti i riferimenti temporali precisi
- Preserva citazioni dirette con attribuzione
- Usa nomi di luoghi nella forma standard della lingua target
- Mantieni obiettività e neutralità giornalistica
- Preserva tutte le fonti citate

ARTICOLO DA TRADURRE:

${fullText}`,

      business: `Traduci il seguente contenuto business in ${langName}.

ISTRUZIONI:
- Usa terminologia business standard nella lingua target
- Mantieni sigle (KPI, ROI, EBITDA) con spiegazione se necessario
- Preserva precisione di cifre, percentuali e dati di mercato
- Mantieni nomi aziendali originali
- Il linguaggio deve suonare professionale e credibile

CONTENUTO DA TRADURRE:

${fullText}`,

      opinion: `Traduci il seguente articolo di opinione in ${langName}.

ISTRUZIONI:
- Preserva lo stile personale e unico dell'autore
- Mantieni il tono (ironico, polemico, riflessivo, appassionato)
- Preserva forza e struttura del ragionamento
- Adatta figure retoriche e espressioni persuasive
- Mantieni lo stesso potere persuasivo dell'originale

ARTICOLO DA TRADURRE:

${fullText}`,
    };

    return templates[contentType] || templates.general;
  }
}
