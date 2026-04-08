# 📚 Citation Extraction Feature

## Panoramica
Funzionalità per estrarre citazioni, riferimenti bibliografici e fonti da articoli web, utile per studenti, ricercatori e accademici.

## Caratteristiche Principali

### 1. Estrazione Intelligente
- **Citazioni Dirette**: Identifica frasi citate da altre fonti
- **Riferimenti**: Rileva menzioni di autori, studi, libri
- **Dati Statistici**: Trova numeri e percentuali citati
- **Fonti**: Identifica link e riferimenti bibliografici

### 2. Formati Bibliografici
Supporta i principali stili di citazione:
- **APA** (7th Edition)
- **MLA** (9th Edition)
- **Chicago** (17th Edition)
- **IEEE**
- **Harvard**

### 3. Informazioni per Citazione
Ogni citazione include:
- Testo citato (se presente)
- Autore/fonte
- Contesto e rilevanza
- Tipo di citazione
- Posizione nell'articolo

### 4. Citazione Articolo Principale
Genera automaticamente la citazione bibliografica dell'articolo analizzato in tutti gli stili supportati.

## Interfaccia Utente

### Tab Citazioni
Nuovo tab nel popup con:
- Pulsante "📖 Estrai Citazioni"
- Selector stile bibliografico
- Lista citazioni trovate
- Citazione articolo principale
- Pulsante copia bibliografia

### Visualizzazione Citazioni
Ogni citazione mostra:
- 💬 Icona tipo (citazione diretta)
- 📖 Icona tipo (riferimento)
- 📊 Icona tipo (dato statistico)
- 🔗 Icona tipo (fonte)
- Numero progressivo
- Autore (se disponibile)
- Testo citato
- Contesto
- Posizione nell'articolo

## Flusso Utente

1. **Analizza Articolo**
   - Utente apre popup
   - Clicca "Analizza Pagina"
   - Genera riassunto

2. **Estrai Citazioni**
   - Passa al tab "Citazioni"
   - Clicca "📖 Estrai Citazioni"
   - Attende elaborazione AI

3. **Visualizza Risultati**
   - Vede lista citazioni trovate
   - Vede citazione articolo principale
   - Può cambiare stile bibliografico

4. **Copia Bibliografia**
   - Seleziona stile desiderato
   - Clicca "📋" per copiare
   - Incolla nel documento

## Tecnologia

### AI Prompt
Sistema prompt specializzato per:
- Identificare citazioni esplicite
- Rilevare riferimenti impliciti
- Distinguere opinioni da citazioni
- Estrarre metadati fonte

### Parsing Intelligente
- Estrazione JSON strutturato
- Validazione dati
- Arricchimento metadati
- Gestione errori

### Formattazione
- Template per ogni stile
- Gestione date
- Estrazione dominio
- Generazione chiavi BibTeX

## Integrazione

### Cronologia
Le citazioni vengono salvate insieme a:
- Riassunto
- Punti chiave
- Traduzione
- Q&A

### Export
Citazioni incluse in:
- Export PDF
- Export Markdown
- Copia negli appunti
- Invio email

## Casi d'Uso

### Studenti
- Scrivere tesi e tesine
- Citare fonti correttamente
- Creare bibliografie
- Verificare riferimenti

### Ricercatori
- Raccogliere fonti
- Verificare citazioni
- Creare reference list
- Analizzare letteratura

### Giornalisti
- Verificare fonti
- Citare studi
- Fact-checking
- Documentazione

### Blogger/Content Creator
- Citare fonti
- Dare credito
- Link building
- Trasparenza

## Stili Bibliografici

### APA (American Psychological Association)
```
Autore. (Anno). Titolo. Sito. URL
```

### MLA (Modern Language Association)
```
Autore. "Titolo." Sito, Data, URL. Accessed Data.
```

### Chicago
```
Autore. "Titolo." Sito. Data. URL.
```

### IEEE
```
Autore, "Titolo," Sito, Data. [Online]. Available: URL. [Accessed: Data].
```

### Harvard
```
Autore (Anno) Titolo. Available at: URL (Accessed: Data).
```

## Limitazioni

1. **Dipendenza AI**: Richiede API key attiva
2. **Qualità Input**: Dipende dalla struttura dell'articolo
3. **Citazioni Implicite**: Potrebbe non rilevare tutte le fonti
4. **Metadati Mancanti**: Alcuni articoli non hanno autore/data

## Miglioramenti Futuri

1. **Export BibTeX**: Formato per LaTeX
2. **Export RIS**: Formato per reference manager
3. **Verifica Fonti**: Check link e disponibilità
4. **OCR Immagini**: Estrarre citazioni da screenshot
5. **Integrazione Zotero**: Sync con reference manager
6. **DOI Lookup**: Ricerca automatica DOI
7. **Citation Network**: Visualizza relazioni tra fonti

## Metriche

- Numero citazioni estratte
- Stile più usato
- Tempo medio estrazione
- Tasso successo
- Feedback utenti

## Note Tecniche

### Performance
- Estrazione: ~5-10 secondi
- Parsing: <1 secondo
- Formattazione: istantanea

### Storage
- Citazioni salvate in cronologia
- Formato JSON compatto
- Sincronizzazione automatica

### Sicurezza
- Nessun dato inviato a server esterni
- API key criptate localmente
- Privacy utente garantita
