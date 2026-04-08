// Markdown Exporter - Genera file Markdown ben formattati
import { CitationExtractor } from '../ai/citation-extractor.js';

export class MarkdownExporter {
  static exportToMarkdown(article, summary, keyPoints, metadata, translation = null, qaList = null, notes = null, citations = null) {
    let markdown = '';
    
    // Header con metadata
    markdown += `# ${article.title}\n\n`;
    markdown += `---\n\n`;
    markdown += `**URL:** ${article.url}\n\n`;
    markdown += `**Lunghezza:** ${article.wordCount} parole • ${article.readingTimeMinutes} min lettura\n\n`;
    markdown += `**Generato il:** ${new Date().toLocaleDateString('it-IT')}\n\n`;
    markdown += `**Provider:** ${metadata.provider || 'N/A'}\n\n`;
    markdown += `**Lingua:** ${metadata.language || 'N/A'}\n\n`;
    markdown += `**Tipo:** ${metadata.contentType || 'N/A'}\n\n`;
    markdown += `---\n\n`;
    
    // Note personali (se presenti)
    if (notes) {
      markdown += `## 📌 Note Personali\n\n`;
      markdown += `${notes}\n\n`;
      markdown += `---\n\n`;
    }
    
    // Riassunto (se incluso)
    if (summary) {
      markdown += `## 📝 Riassunto\n\n`;
      markdown += `${summary}\n\n`;
      markdown += `---\n\n`;
    }
    
    // Punti chiave (se inclusi)
    if (keyPoints && keyPoints.length > 0) {
      markdown += `## 🔑 Punti Chiave\n\n`;
      keyPoints.forEach((point, index) => {
        markdown += `### ${index + 1}. ${point.title}\n\n`;
        markdown += `**Riferimento:** §${point.paragraphs}\n\n`;
        markdown += `${point.description}\n\n`;
      });
      markdown += `---\n\n`;
    }
    
    // Traduzione (se inclusa)
    if (translation) {
      markdown += `## 🌍 Traduzione\n\n`;
      markdown += `${translation}\n\n`;
      markdown += `---\n\n`;
    }
    
    // Q&A (se incluse)
    if (qaList && qaList.length > 0) {
      markdown += `## 💬 Domande e Risposte\n\n`;
      qaList.forEach((qa, index) => {
        markdown += `### Q${index + 1}: ${qa.question}\n\n`;
        markdown += `**R${index + 1}:** ${qa.answer}\n\n`;
      });
      markdown += `---\n\n`;
    }
    
    // Citations (se incluse)
    if (citations && citations.citations && citations.citations.length > 0) {
      markdown += `## 📚 Citazioni e Bibliografia\n\n`;
      
      // Citazione articolo principale
      markdown += `### Articolo Principale\n\n`;
      const mainCitation = CitationExtractor.formatCitation(citations.article, 'apa');
      markdown += `${mainCitation}\n\n`;
      markdown += `---\n\n`;
      
      // Citazioni trovate
      const totalCitations = citations.total_citations || citations.totalCount || citations.citations.length;
      markdown += `### Citazioni Trovate (${totalCitations})\n\n`;
      citations.citations.forEach((citation, index) => {
        const author = citation.author && citation.author !== 'N/A' ? citation.author : 'Fonte non specificata';
        markdown += `#### #${citation.id} - ${author}\n\n`;
        
        // Source and year
        if (citation.source || citation.year) {
          let sourceInfo = '';
          if (citation.source && citation.source !== 'N/A') sourceInfo += `📚 ${citation.source}`;
          if (citation.year) sourceInfo += ` (${citation.year})`;
          if (sourceInfo) {
            markdown += `${sourceInfo}\n\n`;
          }
        }
        
        // Citation text
        const quoteText = citation.quote_text || citation.text || '';
        if (quoteText) {
          markdown += `> "${quoteText}"\n\n`;
        }
        
        // Context
        if (citation.context) {
          markdown += `${citation.context}\n\n`;
        }
        
        // Type and paragraph
        const typeLabel = this.getCitationTypeLabel(citation.type);
        let metadata = `*Tipo:* ${typeLabel}`;
        if (citation.paragraph) {
          metadata += ` | *Paragrafo:* §${citation.paragraph}`;
        }
        markdown += `${metadata}\n\n`;
        
        // Additional info
        if (citation.additional_info) {
          const info = citation.additional_info;
          const details = [];
          if (info.study_title) details.push(`**Studio:** "${info.study_title}"`);
          if (info.journal) details.push(`**Journal:** ${info.journal}`);
          if (info.doi) details.push(`**DOI:** ${info.doi}`);
          if (info.url) details.push(`**URL:** ${info.url}`);
          
          if (details.length > 0) {
            markdown += `*Dettagli:* ${details.join(' | ')}\n\n`;
          }
        }
      });
      markdown += `---\n\n`;
    }
    
    // Footer
    markdown += `\n*Generato con AI Article Summarizer*\n`;
    
    // Crea e scarica il file
    this.downloadMarkdown(markdown, article.title);
  }
  
  static downloadMarkdown(content, title) {
    // Crea blob
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    
    // Crea URL
    const url = URL.createObjectURL(blob);
    
    // Crea link temporaneo
    const link = document.createElement('a');
    link.href = url;
    
    // Genera filename
    const sanitizedTitle = title
      .substring(0, 50)
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    link.download = `riassunto_${sanitizedTitle}_${Date.now()}.md`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static exportMultiAnalysisToMarkdown(analysis, articles, options = {}) {
    // Default: include tutto se non specificato
    const {
      includeSummary = true,
      includeComparison = true,
      includeQA = true
    } = options;
    
    let markdown = '';
    
    // Header
    markdown += `# Analisi Multi Articolo\n\n`;
    markdown += `---\n\n`;
    markdown += `**Generato il:** ${new Date(analysis.timestamp).toLocaleDateString('it-IT')}\n\n`;
    markdown += `**Numero articoli:** ${articles.length}\n\n`;
    markdown += `---\n\n`;
    
    // Articles List
    markdown += `## 📚 Articoli Analizzati\n\n`;
    articles.forEach((article, index) => {
      markdown += `${index + 1}. **${article.article.title}**\n`;
      markdown += `   - URL: ${article.article.url}\n`;
      markdown += `   - Parole: ${article.article.wordCount}\n\n`;
    });
    markdown += `---\n\n`;
    
    // Global Summary
    if (includeSummary && analysis.globalSummary) {
      markdown += `## 📝 Riassunto Globale\n\n`;
      markdown += `${analysis.globalSummary}\n\n`;
      markdown += `---\n\n`;
    }
    
    // Comparison
    if (includeComparison && analysis.comparison) {
      markdown += `## ⚖️ Confronto Idee\n\n`;
      markdown += `${analysis.comparison}\n\n`;
      markdown += `---\n\n`;
    }
    
    // Q&A
    if (includeQA && analysis.qa && analysis.qa.questions && analysis.qa.questions.length > 0) {
      markdown += `## 💬 Domande e Risposte\n\n`;
      analysis.qa.questions.forEach((qa, index) => {
        markdown += `### Q${index + 1}: ${qa.question}\n\n`;
        markdown += `**R${index + 1}:** ${qa.answer}\n\n`;
      });
      markdown += `---\n\n`;
    }
    
    // Footer
    markdown += `\n*Generato con AI Article Summarizer - Analisi Multi Articolo*\n`;
    
    // Download
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analisi_multi_articolo_${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  static getCitationTypeLabel(type) {
    const labels = {
      'direct_quote': 'Citazione Diretta',
      'indirect_quote': 'Citazione Indiretta',
      'study_reference': 'Studio/Ricerca',
      'statistic': 'Statistica',
      'expert_opinion': 'Opinione Esperto',
      'book_reference': 'Libro',
      'article_reference': 'Articolo',
      'report_reference': 'Report',
      'organization_data': 'Dati Organizzazione',
      'web_source': 'Fonte Web'
    };
    return labels[type] || 'Altro';
  }
}
