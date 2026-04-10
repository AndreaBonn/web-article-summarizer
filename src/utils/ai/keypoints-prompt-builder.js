// KeypointsPromptBuilder - Template dei prompt per l'estrazione di punti chiave
// L'orchestrazione (system prompt, language map, formatArticleForPrompt) resta in PromptBuilder
// per evitare circular import. Questo modulo è puro: riceve dati già elaborati.

export class KeypointsPromptBuilder {
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
