// PDF Exporter - Genera PDF ben formattati per riassunti e punti chiave
import { jsPDF } from 'jspdf';
import { CitationExtractor } from '../ai/citation-extractor.js';

export class PDFExporter {
  static async exportToPDF(article, summary, keyPoints, metadata, translation = null, qaList = null, citations = null) {
    const doc = new jsPDF();
    
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    
    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('AI Article Summarizer', margin, yPosition);
    yPosition += 10;
    
    // Metadata
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    const date = new Date().toLocaleDateString('it-IT');
    doc.text(`Generato il: ${date}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Provider: ${metadata.provider || 'N/A'}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Lingua: ${metadata.language || 'N/A'}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Tipo: ${metadata.contentType || 'N/A'}`, margin, yPosition);
    yPosition += 10;
    
    // Separator
    doc.setDrawColor(200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    
    // Article Title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0);
    const titleLines = doc.splitTextToSize(article.title, maxWidth);
    doc.text(titleLines, margin, yPosition);
    yPosition += (titleLines.length * 7) + 5;
    
    // Article Stats
    doc.setFontSize(9);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(100);
    doc.text(`${article.wordCount} parole • ${article.readingTimeMinutes} min lettura`, margin, yPosition);
    yPosition += 5;
    doc.text(`URL: ${article.url}`, margin, yPosition);
    yPosition += 15;
    
    // Summary Section (if included)
    if (summary) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0);
      doc.text('RIASSUNTO', margin, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const summaryLines = doc.splitTextToSize(summary, maxWidth);
      
      for (let line of summaryLines) {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      }
      
      yPosition += 10;
    }
    
    // Key Points Section (if included)
    if (keyPoints && keyPoints.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('PUNTI CHIAVE', margin, yPosition);
      yPosition += 10;
      
      keyPoints.forEach((point, index) => {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Point number and title
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(102, 126, 234); // Purple color
      const titleText = `${index + 1}. ${point.title}`;
      const titleLines = doc.splitTextToSize(titleText, maxWidth - 10);
      doc.text(titleLines, margin, yPosition);
      yPosition += (titleLines.length * 6) + 2;
      
      // Paragraph reference
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`§${point.paragraphs}`, margin, yPosition);
      yPosition += 5;
      
      // Description
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0);
      const descLines = doc.splitTextToSize(point.description, maxWidth - 5);
      
      for (let line of descLines) {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin + 5, yPosition);
        yPosition += 4.5;
      }
      
      yPosition += 8;
      });
    }
    
    // Translation Section (if available)
    if (translation) {
      yPosition += 10;
      
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0);
      doc.text('TRADUZIONE', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const translationLines = doc.splitTextToSize(translation, maxWidth);
      
      for (let line of translationLines) {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      }
    }
    
    // Q&A Section (if available)
    if (qaList && qaList.length > 0) {
      yPosition += 10;
      
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0);
      doc.text('DOMANDE E RISPOSTE', margin, yPosition);
      yPosition += 10;
      
      qaList.forEach((qa, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Question
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(102, 126, 234); // Purple color
        const questionText = `Q${index + 1}: ${qa.question}`;
        const questionLines = doc.splitTextToSize(questionText, maxWidth - 5);
        doc.text(questionLines, margin, yPosition);
        yPosition += (questionLines.length * 6) + 3;
        
        // Answer
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0);
        const answerText = `R${index + 1}: ${qa.answer}`;
        const answerLines = doc.splitTextToSize(answerText, maxWidth - 5);
        
        for (let line of answerLines) {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, margin + 5, yPosition);
          yPosition += 5;
        }
        
        yPosition += 8;
      });
    }
    
    // Citations section
    if (citations && citations.citations && citations.citations.length > 0) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0);
      doc.text('CITAZIONI E BIBLIOGRAFIA', margin, yPosition);
      yPosition += 10;
      
      // Citazione articolo principale
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(102, 126, 234);
      doc.text('Articolo Principale:', margin, yPosition);
      yPosition += 6;
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0);
      const mainCitation = CitationExtractor.formatCitation(citations.article, 'apa');
      const mainCitationLines = doc.splitTextToSize(mainCitation, maxWidth - 5);
      for (let line of mainCitationLines) {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin + 5, yPosition);
        yPosition += 5;
      }
      yPosition += 8;
      
      // Citazioni trovate
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(102, 126, 234);
      const totalCitations = citations.total_citations || citations.totalCount || citations.citations.length;
      doc.text(`Citazioni Trovate (${totalCitations}):`, margin, yPosition);
      yPosition += 8;
      
      citations.citations.forEach((citation, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Citation number and author
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0);
        const author = citation.author && citation.author !== 'N/A' ? citation.author : 'Fonte non specificata';
        const header = `#${citation.id} - ${author}`;
        doc.text(header, margin, yPosition);
        yPosition += 6;
        
        // Source and year
        if (citation.source || citation.year) {
          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(100);
          let sourceInfo = '';
          if (citation.source && citation.source !== 'N/A') sourceInfo += citation.source;
          if (citation.year) sourceInfo += ` (${citation.year})`;
          if (sourceInfo) {
            doc.text(sourceInfo, margin + 5, yPosition);
            yPosition += 5;
          }
        }
        
        // Citation text
        const quoteText = citation.quote_text || citation.text || '';
        if (quoteText) {
          doc.setFontSize(9);
          doc.setFont(undefined, 'italic');
          doc.setTextColor(60);
          const citationLines = doc.splitTextToSize(`"${quoteText}"`, maxWidth - 10);
          for (let line of citationLines) {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(line, margin + 5, yPosition);
            yPosition += 5;
          }
          yPosition += 3;
        }
        
        // Context
        if (citation.context) {
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(0);
          const contextLines = doc.splitTextToSize(citation.context, maxWidth - 10);
          for (let line of contextLines) {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(line, margin + 5, yPosition);
            yPosition += 5;
          }
          yPosition += 3;
        }
        
        // Type and paragraph
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100);
        const typeLabel = this.getCitationTypeLabel(citation.type);
        let metadata = `Tipo: ${typeLabel}`;
        if (citation.paragraph) {
          metadata += ` | Paragrafo: §${citation.paragraph}`;
        }
        doc.text(metadata, margin + 5, yPosition);
        yPosition += 6;
      });
    }
    
    // Footer on last page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Pagina ${i} di ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Generate filename
    const sanitizedTitle = article.title
      .substring(0, 50)
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const filename = `riassunto_${sanitizedTitle}_${Date.now()}.pdf`;
    
    // Save
    doc.save(filename);
  }
  
  static async exportKeyPointsOnly(article, keyPoints, metadata) {
    const doc = new jsPDF();
    
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    
    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Punti Chiave - Web Sites Summarizer', margin, yPosition);
    yPosition += 15;
    
    // Article Title
    doc.setFontSize(14);
    const titleLines = doc.splitTextToSize(article.title, maxWidth);
    doc.text(titleLines, margin, yPosition);
    yPosition += (titleLines.length * 7) + 10;
    
    // Key Points
    keyPoints.forEach((point, index) => {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(102, 126, 234);
      const titleText = `${index + 1}. ${point.title}`;
      const titleLines = doc.splitTextToSize(titleText, maxWidth - 10);
      doc.text(titleLines, margin, yPosition);
      yPosition += (titleLines.length * 6) + 2;
      
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`§${point.paragraphs}`, margin, yPosition);
      yPosition += 5;
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0);
      const descLines = doc.splitTextToSize(point.description, maxWidth - 5);
      
      for (let line of descLines) {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin + 5, yPosition);
        yPosition += 4.5;
      }
      
      yPosition += 8;
    });
    
    const sanitizedTitle = article.title
      .substring(0, 50)
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const filename = `punti_chiave_${sanitizedTitle}_${Date.now()}.pdf`;
    
    doc.save(filename);
  }

  static async exportMultiAnalysisToPDF(analysis, articles, options = {}) {
    // Default: include tutto se non specificato
    const {
      includeSummary = true,
      includeComparison = true,
      includeQA = true
    } = options;

    const doc = new jsPDF();
    
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    
    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Analisi Multi Articolo', margin, yPosition);
    yPosition += 10;
    
    // Metadata
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    const date = new Date(analysis.timestamp).toLocaleDateString('it-IT');
    doc.text(`Generato il: ${date}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Numero articoli: ${articles.length}`, margin, yPosition);
    yPosition += 10;
    
    // Articles List
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0);
    doc.text('ARTICOLI ANALIZZATI:', margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    articles.forEach((article, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      const titleLines = doc.splitTextToSize(`${index + 1}. ${article.article.title}`, maxWidth - 5);
      doc.text(titleLines, margin + 5, yPosition);
      yPosition += (titleLines.length * 5) + 3;
    });
    
    yPosition += 10;
    
    // Global Summary
    if (includeSummary && analysis.globalSummary) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0);
      doc.text('RIASSUNTO GLOBALE', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const summaryLines = doc.splitTextToSize(analysis.globalSummary, maxWidth);
      
      for (let line of summaryLines) {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      }
      
      yPosition += 15;
    }
    
    // Comparison
    if (includeComparison && analysis.comparison) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0);
      doc.text('CONFRONTO IDEE', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const comparisonLines = doc.splitTextToSize(analysis.comparison, maxWidth);
      
      for (let line of comparisonLines) {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      }
      
      yPosition += 15;
    }
    
    // Q&A
    if (includeQA && analysis.qa && analysis.qa.questions && analysis.qa.questions.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0);
      doc.text('DOMANDE E RISPOSTE', margin, yPosition);
      yPosition += 10;
      
      analysis.qa.questions.forEach((qa, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Question
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(102, 126, 234);
        const questionText = `Q${index + 1}: ${qa.question}`;
        const questionLines = doc.splitTextToSize(questionText, maxWidth - 5);
        doc.text(questionLines, margin, yPosition);
        yPosition += (questionLines.length * 6) + 3;
        
        // Answer
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0);
        const answerText = `R${index + 1}: ${qa.answer}`;
        const answerLines = doc.splitTextToSize(answerText, maxWidth - 5);
        
        for (let line of answerLines) {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, margin + 5, yPosition);
          yPosition += 5;
        }
        
        yPosition += 8;
      });
    }
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Pagina ${i} di ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    const filename = `analisi_multi_articolo_${Date.now()}.pdf`;
    doc.save(filename);
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
