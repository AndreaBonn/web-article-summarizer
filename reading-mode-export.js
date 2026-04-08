// Reading Mode - Export Module
// Gestisce copia negli appunti ed esportazione PDF

// Copy all content
async function copyAll() {
  if (!currentData) return;

  const { article, pdf, summary, keyPoints } = currentData;

  // Gestisci sia articoli che PDF
  if (currentData.isPDF || pdf) {
    let text = `PDF: ${pdf?.name || currentData.filename || 'Documento'}\n`;
    text += `Pagine: ${pdf?.pages || currentData.pageCount || 'N/A'}\n\n`;
    text += `${'='.repeat(60)}\n\n`;
    text += `RIASSUNTO:\n${summary}\n\n`;

    if (keyPoints && keyPoints.length > 0) {
      text += `PUNTI CHIAVE:\n`;
      keyPoints.forEach((point, index) => {
        text += `${index + 1}. ${point.title}\n`;
        text += `   ${point.description}\n\n`;
      });
    }

    // Aggiungi traduzione se presente
    if (currentData.translation) {
      text += `${'='.repeat(60)}\n\n`;
      text += `TRADUZIONE:\n${currentData.translation.text || currentData.translation}\n\n`;
    }

    // Aggiungi Q&A se presenti
    if (currentData.qa && currentData.qa.length > 0) {
      text += `${'='.repeat(60)}\n\n`;
      text += `DOMANDE E RISPOSTE:\n\n`;
      currentData.qa.forEach((qa, index) => {
        text += `Q${index + 1}: ${qa.question}\n`;
        text += `R${index + 1}: ${qa.answer}\n\n`;
      });
    }

    // Aggiungi citazioni se presenti
    if (currentData.citations && currentData.citations.citations && currentData.citations.citations.length > 0) {
      text += `${'='.repeat(60)}\n\n`;
      text += `CITAZIONI (${currentData.citations.citations.length}):\n\n`;
      currentData.citations.citations.forEach((citation, index) => {
        text += `[${index + 1}] `;
        if (citation.author) text += `${citation.author} `;
        if (citation.year) text += `(${citation.year}) `;
        if (citation.source) text += `- ${citation.source}`;
        text += `\n`;
        if (citation.quote_text) text += `   "${citation.quote_text}"\n`;
        text += `\n`;
      });
    }

    // Aggiungi note se presenti
    if (currentData.notes) {
      text += `${'='.repeat(60)}\n\n`;
      text += `NOTE PERSONALI:\n${currentData.notes}\n\n`;
    }

    try {
      await navigator.clipboard.writeText(text);

      const originalText = elements.copyBtn.textContent;
      elements.copyBtn.textContent = '✓ Copiato!';
      setTimeout(() => {
        elements.copyBtn.textContent = originalText;
      }, 2000);
    } catch (error) {
      console.error('Copy error:', error);
      alert('Errore durante la copia');
    }
    return;
  }

  // Gestione articoli normali
  let text = `ARTICOLO: ${article.title}\n`;
  text += `URL: ${article.url}\n\n`;
  text += `${'='.repeat(60)}\n\n`;
  text += `RIASSUNTO:\n${summary}\n\n`;

  if (keyPoints && keyPoints.length > 0) {
    text += `PUNTI CHIAVE:\n`;
    keyPoints.forEach((point, index) => {
      text += `${index + 1}. ${point.title} (§${point.paragraphs})\n`;
      text += `   ${point.description}\n\n`;
    });
  }

  // Aggiungi traduzione se presente
  if (currentData.translation) {
    text += `${'='.repeat(60)}\n\n`;
    text += `TRADUZIONE:\n${currentData.translation.text || currentData.translation}\n\n`;
  }

  // Aggiungi Q&A se presenti
  if (currentData.qa && currentData.qa.length > 0) {
    text += `${'='.repeat(60)}\n\n`;
    text += `DOMANDE E RISPOSTE:\n\n`;
    currentData.qa.forEach((qa, index) => {
      text += `Q${index + 1}: ${qa.question}\n`;
      text += `R${index + 1}: ${qa.answer}\n\n`;
    });
  }

  // Aggiungi citazioni se presenti
  if (currentData.citations && currentData.citations.citations && currentData.citations.citations.length > 0) {
    text += `${'='.repeat(60)}\n\n`;
    text += `CITAZIONI (${currentData.citations.citations.length}):\n\n`;
    currentData.citations.citations.forEach((citation, index) => {
      text += `[${index + 1}] `;
      if (citation.author) text += `${citation.author} `;
      if (citation.year) text += `(${citation.year}) `;
      if (citation.source) text += `- ${citation.source}`;
      text += `\n`;
      if (citation.quote_text) text += `   "${citation.quote_text}"\n`;
      text += `\n`;
    });
  }

  // Aggiungi note se presenti
  if (currentData.notes) {
    text += `${'='.repeat(60)}\n\n`;
    text += `NOTE PERSONALI:\n${currentData.notes}\n\n`;
  }

  try {
    await navigator.clipboard.writeText(text);

    const originalText = elements.copyBtn.textContent;
    elements.copyBtn.textContent = '✓ Copiato!';
    setTimeout(() => {
      elements.copyBtn.textContent = originalText;
    }, 2000);
  } catch (error) {
    console.error('Copy error:', error);
    alert('Errore durante la copia');
  }
}

// Export to PDF
async function exportToPDF() {
  if (!currentData) {
    alert('Nessun dato da esportare');
    return;
  }

  try {
    // Verifica che jsPDF sia caricato
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('Libreria PDF non caricata. Ricarica la pagina e riprova.');
      return;
    }

    // Mostra loading
    const originalText = elements.exportBtn.textContent;
    elements.exportBtn.textContent = '⏳ Esportazione...';
    elements.exportBtn.disabled = true;

    const { article, pdf, summary, keyPoints, metadata } = currentData;

    // Gestisci sia articoli che PDF
    const articleData = currentData.isPDF || pdf ? {
      title: pdf?.name || currentData.filename || 'Documento PDF',
      url: 'PDF Document',
      content: currentData.extractedText || pdf?.text || '',
      wordCount: 0,
      readingTimeMinutes: 0
    } : article;

    const metadataData = metadata || currentData.metadata || {
      provider: currentData.apiProvider || 'AI',
      language: 'it',
      contentType: 'pdf'
    };

    // Usa PDFExporter se disponibile, altrimenti fallback
    if (typeof PDFExporter !== 'undefined') {
      await PDFExporter.exportToPDF(
        articleData,
        summary,
        keyPoints,
        metadataData,
        currentData.translation,
        currentData.qa,
        currentData.citations
      );
    } else {
      // Fallback: export semplice
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      let y = 20;
      const lineHeight = 7;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const maxWidth = 170;

      // Helper function to add text with page breaks
      const addText = (text, fontSize = 11, isBold = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');

        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach(line => {
          if (y + lineHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += lineHeight;
        });
      };

      // Title
      addText(article.title, 16, true);
      y += 5;

      // Metadata
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`${article.wordCount || 0} parole • ${article.readingTimeMinutes || 0} min lettura`, margin, y);
      y += 10;
      doc.setTextColor(0);

      // Summary
      addText('RIASSUNTO', 14, true);
      y += 3;
      addText(summary);
      y += 10;

      // Key Points
      if (keyPoints && keyPoints.length > 0) {
        addText('PUNTI CHIAVE', 14, true);
        y += 3;

        keyPoints.forEach((point, index) => {
          addText(`${index + 1}. ${point.title}`, 11, true);
          addText(`   ${point.description}`);
          y += 3;
        });
      }

      // Save
      const filename = `${article.title.substring(0, 50)}_reading-mode.pdf`;
      doc.save(filename);
    }

    // Successo
    elements.exportBtn.textContent = '✓ Esportato!';
    setTimeout(() => {
      elements.exportBtn.textContent = originalText;
      elements.exportBtn.disabled = false;
    }, 2000);

  } catch (error) {
    console.error('Export error:', error);
    alert('Errore durante l\'esportazione PDF: ' + error.message);
    elements.exportBtn.textContent = '📄 PDF';
    elements.exportBtn.disabled = false;
  }
}
