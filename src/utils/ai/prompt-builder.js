// Prompt Builder - Costruzione dei prompt per i provider LLM
import { PromptRegistry } from './prompt-registry.js';
import { InputSanitizer } from '../security/input-sanitizer.js';
import { Logger } from '../core/logger.js';
import { KeypointsPromptBuilder } from './keypoints-prompt-builder.js';

export const LANGUAGE_CONFIGS = {
  it: { name: 'italiano', summaryNoun: 'il riassunto', keyPointsNoun: 'i punti chiave' },
  en: { name: 'English', summaryNoun: 'the summary', keyPointsNoun: 'the key points' },
  es: { name: 'español', summaryNoun: 'el resumen', keyPointsNoun: 'los puntos clave' },
  fr: { name: 'français', summaryNoun: 'le résumé', keyPointsNoun: 'les points clés' },
  de: { name: 'Deutsch', summaryNoun: 'die Zusammenfassung', keyPointsNoun: 'die Schlüsselpunkte' },
};

const LANGUAGE_TEMPLATES = {
  it: (noun) => ({
    instruction: `Scrivi ${noun} in italiano`,
    systemAddition: `\n\nIMPORTANTE: Devi scrivere ${noun} ESCLUSIVAMENTE in ITALIANO, indipendentemente dalla lingua dell'articolo originale.`,
  }),
  en: (noun) => ({
    instruction: `Write ${noun} in English`,
    systemAddition: `\n\nIMPORTANT: You MUST write ${noun} EXCLUSIVELY in ENGLISH, regardless of the original article language.`,
  }),
  es: (noun) => ({
    instruction: `Escribe ${noun} en español`,
    systemAddition: `\n\nIMPORTANTE: Debes escribir ${noun} EXCLUSIVAMENTE en ESPAÑOL, independientemente del idioma del artículo original.`,
  }),
  fr: (noun) => ({
    instruction: `Écris ${noun} en français`,
    systemAddition: `\n\nIMPORTANT: Tu DOIS écrire ${noun} EXCLUSIVEMENT en FRANÇAIS, quelle que soit la langue de l'article original.`,
  }),
  de: (noun) => ({
    instruction: `Schreibe ${noun} auf Deutsch`,
    systemAddition: `\n\nWICHTIG: Du MUSST ${noun} AUSSCHLIESSLICH auf DEUTSCH schreiben, unabhängig von der Sprache des Originalartikels.`,
  }),
};

export function buildLanguageMap(outputType) {
  const nounKey = outputType === 'keypoints' ? 'keyPointsNoun' : 'summaryNoun';
  const map = {};
  for (const [lang, config] of Object.entries(LANGUAGE_CONFIGS)) {
    const template = LANGUAGE_TEMPLATES[lang](config[nounKey]);
    map[lang] = { name: config.name, ...template };
  }
  return map;
}

export class PromptBuilder {
  static getSystemPrompt(provider, contentType) {
    return PromptRegistry.getSummarySystemPrompt(provider, contentType);
  }

  static getKeyPointsSystemPrompt(provider, contentType) {
    return PromptRegistry.getKeyPointsSystemPrompt(provider, contentType);
  }

  static formatArticleForPrompt(article) {
    // Sanitizza il titolo
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

    let formatted = `TITOLO: ${cleanTitle}\n\n`;
    formatted += `ARTICOLO (ogni paragrafo è numerato):\n`;

    let skippedParagraphs = 0;

    // Sanitizza ogni paragrafo
    article.paragraphs.forEach((p) => {
      try {
        const cleanText = InputSanitizer.sanitizeForAI(p.text, {
          maxLength: 5000,
          minLength: 5,
          removeHTML: true,
          preserveNewlines: true,
          removeCitations: false,
        });

        formatted += `§${p.id}: ${cleanText}\n\n`;
      } catch {
        Logger.warn(`Paragrafo §${p.id} troppo corto o invalido, saltato`);
        skippedParagraphs++;
      }
    });

    formatted += `\nLUNGHEZZA: ${article.wordCount} parole (~${article.readingTimeMinutes} minuti di lettura)`;

    // Avvisa nel prompt se troppi paragrafi sono stati saltati (>30%)
    if (skippedParagraphs > 0 && article.paragraphs.length > 0) {
      const skipRatio = skippedParagraphs / article.paragraphs.length;
      if (skipRatio > 0.3) {
        formatted += `\n⚠️ NOTA: ${skippedParagraphs}/${article.paragraphs.length} paragrafi non elaborabili sono stati omessi.`;
      }
    }

    return formatted;
  }

  static buildPrompt(provider, article, settings, detectContentType, detectLanguage) {
    // Rileva tipo di contenuto e lingua
    const contentType = settings.contentType || detectContentType(article);
    const detectedLanguage = detectLanguage(article.content);

    // Calcola lunghezza target basata sulla completezza
    const wordCount = article.wordCount;

    // Nuove percentuali più generose per garantire completezza
    const lengthMap = {
      short: Math.floor(wordCount * 0.4),
      medium: Math.floor(wordCount * 0.6),
      detailed: Math.floor(wordCount * 0.75),
    };

    let targetWords = lengthMap[settings.summaryLength] || lengthMap.medium;
    targetWords = Math.max(300, Math.min(targetWords, 3000));

    // Mappa lingua output (generata dalla costante condivisa)
    const languageMap = buildLanguageMap('summary');
    const outputLang =
      languageMap[settings.outputLanguage] || languageMap[detectedLanguage] || languageMap.it;

    // Ottieni system prompt appropriato e aggiungi istruzione lingua
    let systemPrompt = this.getSystemPrompt(provider, contentType);
    systemPrompt += outputLang.systemAddition;

    // Formatta articolo
    const formattedArticle = this.formatArticleForPrompt(article);

    // Costruisci user prompt
    const userPrompt = `# ARTICOLO DA RIASSUMERE

${formattedArticle}

---

# ISTRUZIONI PER IL RIASSUNTO

## ⚠️ LINGUA DI OUTPUT RICHIESTA: ${outputLang.name.toUpperCase()}
${outputLang.instruction.toUpperCase()}

## Obiettivo
Crea un riassunto **COMPLETO ed ESAUSTIVO** che possa SOSTITUIRE completamente la lettura dell'articolo originale.

## Principio Fondamentale: COMPLETEZZA > BREVITÀ
Il riassunto deve contenere TUTTI gli elementi essenziali per comprendere l'articolo senza doverlo leggere.

## Linee Guida per la Qualità

✅ **DA FARE:**
- **SCRIVI TUTTO IN ${outputLang.name.toUpperCase()}** - Questa è la priorità assoluta
- Preserva TUTTI i nomi propri, date, cifre, percentuali e dati specifici
- Mantieni terminologia tecnica importante (spiega brevemente se necessario)
- Includi TUTTI gli esempi concreti e i casi citati nell'articolo
- Mantieni la struttura logica e il flusso narrativo dell'articolo
- Usa transizioni fluide tra concetti
- Scrivi in prosa scorrevole e ben strutturata
- Sii preciso: se l'autore dice "il 67%", scrivi "il 67%", non "la maggioranza"
- Includi contesto, background e implicazioni discusse nell'articolo

❌ **DA EVITARE:**
- Generalizzazioni vaghe ("l'articolo parla di...", "vengono discussi vari aspetti")
- Frasi meta ("l'autore inizia spiegando...") - vai diretto al contenuto
- Omettere dati, esempi o sezioni importanti
- Aggiungere opinioni o informazioni non nell'originale
- Liste bullet point (usa prosa fluida)
- Riassumere superficialmente sezioni complesse
- Tagliare informazioni per rispettare un limite di parole rigido

## Note sulla Lunghezza
- Indicazione: circa ${targetWords} parole (ma è solo una guida)
- **IMPORTANTE**: Puoi usare più parole se necessario per essere completo ed esaustivo
- Non sacrificare informazioni importanti per rispettare un limite di parole
- L'obiettivo è la completezza, non la brevità
- Rimuovi solo ridondanze e dettagli veramente superflui

---

# PUNTI CHIAVE STRUTTURATI

Dopo il riassunto, crea una sezione con 5-8 punti chiave:

**[Titolo breve e descrittivo]** (§N o §N-M)
Spiegazione in 2-3 frasi con dettagli specifici e concreti.

Ogni punto deve:
- Catturare un'idea centrale dell'articolo
- Essere autosufficiente
- Includere dettagli specifici (dati, esempi, nomi)
- Indicare i paragrafi di riferimento

---

# FORMATO OUTPUT

## RIASSUNTO

[Il tuo riassunto COMPLETO ed ESAUSTIVO in prosa fluida. Lunghezza indicativa: ~${targetWords} parole, ma usa più spazio se necessario per essere completo]

## PUNTI CHIAVE

1. **[Titolo]** (§N)
   [Spiegazione dettagliata]

2. **[Titolo]** (§N-M)
   [Spiegazione dettagliata]

[...]

---

⚠️ REMINDER: Scrivi TUTTO il riassunto e i punti chiave in ${outputLang.name.toUpperCase()}.

Inizia ora con il riassunto completo.`;

    return {
      systemPrompt,
      userPrompt,
      metadata: { contentType, detectedLanguage, targetWords },
    };
  }

  static buildKeyPointsPrompt(provider, article, settings, detectContentType, detectLanguage) {
    // Rileva tipo di contenuto e lingua
    const contentType = settings.contentType || detectContentType(article);
    const detectedLanguage = detectLanguage(article.content);

    // Mappa lingua output (generata dalla costante condivisa)
    const languageMap = buildLanguageMap('keypoints');
    const outputLang =
      languageMap[settings.outputLanguage] || languageMap[detectedLanguage] || languageMap.it;

    // Ottieni system prompt appropriato e aggiungi istruzione lingua
    let systemPrompt = this.getKeyPointsSystemPrompt(provider, contentType);
    systemPrompt += outputLang.systemAddition;

    // Formatta articolo
    const formattedArticle = this.formatArticleForPrompt(article);

    // Delega a KeypointsPromptBuilder per la costruzione dello user prompt
    const userPrompt = KeypointsPromptBuilder.buildKeyPointsUserPrompt(
      contentType,
      formattedArticle,
      article,
      outputLang,
    );

    return {
      systemPrompt,
      userPrompt,
      metadata: { contentType, detectedLanguage },
    };
  }

  static buildKeyPointsUserPrompt(contentType, formattedArticle, article, outputLang) {
    // Delega a KeypointsPromptBuilder — mantenuto per backward compatibility
    return KeypointsPromptBuilder.buildKeyPointsUserPrompt(
      contentType,
      formattedArticle,
      article,
      outputLang,
    );
  }
}
