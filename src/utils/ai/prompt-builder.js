// Prompt Builder - Costruzione dei prompt per i provider LLM
import { PromptRegistry } from './prompt-registry.js';
import { InputSanitizer } from '../security/input-sanitizer.js';

const LANGUAGE_CONFIGS = {
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

function buildLanguageMap(outputType) {
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
      console.warn('Errore sanitizzazione titolo:', error);
      cleanTitle = article.title.substring(0, 500);
    }

    let formatted = `TITOLO: ${cleanTitle}\n\n`;
    formatted += `ARTICOLO (ogni paragrafo è numerato):\n`;

    const originalLength = article.content ? article.content.length : 0;
    let totalSanitized = 0;
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
        totalSanitized += p.text.length - cleanText.length;
      } catch (error) {
        console.warn(`Paragrafo §${p.id} troppo corto o invalido, saltato`);
        skippedParagraphs++;
      }
    });

    formatted += `\nLUNGHEZZA: ${article.wordCount} parole (~${article.readingTimeMinutes} minuti di lettura)`;

    if (totalSanitized > 0 || skippedParagraphs > 0) {
      const savedTokens = Math.floor(totalSanitized / 4);
      console.log(`Sanitizzazione completata:`);
      console.log(`   - Caratteri rimossi: ${totalSanitized}`);
      console.log(`   - Token risparmiati: ~${savedTokens}`);
      if (originalLength > 0) {
        console.log(`   - Riduzione: ${((totalSanitized / originalLength) * 100).toFixed(1)}%`);
      }
      if (skippedParagraphs > 0) {
        console.log(`   - Paragrafi saltati: ${skippedParagraphs}`);
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

    // Costruisci user prompt basato sul tipo di contenuto
    const userPrompt = this.buildKeyPointsUserPrompt(
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
    const baseInstructions = `# ARTICOLO DA ANALIZZARE

${formattedArticle}

---

# ISTRUZIONI PER L'ESTRAZIONE

## ⚠️ LINGUA DI OUTPUT RICHIESTA: ${outputLang.name.toUpperCase()}
${outputLang.instruction.toUpperCase()}

## Obiettivo
Estrai 7-12 punti chiave che catturino TUTTE le informazioni importanti e interessanti dell'articolo. Ogni punto deve essere conciso (2-4 frasi) ma esaustivo.`;

    const qualityCriteria = `
## Criteri di Qualità

Ogni punto chiave deve:
1. **Essere specifico**: usa dati concreti, non generalizzazioni
2. **Essere autosufficiente**: comprensibile senza leggere altri punti
3. **Avere riferimenti**: indicare sempre §N o §N-M
4. **Essere sostanziale**: fornire informazioni di valore
5. **Essere conciso**: 2-4 frasi, non di più

## Struttura di Ogni Punto

**[Titolo descrittivo e specifico del concetto]** (§N o §N-M)
Spiegazione in 2-4 frasi che include: (1) il concetto principale, (2) dettagli specifici concreti, (3) contesto o implicazioni se rilevanti. Usa dati numerici precisi quando disponibili.`;

    const outputFormat = `
---

# FORMATO OUTPUT

## PUNTI CHIAVE

1. **[Titolo chiaro e descrittivo]** (§N)
   [Prima frase: concetto principale]. [Seconda frase: dettagli specifici con dati]. [Terza frase opzionale: contesto o implicazioni].

2. **[Titolo]** (§N-M)
   [Spiegazione completa ma concisa]

...

---

⚠️ REMINDER: Scrivi TUTTI i punti chiave in ${outputLang.name.toUpperCase()}.

Inizia ora con l'estrazione dei punti chiave.`;

    // Istruzioni specifiche per tipo di contenuto
    const specificInstructions = {
      scientific: `
## Cosa Includere (ARTICOLI SCIENTIFICI)

**OBBLIGATORI:**
1. **Domanda di ricerca/Ipotesi principale** (§N)
2. **Design dello studio e metodologia** (§N-M): tipo studio, N campione, caratteristiche partecipanti
3. **Procedure e misure** (§N): strumenti utilizzati, variabili misurate
4. **Risultato principale** (§N): con statistiche complete (M, SD, p-value, effect size)
5. **Risultati secondari significativi** (§N): tutti i risultati statisticamente significativi
6. **Limitazioni riconosciute** (§N)
7. **Implicazioni e direzioni future** (§N)

**FORMATO PER RISULTATI:**
Includi SEMPRE: media (M), deviazione standard (SD), valore p, dimensione effetto (Cohen's d, η², etc.), intervalli di confidenza quando disponibili.`,

      news: `
## Cosa Includere (NEWS)

**STRUTTURA OBBLIGATORIA:**
1. **Fatto Principale** (§N): CHI ha fatto/detto COSA, QUANDO e DOVE
2. **Sviluppi Chiave in Ordine Cronologico** (§N-M)
3. **Dichiarazioni delle Parti Coinvolte** (§N): con attribuzione chiara della fonte
4. **Contesto e Background** (§N)
5. **Dati e Cifre** (§N): tutti i numeri significativi
6. **Reazioni e Commenti** (§N)
7. **Implicazioni e Conseguenze** (§N)

**REGOLE SPECIFICHE:**
- Distingui fatti verificati da allegazioni
- Attribuisci SEMPRE le informazioni: "Secondo X", "Come riportato da Y"
- Include timestamp precisi quando disponibili`,

      tutorial: `
## Cosa Includere (TUTORIAL)

**STRUTTURA OBBLIGATORIA:**
1. **Obiettivo e Risultato Finale** (§N)
2. **Prerequisiti e Setup Iniziale** (§N): conoscenze, software/tools con versioni
3. **Passi Procedurali Chiave** (§N-M): sequenza logica
4. **Comandi/Codice Fondamentali** (§N): sintassi esatte
5. **Concetti Tecnici Importanti** (§N): principi sottostanti
6. **Configurazioni Critiche** (§N)
7. **Problemi Comuni e Soluzioni** (§N)
8. **Verifica del Successo** (§N)`,

      business: `
## Cosa Includere (BUSINESS)

**STRUTTURA OBBLIGATORIA:**
1. **Context** (§N): azienda, industria, situazione iniziale
2. **Sfida o Opportunità** (§N)
3. **Strategia e Approccio** (§N-M)
4. **Implementazione e Tattiche** (§N)
5. **Risultati e Metriche** (§N): KPI specifici, ROI
6. **Insights e Implicazioni** (§N)

**FOCUS:**
- Dati quantitativi specifici (revenue, market share, growth %)
- Metriche di successo misurabili
- Actionable insights`,

      opinion: `
## Cosa Includere (OPINION)

**STRUTTURA OBBLIGATORIA:**
1. **Tesi Principale** (§N): posizione dell'autore
2. **Contesto e Motivazione** (§N)
3. **Argomenti Principali** (§N-M): con evidenze a supporto
4. **Contro-argomenti Affrontati** (§N): se presenti
5. **Conclusioni e Call-to-Action** (§N)

**REGOLE:**
- Distingui chiaramente fatti da opinioni
- Riporta la posizione dell'autore in modo neutrale
- Includi le evidenze usate a supporto`,

      general: `
## Cosa Includere nei Punti Chiave

✅ **SEMPRE:**
- Concetti centrali e argomenti principali
- Dati quantitativi specifici (numeri, percentuali, statistiche)
- Nomi propri, date, luoghi rilevanti
- Esempi concreti che illustrano concetti
- Citazioni o affermazioni chiave di esperti/fonti
- Conclusioni e take-away principali
- Implicazioni pratiche o teoriche
- Informazioni sorprendenti o contro-intuitive
- Dettagli tecnici rilevanti
- Background o contesto essenziale

❌ **MAI:**
- Punti troppo vaghi o generici
- Informazioni ridondanti o ripetitive
- Dettagli marginali o irrilevanti
- Opinioni personali non nell'articolo
- Interpretazioni non supportate dal testo`,
    };

    return (
      baseInstructions +
      (specificInstructions[contentType] || specificInstructions.general) +
      qualityCriteria +
      outputFormat
    );
  }
}
