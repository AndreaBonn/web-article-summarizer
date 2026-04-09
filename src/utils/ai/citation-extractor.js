// Citation Extractor - Estrazione citazioni da articoli
import { PromptRegistry } from './prompt-registry.js';
import { APIClient } from './api-client.js';
import { Logger } from '../core/logger.js';
import { HtmlSanitizer } from '../security/html-sanitizer.js';
import { parseLLMJson } from './json-repair.js';

const SIMILARITY_EXACT_THRESHOLD = 0.8;
const SIMILARITY_MIN_THRESHOLD = 0.3;
const MIN_KEYWORD_MATCHES = 2;

// Italian + English stopwords for keyword extraction
const STOPWORDS = new Set([
  'il',
  'lo',
  'la',
  'i',
  'gli',
  'le',
  'un',
  'uno',
  'una',
  'di',
  'a',
  'da',
  'in',
  'con',
  'su',
  'per',
  'tra',
  'fra',
  'e',
  'o',
  'ma',
  'se',
  'che',
  'chi',
  'cui',
  'non',
  'più',
  'anche',
  'come',
  'quando',
  'è',
  'sono',
  'ha',
  'hanno',
  'essere',
  'avere',
  'fare',
  'dire',
  'questo',
  'quello',
  'sua',
  'suo',
  'the',
  'an',
  'and',
  'or',
  'but',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
]);

export const CitationExtractor = {
  /**
   * Estrae citazioni dall'articolo usando AI
   */
  async extractCitations(article, provider, apiKey, _settings) {
    const systemPrompt = PromptRegistry.getCitationSystemPrompt(provider);
    const userPrompt = this.getUserPrompt(article);

    try {
      const response = await APIClient.generateCompletion(
        provider,
        apiKey,
        systemPrompt,
        userPrompt,
        {
          temperature: 0.1,
          maxTokens: provider === 'gemini' ? 8000 : 4000, // Più token per Gemini
          responseFormat: 'json', // Forza output JSON valido
        },
      );

      return this.parseCitations(response, article);
    } catch (error) {
      Logger.error('Errore estrazione citazioni:', error);
      throw new Error('Impossibile estrarre le citazioni: ' + error.message);
    }
  },

  getUserPrompt(article) {
    // Validazione e normalizzazione dell'oggetto article
    if (!article || typeof article !== 'object') {
      throw new Error('Oggetto article non valido');
    }

    // Estrai contenuto in modo sicuro
    let content;
    if (article.content) {
      content = article.content;
    } else if (article.paragraphs && Array.isArray(article.paragraphs)) {
      content = article.paragraphs.map((p) => p.text || p).join('\n\n');
    } else {
      throw new Error("Nessun contenuto trovato nell'articolo");
    }

    // Dividi il contenuto in paragrafi numerati
    const paragraphs = content
      .split('\n\n')
      .filter((p) => p.trim().length > 0)
      .map((p, i) => `§${i + 1}: ${p.trim()}`)
      .join('\n\n');

    // Estrai metadati in modo sicuro
    const title = article.title || 'Titolo non disponibile';
    const author = article.author || article.byline || 'N/A';
    const publication = article.siteName || article.publication || article.source || 'N/A';
    const date = article.publishedDate || article.date || 'N/A';

    return `# ARTICOLO DA ANALIZZARE PER CITAZIONI

**Titolo:** ${title}
**Autore:** ${author}
**Pubblicazione:** ${publication}
**Data:** ${date}

---

## CONTENUTO COMPLETO
(Ogni paragrafo è numerato)

${paragraphs}

---

# ISTRUZIONI

Analizza questo articolo e identifica SOLO citazioni e riferimenti a FONTI ESTERNE.

⚠️ IMPORTANTE: NON includere opinioni dell'autore dell'articolo. Cerca SOLO:
- Riferimenti bibliografici formali (paper, studi, libri)
- Citazioni dirette di persone/esperti ESTERNI
- Dati/statistiche con fonte esplicita
- Riferimenti a ricerche/report di organizzazioni

Per ogni citazione VALIDA trovata, estrai:
- id: numero progressivo
- type: direct_quote | indirect_quote | study_reference | statistic | expert_opinion | book_reference | article_reference | report_reference | organization_data | web_source
- quote_text: OBBLIGATORIO - testo esatto citato o descrizione breve (NON lasciare vuoto!)
- author: autore/i della fonte
- source: pubblicazione/organizzazione
- year: anno (se menzionato)
- context: perché viene citata (1-2 frasi)
- paragraph: numero paragrafo (§N)
- additional_info: dettagli extra (study_title, journal, doi, volume, pages, url, etc.)

## FORMATO OUTPUT

Restituisci SOLO un oggetto JSON valido (senza markdown, senza spiegazioni):

{
  "article_metadata": {
    "title": "${title}",
    "author": "${author}",
    "publication": "${publication}",
    "date": "${date}"
  },
  "total_citations": 0,
  "citations": [
    {
      "id": 1,
      "type": "study_reference",
      "quote_text": "Testo esatto della citazione o descrizione breve (OBBLIGATORIO - NON lasciare vuoto!)",
      "author": "Cognome, Nome",
      "source": "Nome fonte",
      "year": "2024",
      "context": "Breve spiegazione del perché viene citata",
      "paragraph": "3",
      "additional_info": {
        "study_title": null,
        "journal": null,
        "doi": null,
        "volume": null,
        "pages": null,
        "url": null
      }
    }
  ]
}

**REGOLE CRITICHE:**
✅ INCLUDI SOLO se ha:
   - Fonte esterna identificabile (nome autore/organizzazione/pubblicazione)
   - Attribuzione chiara (non è opinione dell'autore dell'articolo)
   - Contesto verificabile

❌ NON INCLUDERE:
   - Opinioni/affermazioni dell'autore dell'articolo
   - Citazioni senza fonte chiara
   - Parafrasi generiche senza riferimento

**FORMATO:**
- Se un'informazione non è disponibile, usa null (TRANNE quote_text che è OBBLIGATORIO)
- Mantieni ordine di apparizione (§1, §2, §3...)
- Nel quote_text, sostituisci " con ' per evitare errori JSON
- Limita quote_text a max 200 caratteri
- quote_text NON può essere null, vuoto o undefined - SEMPRE fornire un testo descrittivo
- JSON VALIDO e COMPLETO

**QUALITÀ > QUANTITÀ**: Meglio 3 citazioni VERE che 10 dubbie.

Analizza ora e restituisci SOLO il JSON valido.`;
  },

  /**
   * Trova il paragrafo corretto cercando la citazione nel testo
   */
  findCitationParagraph(citation, article) {
    // Estrai i paragrafi dall'articolo
    let paragraphs = [];

    if (article.paragraphs && Array.isArray(article.paragraphs)) {
      paragraphs = article.paragraphs.map((p, i) => ({
        id: i + 1,
        text: typeof p === 'string' ? p : p.text || '',
      }));
    } else if (article.content) {
      paragraphs = article.content
        .split('\n\n')
        .filter((p) => p.trim().length > 0)
        .map((p, i) => ({
          id: i + 1,
          text: p.trim(),
        }));
    }

    if (paragraphs.length === 0) {
      return '1'; // Fallback
    }

    // Estrai il testo della citazione
    const quoteText = citation.quote_text || '';

    if (!quoteText || quoteText.length < 10) {
      return citation.paragraph || '1'; // Usa il paragrafo suggerito dall'AI se la citazione è troppo corta
    }

    // Normalizza il testo della citazione per la ricerca
    const normalizedQuote = this.normalizeText(quoteText);

    // Cerca la citazione nei paragrafi
    let bestMatch = null;
    let bestScore = 0;

    for (const para of paragraphs) {
      const normalizedPara = this.normalizeText(para.text);

      // Calcola similarity score
      const score = this.calculateSimilarity(normalizedQuote, normalizedPara);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = para.id;
      }

      // Se troviamo una corrispondenza esatta o molto alta, fermiamoci
      if (score > SIMILARITY_EXACT_THRESHOLD) {
        break;
      }
    }

    // Se abbiamo trovato un match con score > 0.3, usalo
    if (bestMatch && bestScore > SIMILARITY_MIN_THRESHOLD) {
      Logger.debug(
        `Citazione trovata nel paragrafo §${bestMatch} (score: ${bestScore.toFixed(2)})`,
      );
      return bestMatch.toString();
    }

    // Altrimenti, cerca parole chiave
    const keywords = this.extractKeywords(quoteText);

    for (const para of paragraphs) {
      const paraLower = para.text.toLowerCase();
      let keywordMatches = 0;

      for (const keyword of keywords) {
        if (paraLower.includes(keyword.toLowerCase())) {
          keywordMatches++;
        }
      }

      // Se troviamo almeno 2 keyword match, probabilmente è il paragrafo giusto
      if (keywordMatches >= Math.min(MIN_KEYWORD_MATCHES, keywords.length)) {
        Logger.debug(
          `Citazione trovata nel paragrafo §${para.id} (keyword match: ${keywordMatches}/${keywords.length})`,
        );
        return para.id.toString();
      }
    }

    // Fallback: usa il paragrafo suggerito dall'AI o il primo
    Logger.warn(
      `Impossibile trovare il paragrafo esatto per la citazione: "${quoteText.substring(0, 50)}..."`,
    );
    return citation.paragraph || '1';
  },

  /**
   * Normalizza testo per confronto
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[""''«»]/g, '"') // Normalizza virgolette
      .replace(/[^\w\s]/g, ' ') // Rimuovi punteggiatura
      .replace(/\s+/g, ' ') // Normalizza spazi
      .trim();
  },

  /**
   * Calcola similarity tra due testi usando Jaccard similarity
   */
  calculateSimilarity(text1, text2) {
    const words1 = new Set(text1.split(' ').filter((w) => w.length > 2));
    const words2 = new Set(text2.split(' ').filter((w) => w.length > 2));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  },

  /**
   * Estrae parole chiave significative da un testo
   */
  extractKeywords(text) {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w));

    // Prendi le prime 5 parole più lunghe (probabilmente più significative)
    return words.sort((a, b) => b.length - a.length).slice(0, 5);
  },

  parseCitations(response, article) {
    try {
      const data = parseLLMJson(response);

      // Valida struttura dati
      if (!data.citations || !Array.isArray(data.citations)) {
        Logger.warn('Nessuna citazione trovata nella risposta');
        data.citations = [];
      }

      // ✨ NUOVO: Verifica e correggi il numero di paragrafo per ogni citazione
      Logger.debug('Verifica paragrafi citazioni...');
      data.citations = data.citations.map((citation) => {
        // ✅ VALIDAZIONE: Assicurati che quote_text esista
        if (!citation.quote_text && !citation.text) {
          Logger.warn('Citazione senza testo:', citation);
          // Prova a generare un testo descrittivo
          citation.quote_text =
            citation.context ||
            `Riferimento a ${citation.source || 'fonte'} ${citation.author ? 'di ' + citation.author : ''}`.trim();
        }

        // Normalizza il campo text -> quote_text
        if (!citation.quote_text && citation.text) {
          citation.quote_text = citation.text;
        }

        const correctParagraph = this.findCitationParagraph(citation, article);

        if (correctParagraph !== citation.paragraph) {
          Logger.debug(
            `Corretto paragrafo citazione "${citation.quote_text?.substring(0, 30)}..." da §${citation.paragraph} a §${correctParagraph}`,
          );
        }

        return {
          ...citation,
          paragraph: correctParagraph,
          originalParagraph: citation.paragraph, // Mantieni il paragrafo originale suggerito dall'AI per debug
        };
      });

      // Arricchisci con metadati articolo
      return {
        article_metadata: data.article_metadata || {
          title: article.title,
          author: article.author || 'N/A',
          publication: article.siteName || 'N/A',
          date: article.publishedDate || 'N/A',
        },
        total_citations: data.total_citations || data.citations.length,
        citations: data.citations,
        extractedAt: new Date().toISOString(),
      };
    } catch (error) {
      Logger.error('Errore parsing citazioni:', error);
      Logger.error('Risposta completa:', response.substring(0, 1000));
      throw new Error('Errore nel parsing delle citazioni: ' + error.message);
    }
  },

  /**
   * Formatta citazioni in diversi stili bibliografici
   */
  formatCitation(article, style = 'apa') {
    // Validazione input
    if (!article || typeof article !== 'object') {
      return 'Articolo non disponibile';
    }

    // Escape all fields from external articles to prevent XSS when inserted in innerHTML
    const author = HtmlSanitizer.escape(article.author || article.byline || 'Autore Sconosciuto');
    const title = HtmlSanitizer.escape(article.title || 'Titolo non disponibile');
    const url = HtmlSanitizer.escape(article.url || '');
    const date = article.publishedDate || article.date || new Date().toISOString().split('T')[0];
    const accessDate = article.accessDate || new Date().toISOString().split('T')[0];

    // Estrai nome dominio per il nome del sito
    let siteName = 'Web';
    try {
      const urlObj = new URL(url);
      siteName = urlObj.hostname.replace('www.', '');
    } catch {
      // Ignora errori URL
    }

    const year = date.split('-')[0];
    const [, m, d] = date.split('-');
    const [ay, am, ad] = accessDate.split('-');

    switch (style.toLowerCase()) {
      case 'apa':
        // APA 7th Edition
        return `${author}. (${year}). ${title}. ${siteName}. ${url}`;

      case 'mla': {
        // MLA 9th Edition
        const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];
        const accessMonth = monthNames[parseInt(am) - 1];
        return `${author}. "${title}." ${siteName}, ${d} ${monthNames[parseInt(m) - 1]}. ${year}, ${url}. Accessed ${ad} ${accessMonth}. ${ay}.`;
      }

      case 'chicago':
        // Chicago 17th Edition
        return `${author}. "${title}." ${siteName}. ${date}. ${url}.`;

      case 'ieee':
        // IEEE
        return `${author}, "${title}," ${siteName}, ${date}. [Online]. Available: ${url}. [Accessed: ${accessDate}].`;

      case 'harvard':
        // Harvard
        return `${author} (${year}) ${title}. Available at: ${url} (Accessed: ${accessDate}).`;

      default:
        return this.formatCitation(article, 'apa');
    }
  },

  /**
   * Genera bibliografia completa
   */
  generateBibliography(article, citations, style = 'apa') {
    let bibliography = `# Bibliografia\n\n`;
    bibliography += `**Stile:** ${style.toUpperCase()}\n\n`;
    bibliography += `## Articolo Principale\n\n`;
    bibliography += this.formatCitation(article, style) + '\n\n';

    if (citations && citations.length > 0) {
      bibliography += `## Fonti Citate nell'Articolo (${citations.length})\n\n`;
      citations.forEach((citation, index) => {
        // Numero citazione
        bibliography += `${index + 1}. `;

        // Autore
        if (citation.author && citation.author !== 'Non specificato' && citation.author !== 'N/A') {
          bibliography += `**${citation.author}**`;
        } else {
          bibliography += `**Fonte non specificata**`;
        }

        // Anno
        if (citation.year) {
          bibliography += ` (${citation.year})`;
        }

        bibliography += '\n';

        // Testo citazione
        const quoteText = citation.quote_text || citation.text || '';
        if (quoteText) {
          bibliography += `   "${quoteText.substring(0, 150)}${quoteText.length > 150 ? '...' : ''}"\n`;
        }

        // Fonte/Pubblicazione
        if (citation.source && citation.source !== 'N/A') {
          bibliography += `   📚 Fonte: ${citation.source}\n`;
        }

        // Contesto
        if (citation.context) {
          bibliography += `   📝 Contesto: ${citation.context}\n`;
        }

        // Tipo e posizione
        const typeLabel = this.getCitationTypeLabel(citation.type);
        bibliography += `   🏷️ Tipo: ${typeLabel}`;
        if (citation.paragraph) {
          bibliography += ` | 📍 Paragrafo: §${citation.paragraph}`;
        }
        bibliography += '\n';

        // Informazioni aggiuntive
        if (citation.additional_info) {
          const info = citation.additional_info;
          const details = [];
          if (info.study_title) details.push(`Studio: "${info.study_title}"`);
          if (info.journal) details.push(`Journal: ${info.journal}`);
          if (info.doi) details.push(`DOI: ${info.doi}`);
          if (info.url) details.push(`URL: ${info.url}`);

          if (details.length > 0) {
            bibliography += `   ℹ️ ${details.join(' | ')}\n`;
          }
        }

        bibliography += '\n';
      });
    }

    return bibliography;
  },

  getCitationTypeLabel(type) {
    const labels = {
      direct_quote: 'Citazione Diretta',
      indirect_quote: 'Citazione Indiretta',
      study_reference: 'Studio/Ricerca',
      statistic: 'Statistica',
      expert_opinion: 'Opinione Esperto',
      book_reference: 'Libro',
      article_reference: 'Articolo',
      report_reference: 'Report',
      organization_data: 'Dati Organizzazione',
      web_source: 'Fonte Web',
    };
    return labels[type] || 'Altro';
  },
};
