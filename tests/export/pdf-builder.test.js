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

const { PDFBuilder } = await import('@utils/export/pdf-builder.js');

// ---------------------------------------------------------------------------
// constructor
// ---------------------------------------------------------------------------
describe('PDFBuilder constructor', () => {
  it('inizializza y a PAGE_TOP (20)', () => {
    const pdf = new PDFBuilder();
    expect(pdf.y).toBe(20);
  });

  it('calcola maxWidth come pageWidth - 2*MARGIN', () => {
    const pdf = new PDFBuilder();
    // pageWidth = 210, MARGIN = 20
    expect(pdf.maxWidth).toBe(170);
  });
});

// ---------------------------------------------------------------------------
// checkPageBreak()
// ---------------------------------------------------------------------------
describe('PDFBuilder.checkPageBreak()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aggiunge pagina quando y supera threshold', () => {
    const pdf = new PDFBuilder();
    pdf.y = 275;
    pdf.checkPageBreak();
    expect(mockDoc.addPage).toHaveBeenCalledTimes(1);
    expect(pdf.y).toBe(20);
  });

  it('non aggiunge pagina quando y sotto threshold', () => {
    const pdf = new PDFBuilder();
    pdf.y = 100;
    pdf.checkPageBreak();
    expect(mockDoc.addPage).not.toHaveBeenCalled();
  });

  it('usa threshold custom', () => {
    const pdf = new PDFBuilder();
    pdf.y = 255;
    pdf.checkPageBreak(250);
    expect(mockDoc.addPage).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// writeText()
// ---------------------------------------------------------------------------
describe('PDFBuilder.writeText()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.splitTextToSize.mockImplementation((text) => [text]);
  });

  it('scrive testo con parametri di default', () => {
    const pdf = new PDFBuilder();
    pdf.writeText('Hello');

    expect(mockDoc.setFontSize).toHaveBeenCalledWith(10);
    expect(mockDoc.setFont).toHaveBeenCalledWith(undefined, 'normal');
    expect(mockDoc.setTextColor).toHaveBeenCalledWith(0, 0, 0);
    expect(mockDoc.text).toHaveBeenCalledWith('Hello', 20, 20);
  });

  it('applica fontSize, style, color e indent custom', () => {
    const pdf = new PDFBuilder();
    pdf.writeText('Bold', { fontSize: 16, style: 'bold', color: [255, 0, 0], indent: 10 });

    expect(mockDoc.setFontSize).toHaveBeenCalledWith(16);
    expect(mockDoc.setFont).toHaveBeenCalledWith(undefined, 'bold');
    expect(mockDoc.setTextColor).toHaveBeenCalledWith(255, 0, 0);
    expect(mockDoc.text).toHaveBeenCalledWith('Bold', 30, 20);
  });

  it('avanza y per ogni riga scritta', () => {
    const pdf = new PDFBuilder();
    mockDoc.splitTextToSize.mockReturnValue(['line1', 'line2']);
    pdf.writeText('Long text');
    // fontSize default 10, increment = 10 * 0.5 = 5 per riga
    expect(pdf.y).toBe(30); // 20 + 5 + 5
  });
});

// ---------------------------------------------------------------------------
// writeSectionTitle()
// ---------------------------------------------------------------------------
describe('PDFBuilder.writeSectionTitle()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('scrive titolo sezione in bold e avanza y di 10', () => {
    const pdf = new PDFBuilder();
    pdf.writeSectionTitle('TITOLO');

    expect(mockDoc.setFontSize).toHaveBeenCalledWith(14);
    expect(mockDoc.setFont).toHaveBeenCalledWith(undefined, 'bold');
    expect(mockDoc.text).toHaveBeenCalledWith('TITOLO', 20, 20);
    expect(pdf.y).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// addSeparator()
// ---------------------------------------------------------------------------
describe('PDFBuilder.addSeparator()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disegna linea e avanza y di 10', () => {
    const pdf = new PDFBuilder();
    const startY = pdf.y;
    pdf.addSeparator();

    expect(mockDoc.setDrawColor).toHaveBeenCalledWith(200);
    expect(mockDoc.line).toHaveBeenCalledWith(20, startY, 190, startY);
    expect(pdf.y).toBe(startY + 10);
  });
});

// ---------------------------------------------------------------------------
// addSpacing()
// ---------------------------------------------------------------------------
describe('PDFBuilder.addSpacing()', () => {
  it('aggiunge spacing di default 10', () => {
    const pdf = new PDFBuilder();
    const startY = pdf.y;
    pdf.addSpacing();
    expect(pdf.y).toBe(startY + 10);
  });

  it('aggiunge spacing custom', () => {
    const pdf = new PDFBuilder();
    const startY = pdf.y;
    pdf.addSpacing(25);
    expect(pdf.y).toBe(startY + 25);
  });
});

// ---------------------------------------------------------------------------
// renderKeyPoints()
// ---------------------------------------------------------------------------
describe('PDFBuilder.renderKeyPoints()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.splitTextToSize.mockImplementation((text) => [text]);
  });

  it('non fa nulla con array vuoto', () => {
    const pdf = new PDFBuilder();
    pdf.renderKeyPoints([]);
    expect(mockDoc.text).not.toHaveBeenCalled();
  });

  it('non fa nulla con null', () => {
    const pdf = new PDFBuilder();
    pdf.renderKeyPoints(null);
    expect(mockDoc.text).not.toHaveBeenCalled();
  });

  it('renderizza titolo sezione e punti chiave', () => {
    const pdf = new PDFBuilder();
    const keyPoints = [
      { title: 'Punto A', paragraphs: '1-2', description: 'Desc A' },
    ];
    pdf.renderKeyPoints(keyPoints);

    // Deve scrivere titolo sezione "PUNTI CHIAVE"
    expect(mockDoc.text).toHaveBeenCalledWith('PUNTI CHIAVE', 20, expect.any(Number));
    // Deve scrivere §1-2
    expect(mockDoc.text).toHaveBeenCalledWith('§1-2', 20, expect.any(Number));
  });
});

// ---------------------------------------------------------------------------
// renderQA()
// ---------------------------------------------------------------------------
describe('PDFBuilder.renderQA()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.splitTextToSize.mockImplementation((text) => [text]);
  });

  it('non fa nulla con null', () => {
    const pdf = new PDFBuilder();
    pdf.renderQA(null);
    expect(mockDoc.text).not.toHaveBeenCalled();
  });

  it('non fa nulla con array vuoto', () => {
    const pdf = new PDFBuilder();
    pdf.renderQA([]);
    expect(mockDoc.text).not.toHaveBeenCalled();
  });

  it('renderizza domande e risposte numerate', () => {
    const pdf = new PDFBuilder();
    pdf.renderQA([{ question: 'Cosa?', answer: 'Questo.' }]);

    // Verifica che titolo sezione sia scritto
    expect(mockDoc.text).toHaveBeenCalledWith('DOMANDE E RISPOSTE', 20, expect.any(Number));
  });
});

// ---------------------------------------------------------------------------
// renderFooter()
// ---------------------------------------------------------------------------
describe('PDFBuilder.renderFooter()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('scrive footer su ogni pagina', () => {
    mockDoc.internal.getNumberOfPages.mockReturnValue(3);
    const pdf = new PDFBuilder();
    pdf.renderFooter();

    expect(mockDoc.setPage).toHaveBeenCalledTimes(3);
    expect(mockDoc.setPage).toHaveBeenCalledWith(1);
    expect(mockDoc.setPage).toHaveBeenCalledWith(2);
    expect(mockDoc.setPage).toHaveBeenCalledWith(3);
  });
});

// ---------------------------------------------------------------------------
// save()
// ---------------------------------------------------------------------------
describe('PDFBuilder.save()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.internal.getNumberOfPages.mockReturnValue(1);
  });

  it('chiama renderFooter e doc.save con filename', () => {
    const pdf = new PDFBuilder();
    pdf.save('test.pdf');

    expect(mockDoc.save).toHaveBeenCalledWith('test.pdf');
    // renderFooter chiama setPage
    expect(mockDoc.setPage).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// sanitizeFilename()
// ---------------------------------------------------------------------------
describe('PDFBuilder.sanitizeFilename()', () => {
  it('converte caratteri speciali in underscore e lowercase', () => {
    expect(PDFBuilder.sanitizeFilename('Hello World!')).toBe('hello_world_');
  });

  it('tronca a 50 caratteri', () => {
    const longTitle = 'A'.repeat(100);
    const result = PDFBuilder.sanitizeFilename(longTitle);
    expect(result.length).toBeLessThanOrEqual(50);
  });

  it('preserva lettere e numeri', () => {
    expect(PDFBuilder.sanitizeFilename('Test123')).toBe('test123');
  });

  it('gestisce stringa vuota', () => {
    expect(PDFBuilder.sanitizeFilename('')).toBe('');
  });
});
