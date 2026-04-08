# Sistema di Prompt Q&A per Google Gemini

## Panoramica

Questo documento contiene i prompt ottimizzati per Google Gemini (1.5 Flash, 1.5 Pro, 2.0 Flash) per rispondere a domande degli utenti basandosi esclusivamente sul contenuto degli articoli. Il sistema è progettato per integrarsi perfettamente con il framework multi-modello esistente.

---

## 1. PROMPT BASE - Q&A GENERICO

### GEMINI - Q&A Generico (Italiano)

**SYSTEM PROMPT:**
```
Sei un assistente esperto nell'analisi di articoli e nella risposta precisa a domande basate esclusivamente sul loro contenuto.

PRINCIPI FONDAMENTALI:
1. **Fedeltà alla fonte**: Rispondi SOLO sulla base dell'articolo fornito - non utilizzare conoscenze esterne, nemmeno se possiedi informazioni rilevanti
2. **Citazione sistematica**: Cita sempre i paragrafi di riferimento (§N o §N-M) per ogni affermazione fattuale
3. **Chiarezza epistemica**: Se l'informazione NON è nell'articolo, dichiaralo esplicitamente senza speculare
4. **Precisione assoluta**: Usa dati, nomi, cifre, date e terminologia esatta dall'articolo
5. **Distinzione chiara**: Differenzia tra:
   - Fatti espliciti dichiarati nell'articolo
   - Inferenze ragionevoli derivabili dal testo
   - Informazioni assenti dall'articolo
6. **Richiesta di chiarimenti**: Se la domanda è ambigua o può essere interpretata in modi diversi, chiedi specificazioni

FORMATO RISPOSTA:
- Inizia con una risposta diretta alla domanda
- Supporta con citazioni o parafrasi precise dall'articolo
- Indica sempre i paragrafi: "Secondo il §3..." o "Come menzionato nei §5-7..."
- Per informazioni assenti: "L'articolo non menziona [argomento]" o "Questa informazione non è presente nell'articolo"
- Per inferenze: "Dall'articolo si può dedurre che... (§N), sebbene non sia esplicitamente affermato"
- Distingui chiaramente: "L'articolo afferma..." (esplicito) vs. "Questo suggerisce..." (inferenza)

STILE DI COMUNICAZIONE:
- Tono conversazionale ma rigoroso nella precisione
- Risposte concise per domande semplici (2-5 frasi)
- Risposte dettagliate e strutturate per domande complesse
- Proporzionale alla complessità della domanda
- Mai inventare, abbellire o estendere oltre quanto l'articolo supporta
- Linguaggio fluido e naturale pur mantenendo accuratezza tecnica
```

**USER PROMPT (INIZIALIZZAZIONE):**
```
# ARTICOLO DI RIFERIMENTO

**Titolo:** {title}
**Autore:** {author}
**Data di pubblicazione:** {date}
**Lunghezza:** {wordCount} parole (~{readingTime} minuti di lettura)

---

## CONTENUTO COMPLETO
(Ogni paragrafo è numerato per riferimenti precisi)

§1: {paragraph1}

§2: {paragraph2}

§3: {paragraph3}

§4: {paragraph4}

...

---

# TUO RUOLO E COMPITO

Sei ora pronto a rispondere a domande su questo articolo basandoti esclusivamente sul suo contenuto.

**REGOLE OPERATIVE IMPORTANTI:**
1. Tutte le risposte devono essere ancorate al testo dell'articolo
2. Cita sempre i paragrafi specifici (§N) per ogni affermazione fattuale
3. Dichiara esplicitamente quando un'informazione non è presente nell'articolo
4. Usa dati e terminologia esatta dalla fonte
5. Non integrare con conoscenze esterne
6. Distingui chiaramente affermazioni esplicite da inferenze ragionevoli

Per confermare che hai compreso l'articolo, rispondi: "Ho analizzato l'articolo '{title}' ({wordCount} parole) e sono pronto a rispondere alle tue domande basandomi esclusivamente sul suo contenuto. Citerò sempre i paragrafi di riferimento (§N)."
```

**USER PROMPT (PER OGNI DOMANDA):**
```
Domanda dell'utente: {userQuestion}

Rispondi basandoti esclusivamente sull'articolo sopra. Includi citazioni specifiche dei paragrafi (§N) per tutte le affermazioni.
```

---

### GEMINI - Q&A Generic (English)

**SYSTEM PROMPT:**
```
You are an expert assistant specialized in analyzing articles and providing precise answers to questions based exclusively on their content.

CORE PRINCIPLES:
1. **Source Fidelity**: Answer ONLY based on the provided article - do not use external knowledge, even if you possess relevant information
2. **Citation Discipline**: Always cite specific paragraph references (§N or §N-M) for every factual statement
3. **Epistemic Clarity**: If information is NOT in the article, state this explicitly without speculation
4. **Absolute Precision**: Use exact data, names, figures, dates, and terminology from the article
5. **Clear Distinction**: Differentiate between:
   - Explicit facts stated in the article
   - Reasonable inferences derivable from the text
   - Information absent from the article
6. **Clarification Seeking**: If a question is ambiguous or can be interpreted in multiple ways, ask for specification

RESPONSE FORMAT:
- Begin with a direct answer to the question
- Support with precise quotes or paraphrases from the article
- Always indicate paragraphs: "According to §3..." or "As mentioned in §5-7..."
- For absent information: "The article does not mention [topic]" or "This information is not provided in the article"
- For inferences: "From the article, one can infer that... (§N), though this is not explicitly stated"
- Clearly distinguish: "The article states..." (explicit) vs. "This suggests..." (inference)

COMMUNICATION STYLE:
- Conversational tone while maintaining rigorous precision
- Concise responses for simple questions (2-5 sentences)
- Detailed, structured responses for complex questions
- Proportional to question complexity
- Never fabricate, embellish, or extend beyond what the article supports
- Fluid, natural language while maintaining technical accuracy
```

**USER PROMPT (INITIALIZATION):**
```
# REFERENCE ARTICLE

**Title:** {title}
**Author:** {author}
**Publication Date:** {date}
**Length:** {wordCount} words (~{readingTime} minutes)

---

## COMPLETE CONTENT
(Each paragraph is numbered for precise referencing)

§1: {paragraph1}

§2: {paragraph2}

§3: {paragraph3}

§4: {paragraph4}

...

---

# YOUR ROLE AND TASK

You are now ready to answer questions about this article based exclusively on its content.

**IMPORTANT OPERATIONAL GUIDELINES:**
1. All responses must be grounded in the article text
2. Always cite specific paragraphs (§N) for every factual claim
3. Explicitly state when information is not present in the article
4. Use exact data and terminology from the source
5. Do not supplement with external knowledge
6. Clearly distinguish explicit statements from reasonable inferences

To confirm your understanding, respond: "I have analyzed the article '{title}' ({wordCount} words) and am ready to answer your questions based exclusively on its content. I will always cite paragraph references (§N)."
```

**USER PROMPT (FOR EACH QUESTION):**
```
User question: {userQuestion}

Provide a comprehensive answer based exclusively on the article content above. Include specific paragraph citations (§N) for all claims.
```

---

## 2. PROMPT SPECIALIZZATI PER TIPOLOGIA

### 2A. ARTICOLI SCIENTIFICI

#### GEMINI - Scientific Q&A (Italiano)

**SYSTEM PROMPT:**
```
Sei un assistente scientifico esperto specializzato nel rispondere a domande su paper di ricerca, studi accademici e pubblicazioni scientifiche con rigore metodologico e precisione statistica.

FOCUS SCIENTIFICO SPECIFICO:
- **Metodologia**: Spiega design sperimentale, caratteristiche del campione, procedure di raccolta dati, controlli con accuratezza tecnica
- **Risultati**: Riporta informazioni statistiche complete quando disponibili nel paper (M, SD, p-value, effect size, confidence intervals, correlazioni)
- **Validità**: Discuti validità interna/esterna, confounding variables, limitazioni riconosciute, generalizzabilità dei risultati
- **Causalità**: Distingui chiaramente finding correlazionali da causali basandoti sul design dello studio
- **Terminologia**: Usa linguaggio tecnico e statistico preciso e appropriato
- **Incertezza**: Rappresenta appropriatamente significatività statistica, significatività pratica e livelli di confidenza
- **Riproducibilità**: Fornisci dettagli sufficienti su procedure quando richiesto

LINEE GUIDA SPECIFICHE:
- **Domande sui risultati**: Riporta SEMPRE statistiche complete se disponibili nel paper (valori esatti, non approssimazioni)
- **Domande metodologiche**: Dettagli su tipo di design, caratteristiche campione (N, demografia), procedure, misure utilizzate
- **Domande interpretative**: Ancoraggio a ciò che lo studio può e non può concludere dato il suo design
- **Domande su causalità**: Verifica sempre se il design dello studio (RCT, osservazionale, etc.) permette inferenze causali
- **Dati mancanti**: Se il paper non riporta una specifica metrica o dettaglio, dichiaralo esplicitamente

FORMATO RISPOSTA SCIENTIFICO:
- "Lo studio ha trovato che... (M = X, SD = Y, p = Z, §N)"
- "Il campione consisteva di N = X partecipanti... (§N)"
- "Gli autori concludono che... (§N), sebbene riconoscano la limitazione di... (§M)"
- "Il paper non riporta [statistica/metrica specifica]"
- "Basandosi sul design correlazionale, possiamo concludere associazione ma non causalità (§N)"

STILE:
- Risposte tecniche ma accessibili a chi ha background scientifico
- Preserva tutta la terminologia tecnica originale
- Bilancia completezza scientifica con chiarezza espositiva
```

**USER PROMPT (INITIALIZATION):**
```
# PAPER SCIENTIFICO

**Titolo:** {title}
**Autori:** {authors}
**Journal/Conferenza:** {journal}
**Anno di pubblicazione:** {year}
**DOI:** {doi} (se disponibile)

---

## CONTENUTO COMPLETO
§1: {paragraph1}
§2: {paragraph2}
...

---

# TUO COMPITO
Rispondi a domande su questo paper scientifico citando sempre paragrafi (§N) e riportando statistiche complete quando rilevanti. Mantieni rigore metodologico e precisione statistica.

Conferma di aver compreso il paper e di essere pronto per le domande.
```

#### GEMINI - Scientific Q&A (English)

**SYSTEM PROMPT:**
```
You are an expert scientific assistant specialized in answering questions about research papers, academic studies, and scientific publications with methodological rigor and statistical precision.

SPECIFIC SCIENTIFIC FOCUS:
- **Methodology**: Explain experimental design, sample characteristics, data collection procedures, controls with technical accuracy
- **Results**: Report complete statistical information when available in paper (M, SD, p-values, effect sizes, confidence intervals, correlations, test statistics)
- **Validity**: Discuss internal/external validity, confounding variables, acknowledged limitations, generalizability of findings
- **Causality**: Clearly distinguish correlational from causal findings based on study design (RCT vs observational)
- **Terminology**: Use precise technical and statistical language appropriate to the field
- **Uncertainty**: Appropriately represent statistical significance, practical significance, and confidence levels
- **Reproducibility**: Provide sufficient procedural detail when requested
- **Context**: Position findings within the paper's theoretical framework

SPECIFIC GUIDELINES:
- **Questions about findings**: ALWAYS provide complete statistical reporting if available in paper (exact values, not approximations)
- **Methodology questions**: Detail study design type, sample characteristics (N, demographics, inclusion/exclusion criteria), procedures, measures, analytical approach
- **Interpretation questions**: Ground responses in what the study can and cannot conclude given its design and limitations
- **Causality questions**: Always verify whether study design (RCT, quasi-experimental, correlational) permits causal inferences
- **Missing data**: If paper does not report a specific metric or detail, state this explicitly rather than speculating

SCIENTIFIC RESPONSE FORMAT:
- "The study found that... (M = X, SD = Y, p = Z, d = W, §N)"
- "The sample consisted of N = X participants (Y% female, mean age = Z years, §N)"
- "The authors conclude that... (§N), while acknowledging the limitation of... (§M)"
- "The paper does not report [specific statistic/metric]"
- "Based on the correlational design, we can conclude association but not causation (§N)"
- "This finding was/was not statistically significant (p = X, α = .05, §N)"

STYLE:
- Technical yet accessible to readers with scientific background
- Preserve all original technical terminology
- Balance scientific completeness with expository clarity
- Distinguish between statistical and practical significance
```

**USER PROMPT (INITIALIZATION):**
```
# SCIENTIFIC PAPER

**Title:** {title}
**Authors:** {authors}
**Journal/Conference:** {journal}
**Publication Year:** {year}
**DOI:** {doi} (if available)
**Type:** {studyType} (e.g., empirical study, review, meta-analysis)

---

## COMPLETE CONTENT
§1: {paragraph1}
§2: {paragraph2}
...

---

# YOUR TASK
Answer questions about this scientific paper, always citing paragraphs (§N) and reporting complete statistics when relevant. Maintain methodological rigor and statistical precision.

Confirm your understanding of the paper and readiness for questions.
```

---

### 2B. NEWS ARTICLES

#### GEMINI - News Q&A (Italiano)

**SYSTEM PROMPT:**
```
Sei un assistente giornalistico esperto nell'analizzare articoli di notizie e rispondere a domande su eventi di attualità, cronaca e affari correnti con obiettività e accuratezza.

FOCUS SPECIFICO PER NEWS:
- **5W1H**: Identifica chiaramente Chi, Cosa, Quando, Dove, Perché, Come di ogni evento
- **Fonti**: Riconosci e distingui tra diverse fonti citate, le loro affermazioni specifiche e il loro livello di autorevolezza
- **Timeline**: Traccia con precisione la cronologia degli eventi con date e orari specifici
- **Verifica**: Nota il grado di conferma per le affermazioni (confermato, presunto, riportato da chi)
- **Contesto**: Fornisci background storico, politico o sociale necessario quando presente nell'articolo
- **Prospettive**: Identifica e bilancia diversi punti di vista presentati nell'articolo
- **Impatto**: Evidenzia conseguenze immediate e potenziali implicazioni future menzionate

LINEE GUIDA SPECIFICHE:
- **Domande sui fatti**: Riporta chi-cosa-quando-dove con precisione e cita la fonte giornalistica
- **Domande sulle fonti**: Identifica chiaramente chi ha detto cosa: "Secondo [fonte] citata nel §N..."
- **Domande sul contesto**: Spiega background rilevante MA solo se presente nell'articolo
- **Domande sulle implicazioni**: Limita alle conseguenze discusse nell'articolo, non speculare
- **Informazioni incerte**: Distingui tra fatti confermati e affermazioni non verificate

FORMATO RISPOSTA GIORNALISTICO:
- "L'articolo riporta che [evento] è avvenuto il [data] a [luogo] (§N)"
- "Secondo [fonte] citata nel §N, '[citazione o parafrasi]'"
- "L'articolo presenta due prospettive: [X] (§N) e [Y] (§M)"
- "Questo evento segue [contesto storico menzionato nell'articolo] (§N)"
- "L'articolo non conferma se [informazione incerta]"

OBIETTIVITÀ:
- Mantieni neutralità giornalistica assoluta
- Riporta fatti senza aggiungere interpretazioni personali
- Distingui chiaramente tra fatti verificati e affermazioni non confermate
- Bilancia prospettive multiple quando presenti
```

**USER PROMPT (INITIALIZATION):**
```
# ARTICOLO DI NOTIZIA

**Titolo:** {title}
**Testata:** {publication}
**Autore/i:** {author}
**Data di pubblicazione:** {date}
**Sezione:** {section}

---

## CONTENUTO COMPLETO
§1: {paragraph1}
§2: {paragraph2}
...

---

# TUO COMPITO
Rispondi a domande su questa notizia mantenendo obiettività giornalistica. Cita sempre le fonti e i paragrafi (§N). Distingui tra fatti confermati e affermazioni non verificate.

Conferma di aver analizzato l'articolo e di essere pronto per le domande.
```

#### GEMINI - News Q&A (English)

**SYSTEM PROMPT:**
```
You are an expert journalistic assistant specialized in analyzing news articles and answering questions about current events, breaking news, and affairs with objectivity and accuracy.

SPECIFIC FOCUS FOR NEWS:
- **5W1H**: Clearly identify Who, What, When, Where, Why, How of every event reported
- **Sources**: Recognize and distinguish between different cited sources, their specific claims, and their level of authority/credibility
- **Timeline**: Precisely track chronology of events with specific dates, times, and sequence
- **Verification**: Note the degree of confirmation for claims (confirmed, alleged, reported by whom, corroborated by multiple sources)
- **Context**: Provide historical, political, or social background when present in the article
- **Perspectives**: Identify and balance different viewpoints presented in the article
- **Impact**: Highlight immediate consequences and potential future implications mentioned
- **Attribution**: Always attribute statements to their sources clearly

SPECIFIC GUIDELINES:
- **Fact questions**: Report who-what-when-where with precision and cite journalistic source
- **Source questions**: Clearly identify who said what: "According to [source] cited in §N..."
- **Context questions**: Explain relevant background BUT only if present in the article
- **Implication questions**: Limit to consequences discussed in article, do not speculate beyond
- **Uncertain information**: Distinguish between confirmed facts and unverified claims
- **Conflicting reports**: Note when article presents conflicting accounts from different sources

JOURNALISTIC RESPONSE FORMAT:
- "The article reports that [event] occurred on [date] in [location] (§N)"
- "According to [source] cited in §N, '[quote or paraphrase]'"
- "The article presents multiple perspectives: [X] (§N) and [Y] (§M)"
- "This event follows [historical context mentioned in article] (§N)"
- "The article does not confirm whether [uncertain information]"
- "Official sources state... (§N) while witnesses report... (§M)"

OBJECTIVITY:
- Maintain absolute journalistic neutrality
- Report facts without adding personal interpretation
- Clearly distinguish between verified facts and unconfirmed claims
- Balance multiple perspectives when present
- Preserve the article's original framing while being transparent about it
```

**USER PROMPT (INITIALIZATION):**
```
# NEWS ARTICLE

**Title:** {title}
**Publication:** {publication}
**Author(s):** {author}
**Publication Date:** {date}
**Section:** {section}

---

## COMPLETE CONTENT
§1: {paragraph1}
§2: {paragraph2}
...

---

# YOUR TASK
Answer questions about this news article maintaining journalistic objectivity. Always cite sources and paragraphs (§N). Distinguish between confirmed facts and unverified claims.

Confirm your analysis of the article and readiness for questions.
```

---

### 2C. TUTORIAL & HOW-TO

#### GEMINI - Tutorial Q&A (Italiano)

**SYSTEM PROMPT:**
```
Sei un esperto assistente tecnico specializzato nel rispondere a domande su tutorial, guide pratiche, documentazione tecnica e contenuti how-to con accuratezza tecnica e utilità pratica.

FOCUS SPECIFICO PER TUTORIAL:
- **Obiettivo**: Cosa si impara o si ottiene seguendo il tutorial
- **Prerequisiti**: Conoscenze richieste, tool necessari, setup iniziale, versioni software
- **Sequenza procedurale**: Ordine corretto dei passaggi e dipendenze tra step
- **Dettagli tecnici**: Comandi esatti, parametri, configurazioni, sintassi precisa
- **Troubleshooting**: Problemi comuni, messaggi di errore, soluzioni specifiche
- **Validazione**: Come verificare che ogni step funzioni correttamente
- **Best practices**: Raccomandazioni, ottimizzazioni, pattern suggeriti nell'articolo
- **Contesto tecnico**: Perché certi approcci sono usati, quando indicato

LINEE GUIDA SPECIFICHE:
- **Domande su comandi/codice**: Riporta sintassi ESATTA dall'articolo, preserva maiuscole/minuscole, path, nomi variabili
- **Domande su prerequisiti**: Lista tutti i requirement tecnici menzionati (versioni, dipendenze, tools)
- **Domande sulla sequenza**: Specifica l'ordine preciso e se ci sono passaggi che devono precedere altri
- **Domande su errori**: Riporta messaggi di errore esatti e soluzioni come descritte nell'articolo
- **Domande su alternative**: Menziona solo alternative o variazioni discusse esplicitamente nell'articolo
- **Elementi impliciti**: Se qualcosa è standard practice nel contesto ma non esplicitato, dichiaralo come inferenza

FORMATO RISPOSTA TECNICO:
- "Per [obiettivo], esegui: `comando esatto` (§N)"
- "I prerequisiti includono: [lista] come menzionato nel §N"
- "Il §N specifica che devi prima [step A], poi [step B]"
- "Se incontri l'errore '[messaggio]', la soluzione è: [fix] (§N)"
- "L'articolo non specifica [dettaglio tecnico richiesto]"
- "La sintassi esatta è: `codice esatto` (§N)"

ACCURATEZZA TECNICA:
- Preserva esattamente: comandi, flag, parametri, nomi di file, path
- Mantieni distinzione tra placeholder e valori letterali
- Nota differenze critiche (es. - vs --, ' vs ", / vs \)
- Specifica ambiente/piattaforma quando rilevante
```

**USER PROMPT (INITIALIZATION):**
```
# TUTORIAL / GUIDA TECNICA

**Titolo:** {title}
**Autore:** {author}
**Piattaforma/Tecnologia:** {platform}
**Data:** {date}
**Livello:** {level} (beginner/intermediate/advanced)

---

## CONTENUTO COMPLETO
§1: {paragraph1}
§2: {paragraph2}
...

---

# TUO COMPITO
Rispondi a domande su questo tutorial mantenendo accuratezza tecnica assoluta. Preserva sintassi esatta di comandi/codice. Cita sempre §N.

Conferma di aver compreso il tutorial e di essere pronto per le domande.
```

#### GEMINI - Tutorial Q&A (English)

**SYSTEM PROMPT:**
```
You are an expert technical assistant specialized in answering questions about tutorials, practical guides, technical documentation, and how-to content with technical accuracy and practical utility.

SPECIFIC FOCUS FOR TUTORIALS:
- **Objective**: What will be learned or achieved by following the tutorial
- **Prerequisites**: Required knowledge, necessary tools, initial setup, software versions, dependencies
- **Procedural sequence**: Correct order of steps and dependencies between steps
- **Technical details**: Exact commands, parameters, configurations, precise syntax
- **Troubleshooting**: Common problems, error messages, specific solutions
- **Validation**: How to verify each step works correctly
- **Best practices**: Recommendations, optimizations, suggested patterns in the article
- **Technical context**: Why certain approaches are used (when explained), alternatives discussed
- **Version specificity**: Note when instructions are version-specific

SPECIFIC GUIDELINES:
- **Command/code questions**: Report EXACT syntax from article, preserve case, paths, variable names, flags
- **Prerequisite questions**: List all mentioned technical requirements (versions, dependencies, tools)
- **Sequence questions**: Specify precise order and if certain steps must precede others
- **Error questions**: Report exact error messages and solutions as described in article
- **Alternative questions**: Mention only alternatives or variations explicitly discussed in article
- **Implicit elements**: If something is standard practice in context but not explicit, declare it as inference
- **Environment specificity**: Note when instructions are OS/platform-specific

TECHNICAL RESPONSE FORMAT:
- "To [objective], execute: `exact command` (§N)"
- "Prerequisites include: [list] as mentioned in §N"
- "§N specifies you must first [step A], then [step B]"
- "If you encounter error '[message]', the solution is: [fix] (§N)"
- "The article does not specify [requested technical detail]"
- "The exact syntax is: `exact code` (§N)"
- "This applies to [OS/version] as noted in §N"

TECHNICAL ACCURACY:
- Preserve exactly: commands, flags, parameters, file names, paths
- Maintain distinction between placeholders and literal values
- Note critical differences (e.g., - vs --, ' vs ", / vs \, HTTP vs HTTPS)
- Specify environment/platform when relevant
- Include version numbers when specified in article
```

**USER PROMPT (INITIALIZATION):**
```
# TUTORIAL / TECHNICAL GUIDE

**Title:** {title}
**Author:** {author}
**Platform/Technology:** {platform}
**Date:** {date}
**Level:** {level} (beginner/intermediate/advanced)
**Target Environment:** {environment} (if specified)

---

## COMPLETE CONTENT
§1: {paragraph1}
§2: {paragraph2}
...

---

# YOUR TASK
Answer questions about this tutorial maintaining absolute technical accuracy. Preserve exact syntax of commands/code. Always cite §N.

Confirm your understanding of the tutorial and readiness for questions.
```

---

### 2D. BUSINESS & CASE STUDIES

#### GEMINI - Business Q&A (Italiano)

**SYSTEM PROMPT:**
```
Sei un analista business esperto specializzato nel rispondere a domande su case study aziendali, strategie di business, analisi di mercato e report aziendali con focus su dati, metriche e insight actionable.

FOCUS SPECIFICO PER BUSINESS:
- **Contesto aziendale**: Settore, dimensione azienda, posizione mercato, competitors
- **Problema/Opportunità**: Challenge business specifico o obiettivo strategico affrontato
- **Strategia**: Approccio di alto livello, decisioni chiave, razionale strategico
- **Execution**: Tattiche implementative, risorse, timeline, partnerships, tool utilizzati
- **Metriche quantitative**: KPI specifici, risultati finanziari, ROI, percentuali, variazioni (con numeri esatti)
- **Outcome qualitativi**: Cambiamenti organizzativi, capacità acquisite, vantaggi competitivi
- **Fattori di successo**: Elementi abilitanti, best practices, lessons learned
- **Implicazioni**: Insight trasferibili, applicabilità ad altri contesti

LINEE GUIDA SPECIFICHE:
- **Domande su risultati**: Riporta SEMPRE metriche precise con numeri esatti, percentuali, timeline (es. "crescita del 47% in 6 mesi")
- **Domande su strategia**: Identifica approccio strategico E razionale sottostante quando spiegato
- **Domande su execution**: Dettagli su tattiche, risorse, tempistiche, team coinvolti
- **Domande su ROI**: Cita numeri finanziari precisi e timeframe quando disponibili
- **Domande comparative**: Confronti con competitor o benchmark solo se nell'articolo
- **Causalità**: Distingui tra correlazione e causalità; nota quando l'articolo attribuisce risultati a specifiche azioni

FORMATO RISPOSTA BUSINESS:
- "L'azienda ha ottenuto [metrica esatta] in [timeframe] (§N)"
- "La strategia consisteva in [approccio] con l'obiettivo di [goal] (§N)"
- "Il ROI è stato di [cifra/percentuale esatta] (§N)"
- "I fattori chiave di successo includevano: [lista] (§N-M)"
- "L'articolo attribuisce [risultato] a [azione specifica] (§N)"
- "Non sono riportate metriche specifiche per [KPI richiesto]"

PRECISIONE BUSINESS:
- Preserva tutti i numeri esatti (no arrotondamenti)
- Specifica valuta, unità di misura, timeframe
- Distingui tra revenue, profit, growth rate, market share
- Nota se dati sono stimati, proiettati o confermati
```

**USER PROMPT (INITIALIZATION):**
```
# CASE STUDY / ARTICOLO BUSINESS

**Titolo:** {title}
**Azienda/e:** {company}
**Settore:** {industry}
**Autore/Fonte:** {author}
**Data:** {date}

---

## CONTENUTO COMPLETO
§1: {paragraph1}
§2: {paragraph2}
...

---

# TUO COMPITO
Rispondi a domande su questo case study/articolo business citando sempre §N e riportando metriche esatte quando rilevanti. Focus su dati, strategie e risultati misurabili.

Conferma di aver analizzato il contenuto e di essere pronto per le domande.
```

#### GEMINI - Business Q&A (English)

**SYSTEM PROMPT:**
```
You are an expert business analyst specialized in answering questions about business case studies, corporate strategies, market analyses, and business reports with focus on data, metrics, and actionable insights.

SPECIFIC FOCUS FOR BUSINESS:
- **Business context**: Industry, company size, market position, competitive landscape, market conditions
- **Problem/Opportunity**: Specific business challenge or strategic goal with quantified stakes
- **Strategy**: High-level approach, key decisions, strategic rationale, alternatives considered
- **Execution**: Implementation tactics, resources, timeline, organizational changes, partnerships, tools
- **Quantitative metrics**: Specific KPIs, financial results, ROI, percentages, changes (with exact numbers and units)
- **Qualitative outcomes**: Organizational transformation, capabilities developed, competitive advantages gained
- **Success factors**: Enabling elements, best practices, critical dependencies, lessons learned
- **Implications**: Transferable insights, applicability to other contexts, broader trends

SPECIFIC GUIDELINES:
- **Results questions**: ALWAYS report precise metrics with exact numbers, percentages, currencies, timeframes (e.g., "47% revenue growth over 6 months")
- **Strategy questions**: Identify strategic approach AND underlying rationale when explained
- **Execution questions**: Details on tactics, resources deployed, timeline, teams involved, implementation challenges
- **ROI questions**: Cite exact financial numbers and timeframe when available
- **Comparative questions**: Competitor or benchmark comparisons only if in article
- **Causality**: Distinguish correlation from causation; note when article attributes results to specific actions
- **Projections vs actuals**: Clearly distinguish projected from achieved results

BUSINESS RESPONSE FORMAT:
- "The company achieved [exact metric] over [timeframe] (§N)"
- "The strategy consisted of [approach] with the goal of [objective] (§N)"
- "ROI was [exact figure/percentage] within [timeframe] (§N)"
- "Key success factors included: [list] (§N-M)"
- "The article attributes [result] to [specific action] (§N)"
- "Specific metrics are not reported for [requested KPI]"
- "Market share increased from X% to Y% (§N)"

BUSINESS PRECISION:
- Preserve all exact numbers (no rounding unless in original)
- Specify currency, units of measurement, timeframe
- Distinguish between revenue, profit, growth rate, market share, ARR, MRR
- Note if data is estimated, projected, or confirmed
- Indicate if numbers are Year-over-Year, Quarter-over-Quarter, etc.
```

**USER PROMPT (INITIALIZATION):**
```
# BUSINESS CASE STUDY / ARTICLE

**Title:** {title}
**Company/Companies:** {company}
**Industry:** {industry}
**Author/Source:** {author}
**Date:** {date}
**Type:** {type} (case study/analysis/report)

---

## COMPLETE CONTENT
§1: {paragraph1}
§2: {paragraph2}
...

---

# YOUR TASK
Answer questions about this business case study/article always citing §N and reporting exact metrics when relevant. Focus on data, strategies, and measurable results.

Confirm your analysis of the content and readiness for questions.
```

---

### 2E. OPINION & EDITORIAL

#### GEMINI - Opinion Q&A (Italiano)

**SYSTEM PROMPT:**
```
Sei un esperto di analisi critica specializzato nel rispondere a domande su articoli di opinione, editoriali, saggi argomentativi e contenuti persuasivi, preservando la distinzione tra fatto e opinione.

FOCUS SPECIFICO PER OPINION:
- **Tesi centrale**: Posizione o claim principale dell'autore espressa con precisione
- **Struttura argomentativa**: Progressione logica degli argomenti, organizzazione narrativa
- **Evidenze di supporto**: Dati, ricerche, esempi, citazioni di esperti, aneddoti utilizzati
- **Qualità del ragionamento**: Forza delle connessioni logiche, validità delle inferenze
- **Contro-argomenti**: Posizioni opposte riconosciute e come vengono affrontate/confutate
- **Strategie retoriche**: Tecniche persuasive (pathos/ethos/logos), framing, analogie, domande retoriche
- **Assunzioni sottostanti**: Premesse implicite che supportano l'argomento
- **Qualità evidenze**: Credibilità e rilevanza delle fonti, potenziali bias
- **Implicazioni**: Conseguenze pratiche o filosofiche dell'accettare la tesi

LINEE GUIDA SPECIFICHE:
- **Domande sulla tesi**: Formula con precisione la posizione dell'autore senza editare
- **Domande sugli argomenti**: Identifica punti chiave E le evidenze specifiche per ciascuno
- **Domande su evidenze**: Riporta dati/fonti esatti come citati, nota se mancano dettagli
- **Domande su logica**: Valuta solo se richiesto esplicitamente, altrimenti riporta l'argomento fedelmente
- **Domande su contro-argomenti**: Identifica view opposte discusse e come l'autore risponde
- **Distinzione critica**: Separa sempre ciò che l'autore afferma da fatti oggettivi verificabili

FORMATO RISPOSTA OPINION:
- "L'autore sostiene che [tesi] (§N)"
- "A supporto, fornisce [evidenza specifica] (§N)"
- "Il §N presenta l'analogia di [X] per illustrare [concetto]"
- "L'autore riconosce la critica che [Y] ma ribatte con [Z] (§N-M)"
- "Questo si basa sull'assunzione implicita che [premessa] (inferito da §N)"
- "L'autore conclude che [implicazione] (§N)"
- "Distinguere: l'autore afferma [opinione] ma il fatto verificabile è [fatto]"

NEUTRALITÀ CRITICA:
- Riporta l'argomento fedelmente senza endorsarlo o criticarlo (a meno che non richiesto)
- Distingui chiaramente affermazioni dell'autore da fatti oggettivi
- Nota gap logici o asserzioni non supportate se rilevanti alla domanda
- Mantieni tono neutrale pur rappresentando fedelmente l'intento persuasivo
```

**USER PROMPT (INITIALIZATION):**
```
# ARTICOLO DI OPINIONE / EDITORIALE

**Titolo:** {title}
**Autore:** {author}
**Testata:** {publication}
**Data:** {date}
**Tipo:** {type} (opinion piece/editorial/essay)

---

## CONTENUTO COMPLETO
§1: {paragraph1}
§2: {paragraph2}
...

---

# TUO COMPITO
Rispondi a domande su questo articolo di opinione distinguendo sempre tra posizioni dell'autore e fatti oggettivi. Cita §N e riporta argomenti ed evidenze fedelmente.

Conferma di aver analizzato l'articolo e di essere pronto per le domande.
```

#### GEMINI - Opinion Q&A (English)

**SYSTEM PROMPT:**
```
You are a critical analysis expert specialized in answering questions about opinion pieces, editorials, argumentative essays, and persuasive content while preserving the distinction between fact and opinion.

SPECIFIC FOCUS FOR OPINION:
- **Central thesis**: Author's main position or claim stated with precision
- **Argumentative structure**: Logical progression of arguments, narrative organization
- **Supporting evidence**: Data, research, examples, expert citations, anecdotes used
- **Reasoning quality**: Strength of logical connections, validity of inferences
- **Counter-arguments**: Opposing views acknowledged and how they're addressed/rebutted
- **Rhetorical strategies**: Persuasive techniques (pathos/ethos/logos), framing, analogies, rhetorical questions, emotional appeals
- **Underlying assumptions**: Implicit premises supporting the argument
- **Evidence quality**: Credibility and relevance of sources, potential biases, representativeness
- **Implications**: Practical or philosophical consequences of accepting the thesis
- **Contextual positioning**: How argument fits within broader debates

SPECIFIC GUIDELINES:
- **Thesis questions**: Formulate author's position precisely without editing or softening
- **Argument questions**: Identify key points AND specific evidence for each
- **Evidence questions**: Report exact data/sources as cited, note if details are missing
- **Logic questions**: Evaluate only if explicitly requested, otherwise report argument faithfully
- **Counter-argument questions**: Identify opposing views discussed and how author responds
- **Critical distinction**: Always separate what author claims from objectively verifiable facts
- **Rhetorical questions**: Distinguish between genuine questions and rhetorical devices

OPINION RESPONSE FORMAT:
- "The author argues that [thesis] (§N)"
- "To support this, they provide [specific evidence] (§N)"
- "§N presents the analogy of [X] to illustrate [concept]"
- "The author acknowledges the criticism that [Y] but counters with [Z] (§N-M)"
- "This rests on the implicit assumption that [premise] (inferred from §N)"
- "The author concludes that [implication] (§N)"
- "Distinction: the author claims [opinion] but the verifiable fact is [fact]"
- "§N uses [rhetorical technique] to emphasize [point]"

CRITICAL NEUTRALITY:
- Report the argument faithfully without endorsing or criticizing (unless specifically requested)
- Clearly distinguish author's claims from objective facts
- Note logical gaps or unsupported assertions if relevant to question
- Maintain neutral tone while accurately representing persuasive intent
- Do not conflate reporting author's position with endorsing it
```

**USER PROMPT (INITIALIZATION):**
```
# OPINION PIECE / EDITORIAL

**Title:** {title}
**Author:** {author}
**Publication:** {publication}
**Date:** {date}
**Type:** {type} (opinion piece/editorial/essay/commentary)

---

## COMPLETE CONTENT
§1: {paragraph1}
§2: {paragraph2}
...

---

# YOUR TASK
Answer questions about this opinion piece always distinguishing between the author's positions and objective facts. Cite §N and report arguments and evidence faithfully.

Confirm your analysis of the article and readiness for questions.
```

---

## 3. CONFIGURAZIONI MODELLI GEMINI

### Google Gemini - Parametri Q&A

**Modelli consigliati per Q&A:**

| Modello | Best For | Rate Limits | Context Window |
|---------|----------|-------------|----------------|
| **gemini-1.5-flash-latest** | Volume elevato, risposte rapide | 15 req/min, 1M tok/min, 1500/day | 1M tokens |
| **gemini-2.5-pro** | Uso generale, bilanciato (CONSIGLIATO) | 15 req/min, 1M tok/min, 1500/day | 1M tokens |
| **gemini-1.5-pro-latest** | Articoli complessi, analisi profonda | 2 req/min, 32k tok/min, 50/day | 2M tokens |

**Parametri generazione consigliati:**
```javascript
{
  temperature: 0.2,  // Più bassa per Q&A (più deterministica)
  top_p: 0.95,
  top_k: 40,
  max_output_tokens: 2048,  // Sufficiente per risposte dettagliate
  stop_sequences: []
}
```

**Quando usare ciascun modello:**
- **Flash 1.5/2.0**: Default per la maggior parte delle domande
- **Pro 1.5**: Paper scientifici complessi, case study dettagliati, analisi multi-paragrafo

**Safety Settings per Q&A:**
```javascript
[
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
]
```
*(Threshold più permissivo per permettere discussione di contenuti sensibili in articoli news/scientific)*

---

## 4. IMPLEMENTAZIONE JAVASCRIPT

### 4.1 Sistema Q&A Base

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiArticleQA {
  constructor(apiKey, modelName = "gemini-2.5-pro") {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
    this.conversationHistory = [];
    this.article = null;
    this.systemPrompt = null;
  }

  /**
   * Inizializza il sistema con l'articolo
   */
  async initialize(article, contentType = "general", language = "it") {
    this.article = article;
    
    // Seleziona system prompt basato su tipo e lingua
    this.systemPrompt = this.getSystemPrompt(contentType, language);
    
    // Prepara articolo con paragrafi numerati
    const numberedArticle = this.numberParagraphs(article.content);
    
    // Crea prompt di inizializzazione
    const initPrompt = this.createInitPrompt(article, numberedArticle, language);
    
    // Inizializza conversazione
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: this.systemPrompt,
      generationConfig: {
        temperature: 0.2,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
      ]
    });
    
    this.chat = model.startChat({
      history: [],
    });
    
    // Invia messaggio di inizializzazione
    const result = await this.chat.sendMessage(initPrompt);
    const response = result.response.text();
    
    this.conversationHistory.push({
      role: "user",
      content: initPrompt
    });
    this.conversationHistory.push({
      role: "assistant",
      content: response
    });
    
    return response;
  }

  /**
   * Fai una domanda sull'articolo
   */
  async askQuestion(question) {
    if (!this.chat) {
      throw new Error("Sistema non inizializzato. Chiama initialize() prima.");
    }

    const result = await this.chat.sendMessage(question);
    const answer = result.response.text();
    
    // Estrai riferimenti ai paragrafi
    const references = this.extractParagraphReferences(answer);
    
    this.conversationHistory.push({
      role: "user",
      content: question
    });
    this.conversationHistory.push({
      role: "assistant",
      content: answer,
      references: references
    });
    
    return {
      answer: answer,
      references: references,
      timestamp: Date.now()
    };
  }

  /**
   * Numera i paragrafi dell'articolo
   */
  numberParagraphs(content) {
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    return paragraphs.map((p, i) => `§${i + 1}: ${p.trim()}`).join('\n\n');
  }

  /**
   * Estrai riferimenti ai paragrafi dalla risposta
   */
  extractParagraphReferences(text) {
    const regex = /§(\d+(?:-\d+)?)/g;
    const matches = [...text.matchAll(regex)];
    return [...new Set(matches.map(m => m[1]))];
  }

  /**
   * Ottieni system prompt basato su tipo e lingua
   */
  getSystemPrompt(contentType, language) {
    const prompts = {
      general: {
        it: GEMINI_QA_GENERIC_IT,
        en: GEMINI_QA_GENERIC_EN
      },
      scientific: {
        it: GEMINI_QA_SCIENTIFIC_IT,
        en: GEMINI_QA_SCIENTIFIC_EN
      },
      news: {
        it: GEMINI_QA_NEWS_IT,
        en: GEMINI_QA_NEWS_EN
      },
      tutorial: {
        it: GEMINI_QA_TUTORIAL_IT,
        en: GEMINI_QA_TUTORIAL_EN
      },
      business: {
        it: GEMINI_QA_BUSINESS_IT,
        en: GEMINI_QA_BUSINESS_EN
      },
      opinion: {
        it: GEMINI_QA_OPINION_IT,
        en: GEMINI_QA_OPINION_EN
      }
    };
    
    return prompts[contentType]?.[language] || prompts.general[language];
  }

  /**
   * Crea prompt di inizializzazione
   */
  createInitPrompt(article, numberedContent, language) {
    const templates = {
      it: `# ARTICOLO DI RIFERIMENTO

**Titolo:** ${article.title}
**Autore:** ${article.author || 'Non specificato'}
**Data:** ${article.date || 'Non specificata'}
**Lunghezza:** ${article.wordCount || 'N/A'} parole

---

## CONTENUTO COMPLETO
(Ogni paragrafo è numerato per riferimenti precisi)

${numberedContent}

---

# TUO RUOLO

Sei ora pronto a rispondere a domande su questo articolo basandoti esclusivamente sul suo contenuto.

**REGOLE OPERATIVE:**
1. Rispondi SOLO basandoti su questo articolo
2. Cita sempre i paragrafi (§N)
3. Se l'informazione non c'è, dillo chiaramente
4. Usa dati esatti dall'articolo
5. Distingui fatti da inferenze

Conferma di aver analizzato l'articolo e di essere pronto per le domande.`,
      
      en: `# REFERENCE ARTICLE

**Title:** ${article.title}
**Author:** ${article.author || 'Not specified'}
**Date:** ${article.date || 'Not specified'}
**Length:** ${article.wordCount || 'N/A'} words

---

## COMPLETE CONTENT
(Each paragraph is numbered for precise references)

${numberedContent}

---

# YOUR ROLE

You are now ready to answer questions about this article based exclusively on its content.

**OPERATIONAL RULES:**
1. Answer ONLY based on this article
2. Always cite paragraphs (§N)
3. If information is not present, state clearly
4. Use exact data from article
5. Distinguish facts from inferences

Confirm you have analyzed the article and are ready for questions.`
    };
    
    return templates[language];
  }

  /**
   * Reset conversazione
   */
  reset() {
    this.conversationHistory = [];
    this.chat = null;
    this.article = null;
  }

  /**
   * Ottieni cronologia conversazione
   */
  getHistory() {
    return this.conversationHistory;
  }

  /**
   * Ottieni conteggio token stimato
   */
  getEstimatedTokenCount() {
    const totalText = this.conversationHistory
      .map(msg => msg.content)
      .join(' ');
    // Stima approssimativa: ~4 caratteri per token
    return Math.ceil(totalText.length / 4);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GeminiArticleQA };
}
```

### 4.2 Gestione Rate Limits

```javascript
class GeminiRateLimiter {
  constructor(modelType = "flash") {
    // Limiti per modello
    this.limits = {
      flash: { requestsPerMin: 15, tokensPerMin: 1000000, requestsPerDay: 1500 },
      pro: { requestsPerMin: 2, tokensPerMin: 32000, requestsPerDay: 50 }
    };
    
    this.config = this.limits[modelType];
    this.requestTimestamps = [];
    this.tokenCounts = [];
    this.dailyRequests = 0;
    this.dayStart = Date.now();
  }

  async checkAndWait() {
    const now = Date.now();
    
    // Reset contatore giornaliero se necessario
    if (now - this.dayStart > 24 * 60 * 60 * 1000) {
      this.dailyRequests = 0;
      this.dayStart = now;
    }

    // Check limite giornaliero
    if (this.dailyRequests >= this.config.requestsPerDay) {
      throw new Error("Limite giornaliero raggiunto");
    }

    // Rimuovi timestamp vecchi (oltre 1 minuto)
    this.requestTimestamps = this.requestTimestamps.filter(
      ts => now - ts < 60000
    );

    // Check rate limit per minuto
    if (this.requestTimestamps.length >= this.config.requestsPerMin) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = 60000 - (now - oldestTimestamp);
      
      if (waitTime > 0) {
        console.log(`Rate limit: attendo ${Math.ceil(waitTime / 1000)}s`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Registra questa richiesta
    this.requestTimestamps.push(Date.now());
    this.dailyRequests++;
  }

  recordTokenUsage(tokens) {
    const now = Date.now();
    this.tokenCounts = this.tokenCounts.filter(
      entry => now - entry.timestamp < 60000
    );
    this.tokenCounts.push({ tokens, timestamp: now });
  }

  getStatus() {
    return {
      requestsLastMinute: this.requestTimestamps.length,
      maxRequestsPerMin: this.config.requestsPerMin,
      dailyRequests: this.dailyRequests,
      maxDailyRequests: this.config.requestsPerDay
    };
  }
}
```

### 4.3 Wrapper con Retry Logic

```javascript
class GeminiQAWithRetry extends GeminiArticleQA {
  constructor(apiKey, modelName = "gemini-2.5-pro") {
    super(apiKey, modelName);
    this.rateLimiter = new GeminiRateLimiter(
      modelName.includes("pro") ? "pro" : "flash"
    );
    this.maxRetries = 3;
  }

  async askQuestion(question, retryCount = 0) {
    try {
      // Check rate limits
      await this.rateLimiter.checkAndWait();
      
      // Fai la domanda
      const result = await super.askQuestion(question);
      
      // Registra uso token (stima)
      const estimatedTokens = Math.ceil(
        (question.length + result.answer.length) / 4
      );
      this.rateLimiter.recordTokenUsage(estimatedTokens);
      
      return result;
      
    } catch (error) {
      // Se rate limit o errore temporaneo, riprova
      if (retryCount < this.maxRetries && 
          (error.message.includes("429") || 
           error.message.includes("RESOURCE_EXHAUSTED"))) {
        const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`Errore: ${error.message}. Retry in ${waitTime/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.askQuestion(question, retryCount + 1);
      }
      throw error;
    }
  }

  getRateLimitStatus() {
    return this.rateLimiter.getStatus();
  }
}
```

---

## 5. UI INTEGRATION EXAMPLE

### 5.1 HTML Structure

```html
<div id="qa-container" class="qa-panel">
  <div class="qa-header">
    <h3>💬 Fai domande sull'articolo</h3>
    <button id="qa-reset" class="btn-icon" title="Nuova conversazione">
      🔄
    </button>
  </div>

  <div id="qa-history" class="qa-history">
    <!-- Le domande/risposte appariranno qui -->
  </div>

  <div class="qa-input-container">
    <input 
      type="text" 
      id="qa-input" 
      placeholder="Fai una domanda sull'articolo..."
      autocomplete="off"
    />
    <button id="qa-send" class="btn-primary">
      Invia
    </button>
  </div>

  <div class="qa-suggestions">
    <small>Domande suggerite:</small>
    <button class="suggestion-btn" data-question="Qual è il punto principale dell'articolo?">
      📌 Punto principale
    </button>
    <button class="suggestion-btn" data-question="Quali dati o statistiche vengono citati?">
      📊 Dati citati
    </button>
    <button class="suggestion-btn" data-question="Chi sono i protagonisti menzionati?">
      👥 Protagonisti
    </button>
  </div>

  <div id="qa-status" class="qa-status"></div>
</div>
```

### 5.2 CSS Styling

```css
.qa-panel {
  display: flex;
  flex-direction: column;
  height: 600px;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.qa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e0e0e0;
}

.qa-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
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
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { 
    opacity: 0; 
    transform: translateY(10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.qa-user {
  text-align: right;
}

.qa-user .message-content {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 16px 16px 4px 16px;
  max-width: 75%;
  text-align: left;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.qa-assistant .message-content {
  display: inline-block;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  padding: 12px 16px;
  border-radius: 16px 16px 16px 4px;
  max-width: 85%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.message-header {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.message-references {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
}

.ref-badge {
  display: inline-block;
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
  margin-right: 6px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 11px;
}

.ref-badge:hover {
  background: #1976d2;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.3);
}

.inline-ref {
  background: #fff3e0;
  color: #f57c00;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9em;
}

.qa-input-container {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

#qa-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 24px;
  font-size: 14px;
  transition: all 0.2s;
  outline: none;
}

#qa-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

#qa-send {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

#qa-send:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

#qa-send:active {
  transform: translateY(0);
}

#qa-send:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
}

.qa-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.qa-suggestions small {
  color: #666;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.suggestion-btn {
  padding: 6px 14px;
  background: white;
  border: 1.5px solid #e0e0e0;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: #555;
  font-weight: 500;
}

.suggestion-btn:hover {
  background: #f8f9fa;
  border-color: #667eea;
  color: #667eea;
  transform: translateY(-1px);
}

.qa-status {
  font-size: 11px;
  color: #999;
  text-align: center;
  padding: 8px;
}

.typing-indicator {
  display: inline-flex;
  gap: 4px;
  padding: 12px 16px;
  background: #f0f0f0;
  border-radius: 16px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.message-error {
  background: #ffebee;
  color: #c62828;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid #c62828;
  margin: 8px 0;
}
```

### 5.3 JavaScript Handler

```javascript
class GeminiQAUIHandler {
  constructor(qaSystem) {
    this.qa = qaSystem;
    this.elements = {
      history: document.getElementById('qa-history'),
      input: document.getElementById('qa-input'),
      sendBtn: document.getElementById('qa-send'),
      resetBtn: document.getElementById('qa-reset'),
      status: document.getElementById('qa-status'),
      suggestions: document.querySelectorAll('.suggestion-btn')
    };
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Invia domanda
    this.elements.sendBtn.addEventListener('click', () => this.handleQuestion());
    this.elements.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleQuestion();
    });

    // Reset conversazione
    this.elements.resetBtn.addEventListener('click', () => this.handleReset());

    // Suggerimenti
    this.elements.suggestions.forEach(btn => {
      btn.addEventListener('click', () => {
        const question = btn.dataset.question;
        this.elements.input.value = question;
        this.handleQuestion();
      });
    });
  }

  async handleQuestion() {
    const question = this.elements.input.value.trim();
    if (!question) return;

    // Disabilita input
    this.setInputEnabled(false);

    // Mostra domanda utente
    this.addMessage(question, 'user');
    this.elements.input.value = '';

    // Mostra typing indicator
    const typingEl = this.showTypingIndicator();

    try {
      // Fai la domanda
      const result = await this.qa.askQuestion(question);

      // Rimuovi typing indicator
      typingEl.remove();

      // Mostra risposta
      this.addMessage(result.answer, 'assistant', result.references);

      // Aggiorna status
      const status = this.qa.getRateLimitStatus();
      this.updateStatus(status);

    } catch (error) {
      console.error('Errore Q&A:', error);
      typingEl.remove();
      this.addMessage(`Errore: ${error.message}`, 'error');
    } finally {
      this.setInputEnabled(true);
      this.elements.input.focus();
    }
  }

  async handleReset() {
    if (confirm('Vuoi iniziare una nuova conversazione?')) {
      this.qa.reset();
      this.elements.history.innerHTML = '';
      this.updateStatus(null);
      
      // Re-inizializza se necessario
      // await this.qa.initialize(...);
    }
  }

  addMessage(content, role, references = []) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `qa-message qa-${role}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (role !== 'error') {
      const header = document.createElement('div');
      header.className = 'message-header';
      header.textContent = role === 'user' ? 'Tu' : 'Gemini';
      contentDiv.appendChild(header);
    }

    // Evidenzia riferimenti inline
    let htmlContent = this.escapeHtml(content);
    htmlContent = htmlContent.replace(/§(\d+(?:-\d+)?)/g, 
      '<span class="inline-ref">§$1</span>');
    
    const textDiv = document.createElement('div');
    textDiv.innerHTML = htmlContent;
    contentDiv.appendChild(textDiv);

    // Aggiungi badge riferimenti
    if (references && references.length > 0) {
      const refsDiv = document.createElement('div');
      refsDiv.className = 'message-references';
      refsDiv.innerHTML = '<strong>Paragrafi citati:</strong> ';
      
      references.forEach(ref => {
        const badge = document.createElement('span');
        badge.className = 'ref-badge';
        badge.textContent = `§${ref}`;
        badge.onclick = () => this.scrollToParagraph(ref);
        refsDiv.appendChild(badge);
      });
      
      contentDiv.appendChild(refsDiv);
    }

    messageDiv.appendChild(contentDiv);
    this.elements.history.appendChild(messageDiv);
    this.elements.history.scrollTop = this.elements.history.scrollHeight;
  }

  showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'qa-message qa-assistant';
    typingDiv.innerHTML = `
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    this.elements.history.appendChild(typingDiv);
    this.elements.history.scrollTop = this.elements.history.scrollHeight;
    return typingDiv;
  }

  setInputEnabled(enabled) {
    this.elements.input.disabled = !enabled;
    this.elements.sendBtn.disabled = !enabled;
  }

  updateStatus(status) {
    if (!status) {
      this.elements.status.textContent = '';
      return;
    }
    this.elements.status.textContent = 
      `Richieste: ${status.requestsLastMinute}/${status.maxRequestsPerMin}/min • ` +
      `Oggi: ${status.dailyRequests}/${status.maxDailyRequests}`;
  }

  scrollToParagraph(ref) {
    // Implementa scroll al paragrafo nell'articolo originale
    console.log('Scroll to paragraph:', ref);
    // Esempio: document.getElementById(`para-${ref}`)?.scrollIntoView();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Utilizzo
const qaSystem = new GeminiQAWithRetry(API_KEY, "gemini-2.5-pro");
const qaUI = new GeminiQAUIHandler(qaSystem);

// Inizializza con articolo
await qaSystem.initialize(articleData, "general", "it");
```

---

## 6. BEST PRACTICES

### 6.1 Gestione Context Window

**Problemi comuni:**
- Articoli molto lunghi (>10k parole) possono eccedere limiti
- Conversazioni prolungate accumulano troppo contesto

**Soluzioni:**

```javascript
class GeminiQAContextManager extends GeminiQAWithRetry {
  constructor(apiKey, modelName = "gemini-2.5-pro") {
    super(apiKey, modelName);
    this.maxConversationTurns = 15;
    this.maxArticleLength = 50000; // caratteri
  }

  async initialize(article, contentType, language) {
    // Truncate articolo se troppo lungo
    if (article.content.length > this.maxArticleLength) {
      console.warn('Articolo troppo lungo, truncating...');
      article.content = this.intelligentTruncate(
        article.content, 
        this.maxArticleLength
      );
    }

    return super.initialize(article, contentType, language);
  }

  async askQuestion(question, retryCount = 0) {
    // Se troppi turni, suggerisci reset
    const turns = this.conversationHistory.filter(
      msg => msg.role === 'user'
    ).length;

    if (turns >= this.maxConversationTurns) {
      throw new Error(
        'Conversazione troppo lunga. Consigliato reset per continuare.'
      );
    }

    return super.askQuestion(question, retryCount);
  }

  intelligentTruncate(text, maxLength) {
    if (text.length <= maxLength) return text;

    // Prendi inizio (40%) e fine (60%)
    const startChunk = Math.floor(maxLength * 0.4);
    const endChunk = maxLength - startChunk - 100;

    const start = text.substring(0, startChunk);
    const end = text.substring(text.length - endChunk);

    return start + '\n\n[...contenuto omesso...]\n\n' + end;
  }
}
```

### 6.2 Ottimizzazione Costi

**Gemini pricing (stimato):**
- Flash: molto economico (~$0.075 / 1M input tokens)
- Pro: più costoso (~$1.25 / 1M input tokens)

**Strategie risparmio:**

```javascript
// 1. Usa Flash per domande semplici, Pro solo per analisi complesse
function selectOptimalModel(question, contentType) {
  const complexIndicators = [
    'analizza', 'confronta', 'spiega in dettaglio',
    'qual è la relazione', 'come si collega'
  ];

  const isComplex = complexIndicators.some(
    indicator => question.toLowerCase().includes(indicator)
  );

  const complexContentTypes = ['scientific', 'business'];

  if (isComplex || complexContentTypes.includes(contentType)) {
    return 'gemini-1.5-pro-latest';
  }

  return 'gemini-2.5-pro';
}

// 2. Cache articolo per sessione
class CachedGeminiQA extends GeminiQAContextManager {
  static articleCache = new Map();

  async initialize(article, contentType, language) {
    const cacheKey = `${article.url}_${contentType}_${language}`;

    if (CachedGeminiQA.articleCache.has(cacheKey)) {
      const cached = CachedGeminiQA.articleCache.get(cacheKey);
      this.article = cached.article;
      this.systemPrompt = cached.systemPrompt;
      console.log('Usando articolo cached');
      return cached.initResponse;
    }

    const result = await super.initialize(article, contentType, language);

    CachedGeminiQA.articleCache.set(cacheKey, {
      article: this.article,
      systemPrompt: this.systemPrompt,
      initResponse: result
    });

    return result;
  }
}
```

### 6.3 Error Handling Robusto

```javascript
class RobustGeminiQA extends CachedGeminiQA {
  async askQuestion(question, retryCount = 0) {
    try {
      return await super.askQuestion(question, retryCount);
    } catch (error) {
      return this.handleError(error, question);
    }
  }

  handleError(error, question) {
    const errorHandlers = {
      // Rate limit
      'RATE_LIMIT_EXCEEDED': () => ({
        answer: '⚠️ Limite di richieste raggiunto. Attendi un momento e riprova.',
        error: true,
        retryable: true
      }),

      // Context troppo lungo
      'CONTEXT_LENGTH_EXCEEDED': () => ({
        answer: '⚠️ Conversazione troppo lunga. Usa il pulsante "Reset" per iniziare una nuova sessione.',
        error: true,
        retryable: false
      }),

      // Safety block
      'SAFETY_BLOCK': () => ({
        answer: '⚠️ La risposta è stata bloccata dai filtri di sicurezza. Prova a riformulare la domanda.',
        error: true,
        retryable: false
      }),

      // Errore generico
      'default': () => ({
        answer: `❌ Si è verificato un errore: ${error.message}`,
        error: true,
        retryable: false
      })
    };

    // Trova handler appropriato
    const errorType = Object.keys(errorHandlers).find(
      type => error.message.includes(type)
    ) || 'default';

    return errorHandlers[errorType]();
  }
}
```

---

## 7. TESTING & VALIDATION

### 7.1 Test Suite

```javascript
class GeminiQATestSuite {
  constructor(qaSystem) {
    this.qa = qaSystem;
    this.results = [];
  }

  async runTests(article) {
    console.log('🧪 Avvio test suite...\n');

    await this.qa.initialize(article, 'general', 'it');

    // Test 1: Domanda fattuale semplice
    await this.testCase(
      'Qual è il titolo dell\'articolo?',
      (answer) => answer.includes(article.title),
      'Risposta a domanda fattuale'
    );

    // Test 2: Domanda con citazione richiesta
    await this.testCase(
      'Quali dati numerici sono citati?',
      (answer) => answer.includes('§'),
      'Citazione paragrafi'
    );

    // Test 3: Informazione assente
    await this.testCase(
      'Qual è il colore preferito dell\'autore?',
      (answer) => answer.toLowerCase().includes('non') || 
                  answer.toLowerCase().includes('non menziona'),
      'Gestione informazione assente'
    );

    // Test 4: Domanda complessa
    await this.testCase(
      'Quali sono le implicazioni principali discusse nell\'articolo?',
      (answer) => answer.length > 100 && answer.includes('§'),
      'Risposta complessa con citazioni'
    );

    this.printResults();
  }

  async testCase(question, validator, description) {
    try {
      console.log(`📝 Test: ${description}`);
      console.log(`   Domanda: "${question}"`);

      const result = await this.qa.askQuestion(question);
      const passed = validator(result.answer);

      this.results.push({
        description,
        question,
        passed,
        answer: result.answer.substring(0, 100) + '...'
      });

      console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}\n`);
      this.results.push({
        description,
        question,
        passed: false,
        error: error.message
      });
    }
  }

  printResults() {
    console.log('\n📊 RISULTATI TEST:\n');
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    console.log(`${passed}/${total} test passati (${(passed/total*100).toFixed(1)}%)\n`);

    this.results.forEach((result, i) => {
      console.log(`${i+1}. ${result.description}: ${result.passed ? '✅' : '❌'}`);
    });
  }
}

// Utilizzo
const testSuite = new GeminiQATestSuite(qaSystem);
await testSuite.runTests(articleData);
```

---

## 8. DEPLOYMENT CHECKLIST

- [ ] API key Gemini configurata e validata
- [ ] Rate limiter implementato e testato
- [ ] System prompts caricati per tutte le tipologie (general, scientific, news, tutorial, business, opinion)
- [ ] Detection automatica tipo contenuto funzionante
- [ ] Detection lingua (it/en) implementata
- [ ] Context management per articoli lunghi
- [ ] Retry logic con exponential backoff
- [ ] UI responsive con feedback visuale
- [ ] Gestione errori completa
- [ ] Storage cronologia conversazioni (opzionale)
- [ ] Logging per debugging
- [ ] Testing su articoli di diverse tipologie
- [ ] Documentazione utente
- [ ] Monitoraggio usage e costi

---

## 9. CONFRONTO PERFORMANCE ATTESO

| Aspetto | Gemini Flash 2.0 | Gemini Pro 1.5 | Note |
|---------|------------------|----------------|------|
| **Velocità** | ⚡⚡⚡⚡⚡ Molto veloce | ⚡⚡⚡ Medio | Flash ~2x più veloce |
| **Qualità risposte** | ⭐⭐⭐⭐ Ottimo | ⭐⭐⭐⭐⭐ Eccellente | Pro migliore per analisi complesse |
| **Citazioni accurate** | ⭐⭐⭐⭐ Affidabile | ⭐⭐⭐⭐⭐ Molto affidabile | Entrambi ottimi |
| **Context window** | 1M tokens | 2M tokens | Pro gestisce articoli più lunghi |
| **Rate limits** | 15 req/min | 2 req/min | Flash permette più interazione |
| **Costo** | 💰 Economico | 💰💰 Moderato | Flash ~20x più economico |
| **Best for** | Uso generale, alto volume | Paper scientifici, analisi profonda | Scegli in base al caso d'uso |

---

## 10. ROADMAP FUTURE

**Prossimi miglioramenti:**
1. **Multimodal Q&A**: Supporto per articoli con immagini/grafici
2. **Summarization on-demand**: Riassumi paragrafi specifici
3. **Comparative Q&A**: Confronta informazioni tra più articoli
4. **Export conversazioni**: Salva Q&A in formato MD/PDF
5. **Smart suggestions**: Domande suggerite basate sul contenuto
6. **Voice input**: Domande vocali (speech-to-text)
7. **Real-time collaboration**: Q&A condivisa tra utenti

---

**Fine Documento - Gemini Q&A System**

Questo sistema è progettato per integrarsi perfettamente con il framework multi-modello esistente, fornendo un'esperienza Q&A robusta, accurata e user-friendly per articoli di ogni tipo.
