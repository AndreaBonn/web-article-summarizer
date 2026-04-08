# 🤖 AI Article Summarizer

> Estensione Chrome per riassumere articoli web con intelligenza artificiale. Supporta Groq, OpenAI e Claude per generare riassunti completi, punti chiave e traduzioni.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/yourusername/ai-article-summarizer)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 📋 Indice

- [Caratteristiche](#-caratteristiche)
- [Installazione](#-installazione)
- [Configurazione](#-configurazione)
- [Utilizzo](#-utilizzo)
- [Funzionalità Dettagliate](#-funzionalità-dettagliate)
- [Provider AI Supportati](#-provider-ai-supportati)
- [Lingue Supportate](#-lingue-supportate)
- [Tipi di Contenuto](#-tipi-di-contenuto)
- [Architettura](#-architettura)
- [FAQ](#-faq)
- [Troubleshooting](#-troubleshooting)
- [Contribuire](#-contribuire)
- [Licenza](#-licenza)

---

## ✨ Caratteristiche

### 🎯 Funzionalità Principali

- **📝 Riassunti Intelligenti**: Genera riassunti completi e accurati di articoli web
- **🔑 Punti Chiave**: Estrae 7-12 punti salienti con riferimenti ai paragrafi
- **🌍 Traduzione Completa**: Traduce l'intero articolo in 5 lingue
- **💬 Q&A Interattivo**: Fai domande sull'articolo e ottieni risposte contestuali
- **🎤 Funzionalità Vocali**: Text-to-Speech per ascoltare i contenuti e Speech-to-Text per domande vocali
- **🔬 Analisi Multi-Articolo**: Confronta e analizza più articoli contemporaneamente
- **📄 Esportazione Avanzata**: PDF e Markdown con selezione sezioni personalizzabile
- **📧 Invio Email**: Invia riassunti via email con gestione destinatari salvati
- **📚 Cronologia Completa**: Salva articoli singoli e analisi multi-articolo separatamente
- **⚡ Cache Intelligente**: Ricarica istantaneo per articoli già analizzati
- **🎨 Interfaccia Moderna**: Design pulito e intuitivo con modal animati
- **♿ Accessibilità**: Supporto completo per utenti non vedenti e ipovedenti

### 🚀 Caratteristiche Avanzate

- **🤖 Classificazione AI**: Rilevamento automatico del tipo di articolo tramite intelligenza artificiale
- **Prompt Specializzati**: Ottimizzati per articoli scientifici, news, tutorial, business, opinioni
- **Multi-Provider**: Scegli tra Groq (veloce), OpenAI (qualità) o Claude (dettagliato)
- **Rilevamento Correlazioni**: Identifica automaticamente se gli articoli sono correlati
- **Q&A Multi-Articolo**: Sistema interattivo per fare domande su più articoli
- **Esportazione Selettiva**: Scegli quali sezioni includere in PDF, Markdown ed Email
- **Sicurezza**: API keys criptate localmente con AES-256
- **Offline-First**: Cache locale per accesso rapido senza connessione
- **Statistiche**: Traccia utilizzo, parole elaborate e tempo risparmiato

---

## 📦 Installazione

### Metodo 1: Chrome Web Store (Consigliato)
```
🔜 Coming soon
```

### Metodo 2: Installazione Manuale

1. **Scarica il codice**
   ```bash
   git clone https://github.com/yourusername/ai-article-summarizer.git
   cd ai-article-summarizer
   ```

2. **Apri Chrome Extensions**
   - Vai su `chrome://extensions/`
   - Attiva "Modalità sviluppatore" (in alto a destra)

3. **Carica l'estensione**
   - Clicca "Carica estensione non pacchettizzata"
   - Seleziona la cartella del progetto

4. **Verifica installazione**
   - L'icona 🤖 dovrebbe apparire nella barra degli strumenti

---

## ⚙️ Configurazione

### 1. Ottieni le API Keys

Hai bisogno di almeno una API key da uno di questi provider:

#### 🟢 Groq (Consigliato per iniziare)
- **Velocità**: ⚡⚡⚡ Molto veloce
- **Costo**: 💰 Economico
- **Qualità**: ⭐⭐⭐ Buona
- **Come ottenerla**:
  1. Vai su [console.groq.com](https://console.groq.com)
  2. Registrati gratuitamente
  3. Vai su "API Keys" → "Create API Key"
  4. Copia la chiave (inizia con `gsk_...`)

#### 🔵 OpenAI
- **Velocità**: ⚡⚡ Media
- **Costo**: 💰💰 Moderato
- **Qualità**: ⭐⭐⭐⭐ Ottima
- **Come ottenerla**:
  1. Vai su [platform.openai.com](https://platform.openai.com)
  2. Registrati e aggiungi credito
  3. Vai su "API Keys" → "Create new secret key"
  4. Copia la chiave (inizia con `sk-...`)

#### 🟣 Anthropic Claude
- **Velocità**: ⚡ Lenta
- **Costo**: 💰💰💰 Costoso
- **Qualità**: ⭐⭐⭐⭐⭐ Eccellente
- **Come ottenerla**:
  1. Vai su [console.anthropic.com](https://console.anthropic.com)
  2. Registrati
  3. Vai su "API Keys" → "Create Key"
  4. Copia la chiave (inizia con `sk-ant-...`)

### 2. Configura l'Estensione

1. **Apri le Impostazioni**
   - Clicca sull'icona dell'estensione
   - Clicca sull'icona ⚙️ in alto a destra

2. **Inserisci le API Keys**
   - Incolla le chiavi nei campi corrispondenti
   - Clicca "🧪 Test" per verificare la connessione
   - Clicca "💾 Salva API Keys"

3. **Configura Preferenze**
   - Seleziona il provider predefinito
   - Abilita/disabilita salvataggio cronologia
   - Clicca "💾 Salva Preferenze"

✅ **Configurazione completata!** Sei pronto per usare l'estensione.

---

## 🎯 Utilizzo

### Workflow Base

```
1. Apri un articolo web
2. Clicca sull'icona dell'estensione 🤖
3. Seleziona lingua output (es: Italiano)
4. Seleziona tipo contenuto (o lascia "Automatico")
5. Clicca "🔍 Analizza Pagina"
6. Clicca "⚡ Genera Riassunto"
7. Leggi riassunto e punti chiave!
```

### Funzionalità Avanzate

#### 📝 Riassunto
- **Cosa fa**: Sintetizza l'articolo in 200-1200 parole
- **Quando usarlo**: Per capire rapidamente di cosa parla l'articolo
- **Formato**: Prosa fluida e ben strutturata

#### 🔑 Punti Chiave
- **Cosa fa**: Estrae 7-12 punti salienti
- **Quando usarlo**: Per identificare informazioni specifiche
- **Formato**: Lista con titolo, riferimento paragrafo (§N) e descrizione
- **Interattivo**: Clicca su un punto per evidenziare il paragrafo nell'articolo

#### 🌍 Traduzione
- **Cosa fa**: Traduce l'intero articolo nella lingua scelta
- **Quando usarlo**: Per leggere articoli in lingue che non conosci
- **Come usarlo**:
  1. Genera prima il riassunto
  2. Vai al tab "Traduzione"
  3. Clicca "🌍 Traduci Articolo"
  4. Attendi 10-30 secondi
- **Cache**: La traduzione viene salvata per accesso rapido

#### 💬 Domande & Risposte
- **Cosa fa**: Risponde a domande specifiche sull'articolo
- **Quando usarlo**: Per approfondire concetti o chiarire dubbi
- **Come usarlo**:
  1. Scorri in basso dopo il riassunto
  2. Digita la tua domanda
  3. Clicca "Chiedi"
- **Esempi di domande**:
  - "Quali sono le implicazioni pratiche?"
  - "Spiega meglio il concetto di X"
  - "Quali dati supportano questa conclusione?"
  - "Chi sono gli autori citati?"

#### 🔬 Analisi Multi-Articolo
- **Cosa fa**: Confronta e analizza più articoli contemporaneamente
- **Quando usarlo**: Per ricerche approfondite, confronti o sintesi di più fonti
- **Come usarlo**:
  1. Vai alla cronologia (📚)
  2. Clicca "Analisi Multi-Articolo" in alto
  3. Seleziona 2-10 articoli dalla lista
  4. Scegli le opzioni di analisi:
     - **Riassunto Globale**: Sintesi unificata di tutti gli articoli
     - **Confronto Idee**: Analisi di idee comuni, conflitti e prospettive diverse
     - **Q&A Multi-Articolo**: Sistema interattivo per domande su tutti gli articoli
  5. Clicca "Avvia Analisi"

**Funzionalità Avanzate**:
- **Rilevamento Correlazioni**: Il sistema identifica automaticamente se gli articoli sono correlati
- **Gestione Articoli Non Correlati**: Opzioni specifiche per articoli su argomenti diversi
- **Q&A Interattivo**: Fai domande che spaziano su tutti gli articoli selezionati
- **Cronologia Dedicata**: Le analisi multi-articolo vengono salvate separatamente
- **Riapertura Analisi**: Riapri analisi passate e continua a fare domande
- **Esportazione Completa**: Esporta riassunto, confronto e tutte le Q&A in PDF/Markdown

**Esempi di Utilizzo**:
- Confrontare diverse recensioni di un prodotto
- Analizzare paper scientifici correlati
- Sintetizzare notizie da più fonti
- Confrontare opinioni diverse sullo stesso argomento

#### 📄 Esportazione Avanzata
- **Formati Disponibili**: PDF e Markdown
- **Selezione Sezioni**: Scegli cosa includere nell'esportazione
  - ✅ Riassunto
  - ✅ Punti Chiave
  - ✅ Traduzione (se presente)
  - ✅ Domande e Risposte (se presenti)
- **Come usarlo**:
  1. Clicca "📄 PDF" o "📝 MD" dopo aver generato il riassunto
  2. Seleziona le sezioni da includere nel modal
  3. Clicca "Esporta"
- **Formato**: Layout professionale con formattazione pulita

#### 📚 Cronologia
- **Cosa salva**: 
  - Ultimi 50 riassunti di articoli singoli
  - Ultime 30 analisi multi-articolo
- **Come accedere**: Clicca 📚 in alto a destra
- **Tab Separati**:
  - **📄 Articoli Singoli**: Cronologia riassunti normali
  - **🔬 Analisi Multi-Articolo**: Cronologia analisi comparative
- **Funzionalità**:
  - 🔍 Ricerca per titolo o URL
  - 🎛️ Filtri per provider, lingua, tipo
  - 📄 Esporta qualsiasi riassunto o analisi passata
  - 📋 Copia testo
  - 🗑️ Elimina singoli o tutti (separato per tipo)
  - 🔄 Riapri analisi multi-articolo e continua Q&A

---

## 🎨 Funzionalità Dettagliate

### 1. Riassunti Intelligenti

#### Caratteristiche
- **Lunghezza Adattiva**: 200-1200 parole in base alla complessità
- **Completezza**: Cattura tutti i concetti principali
- **Precisione**: Mantiene nomi, date, cifre e riferimenti specifici
- **Stile**: Prosa fluida e naturale

#### Prompt Specializzati per Tipo

**📄 Articoli Generici**
- Focus su concetti principali e struttura logica
- Preserva esempi e citazioni significative

**🔬 Articoli Scientifici**
- Metodologia dettagliata
- Risultati con statistiche complete
- Limitazioni e implicazioni

**📰 News**
- 5W1H (Who, What, When, Where, Why, How)
- Timeline cronologica
- Fonti e dichiarazioni

**💻 Tutorial**
- Obiettivo e prerequisiti
- Passi principali
- Comandi chiave e troubleshooting

**💼 Business**
- Strategia e metriche
- ROI e risultati quantitativi
- Lessons learned

**💭 Opinioni**
- Tesi principale
- Argomentazioni e evidenze
- Contro-argomenti

### 2. Estrazione Punti Chiave

#### Caratteristiche
- **Numero**: 7-12 punti (adattivo)
- **Formato**: Titolo + Riferimento (§N) + Descrizione
- **Lunghezza**: 2-4 frasi per punto
- **Specificità**: Dati concreti, non generalizzazioni

#### Criteri di Qualità
- ✅ Specifico: "67% degli intervistati" NON "La maggioranza"
- ✅ Autosufficiente: Comprensibile senza altri punti
- ✅ Referenziato: Sempre indica §N o §N-M
- ✅ Sostanziale: Fornisce informazioni di valore
- ✅ Conciso: 2-4 frasi massimo

### 3. Traduzione Completa

#### Caratteristiche
- **Completezza**: Traduce tutto l'articolo
- **Qualità**: Fluida e naturale, non letterale
- **Fedeltà**: Mantiene significato e informazioni
- **Contesto**: Rispetta tono e registro

#### Lingue Supportate
- 🇮🇹 **Italiano**
- 🇬🇧 **Inglese**
- 🇪🇸 **Spagnolo**
- 🇫🇷 **Francese**
- 🇩🇪 **Tedesco**

#### Cache e Storico
- ⚡ Caricamento istantaneo se già tradotto
- 💾 Salvato nello storico con riassunto
- 🔄 Rigenera se necessario

### 4. Sistema Q&A

#### Caratteristiche
- **Basato su Contenuto**: Risponde solo usando l'articolo
- **Contestuale**: Cita paragrafi (§N) quando possibile
- **Multilingua**: Risponde nella lingua di output scelta
- **Veloce**: 3-5 secondi per risposta
- **🎤 Domande Vocali**: Fai domande usando la tua voce
- **🔊 Risposte Audio**: Ascolta le risposte generate dall'AI

#### Best Practices
- ✅ Fai domande specifiche
- ✅ Chiedi chiarimenti su concetti
- ✅ Richiedi implicazioni o applicazioni
- ❌ Non chiedere opinioni personali
- ❌ Non chiedere info non nell'articolo

### 4.5. Funzionalità Vocali (Accessibilità)

#### Text-to-Speech (TTS) 🔊
Ascolta i contenuti generati dall'AI:
- **Riassunti**: Pulsante "🔊 Leggi Riassunto"
- **Punti Chiave**: Pulsante "🔊 Leggi Punti Chiave"
- **Traduzioni**: Pulsante "🔊 Leggi Traduzione"
- **Risposte Q&A**: Pulsante "🔊 Leggi Risposta"

**Lingue Supportate**:
- 🇮🇹 Italiano (it-IT)
- 🇺🇸 Inglese (en-US)
- 🇪🇸 Spagnolo (es-ES)
- 🇫🇷 Francese (fr-FR)
- 🇩🇪 Tedesco (de-DE)

**Tecnologia**: Chrome TTS API (gratuita, offline)

#### Speech-to-Text (STT) 🎤
Fai domande usando la tua voce:
1. Clicca sul pulsante 🎤 nella sezione Q&A
2. Parla la tua domanda
3. La trascrizione appare in tempo reale
4. La domanda viene automaticamente inviata all'AI
5. La risposta può essere letta ad alta voce

**Lingue Supportate**: Italiano e Inglese

**Tecnologia**: Web Speech API (gratuita, richiede connessione)

**Accessibilità**:
- ♿ Supporto completo per utenti non vedenti
- 📖 Ideale per utenti con dislessia
- 🎧 Perfetto per multitasking
- 🌍 Apprendimento multimodale

### 5. Esportazione PDF

#### Struttura PDF
```
┌─────────────────────────────────┐
│ Header                          │
│ - Logo e data                   │
│ - Metadata (provider, lingua)   │
├─────────────────────────────────┤
│ Articolo                        │
│ - Titolo                        │
│ - Statistiche (parole, tempo)   │
│ - URL                           │
├─────────────────────────────────┤
│ RIASSUNTO                       │
│ [Testo completo]                │
├─────────────────────────────────┤
│ PUNTI CHIAVE                    │
│ 1. Titolo (§N)                  │
│    Descrizione...               │
│ 2. Titolo (§N-M)                │
│    Descrizione...               │
├─────────────────────────────────┤
│ TRADUZIONE (se presente)        │
│ [Testo completo]                │
├─────────────────────────────────┤

### 6. Invio Email

#### Caratteristiche
- **📧 Mailto Link**: Apre il client email predefinito
- **💾 Email Salvate**: Memorizza fino a 10 destinatari recenti
- **🗑️ Gestione Lista**: Rimuovi email non più necessarie
- **📝 Formato Professionale**: Email ben strutturata e leggibile
- **🔗 Nuova Tab**: Non sostituisce la pagina corrente

#### Contenuto Email
```
Oggetto: Riassunto: [Titolo Articolo]

Corpo:
┌─────────────────────────────────┐
│ RIASSUNTO ARTICOLO              │
│ ═══════════════════════════════ │
│                                 │
│ 📄 Titolo: [...]                │
│ 🔗 URL: [...]                   │
│ 📊 Lunghezza: [N parole]        │
│ 📅 Generato il: [data]          │
│                                 │
│ ═══════════════════════════════ │
│                                 │
│ 📝 RIASSUNTO                    │
│ ─────────────────────────────── │
│ [Testo completo riassunto]      │
│                                 │
│ ═══════════════════════════════ │
│                                 │
│ 🔑 PUNTI CHIAVE                 │
│ ─────────────────────────────── │
│ 1. [Titolo] (§N)                │
│    [Descrizione]                │
│                                 │
│ 2. [Titolo] (§N-M)              │
│    [Descrizione]                │
│                                 │
│ ═══════════════════════════════ │
│                                 │
│ 🌍 TRADUZIONE (se presente)     │
│ ─────────────────────────────── │
│ [Testo completo traduzione]     │
│                                 │
│ ═══════════════════════════════ │
│ Generato con AI Article         │
│ Summarizer                      │
└─────────────────────────────────┘
```

#### Come Usare
1. **Clicca "📧 Email"** nel popup o nella cronologia
2. **Inserisci email destinatario** o seleziona da lista salvate
3. **Clicca "Invia"** - si apre il client email
4. **Verifica e invia** il messaggio dal tuo client

#### Gestione Email Salvate
- **Seleziona**: Click sull'email per auto-compilare
- **Elimina**: Click su 🗑️ per rimuovere dalla lista
- **Limite**: Max 10 email salvate (le più recenti)
- **Privacy**: Email salvate solo localmente nel browser

#### Note
- ⚠️ Richiede client email configurato (Gmail, Outlook, etc.)
- 📱 Su mobile potrebbe aprire app email
- 🔒 Email non inviate automaticamente - controllo manuale
- 🌐 Link mailto aperto in nuova tab (non sostituisce pagina corrente)
├─────────────────────────────────┤
│ Footer                          │
│ - Numerazione pagine            │
└─────────────────────────────────┘
```

#### Caratteristiche
- ✅ Layout professionale
- ✅ Paginazione automatica
- ✅ Colori e formattazione
- ✅ Font leggibili
- ✅ Riferimenti paragrafi mantenuti

### 6. Analisi Multi-Articolo

#### Caratteristiche
- **Selezione Articoli**: 2-10 articoli dalla cronologia
- **Rilevamento Correlazioni**: Identifica automaticamente se gli articoli sono correlati
- **Tre Modalità di Analisi**:
  - **Riassunto Globale**: Sintesi unificata di tutti gli articoli
  - **Confronto Idee**: Analisi comparativa di idee comuni, conflitti e prospettive
  - **Q&A Multi-Articolo**: Sistema interattivo per domande su tutti gli articoli

#### Rilevamento Correlazioni
Il sistema analizza automaticamente se gli articoli selezionati sono correlati:
- **Correlati**: Procede con analisi completa (riassunto + confronto + Q&A)
- **Non Correlati**: Offre opzioni:
  - Solo Q&A (per domande specifiche)
  - Analisi Completa (forzata)
  - Annulla

#### Q&A Multi-Articolo
- **Contesto Completo**: L'AI ha accesso a tutti gli articoli
- **Citazioni**: Le risposte citano gli articoli specifici (es: "L'articolo 1 afferma...")
- **Interattivo**: Box di input sempre visibile, chat scrollabile
- **Persistenza**: Domande e risposte salvate nella cronologia
- **Riapertura**: Riapri analisi passate e continua la conversazione

#### Esportazione Multi-Articolo
- **Selezione Sezioni**: Scegli cosa esportare
  - Riassunto Globale
  - Confronto Idee
  - Domande e Risposte
- **Formati**: PDF e Markdown
- **Email**: Invia l'analisi completa via email

### 7. Cronologia e Cache

#### Sistema di Cache
- **TTL**: 24 ore
- **Capacità**: 50 riassunti + 50 traduzioni
- **Chiave**: URL + Provider + Lingua + Tipo
- **Eviction**: LRU (Least Recently Used)

#### Cronologia
- **Capacità**: 50 entry
- **Contenuto**: Riassunto + Punti Chiave + Traduzione
- **Metadata**: Provider, lingua, tipo, data
- **Ricerca**: Per titolo o URL
- **Filtri**: Provider, lingua, tipo, data

---

## 🤖 Provider AI Supportati

### Confronto Provider

| Feature | Groq | OpenAI | Claude |
|---------|------|--------|--------|
| **Velocità** | ⚡⚡⚡ | ⚡⚡ | ⚡ |
| **Costo** | 💰 | 💰💰 | 💰💰💰 |
| **Qualità** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Modello** | Llama 3.3 70B | GPT-4o-mini | Claude 3.5 Sonnet |
| **Max Tokens** | 4000 | 4000 | 4000 |
| **Consigliato per** | Uso quotidiano | Articoli complessi | Paper scientifici |

### Quando Usare Quale

**🟢 Groq**
- ✅ Articoli generici
- ✅ News e blog
- ✅ Uso frequente
- ✅ Budget limitato

**🔵 OpenAI**
- ✅ Articoli tecnici
- ✅ Tutorial complessi
- ✅ Business case
- ✅ Qualità alta

**🟣 Claude**
- ✅ Paper scientifici
- ✅ Analisi dettagliate
- ✅ Testi complessi
- ✅ Massima accuratezza

---

## 🌍 Lingue Supportate

### Lingue di Output

L'estensione può generare riassunti, punti chiave e traduzioni in:

- 🇮🇹 **Italiano** - Lingua predefinita
- 🇬🇧 **Inglese** - English
- 🇪🇸 **Spagnolo** - Español
- 🇫🇷 **Francese** - Français
- 🇩🇪 **Tedesco** - Deutsch

### Rilevamento Automatico

L'estensione rileva automaticamente la lingua dell'articolo originale e può:
- Generare riassunti nella lingua scelta (anche diversa dall'originale)
- Tradurre da qualsiasi lingua verso le 5 lingue supportate
- Avvisare se l'articolo è già nella lingua target

---

## 📚 Tipi di Contenuto

### Rilevamento Automatico con AI

L'estensione utilizza l'intelligenza artificiale per identificare automaticamente il tipo di articolo:

**Come Funziona**:
1. Estrae un campione del contenuto (primi 1500 caratteri)
2. Invia una richiesta di classificazione all'AI
3. Riceve la categoria più appropriata
4. Applica il prompt specializzato per quel tipo

**Vantaggi**:
- ✅ Precisione elevata (85%+)
- ✅ Adattamento al contesto
- ✅ Nessuna configurazione manuale necessaria
- ✅ Sempre aggiornato con nuovi pattern

**Opzioni**:
- **Rilevamento Automatico** (default): L'AI classifica l'articolo
- **Selezione Manuale**: Scegli tu il tipo se preferisci

**Nota**: Il rilevamento automatico è sempre attivo all'apertura dell'estensione. Puoi cambiarlo manualmente se necessario, ma alla prossima apertura tornerà su "Automatico".

### Tipi Supportati

#### 📄 Articolo Generico
- Blog post, articoli magazine
- Contenuti divulgativi
- Prompt generici bilanciati

#### 🔬 Articolo Scientifico
- Paper di ricerca
- Studi accademici
- Focus su metodologia e risultati

#### 📰 Notizia
- News, breaking news
- Articoli giornalistici
- Focus su 5W1H e timeline

#### 💻 Tutorial/Guida
- How-to, guide tecniche
- Documentazione
- Focus su passi e comandi

#### 💼 Business/Case Study
- Analisi aziendali
- Case study
- Focus su strategia e ROI

#### 💭 Opinione/Editoriale
- Articoli di opinione
- Saggi argomentativi
- Focus su tesi e argomentazioni

---

## 🏗️ Architettura

### Struttura del Progetto

```
ai-article-summarizer/
├── manifest.json           # Configurazione estensione
├── background.js          # Service worker
├── content.js            # Script iniettato nelle pagine
├── popup.html/js/css     # Interfaccia principale
├── options.html/js/css   # Pagina impostazioni
├── history.html/js/css   # Pagina cronologia
├── icons/               # Icone estensione
├── lib/                 # Librerie esterne
│   ├── Readability.js   # Estrazione contenuto
│   └── jspdf.umd.min.js # Generazione PDF
├── utils/               # Moduli utility
│   ├── api-client.js    # Client API LLM
│   ├── storage-manager.js # Gestione storage
│   ├── history-manager.js # Gestione cronologia
│   ├── pdf-exporter.js   # Esportazione PDF
│   ├── email-manager.js  # Invio email
│   ├── translator.js     # Sistema traduzione
│   ├── advanced-analysis.js # Q&A
│   └── content-extractor.js # Estrazione articoli
└── prompts/             # Prompt per LLM
    ├── summary.md       # Prompt riassunti
    ├── estrazione_punti_chiave.md
    └── traduzione.md    # Prompt traduzioni
```

### Tecnologie Utilizzate

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Chrome Storage API (Local)
- **Crittografia**: Web Crypto API (AES-256-GCM)
- **PDF**: jsPDF 2.5.1
- **Estrazione**: Mozilla Readability
- **AI**: Groq, OpenAI, Anthropic APIs

### Sicurezza

- 🔒 **API Keys**: Criptate con AES-256-GCM
- 🔒 **Storage**: Solo locale, nessun server esterno
- 🔒 **CSP**: Content Security Policy restrittiva
- 🔒 **Permissions**: Solo necessarie (activeTab, storage, scripting)

---

## ❓ FAQ

### Generale

**Q: L'estensione è gratuita?**  
A: L'estensione è gratuita, ma hai bisogno di API keys dai provider AI (che hanno costi variabili).

**Q: I miei dati sono al sicuro?**  
A: Sì! Tutto è salvato localmente sul tuo browser. Le API keys sono criptate con AES-256.

**Q: Funziona offline?**  
A: Parzialmente. La cache permette di accedere a riassunti già generati, ma serve connessione per nuovi riassunti.

**Q: Quanti articoli posso riassumere?**  
A: Illimitati! Dipende solo dal credito delle tue API keys.

### Utilizzo

**Q: Quanto costa usare l'estensione?**  
A: Dipende dal provider:
- Groq: ~$0.001 per riassunto
- OpenAI: ~$0.01 per riassunto
- Claude: ~$0.05 per riassunto

**Q: Quanto tempo ci vuole?**  
A: 5-15 secondi per riassunto, 10-30 secondi per traduzione.

**Q: Posso usare più provider?**  
A: Sì! Configura tutte le API keys e scegli quale usare ogni volta.

**Q: La traduzione è accurata?**  
A: Molto! Gli LLM sono ottimi traduttori e mantengono contesto e significato.

### Problemi Comuni

**Q: "API key non configurata"**  
A: Vai in Impostazioni (⚙️) e inserisci almeno una API key.

**Q: "Nessun articolo rilevato"**  
A: La pagina non contiene un articolo riconoscibile. Prova con blog o news standard.

**Q: "Articolo troppo breve"**  
A: L'articolo ha meno di 200 parole. Serve più contenuto.

**Q: Il PDF non si scarica**  
A: Ricarica l'estensione (`chrome://extensions/` → Ricarica).

**Q: La traduzione non funziona**  
A: Verifica di aver configurato le API keys e ricarica l'estensione.

---

## 🔧 Troubleshooting

### Problemi di Installazione

**Errore: "Manifest version not supported"**
- Assicurati di usare Chrome 88+ o Edge 88+
- L'estensione usa Manifest V3

**Errore: "Failed to load extension"**
- Verifica che tutti i file siano presenti
- Controlla la console per errori specifici

### Problemi di Funzionamento

**L'estensione non si apre**
1. Ricarica l'estensione
2. Riavvia Chrome
3. Verifica permessi in `chrome://extensions/`

**Errore 401 (Unauthorized)**
- API key non valida
- Verifica di aver copiato la chiave completa
- Rigenera la chiave sul sito del provider

**Errore 429 (Too Many Requests)**
- Troppe richieste in poco tempo
- Attendi 1-2 minuti
- Verifica limiti del tuo piano API

**Errore 500/503 (Server Error)**
- Problema temporaneo del provider
- Riprova tra qualche minuto
- Prova con un provider diverso

### Debug

**Aprire la Console**
1. Clicca destro sull'icona estensione
2. Seleziona "Ispeziona popup"
3. Vai al tab "Console"

**Verificare Storage**
```javascript
// Nella console del popup
chrome.storage.local.get(null, (data) => console.log(data));
```

**Cancellare Cache**
1. Vai in Impostazioni
2. Clicca "🗑️ Cancella Cache"
3. Oppure: Cronologia → "🗑️ Cancella Tutto"

---

## 🤝 Contribuire

Contributi sono benvenuti! Ecco come puoi aiutare:

### Segnalare Bug

1. Vai su [Issues](https://github.com/yourusername/ai-article-summarizer/issues)
2. Clicca "New Issue"
3. Usa il template "Bug Report"
4. Fornisci dettagli:
   - Versione Chrome
   - Passi per riprodurre
   - Screenshot se possibile
   - Log della console

### Proporre Feature

1. Vai su [Issues](https://github.com/yourusername/ai-article-summarizer/issues)
2. Clicca "New Issue"
3. Usa il template "Feature Request"
4. Descrivi:
   - Problema che risolve
   - Soluzione proposta
   - Alternative considerate

### Contribuire Codice

1. **Fork** il repository
2. **Crea** un branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** le modifiche (`git commit -m 'Add AmazingFeature'`)
4. **Push** al branch (`git push origin feature/AmazingFeature`)
5. **Apri** una Pull Request

### Linee Guida

- Segui lo stile del codice esistente
- Commenta il codice complesso
- Testa le modifiche
- Aggiorna la documentazione

---

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file [LICENSE](LICENSE) per dettagli.

```
MIT License

Copyright (c) 2024 AI Article Summarizer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Ringraziamenti

- **Mozilla Readability** - Per l'estrazione del contenuto
- **jsPDF** - Per la generazione PDF
- **Groq, OpenAI, Anthropic** - Per le API AI
- **Tutti i contributori** - Per il supporto e i feedback

---

## 📞 Supporto

- 📧 **Email**: support@example.com
- 💬 **Discord**: [Join our server](https://discord.gg/example)
- 🐦 **Twitter**: [@AIArticleSummarizer](https://twitter.com/example)
- 📖 **Docs**: [docs.example.com](https://docs.example.com)

---

## 🗺️ Roadmap

### v2.1.0 (Q1 2025)
- [ ] Modalità scura
- [ ] Scorciatoie da tastiera
- [ ] Esportazione Markdown
- [ ] Integrazione Notion/Obsidian

### v2.2.0 (Q2 2025)
- [ ] Batch processing (più articoli)
- [ ] Tag personalizzati
- [ ] Grafici statistiche
- [ ] Condivisione riassunti

### v3.0.0 (Q3 2025)
- [ ] Supporto video (YouTube)
- [ ] Supporto PDF
- [ ] Riassunti audio (TTS)
- [ ] Mobile app

---

## 📊 Statistiche

- ⭐ **Stars**: 0 (Be the first!)
- 🍴 **Forks**: 0
- 👥 **Contributors**: 1
- 📦 **Version**: 2.0.0
- 📅 **Last Update**: November 2024

---

<div align="center">

**Fatto con ❤️ da [Your Name](https://github.com/yourusername)**

[⬆ Torna su](#-ai-article-summarizer)

</div>
