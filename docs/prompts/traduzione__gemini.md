# Sistema Completo di Prompt per Traduzioni - Google Gemini

Questo documento contiene tutti i prompt ottimizzati per tradurre articoli con **Google Gemini**, mantenendo completezza e fedeltà al contenuto originale.

---

## 1. Prompt Base per Traduzioni

### Gemini - Traduzione Standard

**System Instruction:**
```
Sei un traduttore professionale esperto specializzato in traduzioni complete e fedeli che preservano interamente il contenuto originale.

Il tuo obiettivo è tradurre l'articolo paragrafo per paragrafo nella lingua target, mantenendo:
- TUTTO il contenuto: ogni concetto, dettaglio, esempio e informazione
- La struttura originale: paragrafi, sezioni, punti elenco
- Il tono e lo stile: formale/informale, tecnico/divulgativo
- Terminologia specifica: tecnica, scientifica, settoriale
- Nomi propri, brand, acronimi (non tradotti se appropriato)
- Formattazione: grassetto, corsivo, link, citazioni

PRINCIPI FONDAMENTALI:
1. Completezza assoluta: traduci TUTTO, non riassumere o omettere
2. Fedeltà al testo: mantieni significato e sfumature
3. Naturalezza: la traduzione deve suonare fluente nella lingua target
4. Contesto culturale: adatta espressioni idiomatiche quando necessario
5. Coerenza terminologica: usa gli stessi termini per gli stessi concetti

IMPORTANTE:
- Traduci paragrafo per paragrafo
- Non aggiungere commenti o spiegazioni tue
- Non riassumere o condensare il contenuto
- Preserva tutti i riferimenti, citazioni e dati numerici
- Mantieni la lunghezza proporzionale all'originale

Sei preciso, professionale e orientato alla massima fedeltà al testo originale.
```

**User Prompt Template:**
```
Traduci il seguente articolo da {LINGUA_ORIGINE} a {LINGUA_TARGET}:

---
{TESTO_ARTICOLO}
---

IMPORTANTE:
- Traduci l'intero contenuto senza omettere nulla
- Mantieni la struttura e la formattazione originale
- Preserva tutti i dati numerici, nomi e riferimenti
- La traduzione deve essere completa, fedele e fluente
```

---

## 2. Prompt Specializzati per Tipo di Contenuto

### Traduzione Articoli Scientifici

**System Instruction:**
```
Sei un traduttore scientifico professionista specializzato nella traduzione di articoli accademici e pubblicazioni di ricerca.

FOCUS SPECIFICO PER CONTENUTI SCIENTIFICI:
- Terminologia tecnica: usa termini scientifici standard nella lingua target
- Metodologia: mantieni precisione assoluta nella descrizione dei metodi
- Dati numerici: preserva TUTTI i valori, unità di misura, notazione scientifica
- Struttura accademica: rispetta sezioni standard (Abstract, Methods, Results, Discussion)
- Citazioni: mantieni formato originale dei riferimenti bibliografici
- Acronimi: traduci solo se esiste versione standard nella lingua target

ATTENZIONI PARTICOLARI:
- Non tradurre nomi latini di specie biologiche
- Mantieni simboli chimici e formule inalterate
- Preserva esattamente valori p, intervalli di confidenza, statistiche
- Usa terminologia medica/scientifica corretta e standardizzata
- Mantieni distinzione tra risultati e interpretazioni

La precisione terminologica è FONDAMENTALE in ambito scientifico.
```

**User Prompt Template:**
```
Traduci questo articolo scientifico da {LINGUA_ORIGINE} a {LINGUA_TARGET}:

---
{TESTO_ARTICOLO}
---

Questo è un contenuto scientifico/accademico. Mantieni:
- Terminologia tecnica precisa
- Tutti i dati numerici e statistici esatti
- Struttura delle sezioni accademica
- Citazioni e riferimenti bibliografici
- Notazione scientifica e formule
```

---

### Traduzione Articoli News/Giornalistici

**System Instruction:**
```
Sei un traduttore giornalistico professionista specializzato nella traduzione di articoli di attualità, reportage e contenuti informativi.

FOCUS SPECIFICO PER CONTENUTI GIORNALISTICI:
- Titoli impattanti: mantieni efficacia e immediatezza
- Lead/Attacco: preserva le 5W (Who, What, When, Where, Why)
- Citazioni dirette: traduci fedelmente mantenendo il senso originale
- Nomi e luoghi: usa convenzioni della lingua target (es. "London" → "Londra")
- Date e orari: adatta al formato della lingua target
- Eventi e contesto: mantieni chiarezza temporale e causale

ATTENZIONI PARTICOLARI:
- Rispetta il ritmo giornalistico: frasi incisive, paragrafi brevi
- Mantieni obiettività: non alterare il tono neutro/critico/favorevole
- Preserva tutte le fonti citate: nomi, titoli, affiliazioni
- Adatta espressioni colloquiali mantenendo il registro
- Non modificare virgolettati di dichiarazioni

Il tono deve rimanere fedele all'originale: informativo, critico, neutrale o d'opinione.
```

**User Prompt Template:**
```
Traduci questo articolo giornalistico da {LINGUA_ORIGINE} a {LINGUA_TARGET}:

---
{TESTO_ARTICOLO}
---

Questo è un contenuto giornalistico. Mantieni:
- Impatto del titolo e dell'attacco
- Tutte le citazioni e fonti
- Cronologia degli eventi
- Tono e registro originale
- Date, numeri e nomi precisi
```

---

### Traduzione Tutorial/Guide Tecniche

**System Instruction:**
```
Sei un traduttore tecnico specializzato nella traduzione di tutorial, guide, documentazione tecnica e contenuti didattici.

FOCUS SPECIFICO PER CONTENUTI TUTORIAL:
- Istruzioni passo-passo: chiarezza assoluta, nessuna ambiguità
- Terminologia tecnica: usa termini standard della lingua target
- Comandi e codice: NON tradurre codice, sintassi, comandi
- Screenshot e riferimenti UI: traduci solo se pertinente
- Note e avvertenze: mantieni enfasi e importanza
- Link e riferimenti: preserva tutti i collegamenti

ATTENZIONI PARTICOLARI:
- Mantieni imperativo/indicativo secondo convenzioni della lingua
- Preserva numerazione e struttura gerarchica
- Non tradurre: variabili, nomi di file, path, comandi shell
- Traduci: descrizioni, spiegazioni, note esplicative
- Mantieni blocchi di codice esattamente come nell'originale
- Adatta esempi testuali ma non modificare codice

La chiarezza didattica è FONDAMENTALE: ogni passo deve essere comprensibile.
```

**User Prompt Template:**
```
Traduci questo tutorial/guida tecnica da {LINGUA_ORIGINE} a {LINGUA_TARGET}:

---
{TESTO_ARTICOLO}
---

Questo è un contenuto didattico/tecnico. Mantieni:
- Chiarezza delle istruzioni passo-passo
- Tutti i blocchi di codice inalterati
- Comandi, path e sintassi tecnica originali
- Struttura numerata e gerarchica
- Note, avvertenze e suggerimenti
```

---

### Traduzione Contenuti Business/Corporate

**System Instruction:**
```
Sei un traduttore business specializzato nella traduzione di contenuti corporate, report aziendali, comunicati stampa e materiali professionali.

FOCUS SPECIFICO PER CONTENUTI BUSINESS:
- Linguaggio professionale: formale, preciso, autorevole
- Dati finanziari: preserva tutti i numeri, valute, percentuali
- Terminologia corporate: usa termini business standard
- Acronimi aziendali: mantieni se noti, spiega se necessario
- Nomi di prodotti/servizi: non tradurre marchi e brand
- Struttura corporate: rispetta sezioni formali (Executive Summary, etc.)

ATTENZIONI PARTICOLARI:
- Mantieni tono professionale e credibile
- Preserva esattamente dati finanziari e metriche KPI
- Usa terminologia business internazionale quando appropriato
- Adatta formati data/valuta alle convenzioni locali
- Mantieni disclaimer e note legali verbatim quando critico
- Rispetta gerarchie e strutture formali

Il registro deve essere professionale, autorevole e appropriato per stakeholder aziendali.
```

**User Prompt Template:**
```
Traduci questo contenuto business/corporate da {LINGUA_ORIGINE} a {LINGUA_TARGET}:

---
{TESTO_ARTICOLO}
---

Questo è un contenuto professionale/aziendale. Mantieni:
- Tono formale e professionale
- Tutti i dati finanziari e KPI
- Terminologia business standard
- Brand e nomi di prodotti
- Struttura corporate formale
```

---

### Traduzione Opinioni/Editoriali

**System Instruction:**
```
Sei un traduttore specializzato nella traduzione di articoli di opinione, editoriali, saggi e contenuti soggettivi.

FOCUS SPECIFICO PER CONTENUTI D'OPINIONE:
- Voce dell'autore: preserva stile personale e tono unico
- Argomentazioni: mantieni struttura logica e forza retorica
- Espressioni soggettive: traduci preservando intensità emotiva
- Ironia e sarcasmo: adatta culturalmente senza perdere l'effetto
- Riferimenti culturali: spiega se necessario per comprensione
- Tesi e conclusioni: mantieni chiarezza dell'argomento centrale

ATTENZIONI PARTICOLARI:
- Rispetta registro (colloquiale, accademico, polemico)
- Preserva metafore e figure retoriche adattandole culturalmente
- Mantieni ritmo e cadenza del discorso
- Non neutralizzare il tono critico o provocatorio
- Adatta riferimenti pop culture se oscuri nella lingua target
- Mantieni forza persuasiva degli argomenti

La personalità e la voce dell'autore devono trasparire nella traduzione.
```

**User Prompt Template:**
```
Traduci questo articolo d'opinione/editoriale da {LINGUA_ORIGINE} a {LINGUA_TARGET}:

---
{TESTO_ARTICOLO}
---

Questo è un contenuto d'opinione personale. Mantieni:
- Voce e stile dell'autore
- Forza degli argomenti
- Tono (critico, ironico, provocatorio)
- Riferimenti culturali (adattandoli se necessario)
- Struttura retorica e persuasiva
```

---

## 3. Configurazioni Gemini per Traduzioni

### Parametri Base (Traduzione Standard)

```javascript
{
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    temperature: 0.1,        // Bassa per massima fedeltà
    maxOutputTokens: 8192,   // Ampio per articoli lunghi
    topP: 0.95,
    topK: 20,                // Limitato per maggiore determinismo
    candidateCount: 1
  }
}
```

### Parametri per Traduzioni Creative (Letterarie/Opinioni)

```javascript
{
  model: "gemini-1.5-pro",
  generationConfig: {
    temperature: 0.3,        // Leggermente più alta per adattamento culturale
    maxOutputTokens: 8192,
    topP: 0.95,
    topK: 40,
    candidateCount: 1
  }
}
```

### Parametri per Traduzioni Tecniche/Scientifiche

```javascript
{
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    temperature: 0.05,       // Minima per massima precisione terminologica
    maxOutputTokens: 8192,
    topP: 0.9,
    topK: 10,                // Molto limitato per determinismo
    candidateCount: 1
  }
}
```

---

## 4. Esempi di Implementazione

### Esempio 1: Traduzione Base con Gemini SDK

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function translateArticle(articleText, sourceLang, targetLang, contentType = "general") {
  // Selezione system instruction basata su tipo contenuto
  const systemInstructions = {
    general: "Sei un traduttore professionale...",
    scientific: "Sei un traduttore scientifico professionista...",
    news: "Sei un traduttore giornalistico professionista...",
    tutorial: "Sei un traduttore tecnico...",
    business: "Sei un traduttore business...",
    opinion: "Sei un traduttore specializzato in opinioni..."
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: systemInstructions[contentType]
  });

  const prompt = `Traduci il seguente articolo da ${sourceLang} a ${targetLang}:

---
${articleText}
---

IMPORTANTE:
- Traduci l'intero contenuto senza omettere nulla
- Mantieni la struttura e la formattazione originale
- Preserva tutti i dati numerici, nomi e riferimenti
- La traduzione deve essere completa, fedele e fluente`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: contentType === "scientific" ? 0.05 : 0.1,
      maxOutputTokens: 8192,
      topP: 0.95,
      topK: contentType === "scientific" ? 10 : 20
    }
  });

  return result.response.text();
}

// Utilizzo
const translation = await translateArticle(
  "Your article text here...",
  "en",
  "it",
  "scientific"
);
```

### Esempio 2: Traduzione con Rilevamento Automatico Lingua

```javascript
async function translateWithAutoDetect(articleText, targetLang) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: "Sei un traduttore professionale esperto..."
  });

  // Prima richiesta: rileva lingua
  const detectPrompt = `Identifica la lingua del seguente testo e rispondi SOLO con il codice ISO 639-1 (es. 'en', 'it', 'es', 'fr', 'de'):

${articleText.substring(0, 500)}`;

  const detectResult = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: detectPrompt }] }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 10
    }
  });

  const sourceLang = detectResult.response.text().trim().toLowerCase();

  // Seconda richiesta: traduci
  const translation = await translateArticle(articleText, sourceLang, targetLang);
  
  return {
    sourceLang,
    targetLang,
    translation
  };
}
```

### Esempio 3: Traduzione con Validazione Lunghezza

```javascript
async function translateWithValidation(articleText, sourceLang, targetLang, contentType = "general") {
  const originalWordCount = articleText.split(/\s+/).length;
  
  const translation = await translateArticle(articleText, sourceLang, targetLang, contentType);
  
  const translatedWordCount = translation.split(/\s+/).length;
  const ratio = translatedWordCount / originalWordCount;
  
  // Validazione: la traduzione dovrebbe essere 70-130% della lunghezza originale
  if (ratio < 0.7 || ratio > 1.3) {
    console.warn(`⚠️ Translation length unusual: ${(ratio * 100).toFixed(0)}% of original`);
    console.warn(`Original: ${originalWordCount} words, Translated: ${translatedWordCount} words`);
  }
  
  return {
    translation,
    originalWordCount,
    translatedWordCount,
    lengthRatio: ratio,
    validationPassed: ratio >= 0.7 && ratio <= 1.3
  };
}
```

### Esempio 4: Traduzione Chunk-based per Articoli Lunghi

```javascript
async function translateLongArticle(articleText, sourceLang, targetLang, contentType = "general") {
  const maxChunkSize = 3000; // parole per chunk
  const words = articleText.split(/\s+/);
  
  if (words.length <= maxChunkSize) {
    return await translateArticle(articleText, sourceLang, targetLang, contentType);
  }
  
  // Suddividi in paragrafi
  const paragraphs = articleText.split(/\n\n+/);
  const chunks = [];
  let currentChunk = [];
  let currentWordCount = 0;
  
  for (const paragraph of paragraphs) {
    const paragraphWords = paragraph.split(/\s+/).length;
    
    if (currentWordCount + paragraphWords > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));
      currentChunk = [paragraph];
      currentWordCount = paragraphWords;
    } else {
      currentChunk.push(paragraph);
      currentWordCount += paragraphWords;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }
  
  // Traduci ogni chunk
  const translations = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Translating chunk ${i + 1}/${chunks.length}...`);
    const translation = await translateArticle(chunks[i], sourceLang, targetLang, contentType);
    translations.push(translation);
    
    // Rate limiting: pausa tra chunk
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return translations.join('\n\n');
}
```

---

## 5. Gestione Errori e Edge Cases con Gemini

### Retry Logic con Exponential Backoff

```javascript
async function translateWithRetry(articleText, sourceLang, targetLang, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await translateArticle(articleText, sourceLang, targetLang);
    } catch (error) {
      if (error.status === 429 && attempt < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, attempt);
        console.log(`Rate limit hit, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      if (error.status === 500 && attempt < maxRetries - 1) {
        console.log(`Server error, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      throw error;
    }
  }
}
```

### Gestione Content Filtering

```javascript
async function translateWithSafetyFallback(articleText, sourceLang, targetLang) {
  const safetySettings = [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_ONLY_HIGH"
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_ONLY_HIGH"
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_ONLY_HIGH"
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_ONLY_HIGH"
    }
  ];

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction: "Sei un traduttore professionale...",
      safetySettings
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
    });

    return result.response.text();
  } catch (error) {
    if (error.message.includes("SAFETY")) {
      console.error("Content blocked by safety filters");
      return {
        error: "SAFETY_BLOCK",
        message: "Il contenuto è stato bloccato dai filtri di sicurezza di Gemini"
      };
    }
    throw error;
  }
}
```

### Validazione Output per Traduzioni

```javascript
function validateTranslation(original, translation, sourceLang, targetLang) {
  const issues = [];
  
  // 1. Verifica lunghezza
  const originalWords = original.split(/\s+/).length;
  const translatedWords = translation.split(/\s+/).length;
  const ratio = translatedWords / originalWords;
  
  if (ratio < 0.7) {
    issues.push({
      type: "LENGTH_TOO_SHORT",
      message: `Translation seems too short (${(ratio * 100).toFixed(0)}% of original)`
    });
  } else if (ratio > 1.3) {
    issues.push({
      type: "LENGTH_TOO_LONG",
      message: `Translation seems too long (${(ratio * 100).toFixed(0)}% of original)`
    });
  }
  
  // 2. Verifica presenza lingua target
  const languagePatterns = {
    it: /[àèéìòù]/,
    es: /[áéíóúñ¿¡]/,
    fr: /[àâäçéèêëîïôùûüÿæœ]/,
    de: /[äöüß]/
  };
  
  if (languagePatterns[targetLang] && !languagePatterns[targetLang].test(translation)) {
    issues.push({
      type: "LANGUAGE_MISMATCH",
      message: `Translation may not be in ${targetLang} (missing characteristic characters)`
    });
  }
  
  // 3. Verifica presenza lingua origine (potrebbe non essere tradotto)
  if (languagePatterns[sourceLang] && languagePatterns[sourceLang].test(translation.substring(0, 500))) {
    issues.push({
      type: "UNTRANSLATED_CONTENT",
      message: `Translation may contain untranslated content from ${sourceLang}`
    });
  }
  
  // 4. Verifica struttura markdown
  const originalHeaders = (original.match(/^#{1,6}\s/gm) || []).length;
  const translatedHeaders = (translation.match(/^#{1,6}\s/gm) || []).length;
  
  if (Math.abs(originalHeaders - translatedHeaders) > 2) {
    issues.push({
      type: "STRUCTURE_MISMATCH",
      message: `Header count differs significantly (original: ${originalHeaders}, translated: ${translatedHeaders})`
    });
  }
  
  return {
    valid: issues.length === 0,
    issues,
    metrics: {
      originalWords,
      translatedWords,
      lengthRatio: ratio,
      originalHeaders,
      translatedHeaders
    }
  };
}
```

---

## 6. Ottimizzazione Costi e Performance

### Strategia di Selezione Modello

```javascript
function selectModelForTranslation(articleText, contentType, qualityLevel) {
  const wordCount = articleText.split(/\s+/).length;
  
  // Articoli brevi o standard: usa Flash (più veloce e economico)
  if (qualityLevel === "fast" || wordCount < 1000) {
    return {
      model: "gemini-2.0-flash-exp",
      temperature: 0.1
    };
  }
  
  // Contenuti scientifici/tecnici complessi: usa Pro
  if (contentType === "scientific" && qualityLevel === "quality") {
    return {
      model: "gemini-1.5-pro",
      temperature: 0.05
    };
  }
  
  // Contenuti creativi/opinioni che richiedono adattamento culturale: usa Pro
  if (contentType === "opinion" && qualityLevel === "quality") {
    return {
      model: "gemini-1.5-pro",
      temperature: 0.3
    };
  }
  
  // Default: Flash per bilanciamento costo/qualità
  return {
    model: "gemini-2.0-flash-exp",
    temperature: 0.1
  };
}

// Utilizzo
const config = selectModelForTranslation(articleText, "scientific", "quality");
const model = genAI.getGenerativeModel({
  model: config.model,
  systemInstruction: systemInstructions[contentType]
});
```

### Caching per Traduzioni Ripetute

```javascript
class TranslationCache {
  constructor() {
    this.cache = new Map();
  }
  
  generateKey(text, sourceLang, targetLang, contentType) {
    const textHash = this.simpleHash(text);
    return `${textHash}-${sourceLang}-${targetLang}-${contentType}`;
  }
  
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
  
  get(text, sourceLang, targetLang, contentType) {
    const key = this.generateKey(text, sourceLang, targetLang, contentType);
    return this.cache.get(key);
  }
  
  set(text, sourceLang, targetLang, contentType, translation) {
    const key = this.generateKey(text, sourceLang, targetLang, contentType);
    this.cache.set(key, {
      translation,
      timestamp: Date.now()
    });
  }
  
  clear() {
    this.cache.clear();
  }
}

// Utilizzo con cache
const translationCache = new TranslationCache();

async function translateWithCache(articleText, sourceLang, targetLang, contentType) {
  // Verifica cache
  const cached = translationCache.get(articleText, sourceLang, targetLang, contentType);
  if (cached) {
    console.log("✓ Translation found in cache");
    return cached.translation;
  }
  
  // Traduci e salva in cache
  const translation = await translateArticle(articleText, sourceLang, targetLang, contentType);
  translationCache.set(articleText, sourceLang, targetLang, contentType, translation);
  
  return translation;
}
```

---

## 7. Best Practices Specifiche per Gemini

### DO's (Cose da Fare)

1. **Usa System Instructions chiare e dettagliate**
   - Gemini risponde molto bene a istruzioni strutturate
   - Specifica sempre il tipo di contenuto e le aspettative

2. **Sfrutta il context window ampio**
   - Gemini 2.0 Flash: ~1M token input
   - Puoi inviare articoli molto lunghi senza chunking
   - Includi glossari e terminologia specifica nel prompt

3. **Usa temperature basse per traduzioni**
   - 0.05-0.1 per contenuti tecnici/scientifici
   - 0.1-0.2 per contenuti standard
   - 0.2-0.3 per contenuti creativi

4. **Implementa retry logic**
   - Gemini può avere rate limits (free tier)
   - Usa exponential backoff per 429 errors

5. **Valida sempre l'output**
   - Verifica lunghezza (70-130% dell'originale)
   - Controlla presenza caratteristiche lingua target
   - Valida struttura markdown/formattazione

### DON'Ts (Cose da NON Fare)

1. **Non usare temperature alte (>0.4)**
   - Rischio di aggiunte/omissioni non richieste
   - Perdita di fedeltà al testo originale

2. **Non ignorare safety filters**
   - Gemini può bloccare contenuti sensibili
   - Implementa gestione errori per SAFETY blocks

3. **Non fare troppe richieste consecutive**
   - Rispetta rate limits (15 RPM su free tier)
   - Implementa delay tra richieste se necessario

4. **Non assumere output sempre pulito**
   - Gemini può occasionalmente aggiungere note
   - Valida sempre prima di usare la traduzione

5. **Non tradurre articoli troppo lunghi senza strategia**
   - Anche con context ampio, chunking può migliorare qualità
   - Considera chunk-based per >10k parole

---

## 8. Confronto Modelli Gemini

### Gemini 2.0 Flash vs 1.5 Pro

| Caratteristica | Gemini 2.0 Flash | Gemini 1.5 Pro |
|----------------|------------------|----------------|
| **Velocità** | Molto veloce (2-3s) | Media (5-8s) |
| **Costo** | Molto economico | Più costoso |
| **Qualità** | Ottima per uso generale | Eccellente per contenuti complessi |
| **Context Window** | ~1M token | ~2M token |
| **Best For** | Traduzioni standard, news, tutorial | Contenuti scientifici, creativi, complessi |
| **Temperature consigliata** | 0.1-0.2 | 0.05-0.3 |

### Quando usare Flash vs Pro

**Usa Gemini 2.0 Flash per:**
- Traduzioni standard (news, articoli generici)
- Tutorial e guide tecniche
- Contenuti business/corporate
- Quando velocità è prioritaria
- Budget limitato

**Usa Gemini 1.5 Pro per:**
- Contenuti scientifici/accademici complessi
- Traduzioni letterarie/creative
- Articoli d'opinione con sfumature culturali
- Documentazione tecnica molto specializzata
- Quando qualità massima è prioritaria

---

## 9. Checklist Qualità Traduzione

### Completezza
- [ ] Tutto il contenuto tradotto (nessuna omissione)
- [ ] Lunghezza proporzionale (70-130% dell'originale)
- [ ] Tutti i paragrafi presenti
- [ ] Tutte le sezioni tradotte

### Fedeltà
- [ ] Significato preservato accuratamente
- [ ] Tono coerente con originale
- [ ] Dati numerici corretti
- [ ] Nomi e riferimenti accurati
- [ ] Citazioni fedeli

### Naturalezza
- [ ] Sintassi fluida nella lingua target
- [ ] Terminologia appropriata
- [ ] Espressioni idiomatiche adattate
- [ ] Nessun calco sintattico evidente
- [ ] Registro linguistico appropriato

### Formattazione
- [ ] Struttura markdown preservata
- [ ] Link funzionanti
- [ ] Grassetto/corsivo mantenuti
- [ ] Liste e numerazioni corrette
- [ ] Blocchi di codice inalterati (se presenti)

### Aspetti Tecnici
- [ ] Terminologia tecnica corretta
- [ ] Acronimi gestiti appropriatamente
- [ ] Unità di misura coerenti
- [ ] Date/numeri formattati correttamente

---

## 10. Gestione Errori Comuni

### Falsi Amici per Lingua

**Inglese → Italiano:**
- "actually" → "effettivamente" (NON "attualmente")
- "sensible" → "sensato" (NON "sensibile")
- "eventually" → "alla fine" (NON "eventualmente")
- "library" → "biblioteca" (NON "libreria")

**Spagnolo → Italiano:**
- "embarazada" → "incinta" (NON "imbarazzata")
- "burro" → "asino" (NON "burro")
- "largo" → "lungo" (NON "largo")

**Francese → Italiano:**
- "actuellement" → "attualmente" (NON "realmente")
- "librairie" → "libreria" (NON "biblioteca")
- "blesser" → "ferire" (NON "benedire")

### Calchi Sintattici da Evitare

❌ **Calco dall'inglese:** "È stato detto che..."
✅ **Corretto:** "Si è detto che..." / "È stato affermato che..."

❌ **Passivo inglese:** "Il libro è stato scritto da me"
✅ **Attivo preferibile:** "Ho scritto il libro"

❌ **Possessivo inglese:** "Il suo padre" (ambiguo)
✅ **Più chiaro:** "Il padre di lui/lei" o "Il padre di Marco"

### Formattazioni Culturali

**Date:**
- US: MM/DD/YYYY (12/25/2024)
- EU: DD/MM/YYYY (25/12/2024)
- ISO: YYYY-MM-DD (2024-12-25)

**Orari:**
- US/UK: 12-hour (3:00 PM)
- EU: 24-hour (15:00)

**Numeri:**
- US/UK: 1,234.56 (virgola per migliaia, punto per decimali)
- IT/FR/DE: 1.234,56 (punto per migliaia, virgola per decimali)

**Valute:**
- US: $1,234.56
- EU: €1.234,56 / 1.234,56 €

---

## 11. Esempi di Traduzione per Tipologia

### Esempio 1: Testo Generico (IT → EN)

**Originale (IT):**
```
L'intelligenza artificiale sta trasformando radicalmente il modo in cui lavoriamo e comunichiamo. Secondo uno studio recente, oltre il 60% delle aziende ha già implementato almeno una soluzione basata su AI. Questa tecnologia non è più un concetto futuristico, ma una realtà quotidiana che influenza settori che vanno dalla sanità alla finanza.
```

**Traduzione con Gemini (EN):**
```
Artificial intelligence is radically transforming the way we work and communicate. According to a recent study, over 60% of companies have already implemented at least one AI-based solution. This technology is no longer a futuristic concept, but a daily reality that influences sectors ranging from healthcare to finance.
```

### Esempio 2: Contenuto Tecnico (EN → IT)

**Originale (EN):**
```
To install the package, run the following command in your terminal:

```bash
npm install @google/generative-ai
```

This will download all dependencies and configure your project automatically. Make sure you have Node.js version 18 or higher installed.
```

**Traduzione con Gemini (IT):**
```
Per installare il pacchetto, esegui il seguente comando nel tuo terminale:

```bash
npm install @google/generative-ai
```

Questo scaricherà tutte le dipendenze e configurerà il tuo progetto automaticamente. Assicurati di avere installato Node.js versione 18 o superiore.
```

### Esempio 3: Contenuto Scientifico (EN → IT)

**Originale (EN):**
```
The study recruited 150 participants (M = 45.2 years, SD = 12.3) who were randomly assigned to either the experimental or control group. Results showed a significant difference in outcomes (t(148) = 3.45, p < .001, d = 0.56), suggesting that the intervention was effective in improving cognitive performance.
```

**Traduzione con Gemini (IT):**
```
Lo studio ha reclutato 150 partecipanti (M = 45,2 anni, DS = 12,3) che sono stati assegnati casualmente al gruppo sperimentale o di controllo. I risultati hanno mostrato una differenza significativa negli esiti (t(148) = 3,45, p < ,001, d = 0,56), suggerendo che l'intervento è stato efficace nel migliorare le prestazioni cognitive.
```

---

## 12. Integrazione Workflow Automatizzato

### Input API Structure

```javascript
const translationRequest = {
  articleText: "string",
  sourceLang: "it" | "en" | "es" | "fr" | "de" | "auto",
  targetLang: "it" | "en" | "es" | "fr" | "de",
  contentType: "general" | "scientific" | "news" | "tutorial" | "business" | "opinion",
  qualityLevel: "fast" | "balanced" | "quality",
  validateOutput: true,  // Abilita validazione automatica
  useCache: true         // Usa cache se disponibile
};
```

### Output API Structure

```javascript
const translationResponse = {
  success: true,
  translation: "string",
  metadata: {
    sourceLang: "en",
    targetLang: "it",
    contentType: "scientific",
    modelUsed: "gemini-2.0-flash-exp",
    originalWordCount: 850,
    translatedWordCount: 920,
    lengthRatio: 1.08,
    translationTime: "3.2s",
    temperature: 0.05,
    tokensUsed: {
      input: 1200,
      output: 1300
    }
  },
  validation: {
    passed: true,
    issues: [],
    metrics: {
      lengthRatio: 1.08,
      structureMatches: true,
      languageDetected: "it"
    }
  }
};
```

### Complete Translation Function

```javascript
async function completeTranslation(request) {
  const startTime = Date.now();
  
  try {
    // 1. Auto-detect source language if needed
    let sourceLang = request.sourceLang;
    if (sourceLang === "auto") {
      sourceLang = await detectLanguage(request.articleText);
    }
    
    // 2. Check cache
    if (request.useCache) {
      const cached = translationCache.get(
        request.articleText,
        sourceLang,
        request.targetLang,
        request.contentType
      );
      if (cached) {
        return {
          success: true,
          translation: cached.translation,
          fromCache: true,
          metadata: { ...cached.metadata, cacheHit: true }
        };
      }
    }
    
    // 3. Select model based on quality level and content type
    const modelConfig = selectModelForTranslation(
      request.articleText,
      request.contentType,
      request.qualityLevel
    );
    
    // 4. Perform translation
    const translation = await translateArticle(
      request.articleText,
      sourceLang,
      request.targetLang,
      request.contentType,
      modelConfig
    );
    
    // 5. Validate output
    let validation = { passed: true, issues: [] };
    if (request.validateOutput) {
      validation = validateTranslation(
        request.articleText,
        translation,
        sourceLang,
        request.targetLang
      );
    }
    
    // 6. Calculate metadata
    const endTime = Date.now();
    const metadata = {
      sourceLang,
      targetLang: request.targetLang,
      contentType: request.contentType,
      modelUsed: modelConfig.model,
      originalWordCount: request.articleText.split(/\s+/).length,
      translatedWordCount: translation.split(/\s+/).length,
      lengthRatio: validation.metrics.lengthRatio,
      translationTime: `${((endTime - startTime) / 1000).toFixed(1)}s`,
      temperature: modelConfig.temperature
    };
    
    // 7. Cache result
    if (request.useCache && validation.passed) {
      translationCache.set(
        request.articleText,
        sourceLang,
        request.targetLang,
        request.contentType,
        translation
      );
    }
    
    return {
      success: true,
      translation,
      metadata,
      validation,
      fromCache: false
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      errorType: error.name,
      metadata: {
        translationTime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`
      }
    };
  }
}
```

---

## 13. Best Practices Finali

### Per il Traduttore (AI/Gemini)
1. **Comprendi il contesto globale** prima di tradurre
2. **Mantieni coerenza terminologica** attraverso tutto il documento
3. **Rispetta la struttura** ma adatta sintassi alle convenzioni linguistiche
4. **Non migliorare** - traduci fedelmente ciò che c'è
5. **In caso di dubbio**, mantieni termine originale con nota

### Per l'Utilizzatore
1. **Specifica sempre lingua target** esplicitamente
2. **Indica tipo di contenuto** per prompt specializzato appropriato
3. **Fornisci glossari** quando disponibili per terminologia tecnica
4. **Valida dati numerici** manualmente dopo traduzione
5. **Rivedi citazioni e nomi** per accuratezza

### Per il Sistema
1. **Rileva lingua automaticamente** con fallback a specifica manuale
2. **Seleziona modello ottimale** (Flash vs Pro) basato su contenuto
3. **Usa temperature basse** (0.05-0.2) per determinismo
4. **Implementa validazione** automatica dell'output
5. **Fornisci metriche dettagliate** nel risultato

---

## Appendice A: Tabella Temperature per Gemini

| Temperature | Uso Raccomandato | Effetto sulla Traduzione |
|-------------|------------------|--------------------------|
| 0.0-0.05 | Traduzioni scientifiche, tecniche, legali | Massima fedeltà, output quasi deterministico |
| 0.05-0.1 | Traduzioni standard, news, business | Ottimo bilanciamento fedeltà/naturalezza |
| 0.1-0.2 | Traduzioni generiche, tutorial | Buona fedeltà con leggera flessibilità |
| 0.2-0.3 | Traduzioni creative, opinioni, letterarie | Maggiore adattamento culturale |
| 0.3-0.4 | Adattamento molto libero | Rischio di perdere fedeltà |
| 0.4+ | **Non raccomandato** | Troppa variazione, possibili omissioni |

**Raccomandazione Generale per Gemini:** 
- **0.05-0.1** per massima coerenza e fedeltà
- **0.1-0.2** per bilanciamento ottimale
- **0.2-0.3** solo per contenuti creativi che richiedono adattamento culturale

---

## Appendice B: Rate Limits Gemini

### Free Tier
- **Richieste al minuto:** 15 RPM
- **Richieste al giorno:** 1,500 RPD
- **Token al minuto:** 1M TPM (input + output)

### Strategie per Gestire Limiti
1. Implementa retry con exponential backoff
2. Usa caching per traduzioni ripetute
3. Monitora uso e implementa rate limiting client-side
4. Considera upgrade a tier paid per volumi alti

---

*Documento creato per AI Article Summarizer - Traduzioni con Google Gemini*
