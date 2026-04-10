import { describe, it, expect } from 'vitest';
import { ResponseParser } from '@utils/ai/response-parser.js';

// ---------------------------------------------------------------------------
// parseResponse()
// ---------------------------------------------------------------------------
describe('ResponseParser.parseResponse()', () => {
  const makeResponse = (summary, keyPoints = '') =>
    `## RIASSUNTO\n${summary}\n## PUNTI CHIAVE\n${keyPoints}`;

  it('test_parseResponse_formattoCorretto_restittuisceRiassuntoEPuntiChiave', () => {
    const summary =
      'Questo è un riassunto abbastanza lungo da superare la soglia minima di cinquanta caratteri.';
    const kp = '1. **Titolo punto** (§1) Descrizione del punto chiave.';
    const result = ResponseParser.parseResponse(makeResponse(summary, kp));

    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('keyPoints');
    expect(result.summary).toContain('riassunto abbastanza lungo');
  });

  it('test_parseResponse_puntiChiaveConFormatoCorretto_restittuisceArray', () => {
    const summary = 'Riassunto sufficientemente lungo per superare il limite minimo di cinquanta.';
    const kp = '1. **Titolo uno** (§2) Descrizione del primo punto.\n2. **Titolo due** (§3-4) Descrizione del secondo punto.';
    const { keyPoints } = ResponseParser.parseResponse(makeResponse(summary, kp));

    expect(keyPoints).toHaveLength(2);
    expect(keyPoints[0]).toMatchObject({ title: 'Titolo uno', paragraphs: '2' });
    expect(keyPoints[1]).toMatchObject({ title: 'Titolo due', paragraphs: '3-4' });
  });

  it('test_parseResponse_nessunPuntoChiave_restittuisceArrayVuoto', () => {
    const summary = 'Riassunto sufficientemente lungo per superare il limite minimo di cinquanta caratteri.';
    const { keyPoints } = ResponseParser.parseResponse(makeResponse(summary));

    expect(keyPoints).toEqual([]);
  });

  it('test_parseResponse_riassuntoTroppoCorto_lanciaErrore', () => {
    const tooShort = makeResponse('Breve.');
    expect(() => ResponseParser.parseResponse(tooShort)).toThrow();
  });

  it('test_parseResponse_riassuntoVuoto_lanciaErrore', () => {
    const empty = makeResponse('');
    expect(() => ResponseParser.parseResponse(empty)).toThrow();
  });

  it('test_parseResponse_mancaSeparatorePuntiChiave_trattatoComeRiassuntoSolo', () => {
    // Senza "## PUNTI CHIAVE" il testo va tutto nel riassunto
    const testo =
      '## RIASSUNTO\nQuesto è un testo lungo che non ha il separatore punti chiave ma supera il limite.';
    const result = ResponseParser.parseResponse(testo);

    expect(result.summary).toContain('testo lungo');
    expect(result.keyPoints).toEqual([]);
  });

  it('test_parseResponse_puntoChiaveConParagrafoRange_parsaCorrettamente', () => {
    const summary = 'Riassunto abbastanza lungo per superare la soglia minima di cinquanta caratteri.';
    const kp = '1. **Analisi costi** (§5-7) Il costo totale ammonta a 3 miliardi di euro.';
    const { keyPoints } = ResponseParser.parseResponse(makeResponse(summary, kp));

    expect(keyPoints[0].paragraphs).toBe('5-7');
    expect(keyPoints[0].title).toBe('Analisi costi');
  });

  it('test_parseResponse_messaggioErroreCorretto_quandoRiassuntoNonValido', () => {
    expect(() => ResponseParser.parseResponse(makeResponse('Corto.'))).toThrow(
      'formato non valido',
    );
  });
});

// ---------------------------------------------------------------------------
// parseKeyPointsResponse()
// ---------------------------------------------------------------------------
describe('ResponseParser.parseKeyPointsResponse()', () => {
  it('test_parseKeyPointsResponse_formattoCorretto_restittuisceArrayPunti', () => {
    const text = `## PUNTI CHIAVE\n1. **Primo punto** (§1) Descrizione primo.\n2. **Secondo punto** (§2-3) Descrizione secondo.`;
    const result = ResponseParser.parseKeyPointsResponse(text);

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Primo punto');
    expect(result[1].title).toBe('Secondo punto');
  });

  it('test_parseKeyPointsResponse_testoVuoto_restittuisceArrayVuoto', () => {
    const result = ResponseParser.parseKeyPointsResponse('');
    expect(result).toEqual([]);
  });

  it('test_parseKeyPointsResponse_soloHeader_restittuisceArrayVuoto', () => {
    const result = ResponseParser.parseKeyPointsResponse('## PUNTI CHIAVE\n');
    expect(result).toEqual([]);
  });

  it('test_parseKeyPointsResponse_puntoSingolo_restittuisceArrayConUnElemento', () => {
    const text = '## PUNTI CHIAVE\n1. **Unico punto** (§4) Spiegazione dettagliata del punto.';
    const result = ResponseParser.parseKeyPointsResponse(text);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      title: 'Unico punto',
      paragraphs: '4',
    });
    expect(result[0].description).toBeTruthy();
  });

  it('test_parseKeyPointsResponse_senzaHeader_parsaIgualmente', () => {
    // Senza "## PUNTI CHIAVE" il parser rimuove solo quell'header se presente
    const text = '1. **Punto diretto** (§1) Descrizione diretta senza header sezione.';
    const result = ResponseParser.parseKeyPointsResponse(text);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Punto diretto');
  });
});
