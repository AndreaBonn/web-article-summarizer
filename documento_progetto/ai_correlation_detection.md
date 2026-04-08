# Rilevazione Correlazione Articoli tramite AI

## Panoramica

Implementazione di un sistema intelligente di rilevazione della correlazione tra articoli usando **analisi semantica tramite LLM** invece di semplice keyword matching.

## Problema Risolto

### Approccio Precedente (Keyword-Based)
```javascript
// ❌ Troppo semplice e rigido
static extractKeywords(text) {
  // Rimuove stopwords basilari
  // Conta frequenze parole
  // Ritorna top 10 keywords
}

static findCommonKeywords(articles) {
  // Trova keywords presenti in TUTTI gli articoli
  // Soglia: almeno 2 keywords comuni
}
```

**Limitazioni:**
- ❌ Troppo rigido: richiede keywords in TUTTI gli articoli
- ❌ Nessuna semantica: "automobile" ≠ "veicolo"
- ❌ Ignora contesto: "apple" (frutto) vs "Apple" (azienda)
- ❌ Soglia arbitraria: 2 keywords potrebbero essere casuali
- ❌ Stopwords limitate: solo italiano/inglese basilare

### Nuovo Approccio (AI-Based)
```javascript
// ✅ Analisi semantica intelligente
static async checkCorrelationWithAI(articles, provider, apiKey) {
  // Prepara estratti degli articoli
  // Invia all'AI per analisi semantica
  // Riceve JSON con valutazione e motivazione
  
  return {
    related: true/false,
    reason: "Motivazione della decisione",
    commonThemes: ["tema1", "tema2", ...]
  };
}
```

**Vantaggi:**
- ✅ Comprensione semantica: riconosce sinonimi e concetti correlati
- ✅ Analisi contestuale: capisce il contesto oltre le parole
- ✅ Flessibilità: terminologia diversa ma stesso tema
- ✅ Multilingua: funziona con articoli in lingue diverse
- ✅ Spiegazione: fornisce motivazione della decisione

## Implementazione

### 1. Prompt System per Verifica

**System Prompt:**
```
Sei un esperto analista di contenuti specializzato nell'identificare 
relazioni tematiche tra articoli.

Determina se questi articoli trattano argomenti correlati o completamente scollegati.

CORRELATI: condividono temi, argomenti, settori o contesti comuni
NON CORRELATI: argomenti completamente diversi senza legame tematico

Sii generoso: se c'è anche solo un legame tematico ragionevole, 
considera gli articoli correlati.

FORMATO RISPOSTA (JSON):
{
  "correlati": true/false,
  "motivazione": "Breve spiegazione",
  "temi_comuni": ["tema1", "tema2", ...]
}
```

**User Prompt:**
```
Analizza i seguenti N articoli:

ARTICOLO 1:
Titolo: {title}
Estratto: {primi 300 caratteri}...

ARTICOLO 2:
...

Rispondi SOLO con il JSON.
```

### 2. Parametri API

```javascript
{
  temperature: 0.1,  // Bassa per risposta deterministica
  maxTokens: 500,    // Sufficiente per JSON + motivazione
  model: 'default'   // Usa modello configurato dall'utente
}
```

### 3. Gestione Risposta

```javascript
// Parsing JSON
const jsonMatch = response.match(/\{[\s\S]*\}/);
const result = JSON.parse(jsonMatch[0]);

return {
  related: result.correlati === true,
  reason: result.motivazione || null,
  commonThemes: result.temi_comuni || []
};
```

### 4. Fallback Strategy

**Se API non disponibile:**
```javascript
if (!apiKey) {
  console.warn('API key non disponibile');
  return { related: true, reason: null };
}
```

**Se errore durante chiamata:**
```javascript
catch (error) {
  console.error('Errore verifica:', error);
  return { related: true, reason: null };
}
```

**Se parsing JSON fallisce:**
```javascript
// Cerca pattern testuali
const isRelated = response.includes('"correlati": true');
return { 
  related: isRelated, 
  reason: isRelated ? null : 'Articoli diversi' 
};
```

**Filosofia:** In caso di dubbio, assume correlati per non bloccare l'utente.

### 5. UI Enhancement

**Modal con Motivazione AI:**
```html
<div id="unrelatedModal">
  <h3>Articoli Non Correlati</h3>
  <p>Gli articoli sembrano trattare argomenti scollegati.</p>
  
  <!-- Motivazione AI -->
  <div id="unrelatedReason" class="unrelated-reason">
    💡 {motivazione dall'AI}
  </div>
  
  <p>Come vuoi procedere?</p>
  <button>Solo Q&A</button>
  <button>Analisi Completa</button>
  <button>Annulla</button>
</div>
```

**Stile:**
```css
.unrelated-reason {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 12px 16px;
  color: #856404;
  /* Stile warning/info */
}
```

## Esempi di Utilizzo

### Esempio 1: Articoli Correlati

**Input:**
- Articolo 1: "L'impatto dell'AI sulla medicina"
- Articolo 2: "Machine learning per diagnosi precoce"
- Articolo 3: "Intelligenza artificiale in ospedale"

**Output AI:**
```json
{
  "correlati": true,
  "motivazione": "Tutti gli articoli trattano l'applicazione dell'intelligenza artificiale nel settore sanitario, con focus su diagnosi e applicazioni mediche.",
  "temi_comuni": ["intelligenza artificiale", "medicina", "diagnosi", "healthcare"]
}
```

**Risultato:** Procede con analisi completa ✅

### Esempio 2: Articoli Non Correlati

**Input:**
- Articolo 1: "Ricette di cucina italiana"
- Articolo 2: "Fisica quantistica per principianti"
- Articolo 3: "Risultati Serie A calcio"

**Output AI:**
```json
{
  "correlati": false,
  "motivazione": "Gli articoli trattano argomenti completamente diversi (cucina, fisica, sport) senza alcun legame tematico o contestuale.",
  "temi_comuni": []
}
```

**Risultato:** Mostra modal con opzioni ⚠️

### Esempio 3: Correlazione Sottile

**Input:**
- Articolo 1: "Tesla annuncia nuova Gigafactory"
- Articolo 2: "Mercato delle batterie al litio"
- Articolo 3: "Transizione energetica in Europa"

**Output AI:**
```json
{
  "correlati": true,
  "motivazione": "Gli articoli sono correlati attraverso il tema della mobilità elettrica e transizione energetica. Tesla produce veicoli elettrici che usano batterie al litio, e la transizione energetica include l'elettrificazione dei trasporti.",
  "temi_comuni": ["energia", "sostenibilità", "veicoli elettrici", "batterie"]
}
```

**Risultato:** Procede con analisi completa ✅
(L'AI riconosce la correlazione anche se non ovvia)

## Vantaggi Rispetto a Keyword Matching

| Aspetto | Keyword Matching | AI Semantic Analysis |
|---------|------------------|---------------------|
| **Sinonimi** | ❌ "auto" ≠ "veicolo" | ✅ Riconosciuti |
| **Contesto** | ❌ Ignora contesto | ✅ Comprende contesto |
| **Multilingua** | ❌ Problematico | ✅ Funziona bene |
| **Correlazioni sottili** | ❌ Non rilevate | ✅ Identificate |
| **Spiegazione** | ❌ Nessuna | ✅ Motivazione fornita |
| **Flessibilità** | ❌ Rigido | ✅ Adattivo |
| **Costo** | ✅ Gratuito | ⚠️ Richiede API call |
| **Velocità** | ✅ Istantaneo | ⚠️ ~1-2 secondi |

## Costi e Performance

### Costi API

**Per verifica (stima):**
- Input: ~500-1000 tokens (titoli + estratti)
- Output: ~100-200 tokens (JSON + motivazione)
- Totale: ~600-1200 tokens per verifica

**Costo approssimativo:**
- Groq: ~$0.0001 per verifica (quasi gratuito)
- OpenAI GPT-4o: ~$0.001 per verifica
- Claude: ~$0.0015 per verifica

**Conclusione:** Costo trascurabile per il valore aggiunto.

### Performance

- **Tempo medio:** 1-2 secondi
- **Impatto UX:** Minimo, mostrato con progress bar
- **Fallback:** Istantaneo se API non disponibile

## Modifiche ai File

### File Modificati

1. **utils/multi-analysis-manager.js**
   - Sostituito `extractKeywords()` e `findCommonKeywords()`
   - Aggiunto `checkCorrelationWithAI()`
   - Modificato return type di `checkArticlesRelation()`

2. **utils/api-client.js**
   - Aggiunto `generateCompletion()` generico
   - Aggiunto `callGroqCompletion()`
   - Aggiunto `callOpenAICompletion()`
   - Aggiunto `callAnthropicCompletion()`

3. **multi-analysis.html**
   - Aggiunto `<div id="unrelatedReason">` nel modal

4. **multi-analysis.css**
   - Aggiunto stile `.unrelated-reason`

5. **multi-analysis.js**
   - Modificato `startAnalysis()` per gestire oggetto result
   - Modificato `showUnrelatedModal()` per mostrare motivazione

### File Documentazione

1. **prompts/multi-analysis.md**
   - Aggiunta sezione "Verifica Correlazione (Analisi Semantica AI)"
   - Documentati prompt e approccio

2. **documento_progetto/multi_analysis_feature.md**
   - Aggiornata sezione "Verifica Correlazione"
   - Documentati vantaggi e fallback

3. **documento_progetto/ai_correlation_detection.md** (nuovo)
   - Documentazione completa del sistema

## Testing

### Test Cases

1. **Articoli chiaramente correlati**
   - ✅ Deve riconoscere correlazione
   - ✅ Deve identificare temi comuni

2. **Articoli chiaramente non correlati**
   - ✅ Deve riconoscere non correlazione
   - ✅ Deve fornire motivazione chiara

3. **Articoli con correlazione sottile**
   - ✅ Deve essere "generoso" e riconoscere correlazione
   - ✅ Deve spiegare il legame trovato

4. **Articoli in lingue diverse**
   - ✅ Deve funzionare correttamente
   - ✅ Deve riconoscere temi comuni

5. **Errori e fallback**
   - ✅ API key mancante → assume correlati
   - ✅ Errore API → assume correlati
   - ✅ JSON invalido → parsing testuale

### Metriche di Successo

- **Accuratezza:** >90% di decisioni corrette
- **Tempo risposta:** <3 secondi
- **Tasso fallback:** <5% (errori API)
- **Soddisfazione utente:** Motivazioni chiare e utili

## Conclusioni

L'implementazione dell'analisi semantica tramite AI per la rilevazione della correlazione tra articoli rappresenta un significativo miglioramento rispetto al keyword matching:

✅ **Più intelligente:** Comprende semantica e contesto
✅ **Più flessibile:** Funziona con terminologia diversa
✅ **Più trasparente:** Fornisce motivazioni delle decisioni
✅ **Più robusto:** Gestisce edge cases e multilingua

Il costo aggiuntivo (1-2 secondi e ~$0.001 per verifica) è ampiamente giustificato dal valore aggiunto in termini di accuratezza e user experience.

---

*Documento creato: 21 Novembre 2025*
*Versione: 1.0*
