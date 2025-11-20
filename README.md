# 🤖 AI Article Summarizer

Estensione Chrome che riassume articoli web utilizzando AI (Groq, OpenAI, Claude).

## ✨ Funzionalità

- 📄 **Estrazione automatica** del contenuto degli articoli
- 🤖 **Riassunti intelligenti** con 3 provider AI (Groq, OpenAI, Claude)
- 📌 **Punti chiave** con riferimenti ai paragrafi
- 🎯 **Highlight interattivo** - clicca su un punto chiave per evidenziarlo nella pagina
- 💾 **Cache intelligente** - riassunti salvati per 24 ore
- 📊 **Statistiche** di utilizzo

## 🚀 Installazione

1. Scarica o clona questo repository
2. Apri Chrome e vai su `chrome://extensions/`
3. Attiva "Modalità sviluppatore" in alto a destra
4. Clicca "Carica estensione non pacchettizzata"
5. Seleziona la cartella del progetto
6. Scarica Readability.js da [Mozilla](https://github.com/mozilla/readability) e mettilo in `lib/Readability.js`

## 🔑 Configurazione API Keys

### Groq (Consigliato - Veloce e Gratuito)
1. Vai su [console.groq.com](https://console.groq.com)
2. Registrati gratuitamente
3. Crea una nuova API key
4. Incolla la chiave nelle impostazioni dell'estensione

### OpenAI
1. Vai su [platform.openai.com](https://platform.openai.com)
2. Registrati e aggiungi credito
3. Crea una nuova API key
4. Incolla la chiave nelle impostazioni

### Anthropic Claude
1. Vai su [console.anthropic.com](https://console.anthropic.com)
2. Registrati
3. Crea una nuova API key
4. Incolla la chiave nelle impostazioni

## 📖 Come Usare

1. Apri un articolo web (blog, news, Wikipedia, ecc.)
2. Clicca sull'icona dell'estensione
3. Clicca "Analizza Pagina"
4. Seleziona il provider AI
5. Clicca "Genera Riassunto"
6. Leggi il riassunto e i punti chiave
7. Clicca su un punto chiave per evidenziarlo nella pagina

## 🛠️ Tecnologie

- **Manifest V3** - Ultima versione delle estensioni Chrome
- **Readability.js** - Estrazione contenuto pulito
- **Web Crypto API** - Encryption sicura delle API keys
- **Chrome Storage API** - Salvataggio locale e cache

## 📁 Struttura Progetto

```
ai-article-summarizer/
├── manifest.json           # Configurazione estensione
├── background.js           # Service worker per API calls
├── content.js              # Script per interazione con pagina
├── popup.html/js/css       # Interfaccia popup
├── options.html/js/css     # Pagina impostazioni
├── utils/
│   ├── storage-manager.js  # Gestione storage e encryption
│   ├── api-client.js       # Client per API LLM
│   └── content-extractor.js # Estrazione articoli
└── lib/
    └── Readability.js      # Libreria Mozilla (da scaricare)
```

## 🔒 Sicurezza

- API keys criptate con AES-256
- Nessun dato inviato a server esterni (solo alle API LLM scelte)
- Permessi minimi richiesti
- Storage locale (non sincronizzato)

## 📝 Note

- Richiede almeno 200 parole per generare un riassunto
- Cache valida per 24 ore
- Supporta articoli fino a 500,000 caratteri
- Funziona meglio con articoli di blog, news e documentazione

## 🐛 Troubleshooting

**"Nessun articolo rilevato"**
- La pagina potrebbe non contenere un articolo
- Prova con un blog post o articolo di news

**"API key non valida"**
- Verifica di aver copiato correttamente la chiave
- Controlla che la chiave sia attiva nel dashboard del provider

**"Articolo troppo breve"**
- L'articolo deve avere almeno 200 parole

## 📄 Licenza

MIT License - Vedi LICENSE file per dettagli
