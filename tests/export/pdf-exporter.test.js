import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock jsPDF — use a function constructor so `new jsPDF()` works
const mockDoc = {
  internal: {
    pageSize: {
      getWidth: vi.fn(() => 210),
      getHeight: vi.fn(() => 297),
    },
    getNumberOfPages: vi.fn(() => 1),
  },
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  setTextColor: vi.fn(),
  setDrawColor: vi.fn(),
  splitTextToSize: vi.fn((text) => [text]),
  text: vi.fn(),
  line: vi.fn(),
  addPage: vi.fn(),
  setPage: vi.fn(),
  save: vi.fn(),
};

vi.mock('jspdf', () => {
  function MockJsPDF() {
    return mockDoc;
  }
  return { jsPDF: MockJsPDF };
});

vi.mock('../../src/utils/ai/citation-extractor.js', () => ({
  CitationExtractor: {
    formatCitation: vi.fn(() => 'Author (2024). Title. Source.'),
  },
}));

vi.mock('../../src/utils/ai/citation-formatter.js', () => ({
  CitationFormatter: {
    getCitationTypeLabel: vi.fn((type) => {
      const labels = {
        direct_quote: 'Citazione Diretta',
        study_reference: 'Studio/Ricerca',
      };
      return labels[type] || 'Altro';
    }),
  },
}));

const { PDFExporter } = await import('@utils/export/pdf-exporter.js');

const mockArticle = {
  title: 'Test Article Title',
  url: 'https://example.com/article',
  wordCount: 1500,
  readingTimeMinutes: 7,
};

const mockMetadata = {
  provider: 'groq',
  language: 'it',
  contentType: 'general',
};

// ---------------------------------------------------------------------------
// exportToPDF()
// ---------------------------------------------------------------------------
describe('PDFExporter.exportToPDF()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.splitTextToSize.mockImplementation((text) => [text]);
    mockDoc.internal.getNumberOfPages.mockReturnValue(1);
  });

  it('genera PDF con titolo e metadata', async () => {
    await PDFExporter.exportToPDF(mockArticle, 'Il riassunto', [], mockMetadata);

    expect(mockDoc.save).toHaveBeenCalledTimes(1);
    const filename = mockDoc.save.mock.calls[0][0];
    expect(filename).toMatch(/^riassunto_test_article_title_\d+\.pdf$/);
  });

  it('include header AI Article Summarizer', async () => {
    await PDFExporter.exportToPDF(mockArticle, 'sum', [], mockMetadata);

    const textCalls = mockDoc.text.mock.calls.map((c) => c[0]);
    expect(textCalls).toContain('AI Article Summarizer');
  });

  it('include provider e lingua dai metadata', async () => {
    await PDFExporter.exportToPDF(mockArticle, 'sum', [], mockMetadata);

    const textCalls = mockDoc.text.mock.calls.map((c) => c[0]);
    expect(textCalls.some((t) => t.includes('groq'))).toBe(true);
    expect(textCalls.some((t) => t.includes('it'))).toBe(true);
  });

  it('include sezione RIASSUNTO quando summary fornito', async () => {
    await PDFExporter.exportToPDF(mockArticle, 'Contenuto riassunto', [], mockMetadata);

    const textCalls = mockDoc.text.mock.calls.map((c) => c[0]);
    expect(textCalls).toContain('RIASSUNTO');
  });

  it('include traduzione quando fornita', async () => {
    await PDFExporter.exportToPDF(
      mockArticle,
      'sum',
      [],
      mockMetadata,
      'The translation',
    );

    const textCalls = mockDoc.text.mock.calls.map((c) => c[0]);
    expect(textCalls).toContain('TRADUZIONE');
  });

  it('omette traduzione quando null', async () => {
    await PDFExporter.exportToPDF(mockArticle, 'sum', [], mockMetadata, null);

    const textCalls = mockDoc.text.mock.calls.map((c) => c[0]);
    expect(textCalls).not.toContain('TRADUZIONE');
  });

  it('include citazioni quando fornite', async () => {
    const citations = {
      article: { title: 'Source', author: 'Auth' },
      citations: [
        {
          id: 1,
          author: 'Rossi',
          source: 'Nature',
          year: '2024',
          quote_text: 'Quote here',
          type: 'direct_quote',
        },
      ],
      total_citations: 1,
    };
    await PDFExporter.exportToPDF(
      mockArticle,
      'sum',
      [],
      mockMetadata,
      null,
      null,
      citations,
    );

    const textCalls = mockDoc.text.mock.calls.map((c) => c[0]);
    expect(textCalls).toContain('CITAZIONI E BIBLIOGRAFIA');
  });
});

// ---------------------------------------------------------------------------
// exportKeyPointsOnly()
// ---------------------------------------------------------------------------
describe('PDFExporter.exportKeyPointsOnly()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.splitTextToSize.mockImplementation((text) => [text]);
    mockDoc.internal.getNumberOfPages.mockReturnValue(1);
  });

  it('genera PDF con solo punti chiave', async () => {
    const keyPoints = [
      { title: 'KP1', paragraphs: '1-2', description: 'D1' },
    ];
    await PDFExporter.exportKeyPointsOnly(mockArticle, keyPoints, mockMetadata);

    expect(mockDoc.save).toHaveBeenCalledTimes(1);
    const filename = mockDoc.save.mock.calls[0][0];
    expect(filename).toMatch(/^punti_chiave_test_article_title_\d+\.pdf$/);
  });

  it('include header Punti Chiave', async () => {
    await PDFExporter.exportKeyPointsOnly(mockArticle, [], mockMetadata);

    const textCalls = mockDoc.text.mock.calls.map((c) => c[0]);
    expect(textCalls).toContain('Punti Chiave - Web Sites Summarizer');
  });
});

// ---------------------------------------------------------------------------
// exportMultiAnalysisToPDF()
// ---------------------------------------------------------------------------
describe('PDFExporter.exportMultiAnalysisToPDF()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.splitTextToSize.mockImplementation((text) => [text]);
    mockDoc.internal.getNumberOfPages.mockReturnValue(1);
  });

  const mockAnalysis = {
    timestamp: Date.now(),
    globalSummary: 'Global summary text',
    comparison: 'Comparison text',
    qa: {
      questions: [{ question: 'Q?', answer: 'A.' }],
    },
  };

  const mockArticles = [
    { article: { title: 'Art 1' } },
    { article: { title: 'Art 2' } },
  ];

  it('genera PDF multi-analisi con tutte le sezioni', async () => {
    await PDFExporter.exportMultiAnalysisToPDF(mockAnalysis, mockArticles);

    expect(mockDoc.save).toHaveBeenCalledTimes(1);
    const filename = mockDoc.save.mock.calls[0][0];
    expect(filename).toMatch(/^analisi_multi_articolo_\d+\.pdf$/);
  });

  it('include lista articoli analizzati', async () => {
    await PDFExporter.exportMultiAnalysisToPDF(mockAnalysis, mockArticles);

    const textCalls = mockDoc.text.mock.calls.map((c) => c[0]);
    expect(textCalls).toContain('ARTICOLI ANALIZZATI:');
    expect(textCalls.some((t) => t.includes('Art 1'))).toBe(true);
    expect(textCalls.some((t) => t.includes('Art 2'))).toBe(true);
  });

  it('omette riassunto globale quando includeSummary false', async () => {
    await PDFExporter.exportMultiAnalysisToPDF(mockAnalysis, mockArticles, {
      includeSummary: false,
    });

    const textCalls = mockDoc.text.mock.calls.map((c) => c[0]);
    expect(textCalls).not.toContain('RIASSUNTO GLOBALE');
  });

  it('omette confronto quando includeComparison false', async () => {
    await PDFExporter.exportMultiAnalysisToPDF(mockAnalysis, mockArticles, {
      includeComparison: false,
    });

    const textCalls = mockDoc.text.mock.calls.map((c) => c[0]);
    expect(textCalls).not.toContain('CONFRONTO IDEE');
  });

  it('omette Q&A quando includeQA false', async () => {
    await PDFExporter.exportMultiAnalysisToPDF(mockAnalysis, mockArticles, {
      includeQA: false,
    });

    const textCalls = mockDoc.text.mock.calls.map((c) => c[0]);
    expect(textCalls).not.toContain('DOMANDE E RISPOSTE');
  });
});

// ---------------------------------------------------------------------------
// getCitationTypeLabel()
// ---------------------------------------------------------------------------
describe('PDFExporter.getCitationTypeLabel()', () => {
  it('delega a CitationFormatter', () => {
    const result = PDFExporter.getCitationTypeLabel('direct_quote');
    expect(result).toBe('Citazione Diretta');
  });

  it('ritorna fallback per tipo sconosciuto', () => {
    const result = PDFExporter.getCitationTypeLabel('unknown_type');
    expect(result).toBe('Altro');
  });
});

// ---------------------------------------------------------------------------
// _renderCitations() — testato indirettamente via exportToPDF
// ---------------------------------------------------------------------------
describe('PDFExporter._renderCitations() via exportToPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.splitTextToSize.mockImplementation((text) => [text]);
    mockDoc.internal.getNumberOfPages.mockReturnValue(1);
  });

  it('renderizza citazione con autore N/A come Fonte non specificata', async () => {
    const citations = {
      article: { title: 'T' },
      citations: [
        { id: 1, author: 'N/A', type: 'study_reference', quote_text: 'Qt' },
      ],
      total_citations: 1,
    };

    await PDFExporter.exportToPDF(mockArticle, 'sum', [], mockMetadata, null, null, citations);

    const textCalls = mockDoc.text.mock.calls.map((c) => c[0]);
    expect(textCalls.some((t) => t.includes('Fonte non specificata'))).toBe(true);
  });

  it('renderizza source e year nella citazione', async () => {
    const citations = {
      article: { title: 'T' },
      citations: [
        {
          id: 1,
          author: 'Bianchi',
          source: 'Science',
          year: '2023',
          type: 'direct_quote',
          quote_text: 'text',
        },
      ],
      total_citations: 1,
    };

    await PDFExporter.exportToPDF(mockArticle, 'sum', [], mockMetadata, null, null, citations);

    const textCalls = mockDoc.text.mock.calls.map((c) => c[0]);
    expect(textCalls.some((t) => t.includes('Science') && t.includes('2023'))).toBe(true);
  });
});
