# Sistema di Prompt per Analisi Multi-Articolo

Questo documento contiene i prompt ottimizzati per l'analisi di molteplici articoli contemporaneamente, includendo riassunto globale, confronto idee e Q&A multi-articolo.

---

## 1. RIASSUNTO GLOBALE

### Obiettivo
Creare un riassunto unificato che integri i contenuti di tutti gli articoli selezionati in una narrazione coerente e fluida.

### System Prompt (Tutti i Provider)

```
Sei un esperto analista di contenuti specializzato nel creare riassunti globali che sintetizzano molteplici articoli in un'unica narrazione coerente.

Il tuo obiettivo è creare un riassunto unificato che:
- Integri i contenuti di tutti gli articoli in modo fluido
- Identifichi i temi principali comuni
- Evidenzi le informazioni più rilevanti da ciascun articolo
- Crei una narrazione coerente e ben strutturata
- Mantenga un flusso logico e leggibile

PRINCIPI FONDAMENTALI:
1. Non elencare articolo per articolo, ma crea una sintesi integrata
2. Organizza per temi/argomenti, non per fonte
3. Cita gli articoli quando necessario: "Come evidenziato nell'articolo X..."
4. Mantieni completezza preservando i dettagli importanti
5. Crea collegamenti tra le idee dei diversi articoli

STRUTTURA CONSIGLIATA:
- Introduzione: panoramica del tema comune
- Sviluppo: organizzato per sotto-temi o aspetti principali
- Sintesi: conclusioni integrate da tutti gli articoli

Scrivi in italiano, con stile chiaro, professionale e scorrevole.
```

### User Prompt Template

```
Crea un riassunto globale unificato dei seguenti {N} articoli:

{ARTICOLI_CONTENT}

---

Genera un riassunto globale che integri tutti questi contenuti in una narrazione coerente, organizzata per temi principali piuttosto che per singolo articolo. Il riassunto deve permettere di comprendere l'insieme degli argomenti trattati senza dover leggere i singoli articoli.
```

---

## 2. CONFRONTO IDEE

### Obiettivo
Analizzare e confrontare le idee presenti negli articoli, identificando convergenze, divergenze, conflitti e complementarietà.

### System Prompt (Tutti i Provider)

```
Sei un esperto analista critico specializzato nel confrontare e analizzare idee presenti in molteplici articoli.

Il tuo obiettivo è identificare e analizzare:
1. **Idee Comuni**: concetti, temi o conclusioni condivise tra gli articoli
2. **Idee in Conflitto**: posizioni contrastanti o contraddittorie
3. **Prospettive Diverse**: stesso argomento visto da angolazioni differenti
4. **Complementarietà**: come gli articoli si completano a vicenda
5. **Lacune**: argomenti trattati solo parzialmente o da un solo articolo

PRINCIPI FONDAMENTALI:
- Organizza per categorie tematiche
- Per ogni categoria, analizza convergenze e divergenze
- Cita specificamente gli articoli: "L'articolo 1 sostiene che... mentre l'articolo 3..."
- Evidenzia le implicazioni delle differenze trovate
- Mantieni obiettività analitica

STRUTTURA CONSIGLIATA:
1. Temi Comuni: argomenti trattati da tutti o la maggior parte degli articoli
2. Convergenze: dove gli articoli concordano
3. Divergenze: dove gli articoli differiscono o si contraddicono
4. Prospettive Uniche: contributi specifici di singoli articoli
5. Sintesi Comparativa: quadro d'insieme delle relazioni tra gli articoli

Scrivi in italiano, con analisi approfondita e obiettiva.
```

### User Prompt Template

```
Analizza e confronta le idee presenti nei seguenti {N} articoli:

{ARTICOLI_CONTENT}

---

Genera un'analisi comparativa dettagliata che evidenzi:
- Idee e temi comuni a più articoli
- Posizioni in conflitto o contraddittorie
- Prospettive diverse sullo stesso argomento
- Come gli articoli si completano a vicenda
- Contributi unici di ciascun articolo

Organizza l'analisi per temi, citando specificamente gli articoli per ogni affermazione.
```

---

## 3. Q&A MULTI-ARTICOLO

### Obiettivo
Generare domande e risposte che richiedano la sintesi e il confronto di informazioni provenienti da più articoli.

### System Prompt (Tutti i Provider)

```
Sei un esperto nell'analisi di contenuti e nella generazione di domande e risposte significative basate su molteplici fonti.

Il tuo obiettivo è generare 8-10 coppie di domande e risposte che:
- Coprano i temi principali trattati negli articoli
- Richiedano sintesi di informazioni da più articoli
- Evidenzino confronti e relazioni tra i contenuti
- Includano sia domande fattuali che analitiche
- Siano utili per comprendere l'insieme degli articoli

TIPOLOGIE DI DOMANDE:
1. **Sintesi**: "Quali sono i temi principali comuni a tutti gli articoli?"
2. **Confronto**: "Come differiscono le posizioni degli articoli su X?"
3. **Integrazione**: "Quali informazioni complementari forniscono gli articoli su Y?"
4. **Analisi**: "Quali implicazioni emergono dalla lettura combinata degli articoli?"
5. **Dettaglio**: "Quali dati specifici vengono forniti su Z?"

FORMATO RISPOSTA:
Genera SOLO un array JSON con questa struttura:
[
  {
    "question": "Domanda qui",
    "answer": "Risposta dettagliata qui, citando gli articoli quando rilevante (es. 'L'articolo 1 afferma che...')"
  },
  ...
]

IMPORTANTE: 
- Rispondi SOLO con il JSON, senza testo aggiuntivo prima o dopo
- Ogni risposta deve integrare informazioni da più articoli quando possibile
- Cita sempre gli articoli nelle risposte: "L'articolo 1...", "Come evidenziato nell'articolo 2..."
```

### User Prompt Template

```
Genera 8-10 domande e risposte basate sui seguenti {N} articoli:

{ARTICOLI_CONTENT}

---

Genera domande che richiedano di:
- Sintetizzare informazioni da più articoli
- Confrontare posizioni e prospettive diverse
- Integrare contenuti complementari
- Analizzare implicazioni complessive

Rispondi SOLO con il JSON nel formato specificato.
```

---

## 4. VERIFICA CORRELAZIONE ARTICOLI (Analisi Semantica AI)

### Obiettivo
Determinare se gli articoli selezionati trattano argomenti correlati o completamente scollegati usando **analisi semantica tramite LLM**.

### Approccio Intelligente

La verifica viene effettuata tramite **chiamata API all'LLM** che analizza semanticamente i contenuti:

1. **Preparazione Input**: estrae titoli e primi 300 caratteri di ciascun articolo
2. **Analisi AI**: invia all'LLM per valutazione semantica
3. **Risposta Strutturata**: riceve JSON con valutazione e motivazione

### System Prompt per Verifica Correlazione

```
Sei un esperto analista di contenuti specializzato nell'identificare relazioni tematiche tra articoli.

Il tuo compito è determinare se un gruppo di articoli tratta argomenti correlati o completamente scollegati.

DEFINIZIONI:
- **CORRELATI**: Gli articoli condividono temi, argomenti, settori o contesti comuni. 
  Possono avere prospettive diverse ma trattano argomenti che hanno senso analizzare insieme.
- **NON CORRELATI**: Gli articoli trattano argomenti completamente diversi senza alcun 
  legame tematico, settoriale o contestuale.

ESEMPI DI ARTICOLI CORRELATI:
- Tutti parlano di intelligenza artificiale (anche se da prospettive diverse)
- Tutti riguardano lo stesso settore (es. finanza, salute, tecnologia)
- Tutti trattano lo stesso evento o fenomeno
- Tutti affrontano temi sociali/politici interconnessi
- Condividono un contesto geografico o temporale rilevante

ESEMPI DI ARTICOLI NON CORRELATI:
- Uno parla di cucina, uno di fisica quantistica, uno di calcio
- Argomenti completamente diversi senza alcun punto di contatto
- Settori e contesti totalmente scollegati

IMPORTANTE:
- Sii generoso: se c'è anche solo un legame tematico ragionevole, considera gli articoli correlati
- Considera correlati anche articoli che trattano lo stesso tema da angolazioni molto diverse
- Considera il contesto: articoli su aziende diverse dello stesso settore sono correlati

FORMATO RISPOSTA:
Rispondi SOLO con un JSON in questo formato:
{
  "correlati": true/false,
  "motivazione": "Breve spiegazione della decisione",
  "temi_comuni": ["tema1", "tema2", ...] oppure []
}
```

### User Prompt Template

```
Analizza i seguenti {N} articoli e determina se sono correlati:

ARTICOLO 1:
Titolo: {title1}
Estratto: {excerpt1}...

ARTICOLO 2:
Titolo: {title2}
Estratto: {excerpt2}...

[...]

---

Rispondi SOLO con il JSON nel formato specificato.
```

### Vantaggi dell'Approccio AI

1. **Comprensione Semantica**: 
   - Riconosce sinonimi e concetti correlati
   - "automobile" e "veicolo" vengono identificati come correlati
   - "AI" e "intelligenza artificiale" sono riconosciuti come stesso tema

2. **Analisi Contestuale**:
   - Comprende il contesto oltre le singole parole
   - Identifica relazioni tematiche non ovvie
   - Valuta la rilevanza del settore/dominio

3. **Flessibilità**:
   - Articoli sullo stesso tema con terminologia diversa vengono riconosciuti
   - Paper scientifici con gergo tecnico vs articoli divulgativi sullo stesso argomento

4. **Multilingua**:
   - Funziona anche con articoli in lingue diverse
   - L'AI comprende il contenuto indipendentemente dalla lingua

5. **Spiegazione**:
   - Fornisce motivazione della decisione
   - Identifica i temi comuni trovati
   - Aiuta l'utente a capire il risultato

### Gestione Articoli Non Correlati

Quando gli articoli sono scollegati, mostrare un modal con:
- **Motivazione AI**: spiega perché gli articoli non sono correlati
- **Opzioni**:
  1. **Solo Q&A**: genera solo domande e risposte (utile per qualsiasi insieme di articoli)
  2. **Analisi Completa**: procedi comunque con tutte le analisi richieste
  3. **Annulla**: torna alla selezione

**Motivazione**: 
- Il riassunto globale e il confronto idee hanno poco senso per articoli completamente scollegati
- Il Q&A può essere utile anche per articoli non correlati (es. "Quali sono i temi trattati in ciascun articolo?")

### Gestione Errori e Fallback

**Se API non disponibile o errore:**
- Assume articoli correlati (per non bloccare l'utente)
- Log dell'errore per debugging
- Messaggio console: "API key non disponibile per verifica correlazione"

**Se parsing JSON fallisce:**
- Cerca pattern testuali nella risposta ("correlati": true/false)
- Fallback: assume correlati in caso di dubbio

**Parametri API:**
- Temperature: 0.1 (bassa per risposta deterministica)
- Max Tokens: 500 (sufficiente per JSON + motivazione)
- Timeout: standard del provider

---

## 5. UTILIZZO TRADUZIONI E RIASSUNTI

### Priorità dei Contenuti

Per ogni articolo, utilizzare in ordine di priorità:

1. **Traduzione** (se disponibile): fornisce il contenuto nella lingua target dell'utente
2. **Riassunto** (se traduzione non disponibile): versione condensata ma completa
3. **Punti Chiave** (come supplemento): per evidenziare aspetti specifici

### Motivazione

- Le traduzioni preservano più dettagli e sfumature
- I riassunti sono già ottimizzati per la comprensione
- I punti chiave aiutano a identificare gli aspetti più rilevanti

---

## 6. ESEMPI DI OUTPUT

### Esempio: Riassunto Globale (3 articoli su AI)

```
L'intelligenza artificiale sta trasformando radicalmente molteplici settori dell'economia e della società. Come evidenziato nell'articolo 1, il mercato globale dell'AI ha raggiunto i 150 miliardi di dollari nel 2023, con una crescita prevista del 37% annuo. Questa espansione è guidata principalmente dall'adozione nel settore sanitario e finanziario.

Nel contesto sanitario, l'articolo 2 documenta come gli algoritmi di machine learning stiano migliorando la diagnosi precoce di malattie, con un'accuratezza del 94% nel rilevamento di tumori, superiore alla media dei radiologi umani (89%). Parallelamente, l'articolo 3 sottolinea le implicazioni etiche di questa automazione, evidenziando preoccupazioni sulla responsabilità decisionale e sulla privacy dei dati medici.

Sul fronte dell'occupazione, emerge un quadro complesso. L'articolo 1 prevede la creazione di 97 milioni di nuovi posti di lavoro legati all'AI entro il 2025, mentre l'articolo 3 avverte che 85 milioni di posizioni potrebbero essere automatizzate nello stesso periodo. Questa transizione richiede, come concordano tutti gli articoli, massicci investimenti in riqualificazione professionale.

[...]
```

### Esempio: Confronto Idee

```
## Impatto dell'AI sull'Occupazione

**Convergenze:**
Gli articoli 1 e 2 concordano sul fatto che l'AI creerà nuove opportunità lavorative, particolarmente nei settori tecnologici e creativi. Entrambi citano studi che prevedono una crescita netta dell'occupazione nel lungo termine.

**Divergenze:**
L'articolo 3 presenta una visione più cauta, evidenziando che la transizione potrebbe essere "dolorosa" per milioni di lavoratori nel breve-medio termine. Mentre l'articolo 1 enfatizza le opportunità, l'articolo 3 si concentra sui rischi sociali della disoccupazione tecnologica.

**Prospettive Diverse:**
- Articolo 1: focus economico-quantitativo (numeri, statistiche, crescita)
- Articolo 2: focus settoriale (casi d'uso specifici, applicazioni pratiche)
- Articolo 3: focus etico-sociale (implicazioni, responsabilità, equità)

[...]
```

### Esempio: Q&A

```json
[
  {
    "question": "Quali sono le dimensioni del mercato globale dell'AI secondo gli articoli?",
    "answer": "L'articolo 1 riporta che il mercato globale dell'AI ha raggiunto i 150 miliardi di dollari nel 2023, con una crescita prevista del 37% annuo. L'articolo 2 conferma questi dati e aggiunge che il settore sanitario rappresenta il 28% di questo mercato, seguito dal settore finanziario con il 23%."
  },
  {
    "question": "Come differiscono le prospettive degli articoli sull'impatto occupazionale dell'AI?",
    "answer": "Gli articoli presentano prospettive diverse ma complementari. L'articolo 1 adotta una visione ottimistica, prevedendo 97 milioni di nuovi posti di lavoro entro il 2025. L'articolo 3, invece, adotta un approccio più cauto, evidenziando che 85 milioni di posizioni potrebbero essere automatizzate nello stesso periodo e sottolineando i rischi sociali della transizione. L'articolo 2 si posiziona nel mezzo, riconoscendo sia opportunità che sfide."
  },
  {
    "question": "Quali preoccupazioni etiche vengono sollevate riguardo all'uso dell'AI in ambito sanitario?",
    "answer": "L'articolo 3 identifica tre principali preoccupazioni etiche: 1) la responsabilità decisionale quando un algoritmo sbaglia una diagnosi, 2) la privacy e la sicurezza dei dati medici sensibili utilizzati per addestrare i modelli, e 3) il rischio di bias algoritmici che potrebbero discriminare determinati gruppi di pazienti. L'articolo 2 aggiunge che è necessario mantenere la supervisione umana nelle decisioni mediche critiche."
  }
]
```

---

## 7. BEST PRACTICES

### Per il Riassunto Globale

1. **Evitare la struttura "Articolo 1... Articolo 2..."**: integrare i contenuti per tema
2. **Creare transizioni fluide**: collegare le idee in modo naturale
3. **Bilanciare i contributi**: dare spazio proporzionale a ciascun articolo
4. **Citare quando necessario**: "Come evidenziato nell'articolo X..." per attribuire informazioni specifiche

### Per il Confronto Idee

1. **Organizzare per temi**: non per articolo
2. **Essere specifici**: citare esattamente cosa dice ciascun articolo
3. **Evidenziare le sfumature**: non solo "d'accordo" o "in disaccordo", ma le gradazioni
4. **Mostrare le implicazioni**: cosa significa che gli articoli divergono su un punto?

### Per il Q&A

1. **Variare le tipologie**: mix di domande fattuali, comparative e analitiche
2. **Richiedere sintesi**: domande che non possono essere risposte con un solo articolo
3. **Citare nelle risposte**: sempre indicare da quale articolo proviene l'informazione
4. **Essere completi**: risposte che integrano prospettive multiple quando rilevante

---

## 8. GESTIONE ERRORI

### Articoli Troppo Lunghi

Se il contenuto combinato supera il limite di token:
- Utilizzare solo i riassunti (più concisi delle traduzioni)
- Ridurre il numero di punti chiave inclusi
- Informare l'utente della limitazione

### Articoli in Lingue Diverse

- Preferire sempre le traduzioni quando disponibili
- Se non disponibili, utilizzare i riassunti (già in lingua target)
- Mantenere coerenza linguistica nell'output

### Fallimento Parsing Q&A

Se il JSON non è valido:
- Tentare parsing testuale con regex
- Generare almeno 3-5 Q&A di fallback
- Loggare l'errore per debugging

---

## 9. CONFIGURAZIONI PROVIDER

### Groq
- Modello: `llama-3.3-70b-versatile`
- Temperature: 0.3
- Max Tokens: 4000 (per gestire output più lunghi)

### OpenAI
- Modello: `gpt-4o`
- Temperature: 0.3
- Max Tokens: 4000

### Anthropic
- Modello: `claude-sonnet-4-20250514`
- Temperature: 0.3
- Max Tokens: 4000

---

*Documento creato per AI Article Summarizer - Funzionalità Analisi Multi-Articolo*
