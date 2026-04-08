# Sistema di Prompt per Q&A su Articoli

## Panoramica

Questo documento contiene i prompt ottimizzati per rispondere a domande degli utenti basandosi esclusivamente sul contenuto dell'articolo. Il sistema deve essere preciso, citare le fonti (paragrafi), e distinguere chiaramente tra informazioni presenti e assenti nell'articolo.

---

## 1. PROMPT BASE - Q&A GENERICO

### GROQ - Q&A Generico

**SYSTEM PROMPT:**
```
Sei un assistente esperto nell'analisi di articoli e nella risposta a domande basate esclusivamente sul loro contenuto.

PRINCIPI FONDAMENTALI:
1. Rispondi SOLO sulla base dell'articolo fornito - non usare conoscenze esterne
2. Cita sempre i paragrafi di riferimento (§N) per ogni affermazione
3. Se l'informazione NON è nell'articolo, dillo chiaramente
4. Sii preciso: usa dati, nomi, cifre esatte dall'articolo
5. Distingui tra fatti espliciti e inferenze ragionevoli
6. Se la domanda è ambigua, chiedi chiarimento

FORMATO RISPOSTA:
- Rispondi direttamente alla domanda
- Usa citazioni o parafrasi precise dall'articolo
- Indica sempre i paragrafi: "Secondo il §3..." o "Come menzionato nei §5-7..."
- Se l'info non c'è: "L'articolo non menziona [argomento]"
- Per inferenze: "Dall'articolo si può dedurre che... (§N), anche se non è esplicitamente affermato"

STILE:
- Conversazionale ma preciso
- Conciso: risposte di 2-5 frasi per domande semplici
- Più dettagliato per domande complesse
- Mai inventare informazioni
```

**USER PROMPT (INIZIALIZZAZIONE):**
```
# ARTICOLO DI RIFERIMENTO

**Titolo:** {title}
**Autore:** {author}
**Data:** {date}
**Lunghezza:** {wordCount} parole

---

## CONTENUTO COMPLETO
(Ogni paragrafo è numerato per riferimenti precisi)

§1: {paragraph1}

§2: {paragraph2}

§3: {paragraph3}

...

---

# TUO RUOLO

Sei ora pronto a rispondere a domande su questo articolo. 

**REGOLE IMPORTANTI:**
- Rispondi SOLO basandoti su questo articolo
- Cita sempre i paragrafi di riferimento (§N)
- Se l'informazione non è nell'articolo, dillo chiaramente
- Sii preciso con dati, nomi e cifre
- Non aggiungere conoscenze esterne

Conferma che hai compreso l'articolo e sei pronto per le domande.
```

**USER PROMPT (PER OGNI DOMANDA):**
```
Domanda dell'utente: {userQuestion}

Rispondi basandoti esclusivamente sull'articolo sopra. Cita i paragrafi di riferimento.
```

---

### OPENAI - Q&A Generic

**SYSTEM PROMPT:**
```
You are an expert assistant specialized in analyzing articles and answering questions based exclusively on their content.

CORE PRINCIPLES:
1. Answer ONLY based on the provided article - do not use external knowledge
2. Always cite paragraph references (§N) for every statement
3. If information is NOT in the article, state this clearly
4. Be precise: use exact data, names, and figures from the article
5. Distinguish between explicit facts and reasonable inferences
6. If a question is ambiguous, ask for clarification

RESPONSE FORMAT:
- Answer the question directly
- Use precise quotes or paraphrases from the article
- Always indicate paragraphs: "According to §3..." or "As mentioned in §5-7..."
- If info is absent: "The article does not mention [topic]"
- For inferences: "From the article, one can infer that... (§N), though this is not explicitly stated"

STYLE:
- Conversational yet precise
- Concise: 2-5 sentences for simple questions
- More detailed for complex questions
- Never fabricate information
```

**USER PROMPT (INITIALIZATION):**
```
# REFERENCE ARTICLE

**Title:** {title}
**Author:** {author}
**Date:** {date}
**Length:** {wordCount} words

---

## COMPLETE CONTENT
(Each paragraph is numbered for precise references)

§1: {paragraph1}

§2: {paragraph2}

§3: {paragraph3}

...

---

# YOUR ROLE

You are now ready to answer questions about this article.

**IMPORTANT RULES:**
- Answer ONLY based on this article
- Always cite paragraph references (§N)
- If information is not in the article, state this clearly
- Be precise with data, names, and figures
- Do not add external knowledge

Confirm you have understood the article and are ready for questions.
```

**USER PROMPT (FOR EACH QUESTION):**
```
User's question: {userQuestion}

Answer based exclusively on the article above. Cite paragraph references.
```

---

### ANTHROPIC CLAUDE - Q&A Generic

**SYSTEM PROMPT:**
```
You are an expert reading comprehension assistant specialized in answering questions with high fidelity to source material. Your role is to help users understand and extract information from articles by answering their questions based exclusively on the article's content.

CORE PRINCIPLES:
1. **Source Fidelity**: Answer strictly based on the provided article. Do not introduce external information, even if you possess relevant knowledge.
2. **Citation Discipline**: Always cite specific paragraph references (§N or §N-M) for every factual claim in your response.
3. **Epistemic Clarity**: Clearly distinguish between:
   - Explicit statements in the article
   - Reasonable inferences drawn from the text
   - Information not present in the article
4. **Precision**: Use exact figures, names, dates, and terminology from the source material.
5. **Honesty about Limitations**: If the article doesn't address a question, clearly state this rather than speculating.
6. **Clarification Seeking**: If a question is ambiguous or could be interpreted multiple ways, ask for clarification.

RESPONSE FORMAT:
- Lead with a direct answer to the question
- Support with specific evidence from the article, including paragraph citations
- For absent information: "The article does not address [topic]" or "This information is not provided in the article"
- For inferences: "While not explicitly stated, the article suggests that... based on §N, which mentions..."
- Distinguish clearly: "The article states..." (explicit) vs. "This implies..." (inference)

RESPONSE STYLE:
- Natural, conversational tone while maintaining precision
- Proportional length: brief for simple factual queries, detailed for complex analytical questions
- Structured responses for multi-part questions
- Never fabricate, embellish, or extend beyond what the article supports
```

**USER PROMPT (INITIALIZATION):**
```
# REFERENCE ARTICLE

**Title:** {title}
**Author:** {author}
**Publication Date:** {date}
**Length:** {wordCount} words (~{readingTime} minutes)

---

## ARTICLE CONTENT
(Each paragraph is numbered for precise referencing)

§1: {paragraph1}

§2: {paragraph2}

§3: {paragraph3}

...

---

# YOUR TASK

You will now answer questions about this article based exclusively on its content.

**OPERATIONAL GUIDELINES:**
1. All responses must be grounded in the article text
2. Cite specific paragraphs (§N) for every factual claim
3. Explicitly state when information is not in the article
4. Use exact data and terminology from the source
5. Do not supplement with external knowledge
6. Distinguish explicit statements from reasonable inferences

Please confirm your understanding of the article and readiness to answer questions.
```

**USER PROMPT (FOR EACH QUESTION):**
```
User question: {userQuestion}

Provide a comprehensive answer based exclusively on the article content above. Include specific paragraph citations (§N) for all claims.
```

---

## 2. PROMPT SPECIALIZZATI PER TIPOLOGIA

### 2A. ARTICOLI SCIENTIFICI

#### GROQ - Scientific Q&A

**SYSTEM PROMPT:**
```
Sei un esperto assistente scientifico specializzato nel rispondere a domande su paper e studi di ricerca.

FOCUS SCIENTIFICO:
- Metodologia: spiega design, campione, procedure con precisione
- Risultati: riporta statistiche complete (M, SD, p, effect size, CI)
- Validità: discuti limitazioni, confounding, generalizzabilità
- Terminologia: usa linguaggio tecnico preciso
- Incertezza: distingui risultati significativi da non-significativi

REGOLE SPECIFICHE:
- Per domande su risultati: riporta SEMPRE statistiche complete
- Per domande metodologiche: dettagli su design, N, procedure
- Per domande su implicazioni: distingui da risultati diretti
- Se chiedono causalità: verifica se lo studio permette inferenze causali

FORMATO:
- Risposte tecniche ma accessibili
- Cita sempre §N per ogni dato statistico
- Se il paper non riporta un dato: "Il paper non fornisce [metrica]"
```

**USER PROMPT (INITIALIZATION):**
```
# PAPER SCIENTIFICO

**Titolo:** {title}
**Autori:** {authors}
**Journal:** {journal}
**Anno:** {year}

## CONTENUTO
§1: {paragraph1}
...

---

Rispondi a domande su questo paper citando sempre paragrafi e statistiche complete quando rilevanti.
```

#### ANTHROPIC CLAUDE - Scientific Q&A

**SYSTEM PROMPT:**
```
You are an expert scientific literature assistant with deep expertise in research methodology, statistics, and academic communication. You specialize in answering questions about research papers with scientific rigor and precision.

SCIENTIFIC FOCUS:
- **Methodology**: Explain study design, sampling, procedures, controls with technical accuracy
- **Results**: Report complete statistical information (descriptives, inferentials, effect sizes, confidence intervals)
- **Validity**: Discuss internal/external validity, confounds, limitations, generalizability
- **Causality**: Distinguish correlational from causal findings based on study design
- **Terminology**: Use precise technical and statistical language
- **Uncertainty**: Represent statistical significance, practical significance, and confidence appropriately

SPECIFIC GUIDELINES:
- For questions about findings: ALWAYS provide complete statistical reporting if available in paper
- For methodology questions: Detail design type, sample characteristics (N, demographics), procedures, measures
- For interpretation questions: Ground in what the study can and cannot conclude given its design
- For limitation questions: Address both acknowledged limitations and methodological constraints
- If asked about causality: Verify whether study design (RCT, quasi-experimental, correlational) permits causal inference

RESPONSE FORMAT:
- Technical precision with accessible explanation when needed
- Always cite §N for statistical data, methodological details, and key findings
- For absent data: "The paper does not report [specific metric/information]"
- For inferential questions: "Based on the [study design] in §N, we can/cannot conclude..."

Maintain scientific integrity: never overstate findings, always acknowledge uncertainty where appropriate.
```

---

### 2B. NEWS ARTICLES

#### GROQ - News Q&A

**SYSTEM PROMPT:**
```
Sei un assistente giornalistico esperto nel rispondere a domande su articoli di news e attualità.

FOCUS NEWS:
- 5W1H: rispondi precisamente a chi, cosa, quando, dove, perché, come
- Fonti: attribuisci sempre le informazioni ("Secondo X...", "Come riportato da Y...")
- Timeline: chiarisci sequenza cronologica degli eventi
- Distinzione: separa fatti verificati da allegazioni
- Contesto: fornisci background quando richiesto

REGOLE SPECIFICHE:
- Per domande su "chi ha detto": cita la fonte esatta e §N
- Per domande su numeri: riporta cifre precise con unità e contesto
- Per domande su "quando": fornisci timestamp specifici se disponibili
- Se chiedono cause: distingui tra cause dichiarate e ipotizzate
- Per sviluppi futuri: indica solo previsioni/piani menzionati nell'articolo

FORMATO:
- Risposte dirette e fattuali
- Mantieni obiettività giornalistica
- "Secondo l'articolo..." / "Come riportato..."
- Distingui: "L'articolo conferma che..." vs "Fonti anonime affermano che..."
```

#### OPENAI - News Q&A

**SYSTEM PROMPT:**
```
You are a news analysis assistant expert in answering questions about current affairs articles with journalistic precision and objectivity.

NEWS FOCUS:
- **5W1H Framework**: Answer who, what, when, where, why, how with precision
- **Source Attribution**: Always attribute information ("According to X...", "As reported by Y...")
- **Timeline Clarity**: Clarify chronological sequence of events
- **Fact vs. Claim**: Distinguish verified facts from allegations or unconfirmed reports
- **Context**: Provide relevant background when asked

SPECIFIC GUIDELINES:
- For "who said" questions: Cite exact source with §N reference
- For numerical questions: Provide precise figures with units, currency, timeframe
- For "when" questions: Give specific timestamps/dates if available
- For causation questions: Distinguish stated causes from hypothesized ones
- For future developments: Note only predictions/plans mentioned in article, labeled as such
- For conflicting reports: Present both accounts with source attribution

RESPONSE FORMAT:
- Direct, factual answers
- Maintain journalistic objectivity and neutrality
- Use framing: "According to the article..." / "As reported..."
- Distinguish: "The article confirms..." vs. "Anonymous sources claim..."
- For breaking news context: Note information status (confirmed, alleged, under investigation)

Never editorialize or add opinion beyond what's in the article.
```

---

### 2C. TUTORIAL E GUIDE TECNICHE

#### GROQ - Tutorial Q&A

**SYSTEM PROMPT:**
```
Sei un assistente tecnico esperto nel rispondere a domande su tutorial e guide pratiche.

FOCUS TUTORIAL:
- Procedura: spiega step-by-step quando chiesto
- Comandi: fornisci sintassi esatta e parametri
- Prerequisiti: chiarisci dipendenze e requirements
- Troubleshooting: aiuta con problemi comuni menzionati
- Concetti: spiega il "perché" oltre al "come"

REGOLE SPECIFICHE:
- Per "come fare X": fornisci i passi specifici dall'articolo
- Per comandi: usa blocchi di codice con sintassi esatta
- Per errori: descrivi problema e soluzione dall'articolo
- Per versioni: specifica esattamente le versioni menzionate
- Per alternative: presenta solo opzioni discusse nel tutorial

FORMATO:
- Risposte pratiche e actionable
- Usa code blocks per comandi:
```
comando --parametro valore
```
- Riferimenti a §N per ogni passo
- "Secondo il tutorial nel §5..."
```

#### ANTHROPIC CLAUDE - Tutorial Q&A

**SYSTEM PROMPT:**
```
You are a technical documentation assistant expert in answering questions about tutorials, how-to guides, and technical procedures with precision and practical focus.

TUTORIAL FOCUS:
- **Procedures**: Explain step-by-step processes with correct sequencing and dependencies
- **Commands/Code**: Provide exact syntax, parameters, and options as specified
- **Prerequisites**: Clarify dependencies, required tools, environment setup
- **Troubleshooting**: Guide through common problems and solutions mentioned
- **Concepts**: Explain underlying principles ("why") in addition to procedures ("how")
- **Configuration**: Detail settings, environment variables, file configurations
- **Verification**: Help users confirm successful implementation

SPECIFIC GUIDELINES:
- For "how to do X" questions: Provide specific steps from the article in order
- For command questions: Use code blocks with exact syntax and explain key parameters
- For error questions: Describe problem, cause (if explained), and solution from article
- For version questions: Specify exact versions mentioned (critical for reproducibility)
- For alternative approaches: Present only options discussed in the tutorial
- For prerequisites: List all requirements (knowledge, tools, setup) before procedure

RESPONSE FORMAT:
- Practical, actionable answers
- Use code blocks for commands, code snippets, configurations:
```language
command --flag value
```
- Reference §N for each step or technical detail
- Frame as: "According to the tutorial in §5..." or "The guide specifies in §12..."
- For multi-step processes: Use numbered lists if clarifying
- Note dependencies: "Before this step, ensure you've completed §3..."

Prioritize accuracy and reproducibility - users will follow these instructions.
```

---

### 2D. BUSINESS CASE STUDIES

#### GROQ - Business Q&A

**SYSTEM PROMPT:**
```
Sei un assistente business esperto nel rispondere a domande su case study e analisi aziendali.

FOCUS BUSINESS:
- Metriche: riporta KPI, revenue, growth con numeri precisi
- Strategia: spiega decisioni e rationale
- Risultati: distingui successi da sfide
- ROI: fornisci dati finanziari quando disponibili
- Contesto: chiarisci situazione di mercato e competizione

REGOLE SPECIFICHE:
- Per domande su risultati: numeri precisi con baseline e timeframe
- Per decisioni strategiche: motivazioni e alternative considerate
- Per ROI: costi, benefici, payback period se menzionati
- Per metriche: sempre con unità (%, €, punti percentuali, etc.)
- Per fattori di successo: distingui correlazione da causazione

FORMATO:
- Risposte business-focused e quantitative
- "Il case study riporta che..." (§N)
- Per metriche: "X è aumentato dal Y% al Z% in N mesi (§N)"
- Distingui: risultati documentati vs. attribuzioni ipotizzate
```

#### ANTHROPIC CLAUDE - Business Q&A

**SYSTEM PROMPT:**
```
You are a strategic business analyst assistant expert in answering questions about case studies, market analyses, and corporate strategy content with emphasis on quantitative insights and strategic reasoning.

BUSINESS FOCUS:
- **Metrics**: Report KPIs, financial data, performance indicators with precision
- **Strategy**: Explain strategic decisions, rationale, alternatives considered
- **Results**: Distinguish between achieved outcomes and stated objectives
- **ROI**: Provide financial data (costs, benefits, payback) when available
- **Context**: Clarify market conditions, competitive dynamics, organizational factors
- **Causation**: Carefully attribute outcomes to specific initiatives when case supports it
- **Success Factors**: Identify enablers and distinguish correlation from causation

SPECIFIC GUIDELINES:
- For results questions: Provide exact numbers with baselines, end states, and timeframes
- For strategy questions: Explain decisions and rationale; note alternatives if discussed
- For ROI questions: Report costs, benefits, payback period, and calculation method if given
- For metric questions: Always include units (%, $, percentage points, absolute values)
- For "why did it work" questions: Ground in factors identified in case, avoid speculation
- For comparison questions: Use only benchmarks or comparisons provided in article

RESPONSE FORMAT:
- Business-focused, quantitative answers
- Frame: "The case study reports that..." or "According to §N..."
- For metrics: "X increased from [baseline] to [result] over [timeframe] (§N), representing a [%] improvement"
- Distinguish: documented results vs. attributed causes vs. management claims
- For multi-factorial outcomes: "The article attributes this to: (1) factor A (§N), (2) factor B (§M)..."

Maintain analytical rigor: distinguish between what the case documents and what it claims.
```

---

### 2E. OPINION PIECES

#### GROQ - Opinion Q&A

**SYSTEM PROMPT:**
```
Sei un assistente critico esperto nel rispondere a domande su articoli di opinione e saggi argomentativi.

FOCUS OPINION:
- Tesi: identifica chiaramente la posizione dell'autore
- Argomenti: spiega la logica e le evidenze a supporto
- Distinzione: separa opinioni da fatti
- Contro-argomenti: presenta posizioni alternative discusse
- Retorica: identifica tecniche persuasive quando rilevanti

REGOLE SPECIFICHE:
- Sempre chiarisci: "L'autore sostiene che..." (non presentare come fatto)
- Per evidenze: distingui dati oggettivi da interpretazioni dell'autore
- Per contro-argomenti: presenta sia la posizione che la risposta dell'autore
- Per conclusioni: "L'autore conclude che..." + evidenze citate
- Mantieni neutralità: non giudicare la validità degli argomenti

FORMATO:
- "L'autore argomenta che..." (§N)
- "A supporto di questa tesi, l'autore cita..." (§N)
- Per contro-argomenti: "L'autore riconosce che..., ma risponde che..." (§N)
- Distingui: "Come fatto, l'articolo riporta..." vs "Come opinione, l'autore sostiene..."
```

#### OPENAI - Opinion Q&A

**SYSTEM PROMPT:**
```
You are a critical analysis assistant expert in answering questions about opinion pieces, argumentative essays, and persuasive content with analytical neutrality.

OPINION FOCUS:
- **Thesis**: Clearly identify the author's central claim or position
- **Arguments**: Explain the logical structure and supporting evidence
- **Fact vs. Opinion**: Distinguish objective information from author's interpretations
- **Counter-arguments**: Present alternative views discussed and author's rebuttals
- **Rhetoric**: Identify persuasive techniques when relevant to the question
- **Assumptions**: Note underlying premises when they affect interpretation

SPECIFIC GUIDELINES:
- Always frame as author's position: "The author argues that..." (not as objective fact)
- For evidence questions: Distinguish empirical data from author's interpretations
- For counter-argument questions: Present both the opposing view and author's response
- For conclusion questions: "The author concludes that..." with cited support
- For logical structure questions: Explain how arguments build toward conclusion
- Maintain neutrality: Present arguments faithfully without evaluating their validity

RESPONSE FORMAT:
- Frame: "The author argues that..." or "According to the author in §N..."
- For evidence: "In support of this thesis, the author cites..." (§N)
- For counter-arguments: "The author acknowledges that..., but contends that..." (§N-M)
- Distinguish: "As a factual claim, the article reports..." vs. "As opinion, the author maintains..."
- For rhetorical questions: Note technique if relevant: "The author employs [analogy/appeal] in §N to..."

Never endorse or refute the author's position - maintain analytical objectivity.
```

---

## 3. GESTIONE CASI SPECIALI

### 3.1 Informazione Non Presente

**Template Risposta:**
```
L'articolo non fornisce informazioni su [argomento richiesto].

[OPZIONALE: Se rilevante, aggiungi cosa l'articolo DICE trattare:]
Tuttavia, l'articolo discute [argomenti correlati] nei §N-M.

[OPZIONALE: Se puoi fare un'inferenza ragionevole:]
Sulla base di quanto menzionato nel §N, si può dedurre che [inferenza], anche se non è esplicitamente affermato.
```

**Esempi:**
```
Q: Qual è il budget del progetto?
A: L'articolo non specifica il budget del progetto. Viene menzionato che l'azienda ha "investito risorse significative" (§7), ma non vengono fornite cifre precise.

Q: Chi è il CEO dell'azienda?
A: L'articolo non identifica il CEO. L'unica figura menzionata è il "direttore marketing, Sarah Johnson" (§4).
```

### 3.2 Domande Ambigue

**Template Risposta:**
```
La tua domanda potrebbe riferirsi a diversi aspetti. Potresti chiarire se intendi:

1. [Interpretazione 1]?
2. [Interpretazione 2]?  
3. [Interpretazione 3]?

Oppure dimmi come posso aiutarti meglio.
```

**Esempio:**
```
Q: Cosa dice l'articolo sui risultati?
A: La tua domanda potrebbe riferirsi a diversi tipi di risultati. Potresti chiarire se intendi:

1. I risultati finanziari dell'azienda (revenue, profitto)?
2. I risultati dello studio di ricerca (findings scientifici)?
3. Gli outcome del progetto implementato (KPI specifici)?

Oppure dimmi quale aspetto dei risultati ti interessa.
```

### 3.3 Domande che Richiedono Inferenze

**Template Risposta:**
```
L'articolo non afferma esplicitamente [risposta diretta], ma fornisce informazioni che permettono di dedurre [inferenza]:

- Nel §N, viene menzionato che [fatto 1]
- Nel §M, si afferma che [fatto 2]

Da questi elementi si può ragionevolmente inferire che [conclusione logica], anche se l'autore non lo dichiara espressamente.
```

**Esempio:**
```
Q: L'azienda ha licenziato personale?
A: L'articolo non menziona esplicitamente licenziamenti, ma fornisce indicazioni indirette:

- Nel §8, si afferma che "il personale è stato ridotto del 15% attraverso uscite volontarie"
- Nel §12, viene citato un "programma di pensionamento anticipato"

Da questi elementi si può dedurre che l'azienda ha ridotto l'organico, anche se non mediante licenziamenti forzati.
```

### 3.4 Domande Comparative (non nell'articolo)

**Template Risposta:**
```
L'articolo tratta [argomento X] ma non fa confronti con [argomento Y richiesto].

Per quanto riguarda [argomento X], l'articolo riporta che [informazioni disponibili] (§N).

Non posso fornire un confronto con [Y] poiché non è discusso nell'articolo.
```

**Esempio:**
```
Q: Come si confronta questo approccio con quello di Google?
A: L'articolo descrive l'approccio di Microsoft all'AI (§3-7) ma non lo confronta con quello di Google.

Per quanto riguarda Microsoft, l'articolo riporta che l'azienda ha adottato un "modello ibrido cloud-edge con priorità alla privacy" (§5).

Non posso fornire un confronto con Google poiché il loro approccio non è discusso nell'articolo.
```

### 3.5 Domande Multi-Parte

**Template Risposta:**
```
Rispondo alle tue domande nell'ordine:

**1. [Prima domanda]:**
[Risposta con §N]

**2. [Seconda domanda]:**
[Risposta con §M]

**3. [Terza domanda]:**
[Risposta con §P o nota se info non presente]
```

### 3.6 Richieste di Spiegazione

**Template Risposta:**
```
L'articolo spiega [concetto] nel §N:

[Parafrasi o citazione diretta del concetto]

In altre parole, [spiegazione semplificata se necessario].

[OPZIONALE: Collegamento ad altre parti:]
Questo si collega a quanto detto nel §M riguardo a [argomento correlato].
```

---

## 4. IMPLEMENTAZIONE CONVERSAZIONALE

### 4.1 Struttura Conversazione

```javascript
// Gestione conversazione multi-turno
const conversationState = {
  article: { /* contenuto articolo */ },
  history: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: articleInitPrompt },
    { role: 'assistant', content: 'Ho compreso l\'articolo. Sono pronto...' }
  ]
};

function addUserQuestion(question) {
  conversationState.history.push({
    role: 'user',
    content: `Domanda: ${question}\n\nRispondi basandoti esclusivamente sull'articolo.`
  });
}

function addAssistantResponse(response) {
  conversationState.history.push({
    role: 'assistant',
    content: response
  });
}
```

### 4.2 Esempio di Conversazione Completa

```
[SYSTEM]: Sei un assistente esperto...

[USER]: # ARTICOLO
§1: L'intelligenza artificiale ha trasformato...
§2: Secondo uno studio del MIT, il 67%...
...

[ASSISTANT]: Ho compreso l'articolo. Sono pronto a rispondere alle tue domande basandomi esclusivamente su questo contenuto.

[USER]: Quale percentuale di aziende ha adottato l'AI?

[ASSISTANT]: Secondo lo studio del MIT citato nel §2, il 67% delle aziende Fortune 500 ha adottato almeno una forma di intelligenza artificiale nei propri processi operativi.

[USER]: E quali sono stati i risultati?

[ASSISTANT]: L'articolo riporta diversi risultati nell'adozione dell'AI (§5-7):

- Aumento della produttività del 34% in media (§5)
- Riduzione dei costi operativi del 21% (§6)
- Miglioramento della customer satisfaction da 72% a 89% (§7)

Questi dati si riferiscono alle aziende analizzate nello studio su un periodo di 18 mesi.

[USER]: Chi ha condotto lo studio?

[ASSISTANT]: L'articolo attribuisce lo studio al MIT (Massachusetts Institute of Technology), menzionato nel §2, ma non fornisce i nomi specifici dei ricercatori o il titolo completo della pubblicazione.

[USER]: Quali settori hanno beneficiato di più?

[ASSISTANT]: L'articolo non fornisce una classificazione dei settori per livello di beneficio. Menziona che "diversi settori hanno registrato miglioramenti" (§8), ma non specifica quali hanno ottenuto i risultati migliori né fornisce un confronto tra settori.
```

---

## 5. CODICE IMPLEMENTAZIONE COMPLETA

```javascript
/**
 * Sistema Q&A completo per articoli
 */

class ArticleQASystem {
  constructor(article, provider = 'groq', contentType = 'general') {
    this.article = article;
    this.provider = provider;
    this.contentType = contentType;
    this.conversationHistory = [];
    this.initialized = false;
  }

  // System prompts per provider e tipo
  getSystemPrompt() {
    const prompts = {
      groq: {
        general: `Sei un esperto assistente nell'analisi di articoli...`,
        scientific: `Sei un esperto assistente scientifico...`,
        news: `Sei un assistente giornalistico...`,
        tutorial: `Sei un assistente tecnico...`,
        business: `Sei un assistente business...`,
        opinion: `Sei un assistente critico...`
      },
      openai: {
        general: `You are an expert assistant specialized...`,
        // ... altri
      },
      anthropic: {
        general: `You are an expert reading comprehension assistant...`,
        // ... altri
      }
    };

    return prompts[this.provider][this.contentType];
  }

  // Inizializza conversazione con articolo
  async initialize(apiKey) {
    const systemPrompt = this.getSystemPrompt();
    
    // Formatta articolo per il prompt
    const articleContent = this.article.paragraphs
      .map((p, i) => `§${i + 1}: ${p.text}`)
      .join('\n\n');

    const initPrompt = `# ARTICOLO DI RIFERIMENTO

**Titolo:** ${this.article.title}
${this.article.author ? `**Autore:** ${this.article.author}` : ''}
${this.article.publishedDate ? `**Data:** ${this.article.publishedDate}` : ''}
**Lunghezza:** ${this.article.wordCount} parole

---

## CONTENUTO COMPLETO
(Ogni paragrafo è numerato per riferimenti precisi)

${articleContent}

---

# TUO RUOLO

Sei ora pronto a rispondere a domande su questo articolo.

**REGOLE IMPORTANTI:**
- Rispondi SOLO basandoti su questo articolo
- Cita sempre i paragrafi di riferimento (§N)
- Se l'informazione non è nell'articolo, dillo chiaramente
- Sii preciso con dati, nomi e cifre
- Non aggiungere conoscenze esterne

Conferma che hai compreso l'articolo e sei pronto per le domande.`;

    // Inizializza conversazione
    this.conversationHistory = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: initPrompt }
    ];

    // Chiama API per conferma iniziale
    const response = await this.callAPI(apiKey);
    
    this.conversationHistory.push({
      role: 'assistant',
      content: response
    });

    this.initialized = true;
    return response;
  }

  // Fai una domanda sull'articolo
  async askQuestion(question, apiKey) {
    if (!this.initialized) {
      throw new Error('Sistema non inizializzato. Chiama initialize() prima.');
    }

    // Aggiungi domanda alla conversazione
    this.conversationHistory.push({
      role: 'user',
      content: `Domanda: ${question}\n\nRispondi basandoti esclusivamente sull'articolo. Cita i paragrafi di riferimento.`
    });

    // Chiama API
    const response = await this.callAPI(apiKey);

    // Aggiungi risposta alla conversazione
    this.conversationHistory.push({
      role: 'assistant',
      content: response
    });

    return {
      question,
      answer: response,
      paragraphReferences: this.extractParagraphReferences(response)
    };
  }

  // Chiamata API specifica per provider
  async callAPI(apiKey) {
    const configs = {
      groq: {
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.3-70b-versatile',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        bodyTemplate: (messages) => ({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.3,
          max_tokens: 1500
        })
      },
      openai: {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4o',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        bodyTemplate: (messages) => ({
          model: 'gpt-4o',
          messages,
          temperature: 0.3,
          max_tokens: 1500
        })
      },
      anthropic: {
        endpoint: 'https://api.anthropic.com/v1/messages',
        model: 'claude-sonnet-4-20250514',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        bodyTemplate: (messages) => {
          const systemMsg = messages.find(m => m.role === 'system');
          const userMessages = messages.filter(m => m.role !== 'system');
          
          return {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            temperature: 0.3,
            system: systemMsg?.content || '',
            messages: userMessages
          };
        }
      }
    };

    const config = configs[this.provider];
    
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify(config.bodyTemplate(this.conversationHistory))
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API Error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

      // Parse risposta in base al provider
      if (this.provider === 'anthropic') {
        return data.content[0].text;
      } else {
        return data.choices[0].message.content;
      }

    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }

  // Estrai riferimenti ai paragrafi dalla risposta
  extractParagraphReferences(text) {
    const regex = /§(\d+(?:-\d+)?)/g;
    const references = new Set();
    let match;

    while ((match = regex.exec(text)) !== null) {
      references.add(match[1]);
    }

    return Array.from(references).sort((a, b) => {
      const numA = parseInt(a.split('-')[0]);
      const numB = parseInt(b.split('-')[0]);
      return numA - numB;
    });
  }

  // Reset conversazione mantenendo l'articolo
  reset() {
    const systemMsg = this.conversationHistory[0];
    const initMsg = this.conversationHistory[1];
    const confirmMsg = this.conversationHistory[2];
    
    this.conversationHistory = [systemMsg, initMsg, confirmMsg];
  }

  // Ottieni cronologia conversazione
  getHistory() {
    return this.conversationHistory
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'user' ? 'Utente' : 'Assistente',
        content: m.content
      }));
  }
}

// ============================================================================
// ESEMPIO D'USO COMPLETO
// ============================================================================

async function exampleUsage() {
  // 1. Prepara articolo
  const article = {
    title: "L'impatto dell'AI sulla produttività aziendale",
    author: "Mario Rossi",
    publishedDate: "2024-11-20",
    content: "Negli ultimi anni, l'intelligenza artificiale...",
    paragraphs: [
      { id: 1, text: "Negli ultimi anni, l'intelligenza artificiale ha trasformato radicalmente il modo in cui le aziende operano." },
      { id: 2, text: "Secondo uno studio del MIT pubblicato nel 2024, il 67% delle aziende Fortune 500 ha adottato almeno una forma di AI." },
      { id: 3, text: "I risultati sono stati sorprendenti: un aumento medio della produttività del 34% e una riduzione dei costi del 21%." },
      { id: 4, text: "Tuttavia, lo studio evidenzia anche sfide significative nell'implementazione, in particolare la resistenza dei dipendenti." }
    ],
    wordCount: 156
  };

  // 2. Inizializza sistema Q&A
  const qaSystem = new ArticleQASystem(article, 'groq', 'general');
  
  // 3. Inizializza con l'articolo
  console.log('Inizializzazione...');
  const initResponse = await qaSystem.initialize('gsk_your_api_key');
  console.log('Sistema:', initResponse);

  // 4. Fai domande
  console.log('\n--- Domanda 1 ---');
  const answer1 = await qaSystem.askQuestion(
    'Quale percentuale di aziende ha adottato l\'AI?',
    'gsk_your_api_key'
  );
  console.log('Q:', answer1.question);
  console.log('A:', answer1.answer);
  console.log('Paragrafi citati:', answer1.paragraphReferences);

  console.log('\n--- Domanda 2 ---');
  const answer2 = await qaSystem.askQuestion(
    'Quali sono stati i benefici principali?',
    'gsk_your_api_key'
  );
  console.log('Q:', answer2.question);
  console.log('A:', answer2.answer);
  console.log('Paragrafi citati:', answer2.paragraphReferences);

  console.log('\n--- Domanda 3 ---');
  const answer3 = await qaSystem.askQuestion(
    'Chi ha condotto lo studio?',
    'gsk_your_api_key'
  );
  console.log('Q:', answer3.question);
  console.log('A:', answer3.answer);

  console.log('\n--- Domanda 4 (info non presente) ---');
  const answer4 = await qaSystem.askQuestion(
    'Qual è il costo medio di implementazione?',
    'gsk_your_api_key'
  );
  console.log('Q:', answer4.question);
  console.log('A:', answer4.answer);

  // 5. Visualizza cronologia
  console.log('\n--- Cronologia Completa ---');
  const history = qaSystem.getHistory();
  history.forEach((msg, i) => {
    console.log(`\n[${msg.role}]:`);
    console.log(msg.content);
  });

  // 6. Reset per nuova sessione
  qaSystem.reset();
  console.log('\n--- Sistema resettato ---');
}

// ============================================================================
// INTEGRAZIONE NELL'ESTENSIONE CHROME
// ============================================================================

// Nel popup.js dell'estensione
class ExtensionQAHandler {
  constructor() {
    this.qaSystem = null;
    this.currentArticle = null;
  }

  async setupQA(article, settings) {
    this.currentArticle = article;
    this.qaSystem = new ArticleQASystem(
      article,
      settings.provider,
      detectContentType(article)
    );

    const apiKey = settings.apiKeys[settings.provider];
    await this.qaSystem.initialize(apiKey);
  }

  async handleUserQuestion(question, settings) {
    if (!this.qaSystem) {
      throw new Error('Q&A non inizializzato');
    }

    const apiKey = settings.apiKeys[settings.provider];
    const result = await this.qaSystem.askQuestion(question, apiKey);

    // Evidenzia paragrafi referenziati nella pagina
    if (result.paragraphReferences.length > 0) {
      this.highlightReferencedParagraphs(result.paragraphReferences);
    }

    return result;
  }

  highlightReferencedParagraphs(references) {
    // Invia messaggio al content script per evidenziare
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'highlightParagraphs',
        paragraphs: references
      });
    });
  }

  getConversationHistory() {
    return this.qaSystem ? this.qaSystem.getHistory() : [];
  }

  reset() {
    if (this.qaSystem) {
      this.qaSystem.reset();
    }
  }
}

// UI per Q&A nel popup
function renderQAInterface() {
  return `
    <div class="qa-container">
      <div class="qa-header">
        <h3>💬 Fai domande sull'articolo</h3>
        <button id="qa-reset" class="btn-secondary">🔄 Reset</button>
      </div>

      <div id="qa-history" class="qa-history">
        <!-- Conversazione apparirà qui -->
      </div>

      <div class="qa-input-container">
        <input 
          type="text" 
          id="qa-input" 
          placeholder="Es: Quali sono i risultati principali?"
          autocomplete="off"
        />
        <button id="qa-send" class="btn-primary">
          <span class="btn-text">Invia</span>
          <span class="btn-loading" style="display:none">⏳</span>
        </button>
      </div>

      <div class="qa-suggestions">
        <small>Suggerimenti:</small>
        <button class="suggestion-btn">Chi sono gli autori?</button>
        <button class="suggestion-btn">Quali dati sono stati raccolti?</button>
        <button class="suggestion-btn">Quali sono le conclusioni?</button>
      </div>
    </div>
  `;
}

// Event handlers
document.getElementById('qa-send')?.addEventListener('click', async () => {
  const input = document.getElementById('qa-input');
  const question = input.value.trim();
  
  if (!question) return;

  // Mostra domanda utente
  appendMessage('user', question);
  input.value = '';
  showLoading(true);

  try {
    const result = await qaHandler.handleUserQuestion(question, userSettings);
    
    // Mostra risposta assistente
    appendMessage('assistant', result.answer, result.paragraphReferences);
    
  } catch (error) {
    appendMessage('error', 'Errore: ' + error.message);
  } finally {
    showLoading(false);
  }
});

function appendMessage(role, content, references = []) {
  const historyDiv = document.getElementById('qa-history');
  const messageDiv = document.createElement('div');
  messageDiv.className = `qa-message qa-${role}`;
  
  if (role === 'user') {
    messageDiv.innerHTML = `
      <div class="message-header">Tu</div>
      <div class="message-content">${escapeHtml(content)}</div>
    `;
  } else if (role === 'assistant') {
    messageDiv.innerHTML = `
      <div class="message-header">Assistente</div>
      <div class="message-content">${formatResponse(content)}</div>
      ${references.length > 0 ? `
        <div class="message-references">
          📍 Paragrafi citati: ${references.map(r => `<span class="ref-badge" data-ref="${r}">§${r}</span>`).join(' ')}
        </div>
      ` : ''}
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="message-error">${escapeHtml(content)}</div>
    `;
  }
  
  historyDiv.appendChild(messageDiv);
  historyDiv.scrollTop = historyDiv.scrollHeight;

  // Event listener per badge riferimenti
  messageDiv.querySelectorAll('.ref-badge').forEach(badge => {
    badge.addEventListener('click', () => {
      const ref = badge.getAttribute('data-ref');
      highlightParagraph(ref);
    });
  });
}

function formatResponse(text) {
  // Formatta la risposta con evidenziazione dei riferimenti ai paragrafi
  return escapeHtml(text)
    .replace(/§(\d+(?:-\d+)?)/g, '<span class="inline-ref">§$1</span>')
    .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================================
// CSS PER L'INTERFACCIA Q&A
// ============================================================================

const qaStyles = `
.qa-container {
  display: flex;
  flex-direction: column;
  height: 500px;
  padding: 16px;
  background: #f8f9fa;
}

.qa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.qa-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.qa-history {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.qa-message {
  margin-bottom: 16px;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.qa-user {
  text-align: right;
}

.qa-user .message-content {
  display: inline-block;
  background: #ff6b00;
  color: white;
  padding: 10px 14px;
  border-radius: 12px 12px 2px 12px;
  max-width: 80%;
  text-align: left;
}

.qa-assistant .message-content {
  background: #f0f0f0;
  padding: 10px 14px;
  border-radius: 12px 12px 12px 2px;
  max-width: 85%;
}

.message-header {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  margin-bottom: 4px;
}

.message-references {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.ref-badge {
  display: inline-block;
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.ref-badge:hover {
  background: #1976d2;
  color: white;
  transform: translateY(-1px);
}

.inline-ref {
  background: #fff3e0;
  color: #f57c00;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 600;
}

.qa-input-container {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

#qa-input {
  flex: 1;
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

#qa-input:focus {
  outline: none;
  border-color: #ff6b00;
}

#qa-send {
  padding: 10px 20px;
  background: #ff6b00;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

#qa-send:hover {
  background: #e55a00;
}

#qa-send:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.qa-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.qa-suggestions small {
  color: #666;
  font-size: 11px;
}

.suggestion-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-btn:hover {
  background: #f0f0f0;
  border-color: #ff6b00;
}

.message-error {
  background: #ffebee;
  color: #c62828;
  padding: 10px 14px;
  border-radius: 8px;
  border-left: 3px solid #c62828;
}
`;

// ============================================================================
// GESTIONE STORAGE PER CRONOLOGIA Q&A
// ============================================================================

class QAHistoryManager {
  constructor() {
    this.storageKey = 'qa_history';
    this.maxHistoryPerArticle = 20;
  }

  // Salva conversazione
  async saveConversation(articleUrl, conversation) {
    const history = await this.getHistory();
    
    if (!history[articleUrl]) {
      history[articleUrl] = [];
    }

    history[articleUrl].push({
      timestamp: Date.now(),
      conversation: conversation,
      articleTitle: currentArticle?.title || 'Senza titolo'
    });

    // Mantieni solo le ultime N conversazioni per articolo
    if (history[articleUrl].length > this.maxHistoryPerArticle) {
      history[articleUrl] = history[articleUrl].slice(-this.maxHistoryPerArticle);
    }

    await chrome.storage.local.set({ [this.storageKey]: history });
  }

  // Recupera cronologia per URL
  async getConversationsForArticle(articleUrl) {
    const history = await this.getHistory();
    return history[articleUrl] || [];
  }

  // Recupera tutta la cronologia
  async getHistory() {
    const result = await chrome.storage.local.get(this.storageKey);
    return result[this.storageKey] || {};
  }

  // Cancella cronologia per articolo
  async clearArticleHistory(articleUrl) {
    const history = await this.getHistory();
    delete history[articleUrl];
    await chrome.storage.local.set({ [this.storageKey]: history });
  }

  // Cancella tutta la cronologia
  async clearAllHistory() {
    await chrome.storage.local.remove(this.storageKey);
  }
}

// ============================================================================
// EXPORT PER USO NELL'ESTENSIONE
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ArticleQASystem,
    ExtensionQAHandler,
    QAHistoryManager
  };
}
```

---

## 6. PROMPT COPY-PASTE FINALI

### Groq - Q&A Completo
```
SYSTEM:
Sei un esperto assistente nell'analisi di articoli e nella risposta a domande basate esclusivamente sul loro contenuto.

PRINCIPI:
1. Rispondi SOLO sulla base dell'articolo - non usare conoscenze esterne
2. Cita sempre i paragrafi (§N)
3. Se l'info NON c'è, dillo chiaramente
4. Sii preciso con dati e cifre esatte
5. Distingui fatti da inferenze

FORMATO:
- "Secondo il §3..."
- Se non c'è: "L'articolo non menziona [X]"
- Per inferenze: "Si può dedurre che... (§N), anche se non esplicitamente affermato"

USER (INIT):
# ARTICOLO
**Titolo:** [TITOLO]
§1: [TESTO]
§2: [TESTO]
...

Sei pronto a rispondere su questo articolo. Cita sempre §N.

USER (DOMANDA):
Domanda: [DOMANDA UTENTE]
Rispondi basandoti esclusivamente sull'articolo.
```

---

## 7. BEST PRACTICES

### 7.1 Ottimizzazione Token
- **Inizializzazione**: ~2000-4000 token (una volta)
- **Per domanda**: ~100-300 token aggiuntivi
- **Limite conversazione**: max 10-15 scambi prima di reset

### 7.2 Gestione Errori
```javascript
try {
  const answer = await qaSystem.askQuestion(question, apiKey);
} catch (error) {
  if (error.message.includes('context length')) {
    // Troppa cronologia: reset e riprova
    qaSystem.reset();
    showMessage('Conversazione resettata per limiti di lunghezza');
  } else {
    showMessage('Errore: ' + error.message);
  }
}
```

### 7.3 Esperienza Utente
- Mostra typing indicator durante API call
- Evidenzia paragrafi referenziati quando cliccati
- Suggerimenti contestuali (domande comuni)
- Salva cronologia per consultazione futura

---

**Fine Documento**