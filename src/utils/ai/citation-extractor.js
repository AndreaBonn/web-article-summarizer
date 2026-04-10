// Citation Extractor - Estrazione citazioni da articoli (facade)
import { PromptRegistry } from './prompt-registry.js';
import { APIOrchestrator as APIClient } from './api-orchestrator.js';
import { Logger } from '../core/logger.js';
import { parseLLMJson } from './json-repair.js';
import { CitationFormatter } from './citation-formatter.js';
import { CitationMatcher } from './citation-matcher.js';

export const CitationExtractor = {
  // --- Core extraction ---

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
      throw new Error('Impossibile estrarre le citazioni: ' + error.message, { cause: error });
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

  parseCitations(response, article) {
    try {
      const data = parseLLMJson(response);

      // Valida struttura dati
      if (!data.citations || !Array.isArray(data.citations)) {
        Logger.warn('Nessuna citazione trovata nella risposta');
        data.citations = [];
      }

      // Verifica e correggi il numero di paragrafo per ogni citazione
      Logger.debug('Verifica paragrafi citazioni...');
      data.citations = data.citations.map((citation) => {
        // Validazione: assicurati che quote_text esista
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

        const correctParagraph = CitationMatcher.findParagraphForCitation(citation, article);

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
      throw new Error('Errore nel parsing delle citazioni: ' + error.message, { cause: error });
    }
  },

  // --- Delegation to CitationFormatter ---

  formatCitation(article, style = 'apa') {
    return CitationFormatter.formatCitation(article, style);
  },

  generateBibliography(article, citations, style = 'apa') {
    return CitationFormatter.generateBibliography(article, citations, style);
  },

  getCitationTypeLabel(type) {
    return CitationFormatter.getCitationTypeLabel(type);
  },

  // --- Delegation to CitationMatcher ---

  findCitationParagraph(citation, article) {
    return CitationMatcher.findParagraphForCitation(citation, article);
  },

  normalizeText(text) {
    return CitationMatcher.normalizeText(text);
  },

  calculateSimilarity(text1, text2) {
    return CitationMatcher.calculateSimilarity(text1, text2);
  },

  extractKeywords(text) {
    return CitationMatcher.extractKeywords(text);
  },
};
