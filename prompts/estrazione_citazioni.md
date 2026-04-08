      'Harvard': this.formatHarvard.bind(this)
    };

    const formatter = formatters[style];
    if (!formatter) {
      throw new Error(`Stile ${style} non supportato`);
    }

    return this.citations.map((citation, index) => {
      if (style === 'IEEE') {
        return formatter(citation, index + 1);
      } else if (style === 'Chicago') {
        return formatter(citation, index + 1);
      } else {
        return formatter(citation);
      }
    });
  }

  // Genera bibliografia completa in uno stile
  generateBibliography(style = 'APA', sortAlphabetically = true) {
    let formatted = this.formatAll(style);

    // Ordina alfabeticamente per autore (tranne IEEE che usa ordine numerico)
    if (sortAlphabetically && style !== 'IEEE') {
      formatted.sort((a, b) => {
        // Estrai primo autore per ordinamento
        const getFirstAuthor = (str) => {
          const match = str.match(/^([A-Za-z]+)/);
          return match ? match[1] : str;
        };
        return getFirstAuthor(a).localeCompare(getFirstAuthor(b));
      });
    }

    return formatted;
  }

  // Esporta in formato BibTeX
  exportBibTeX() {
    return this.citations.map((citation, index) => {
      const { type, author, year, source, additional_info } = citation;
      
      // Determina tipo BibTeX
      let bibType = 'misc';
      if (type === 'article_reference' || additional_info?.journal) bibType = 'article';
      if (type === 'book_reference') bibType = 'book';
      if (type === 'study_reference' && additional_info?.journal) bibType = 'article';
      if (type === 'conference_reference') bibType = 'inproceedings';
      if (type === 'report_reference') bibType = 'techreport';
      if (type === 'thesis_reference') bibType = 'phdthesis';
      
      // Genera chiave citazione
      const firstAuthor = author ? author.split(';')[0].split(',')[0].trim().toLowerCase() : 'unknown';
      const citeKey = `${firstAuthor}${year || 'nodate'}${index}`;
      
      let bibtex = `@${bibType}{${citeKey},\n`;
      
      // Campi comuni
      if (author) {
        const authors = author.split(';').map(a => a.trim()).join(' and ');
        bibtex += `  author = {${authors}},\n`;
      }
      if (year) {
        bibtex += `  year = {${year}},\n`;
      }
      if (additional_info?.study_title) {
        bibtex += `  title = {${additional_info.study_title}},\n`;
      }
      if (additional_info?.journal) {
        bibtex += `  journal = {${additional_info.journal}},\n`;
      } else if (source) {
        bibtex += `  journal = {${source}},\n`;
      }
      if (additional_info?.volume) {
        bibtex += `  volume = {${additional_info.volume}},\n`;
      }
      if (additional_info?.issue) {
        bibtex += `  number = {${additional_info.issue}},\n`;
      }
      if (additional_info?.pages) {
        bibtex += `  pages = {${additional_info.pages}},\n`;
      }
      if (additional_info?.doi) {
        bibtex += `  doi = {${additional_info.doi}},\n`;
      }
      if (additional_info?.url) {
        bibtex += `  url = {${additional_info.url}},\n`;
      }
      if (additional_info?.publisher) {
        bibtex += `  publisher = {${additional_info.publisher}},\n`;
      }
      
      bibtex += `}\n`;
      
      return bibtex;
    }).join('\n');
  }

  // Esporta in formato RIS (Research Information Systems)
  exportRIS() {
    return this.citations.map(citation => {
      const { type, author, year, source, additional_info } = citation;
      
      // Determina tipo RIS
      let risType = 'GEN'; // Generic
      if (type === 'article_reference') risType = 'JOUR'; // Journal
      if (type === 'book_reference') risType = 'BOOK';
      if (type === 'conference_reference') risType = 'CONF';
      if (type === 'report_reference') risType = 'RPRT';
      if (type === 'thesis_reference') risType = 'THES';
      if (type === 'web_source') risType = 'ELEC';
      
      let ris = `TY  - ${risType}\n`;
      
      // Autori (uno per riga)
      if (author) {
        author.split(';').forEach(a => {
          ris += `AU  - ${a.trim()}\n`;
        });
      }
      
      // Anno
      if (year) {
        ris += `PY  - ${year}\n`;
      }
      
      // Titolo
      if (additional_info?.study_title) {
        ris += `TI  - ${additional_info.study_title}\n`;
      }
      
      // Journal/Fonte
      if (additional_info?.journal) {
        ris += `JO  - ${additional_info.journal}\n`;
      } else if (source) {
        ris += `JO  - ${source}\n`;
      }
      
      // Volume
      if (additional_info?.volume) {
        ris += `VL  - ${additional_info.volume}\n`;
      }
      
      // Issue
      if (additional_info?.issue) {
        ris += `IS  - ${additional_info.issue}\n`;
      }
      
      // Pagine
      if (additional_info?.pages) {
        const pages = additional_info.pages.split('-');
        if (pages.length === 2) {
          ris += `SP  - ${pages[0]}\n`;
          ris += `EP  - ${pages[1]}\n`;
        }
      }
      
      // DOI
      if (additional_info?.doi) {
        ris += `DO  - ${additional_info.doi}\n`;
      }
      
      // URL
      if (additional_info?.url) {
        ris += `UR  - ${additional_info.url}\n`;
      }
      
      // Publisher
      if (additional_info?.publisher) {
        ris += `PB  - ${additional_info.publisher}\n`;
      }
      
      ris += `ER  - \n\n`;
      
      return ris;
    }).join('');
  }
}

// ============================================================================
// 4. SISTEMA COMPLETO DI ESTRAZIONE E FORMATTAZIONE
// ============================================================================

class CitationExtractionSystem {
  constructor(provider = 'groq') {
    this.provider = provider;
    this.extractedData = null;
  }

  // Estrai citazioni da articolo
  async extractCitations(article, apiKey, contentType = 'general') {
    const systemPrompt = this.getSystemPrompt(contentType);
    const userPrompt = this.buildUserPrompt(article, contentType);

    const response = await this.callAPI(systemPrompt, userPrompt, apiKey);
    
    try {
      // Pulisci risposta da eventuali markdown
      let jsonText = response.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }
      
      this.extractedData = JSON.parse(jsonText);
      
      return {
        success: true,
        data: this.extractedData,
        citationCount: this.extractedData.total_citations
      };
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return {
        success: false,
        error: 'Failed to parse citation data: ' + error.message,
        rawResponse: response
      };
    }
  }

  getSystemPrompt(contentType) {
    const basePrompt = `Sei un esperto bibliotecario e ricercatore specializzato nell'identificazione e catalogazione di citazioni, riferimenti bibliografici e fonti all'interno di testi accademici e articoli.

IL TUO COMPITO:
Analizza l'articolo fornito e identifica TUTTE le citazioni, riferimenti e fonti, inclusi:

1. CITAZIONI DIRETTE: testo tra virgolette attribuito a una persona/fonte
2. CITAZIONI INDIRETTE: parafrasi o riferimenti a idee altrui
3. RIFERIMENTI A STUDI/RICERCHE: menzioni di paper, ricerche, report
4. STATISTICHE CON FONTE: dati numerici con attribuzione
5. RIFERIMENTI A ESPERTI: opinioni/affermazioni di autorità nel campo
6. RIFERIMENTI A OPERE: libri, articoli, documenti citati
7. RIFERIMENTI A ORGANIZZAZIONI: report/dati di istituzioni

INFORMAZIONI DA ESTRARRE:
- Testo esatto della citazione o riferimento
- Autore/i (nome completo se disponibile)
- Fonte (pubblicazione, istituzione, organizzazione)
- Anno (se menzionato)
- Tipo di citazione
- Contesto (perché viene citata)
- Posizione nell'articolo (paragrafo §N)
- Dettagli aggiuntivi (titolo studio, journal, DOI se disponibili)

PRINCIPI:
- Sii esaustivo: trova OGNI citazione, anche indiretta
- Sii preciso: copia il testo esattamente come appare
- Distingui i tipi chiaramente
- Estrai tutti i metadati disponibili
- Mantieni l'ordine di apparizione

OUTPUT: JSON strutturato con array di citazioni.`;

    // Aggiunte specifiche per tipo di contenuto
    const additions = {
      scientific: `\n\nFOCUS SCIENTIFICO:
- Identifica citazioni in formato (Author et al., Year)
- Estrai numeri citazione [1], [2-5]
- Cattura citazioni inline e parentetiche
- Identifica riferimenti a metodi standard
- Cattura dataset, codice, protocolli`,
      
      news: `\n\nFOCUS NEWS:
- Identifica fonti anonime ("secondo fonti...")
- Cattura attributions ("reportedly", "allegedly")
- Distingui citazioni dirette da parafrasate
- Nota livello affidabilità fonte
- Identifica wire service attributions`,
      
      business: `\n\nFOCUS BUSINESS:
- Identifica dati finanziari con fonte
- Cattura citazioni executive/CEO
- Identifica analyst reports
- Cattura earnings calls references
- Identifica market data sources`
    };

    return basePrompt + (additions[contentType] || '');
  }

  buildUserPrompt(article, contentType) {
    const paragraphs = article.paragraphs
      .map((p, i) => `§${i + 1}: ${p.text}`)
      .join('\n\n');

    return `# ARTICOLO DA ANALIZZARE PER CITAZIONI

**Titolo:** ${article.title}
**Autore:** ${article.author || 'N/A'}
**Pubblicazione:** ${article.publication || 'N/A'}
**Data:** ${article.publishedDate || 'N/A'}

---

## CONTENUTO COMPLETO
(Ogni paragrafo è numerato)

${paragraphs}

---

# ISTRUZIONI

Analizza questo articolo e identifica TUTTE le citazioni, riferimenti e fonti.

Per ogni citazione trovata, estrai:
- id: numero progressivo
- type: direct_quote | indirect_quote | study_reference | statistic | expert_opinion | book_reference | article_reference | report_reference | organization_data | web_source
- quote_text: testo esatto citato o parafrasato
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
    "title": "${article.title}",
    "author": "${article.author || 'N/A'}",
    "publication": "${article.publication || 'N/A'}",
    "date": "${article.publishedDate || 'N/A'}"
  },
  "total_citations": 0,
  "citations": [
    {
      "id": 1,
      "type": "study_reference",
      "quote_text": "Testo esatto o descrizione",
      "author": "Cognome, Nome",
      "source": "Nome fonte",
      "year": "2024",
      "context": "Breve spiegazione",
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

Trova TUTTE le citazioni. Se info non disponibile, usa null.
Analizza ora e restituisci il JSON.`;
  }

  async callAPI(systemPrompt, userPrompt, apiKey) {
    const configs = {
      groq: {
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1, // Bassa per precisione
          max_tokens: 4000,
          response_format: { type: 'json_object' } // Forza JSON
        }
      },
      openai: {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 4000,
          response_format: { type: 'json_object' }
        }
      },
      anthropic: {
        endpoint: 'https://api.anthropic.com/v1/messages',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: {
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          temperature: 0.1,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ]
        }
      }
    };

    const config = configs[this.provider];
    
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify(config.body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API Error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();

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

  // Formatta citazioni estratte
  formatCitations(style = 'APA') {
    if (!this.extractedData) {
      throw new Error('Nessuna citazione estratta. Chiama extractCitations() prima.');
    }

    const formatter = new CitationFormatter(this.extractedData.citations);
    return formatter.formatAll(style);
  }

  // Genera bibliografia completa
  generateBibliography(style = 'APA', sortAlphabetically = true) {
    if (!this.extractedData) {
      throw new Error('Nessuna citazione estratta.');
    }

    const formatter = new CitationFormatter(this.extractedData.citations);
    return formatter.generateBibliography(style, sortAlphabetically);
  }

  // Esporta in BibTeX
  exportBibTeX() {
    if (!this.extractedData) {
      throw new Error('Nessuna citazione estratta.');
    }

    const formatter = new CitationFormatter(this.extractedData.citations);
    return formatter.exportBibTeX();
  }

  // Esporta in RIS
  exportRIS() {
    if (!this.extractedData) {
      throw new Error('Nessuna citazione estratta.');
    }

    const formatter = new CitationFormatter(this.extractedData.citations);
    return formatter.exportRIS();
  }

  // Statistiche citazioni
  getCitationStats() {
    if (!this.extractedData) {
      throw new Error('Nessuna citazione estratta.');
    }

    const stats = {
      total: this.extractedData.total_citations,
      byType: {},
      byYear: {},
      uniqueAuthors: new Set(),
      uniqueSources: new Set()
    };

    this.extractedData.citations.forEach(citation => {
      // Per tipo
      stats.byType[citation.type] = (stats.byType[citation.type] || 0) + 1;
      
      // Per anno
      if (citation.year) {
        stats.byYear[citation.year] = (stats.byYear[citation.year] || 0) + 1;
      }
      
      // Autori unici
      if (citation.author) {
        citation.author.split(';').forEach(a => stats.uniqueAuthors.add(a.trim()));
      }
      
      // Fonti uniche
      if (citation.source) {
        stats.uniqueSources.add(citation.source);
      }
    });

    stats.uniqueAuthors = stats.uniqueAuthors.size;
    stats.uniqueSources = stats.uniqueSources.size;

    return stats;
  }
}

// ============================================================================
// 5. INTERFACCIA UI PER L'ESTENSIONE
// ============================================================================

// HTML per tab citazioni nel popup
function renderCitationsInterface() {
  return `
    <div class="citations-container">
      <div class="citations-header">
        <h3>📚 Citazioni & Riferimenti</h3>
        <button id="extract-citations" class="btn-primary">
          <span class="btn-text">Estrai Citazioni</span>
          <span class="btn-loading" style="display:none">⏳</span>
        </button>
      </div>

      <div id="citations-stats" class="citations-stats" style="display:none">
        <div class="stat-item">
          <span class="stat-value" id="total-citations">0</span>
          <span class="stat-label">Citazioni totali</span>
        </div>
        <div class="stat-item">
          <span class="stat-value" id="unique-sources">0</span>
          <span class="stat-label">Fonti uniche</span>
        </div>
        <div class="stat-item">
          <span class="stat-value" id="unique-authors">0</span>
          <span class="stat-label">Autori citati</span>
        </div>
      </div>

      <div id="citations-content" class="citations-content">
        <div class="empty-state">
          <p>👆 Clicca "Estrai Citazioni" per analizzare l'articolo</p>
        </div>
      </div>

      <div id="citations-actions" class="citations-actions" style="display:none">
        <div class="format-selector">
          <label>Stile bibliografico:</label>
          <select id="citation-style">
            <option value="APA">APA (7th ed.)</option>
            <option value="MLA">MLA (9th ed.)</option>
            <option value="Chicago">Chicago (17th ed.)</option>
            <option value="IEEE">IEEE</option>
            <option value="Harvard">Harvard</option>
          </select>
        </div>
        <div class="export-buttons">
          <button id="copy-bibliography" class="btn-secondary">📋 Copia Bibliografia</button>
          <button id="export-bibtex" class="btn-secondary">📄 Esporta BibTeX</button>
          <button id="export-ris" class="btn-secondary">📄 Esporta RIS</button>
        </div>
      </div>
    </div>
  `;
}

// Event handlers
let citationSystem = null;

document.getElementById('extract-citations')?.addEventListener('click', async () => {
  const btn = document.getElementById('extract-citations');
  const btnText = btn.querySelector('.btn-text');
  const btnLoading = btn.querySelector('.btn-loading');
  
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline';
  btn.disabled = true;

  try {
    citationSystem = new CitationExtractionSystem(userSettings.provider);
    
    const result = await citationSystem.extractCitations(
      currentArticle,
      userSettings.apiKeys[userSettings.provider],
      detectContentType(currentArticle)
    );

    if (result.success) {
      displayCitations(result.data);
      displayStats(citationSystem.getCitationStats());
      document.getElementById('citations-actions').style.display = 'flex';
    } else {
      showError('Errore nell\'estrazione: ' + result.error);
    }
  } catch (error) {
    showError('Errore: ' + error.message);
  } finally {
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    btn.disabled = false;
  }
});

function displayCitations(data) {
  const container = document.getElementById('citations-content');
  container.innerHTML = '';

  data.citations.forEach(citation => {
    const citationEl = document.createElement('div');
    citationEl.className = 'citation-item';
    citationEl.innerHTML = `
      <div class="citation-header">
        <span class="citation-type ${citation.type}">${formatCitationType(citation.type)}</span>
        <span class="citation-paragraph" data-ref="${citation.paragraph}">§${citation.paragraph}</span>
      </div>
      <div class="citation-text">
        ${citation.type === 'direct_quote' ? `"${citation.quote_text}"` : citation.quote_text}
      </div>
      <div class="citation-meta">
        ${citation.author ? `<strong>${citation.author}</strong>` : ''}
        ${citation.source ? `<em>${citation.source}</em>` : ''}
        ${citation.year ? `(${citation.year})` : ''}
      </div>
      ${citation.context ? `<div class="citation-context">${citation.context}</div>` : ''}
      ${formatAdditionalInfo(citation.additional_info)}
    `;

    // Click sul paragrafo per highlight
    citationEl.querySelector('.citation-paragraph')?.addEventListener('click', (e) => {
      const ref = e.target.getAttribute('data-ref');
      highlightParagraph(ref);
    });

    container.appendChild(citationEl);
  });
}

function displayStats(stats) {
  document.getElementById('total-citations').textContent = stats.total;
  document.getElementById('unique-sources').textContent = stats.uniqueSources;
  document.getElementById('unique-authors').textContent = stats.uniqueAuthors;
  document.getElementById('citations-stats').style.display = 'flex';
}

function formatCitationType(type) {
  const labels = {
    'direct_quote': '💬 Citazione diretta',
    'indirect_quote': '💭 Citazione indiretta',
    'study_reference': '🔬 Studio',
    'statistic': '📊 Statistica',
    'expert_opinion': '👤 Esperto',
    'book_reference': '📖 Libro',
    'article_reference': '📄 Articolo',
    'report_reference': '📋 Report',
    'organization_data': '🏢 Organizzazione',
    'web_source': '🌐 Web'
  };
  return labels[type] || type;
}

function formatAdditionalInfo(info) {
  if (!info || Object.keys(info).length === 0) return '';
  
  const items = [];
  if (info.journal) items.push(`Journal: ${info.journal}`);
  if (info.volume) items.push(`Vol. ${info.volume}`);
  if (info.pages) items.push(`pp. ${info.pages}`);
  if (info.doi) items.push(`<a href="https://doi.org/${info.doi}" target="_blank">DOI: ${info.doi}</a>`);
  if (info.url && !info.doi) items.push(`<a href="${info.url}" target="_blank">URL</a>`);
  
  return items.length > 0 
    ? `<div class="citation-additional">${items.join(' • ')}</div>`
    : '';
}

// Export handlers
document.getElementById('copy-bibliography')?.addEventListener('click', () => {
  const style = document.getElementById('citation-style').value;
  const bibliography = citationSystem.generateBibliography(style, true);
  
  const text = bibliography.join('\n\n');
  navigator.clipboard.writeText(text);
  
  showToast('Bibliografia copiata negli appunti!');
});

document.getElementById('export-bibtex')?.addEventListener('click', () => {
  const bibtex = citationSystem.exportBibTeX();
  downloadFile(bibtex, 'citations.bib', 'text/plain');
  showToast('File BibTeX scaricato!');
});

document.getElementById('export-ris')?.addEventListener('click', () => {
  const ris = citationSystem.exportRIS();
  downloadFile(ris, 'citations.ris', 'text/plain');
  showToast('File RIS scaricato!');
});

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showToast(message) {
  // Toast notification implementation
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}

// ============================================================================
// 6. CSS PER INTERFACCIA CITAZIONI
// ============================================================================

const citationsStyles = `
.citations-container {
  padding: 16px;
  background: #f8f9fa;
}

.citations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.citations-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.citations-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #ff6b00;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}

.citations-content {
  max-height: 400px;
  overflow-y: auto;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  padding: 12px;
  margin-bottom: 16px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.citation-item {
  padding: 12px;
  margin-bottom: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #ff6b00;
}

.citation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.citation-type {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  background: #e3f2fd;
  color: #1976d2;
}

.citation-type.direct_quote { background: #fff3e0; color: #f57c00; }
.citation-type.study_reference { background: #e8f5e9; color: #388e3c; }
.citation-type.statistic { background: #f3e5f5; color: #7b1fa2; }

.citation-paragraph {
  font-size: 12px;
  font-weight: 600;
  color: #1976d2;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 12px;
  background: #e3f2fd;
  transition: all 0.2# Sistema di Estrazione Citazioni da Articoli

## Panoramica

Sistema completo per estrarre, identificare e formattare citazioni, riferimenti bibliografici e fonti da articoli. L'output è strutturato in JSON per facile formattazione in diversi stili bibliografici (APA, MLA, Chicago, IEEE, Harvard).

---

## 1. PROMPT BASE - ESTRAZIONE CITAZIONI

### GROQ - Estrazione Citazioni

**SYSTEM PROMPT:**
```
Sei un esperto bibliotecario e ricercatore specializzato nell'identificazione e catalogazione di citazioni, riferimenti bibliografici e fonti all'interno di testi accademici e articoli.

IL TUO COMPITO:
Analizza l'articolo fornito e identifica TUTTE le citazioni, riferimenti e fonti, inclusi:

1. **CITAZIONI DIRETTE**: testo tra virgolette attribuito a una persona/fonte
2. **CITAZIONI INDIRETTE**: parafrasi o riferimenti a idee altrui
3. **RIFERIMENTI A STUDI/RICERCHE**: menzioni di paper, ricerche, report
4. **STATISTICHE CON FONTE**: dati numerici con attribuzione
5. **RIFERIMENTI A ESPERTI**: opinioni/affermazioni di autorità nel campo
6. **RIFERIMENTI A OPERE**: libri, articoli, documenti citati
7. **RIFERIMENTI A ORGANIZZAZIONI**: report/dati di istituzioni

INFORMAZIONI DA ESTRARRE:
- Testo esatto della citazione o riferimento
- Autore/i (nome completo se disponibile)
- Fonte (pubblicazione, istituzione, organizzazione)
- Anno (se menzionato)
- Tipo di citazione
- Contesto (perché viene citata)
- Posizione nell'articolo (paragrafo §N)
- Dettagli aggiuntivi (titolo studio, journal, DOI se disponibili)

PRINCIPI:
- Sii esaustivo: trova OGNI citazione, anche indiretta
- Sii preciso: copia il testo esattamente come appare
- Distingui i tipi chiaramente
- Estrai tutti i metadati disponibili
- Mantieni l'ordine di apparizione

OUTPUT:
JSON strutturato con array di citazioni.
```

**USER PROMPT:**
```
# ARTICOLO DA ANALIZZARE PER CITAZIONI

**Titolo:** {title}
**Autore:** {author}
**Pubblicazione:** {publication}
**Data:** {date}

---

## CONTENUTO COMPLETO
(Ogni paragrafo è numerato)

§1: {paragraph1}

§2: {paragraph2}

§3: {paragraph3}

...

---

# ISTRUZIONI

Analizza questo articolo e identifica TUTTE le citazioni, riferimenti e fonti.

Per ogni citazione trovata, estrai:
- `id`: numero progressivo
- `type`: tipo di citazione (vedi sotto)
- `quote_text`: testo esatto citato o parafrasato
- `author`: autore/i della fonte
- `source`: pubblicazione/organizzazione
- `year`: anno (se menzionato)
- `context`: perché viene citata (1-2 frasi)
- `paragraph`: numero paragrafo (§N)
- `additional_info`: dettagli extra (titolo studio, journal, URL, DOI, volume, pagine)

## TIPI DI CITAZIONE

Classifica ogni citazione in UNO di questi tipi:
- `direct_quote`: citazione diretta tra virgolette
- `indirect_quote`: parafrasi o riferimento indiretto
- `study_reference`: riferimento a studio/ricerca scientifica
- `statistic`: dato statistico con fonte
- `expert_opinion`: opinione/affermazione di esperto
- `book_reference`: riferimento a libro
- `article_reference`: riferimento ad articolo
- `report_reference`: riferimento a report/documento
- `organization_data`: dato/informazione da organizzazione
- `web_source`: fonte online/website

## FORMATO OUTPUT

Restituisci SOLO un oggetto JSON valido (senza markdown, senza spiegazioni) in questo formato:

{
  "article_metadata": {
    "title": "Titolo articolo",
    "author": "Autore articolo",
    "publication": "Testata",
    "date": "Data pubblicazione"
  },
  "total_citations": N,
  "citations": [
    {
      "id": 1,
      "type": "study_reference",
      "quote_text": "Testo esatto o descrizione riferimento",
      "author": "Cognome, Nome; Cognome2, Nome2",
      "source": "Nome pubblicazione/istituzione",
      "year": "2024",
      "context": "Breve spiegazione del perché viene citato",
      "paragraph": "3",
      "additional_info": {
        "study_title": "Titolo completo se disponibile",
        "journal": "Nome journal",
        "doi": "10.xxxx/xxxxx",
        "volume": "12",
        "pages": "45-67",
        "url": "https://..."
      }
    },
    {
      "id": 2,
      "type": "direct_quote",
      "quote_text": "Testo esatto tra virgolette",
      "author": "Cognome, Nome",
      "source": "Ruolo o affiliazione",
      "year": null,
      "context": "Contesto della citazione",
      "paragraph": "5",
      "additional_info": {}
    }
  ]
}

**IMPORTANTE:**
- Trova TUTTE le citazioni, anche quelle indirette o implicite
- Se un'informazione non è disponibile, usa `null`
- Mantieni l'ordine cronologico di apparizione (§1, §2, §3...)
- Distingui accuratamente i tipi
- Copia il testo ESATTAMENTE come appare (per direct_quote)

Analizza ora l'articolo e restituisci il JSON.
```

---

### OPENAI - Citation Extraction

**SYSTEM PROMPT:**
```
You are an expert librarian and research specialist trained in identifying, cataloging, and extracting citations, bibliographic references, and sources from academic texts and articles.

YOUR TASK:
Analyze the provided article and identify ALL citations, references, and sources, including:

1. **DIRECT QUOTES**: Text in quotation marks attributed to a person/source
2. **INDIRECT QUOTES**: Paraphrases or references to others' ideas
3. **STUDY/RESEARCH REFERENCES**: Mentions of papers, studies, reports
4. **STATISTICS WITH SOURCE**: Numerical data with attribution
5. **EXPERT REFERENCES**: Opinions/statements from authorities
6. **WORK REFERENCES**: Books, articles, documents cited
7. **ORGANIZATION REFERENCES**: Reports/data from institutions

INFORMATION TO EXTRACT:
- Exact text of citation or reference
- Author(s) (full name if available)
- Source (publication, institution, organization)
- Year (if mentioned)
- Citation type
- Context (why it's cited)
- Position in article (paragraph §N)
- Additional details (study title, journal, DOI if available)

PRINCIPLES:
- Be exhaustive: find EVERY citation, even indirect ones
- Be precise: copy text exactly as it appears
- Distinguish types clearly
- Extract all available metadata
- Maintain order of appearance

OUTPUT:
Structured JSON with array of citations.
```

**USER PROMPT:**
```
# ARTICLE TO ANALYZE FOR CITATIONS

**Title:** {title}
**Author:** {author}
**Publication:** {publication}
**Date:** {date}

---

## COMPLETE CONTENT
(Each paragraph is numbered)

§1: {paragraph1}

§2: {paragraph2}

§3: {paragraph3}

...

---

# INSTRUCTIONS

Analyze this article and identify ALL citations, references, and sources.

For each citation found, extract:
- `id`: sequential number
- `type`: citation type (see below)
- `quote_text`: exact quoted or paraphrased text
- `author`: source author(s)
- `source`: publication/organization
- `year`: year (if mentioned)
- `context`: why it's cited (1-2 sentences)
- `paragraph`: paragraph number (§N)
- `additional_info`: extra details (study title, journal, URL, DOI, volume, pages)

## CITATION TYPES

Classify each citation as ONE of these types:
- `direct_quote`: Direct quotation in quotes
- `indirect_quote`: Paraphrase or indirect reference
- `study_reference`: Reference to scientific study/research
- `statistic`: Statistical data with source
- `expert_opinion`: Expert statement/opinion
- `book_reference`: Book reference
- `article_reference`: Article reference
- `report_reference`: Report/document reference
- `organization_data`: Data/information from organization
- `web_source`: Online/website source

## OUTPUT FORMAT

Return ONLY a valid JSON object (no markdown, no explanations) in this format:

{
  "article_metadata": {
    "title": "Article title",
    "author": "Article author",
    "publication": "Publication",
    "date": "Publication date"
  },
  "total_citations": N,
  "citations": [
    {
      "id": 1,
      "type": "study_reference",
      "quote_text": "Exact text or reference description",
      "author": "LastName, FirstName; LastName2, FirstName2",
      "source": "Publication/institution name",
      "year": "2024",
      "context": "Brief explanation of why cited",
      "paragraph": "3",
      "additional_info": {
        "study_title": "Full title if available",
        "journal": "Journal name",
        "doi": "10.xxxx/xxxxx",
        "volume": "12",
        "pages": "45-67",
        "url": "https://..."
      }
    }
  ]
}

**IMPORTANT:**
- Find ALL citations, even indirect or implicit ones
- If information unavailable, use `null`
- Maintain chronological order of appearance (§1, §2, §3...)
- Accurately distinguish types
- Copy text EXACTLY as it appears (for direct_quote)

Now analyze the article and return the JSON.
```

---

### ANTHROPIC CLAUDE - Citation Extraction

**SYSTEM PROMPT:**
```
You are an expert research librarian with extensive training in bibliographic analysis, citation identification, and scholarly referencing standards. You specialize in extracting and cataloging all forms of citations, references, and source attributions from academic and journalistic texts.

YOUR EXPERTISE:
You can identify and distinguish between:
1. **Direct quotations**: Verbatim text attributed to a source, typically in quotation marks
2. **Indirect citations**: Paraphrased ideas or findings from sources
3. **Research references**: Citations of studies, experiments, or research papers
4. **Statistical attributions**: Numerical data credited to specific sources
5. **Expert opinions**: Statements or viewpoints from subject matter authorities
6. **Documentary references**: Citations of books, articles, reports, or other publications
7. **Institutional data**: Information from organizations, agencies, or institutions
8. **Web sources**: Online resources, databases, or digital publications

EXTRACTION REQUIREMENTS:
For each citation, you must identify and extract:
- **Bibliographic elements**: Author(s), year, source publication
- **Textual content**: The exact quoted or referenced material
- **Citation type**: Precise classification per the taxonomy above
- **Contextual purpose**: Why the source is invoked (evidence, authority, contrast, etc.)
- **Localization**: Precise position in the source document
- **Metadata**: Any available details (DOI, journal name, volume, pages, URL, etc.)

ANALYTICAL PRINCIPLES:
- **Completeness**: Identify every citation, including subtle or implicit references
- **Precision**: Extract text with exact fidelity, preserving wording and punctuation
- **Classification accuracy**: Correctly categorize each citation type
- **Metadata thoroughness**: Capture all available bibliographic information
- **Sequential integrity**: Maintain document order of citations

OUTPUT SPECIFICATION:
Structured JSON format with comprehensive citation data suitable for bibliographic software and multiple citation style formatting (APA, MLA, Chicago, IEEE, Harvard).
```

**USER PROMPT:**
```
# ARTICLE FOR CITATION EXTRACTION

**Title:** {title}
**Author:** {author}
**Publication:** {publication}
**Publication Date:** {date}

---

## COMPLETE ARTICLE TEXT
(Paragraphs numbered for precise localization)

§1: {paragraph1}

§2: {paragraph2}

§3: {paragraph3}

...

---

# EXTRACTION TASK

Perform comprehensive citation extraction from this article. Identify and catalog ALL citations, references, and source attributions, including direct quotes, indirect references, research citations, statistical sources, expert opinions, and documentary references.

## DATA SCHEMA

For each citation identified, extract the following structured data:

- `id`: Sequential integer identifier
- `type`: Citation classification (see taxonomy below)
- `quote_text`: Exact verbatim text (for direct quotes) or precise description of reference
- `author`: Full author name(s) in format "LastName, FirstName" (multiple authors separated by semicolon)
- `source`: Publication venue, institution, or organization name
- `year`: Year of publication or statement (string format, null if unavailable)
- `context`: Brief explanation (2-3 sentences) of how/why the source is invoked
- `paragraph`: Paragraph number as string (e.g., "3")
- `additional_info`: Object containing any available metadata:
  - `study_title`: Full title of referenced work
  - `journal`: Journal or publication venue name
  - `doi`: Digital Object Identifier
  - `isbn`: International Standard Book Number
  - `volume`: Volume number
  - `issue`: Issue number
  - `pages`: Page range (e.g., "45-67")
  - `url`: Web address if applicable
  - `publisher`: Publishing organization
  - `edition`: Edition information for books
  - `accessed_date`: For web sources, date of access

## CITATION TYPE TAXONOMY

Classify each citation using ONE of these standardized types:

- `direct_quote`: Verbatim quotation enclosed in quotation marks
- `indirect_quote`: Paraphrased idea or finding attributed to source
- `study_reference`: Citation of empirical research, experiment, or scientific study
- `statistic`: Numerical data, percentage, or quantitative finding with source
- `expert_opinion`: Statement, viewpoint, or analysis from subject matter expert
- `book_reference`: Citation of published book or book chapter
- `article_reference`: Citation of journal article, magazine piece, or newspaper article
- `report_reference`: Reference to technical report, white paper, or policy document
- `organization_data`: Data, finding, or statement from institution or agency
- `web_source`: Online-only source, blog post, website content, or database
- `legal_reference`: Citation of law, court case, or legal document
- `conference_reference`: Conference paper or presentation
- `thesis_reference`: Master's thesis or doctoral dissertation

## OUTPUT FORMAT

Return a single, valid JSON object with NO additional text, markdown formatting, or explanatory content. Use this exact structure:

```json
{
  "article_metadata": {
    "title": "Article title",
    "author": "Article author name",
    "publication": "Publication venue",
    "date": "Publication date",
    "analyzed_date": "Current date YYYY-MM-DD"
  },
  "total_citations": 0,
  "citation_summary": {
    "direct_quotes": 0,
    "indirect_quotes": 0,
    "research_references": 0,
    "statistics": 0,
    "other": 0
  },
  "citations": [
    {
      "id": 1,
      "type": "study_reference",
      "quote_text": "Exact verbatim text or precise description",
      "author": "LastName, FirstName; LastName2, FirstName2",
      "source": "Publication or institution name",
      "year": "2024",
      "context": "Explanation of citation purpose and relevance in the article's argument",
      "paragraph": "3",
      "additional_info": {
        "study_title": "Complete study title if provided",
        "journal": "Journal name",
        "doi": "10.xxxx/xxxxx",
        "volume": "12",
        "issue": "3",
        "pages": "45-67",
        "url": "https://example.com"
      }
    }
  ]
}
```

## CRITICAL REQUIREMENTS

1. **Exhaustiveness**: Identify every citation, including:
   - Obvious direct quotes in quotation marks
   - Subtle indirect references ("according to...", "researchers found...", "data shows...")
   - Embedded statistics with sources
   - Implicit references to prior work
   
2. **Precision**: For direct quotes, copy text EXACTLY including punctuation. For indirect references, describe precisely what is being referenced.

3. **Metadata completeness**: Extract ALL available bibliographic information. If a field is unavailable, use `null`.

4. **Sequential ordering**: Citations must appear in document order (§1, §2, §3...).

5. **Type accuracy**: Carefully distinguish between citation types. For example:
   - "Study found X" → `study_reference`
   - "'Quote here,' said Expert" → `direct_quote`
   - "According to Organization, Y" → `organization_data` or `indirect_quote`
   - "Statistics show Z (Source)" → `statistic`

Begin extraction now. Return only the JSON object.
```

---

## 2. PROMPT SPECIALIZZATI PER TIPOLOGIA

### 2A. ARTICOLI SCIENTIFICI

**ADDENDUM al SYSTEM PROMPT:**
```
FOCUS SPECIFICO PER ARTICOLI SCIENTIFICI:

Priorità aggiuntive:
- Identifica citazioni in formato scientifico (Author et al., Year)
- Estrai numeri di citazione [1], [2-5] se presenti
- Riconosci citazioni inline (Author, Year) e parentetiche (Author Year)
- Identifica riferimenti a metodi standard (PCR, Western blot, etc.) con fonte
- Cattura citazioni di dataset, codice, protocolli
- Identifica citazioni nella bibliografia/reference list se presenti nel testo

Tipi aggiuntivi per articoli scientifici:
- `method_reference`: riferimento a metodologia standardizzata
- `dataset_reference`: citazione di dataset pubblico
- `software_reference`: software/tool citato
- `protocol_reference`: protocollo sperimentale citato
```

---

### 2B. NEWS ARTICLES

**ADDENDUM al SYSTEM PROMPT:**
```
FOCUS SPECIFICO PER ARTICOLI NEWS:

Priorità aggiuntive:
- Identifica fonti anonime ("secondo fonti vicine a...", "anonymous official")
- Cattura attributions indirette ("reportedly", "allegedly", "according to")
- Distingui citazioni dirette da dichiarazioni parafrasate
- Identifica multiple fonti per la stessa informazione
- Nota il livello di affidabilità della fonte (on record, off record, anonymous)
- Identifica breaking news sources e wire service attributions

Campi aggiuntivi per news:
- `source_reliability`: "on_record" | "off_record" | "anonymous" | "unnamed"
- `source_description`: descrizione della fonte se non nominata (es: "official close to the matter")
- `verification_status`: "confirmed" | "alleged" | "reported" | "claimed"
```

---

### 2C. ARTICOLI BUSINESS/FINANZIARI

**ADDENDUM al SYSTEM PROMPT:**
```
FOCUS SPECIFICO PER ARTICOLI BUSINESS:

Priorità aggiuntive:
- Identifica dati finanziari con fonte (revenue, market cap, valuation)
- Cattura citazioni di executive/CEO
- Identifica analyst reports e rating
- Cattura quarterly reports, earnings calls references
- Identifica market data sources (Bloomberg, Reuters, etc.)
- Cattura economic indicators con fonte (GDP, unemployment, etc.)

Tipi aggiuntivi:
- `financial_data`: dato finanziario specifico con fonte
- `analyst_opinion`: opinione/rating di analista
- `company_statement`: dichiarazione ufficiale da company
- `market_data`: dato di mercato da provider
- `earnings_reference`: riferimento a earnings report
```

---

## 3. FORMATTAZIONE CITAZIONI

### 3.1 Modulo di Formattazione JavaScript

```javascript
/**
 * Sistema di formattazione citazioni in diversi stili bibliografici
 */

class CitationFormatter {
  constructor(citations) {
    this.citations = citations;
  }

  // Formatta in stile APA (7th edition)
  formatAPA(citation) {
    const { author, year, quote_text, source, additional_info } = citation;
    
    // Author (Year). Quote/Reference. Source.
    let formatted = '';
    
    // Autore
    if (author) {
      const authors = author.split(';').map(a => a.trim());
      if (authors.length === 1) {
        formatted += authors[0];
      } else if (authors.length === 2) {
        formatted += `${authors[0]} & ${authors[1]}`;
      } else if (authors.length <= 20) {
        formatted += authors.slice(0, -1).join(', ') + ', & ' + authors[authors.length - 1];
      } else {
        formatted += authors.slice(0, 19).join(', ') + ', ... ' + authors[authors.length - 1];
      }
    }
    
    // Anno
    if (year) {
      formatted += ` (${year}). `;
    } else {
      formatted += ' (n.d.). ';
    }
    
    // Titolo (se disponibile)
    if (additional_info?.study_title) {
      formatted += `${additional_info.study_title}. `;
    } else if (citation.type === 'direct_quote') {
      formatted += `"${quote_text}" `;
    }
    
    // Fonte
    if (additional_info?.journal) {
      formatted += `*${additional_info.journal}*`;
      if (additional_info.volume) {
        formatted += `, ${additional_info.volume}`;
        if (additional_info.issue) {
          formatted += `(${additional_info.issue})`;
        }
      }
      if (additional_info.pages) {
        formatted += `, ${additional_info.pages}`;
      }
      formatted += '. ';
    } else if (source) {
      formatted += `*${source}*. `;
    }
    
    // DOI o URL
    if (additional_info?.doi) {
      formatted += `https://doi.org/${additional_info.doi}`;
    } else if (additional_info?.url) {
      formatted += additional_info.url;
    }
    
    return formatted.trim();
  }

  // Formatta in stile MLA (9th edition)
  formatMLA(citation) {
    const { author, year, quote_text, source, additional_info } = citation;
    
    // Author. "Title." Source, Year, pages.
    let formatted = '';
    
    // Autore (Last, First)
    if (author) {
      const authors = author.split(';').map(a => a.trim());
      formatted += authors[0];
      if (authors.length === 2) {
        formatted += `, and ${authors[1]}`;
      } else if (authors.length > 2) {
        formatted += ', et al';
      }
      formatted += '. ';
    }
    
    // Titolo tra virgolette
    if (additional_info?.study_title) {
      formatted += `"${additional_info.study_title}." `;
    } else if (citation.type === 'direct_quote') {
      // Per citazioni dirette, abbrevia se troppo lungo
      const shortQuote = quote_text.length > 50 
        ? quote_text.substring(0, 47) + '...'
        : quote_text;
      formatted += `"${shortQuote}" `;
    }
    
    // Fonte in corsivo
    if (additional_info?.journal) {
      formatted += `*${additional_info.journal}*`;
    } else if (source) {
      formatted += `*${source}*`;
    }
    
    // Volume e numero
    if (additional_info?.volume) {
      formatted += `, vol. ${additional_info.volume}`;
      if (additional_info.issue) {
        formatted += `, no. ${additional_info.issue}`;
      }
    }
    
    // Anno
    if (year) {
      formatted += `, ${year}`;
    }
    
    // Pagine
    if (additional_info?.pages) {
      formatted += `, pp. ${additional_info.pages}`;
    }
    
    formatted += '.';
    
    // URL o DOI
    if (additional_info?.doi) {
      formatted += ` https://doi.org/${additional_info.doi}.`;
    } else if (additional_info?.url) {
      formatted += ` ${additional_info.url}.`;
    }
    
    return formatted.trim();
  }

  // Formatta in stile Chicago (17th edition, Notes-Bibliography)
  formatChicago(citation, noteNumber = null) {
    const { author, year, quote_text, source, additional_info } = citation;
    
    let formatted = '';
    
    // Numero nota (opzionale)
    if (noteNumber) {
      formatted += `${noteNumber}. `;
    }
    
    // Autore (First Last)
    if (author) {
      const authors = author.split(';').map(a => {
        const parts = a.trim().split(',').map(p => p.trim());
        return parts.length === 2 ? `${parts[1]} ${parts[0]}` : a;
      });
      
      if (authors.length === 1) {
        formatted += authors[0];
      } else if (authors.length === 2) {
        formatted += `${authors[0]} and ${authors[1]}`;
      } else if (authors.length === 3) {
        formatted += `${authors[0]}, ${authors[1]}, and ${authors[2]}`;
      } else {
        formatted += `${authors[0]} et al.`;
      }
      formatted += ', ';
    }
    
    // Titolo
    if (additional_info?.study_title) {
      formatted += `"${additional_info.study_title}," `;
    }
    
    // Journal/Fonte in corsivo
    if (additional_info?.journal) {
      formatted += `*${additional_info.journal}* `;
    } else if (source) {
      formatted += `*${source}* `;
    }
    
    // Volume, numero
    if (additional_info?.volume) {
      formatted += `${additional_info.volume}`;
      if (additional_info.issue) {
        formatted += `, no. ${additional_info.issue}`;
      }
    }
    
    // Anno e pagine
    if (year) {
      formatted += ` (${year})`;
    }
    if (additional_info?.pages) {
      formatted += `: ${additional_info.pages}`;
    }
    
    formatted += '.';
    
    // DOI o URL
    if (additional_info?.doi) {
      formatted += ` https://doi.org/${additional_info.doi}.`;
    } else if (additional_info?.url) {
      formatted += ` ${additional_info.url}.`;
    }
    
    return formatted.trim();
  }

  // Formatta in stile IEEE
  formatIEEE(citation, referenceNumber) {
    const { author, year, source, additional_info } = citation;
    
    // [1] Author, "Title," Source, vol. X, no. Y, pp. ZZ-ZZ, Year.
    let formatted = `[${referenceNumber}] `;
    
    // Autore (iniziali)
    if (author) {
      const authors = author.split(';').map(a => {
        const parts = a.trim().split(',').map(p => p.trim());
        if (parts.length === 2) {
          const initials = parts[1].split(' ').map(n => n[0] + '.').join(' ');
          return `${initials} ${parts[0]}`;
        }
        return a;
      });
      
      if (authors.length <= 3) {
        formatted += authors.join(', ');
      } else {
        formatted += `${authors[0]} et al.`;
      }
      formatted += ', ';
    }
    
    // Titolo tra virgolette
    if (additional_info?.study_title) {
      formatted += `"${additional_info.study_title}," `;
    }
    
    // Fonte in corsivo
    if (additional_info?.journal) {
      formatted += `*${additional_info.journal}*`;
    } else if (source) {
      formatted += `*${source}*`;
    }
    
    // Volume, numero, pagine
    if (additional_info?.volume) {
      formatted += `, vol. ${additional_info.volume}`;
    }
    if (additional_info?.issue) {
      formatted += `, no. ${additional_info.issue}`;
    }
    if (additional_info?.pages) {
      formatted += `, pp. ${additional_info.pages}`;
    }
    
    // Anno
    if (year) {
      formatted += `, ${year}`;
    }
    
    formatted += '.';
    
    return formatted.trim();
  }

  // Formatta in stile Harvard
  formatHarvard(citation) {
    const { author, year, source, additional_info } = citation;
    
    // Author (Year) Title. Source.
    let formatted = '';
    
    // Autore
    if (author) {
      const authors = author.split(';').map(a => a.trim());
      if (authors.length === 1) {
        formatted += authors[0];
      } else if (authors.length === 2) {
        formatted += `${authors[0]} and ${authors[1]}`;
      } else {
        formatted += `${authors[0]} et al.`;
      }
    }
    
    // Anno
    if (year) {
      formatted += ` (${year}) `;
    } else {
      formatted += ' (no date) ';
    }
    
    // Titolo
    if (additional_info?.study_title) {
      formatted += `'${additional_info.study_title}', `;
    }
    
    // Fonte
    if (additional_info?.journal) {
      formatted += `*${additional_info.journal}*`;
      if (additional_info.volume) {
        formatted += `, ${additional_info.volume}`;
        if (additional_info.issue) {
          formatted += `(${additional_info.issue})`;
        }
      }
      if (additional_info.pages) {
        formatted += `, pp. ${additional_info.pages}`;
      }
    } else if (source) {
      formatted += `*${source}*`;
    }
    
    formatted += '.';
    
    // DOI o URL
    if (additional_info?.doi) {
      formatted += ` doi: ${additional_info.doi}`;
    } else if (additional_info?.url) {
      formatted += ` Available at: ${additional_info.url}`;
    }
    
    return formatted.trim();
  }

  // Formatta tutte le citazioni in uno stile specifico
  formatAll(style = 'APA') {
    const formatters = {
      'APA': this.formatAPA.bind(this),
      'MLA': this.formatMLA.bind(this),
      'Chicago': this.formatChicago.bind(this),
      'IEEE': this.formatIEEE.bind(this),
      'Harvard':