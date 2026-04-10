import { describe, it, expect } from 'vitest';
import { parseQAFromText } from '@utils/core/multi-analysis-generators.js';

// Risposta di default attesa quando non ci sono coppie Q/R valide
const DEFAULT_QA = [
  {
    question: 'Quali sono i temi principali trattati negli articoli?',
    answer:
      "Gli articoli trattano diversi temi interconnessi che richiedono un'analisi approfondita.",
  },
];

// ---------------------------------------------------------------------------
// Formato standard: Q1: / R1:
// ---------------------------------------------------------------------------

describe('parseQAFromText() — formato standard Q/R con due punti', () => {
  it('test_parseQAFromText_withSinglePairColonFormat_returnsOnePair', () => {
    // Arrange
    const text = 'Q1: Qual è il tema principale?\nR1: Il tema è la sostenibilità.';

    // Act
    const result = parseQAFromText(text);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].question).toBe('Qual è il tema principale?');
    expect(result[0].answer).toBe('Il tema è la sostenibilità.');
  });

  it('test_parseQAFromText_withMultiplePairsColonFormat_returnsAllPairs', () => {
    // Arrange
    const text = [
      'Q1: Prima domanda?',
      'R1: Prima risposta.',
      'Q2: Seconda domanda?',
      'R2: Seconda risposta.',
    ].join('\n');

    // Act
    const result = parseQAFromText(text);

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].question).toBe('Prima domanda?');
    expect(result[0].answer).toBe('Prima risposta.');
    expect(result[1].question).toBe('Seconda domanda?');
    expect(result[1].answer).toBe('Seconda risposta.');
  });
});

// ---------------------------------------------------------------------------
// Formato alternativo: Q1. / R1.
// ---------------------------------------------------------------------------

describe('parseQAFromText() — formato con punto Q1./R1.', () => {
  it('test_parseQAFromText_withDotFormatSinglePair_returnsOnePair', () => {
    // Arrange
    const text = 'Q1. Cosa afferma l\'articolo?\nR1. Afferma che il cambiamento è necessario.';

    // Act
    const result = parseQAFromText(text);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].question).toBe("Cosa afferma l'articolo?");
    expect(result[0].answer).toBe('Afferma che il cambiamento è necessario.');
  });

  it('test_parseQAFromText_withDotFormatMultiplePairs_returnsAllPairs', () => {
    // Arrange
    const text = [
      'Q1. Domanda uno?',
      'R1. Risposta uno.',
      'Q2. Domanda due?',
      'R2. Risposta due.',
      'Q3. Domanda tre?',
      'R3. Risposta tre.',
    ].join('\n');

    // Act
    const result = parseQAFromText(text);

    // Assert
    expect(result).toHaveLength(3);
    expect(result[2].question).toBe('Domanda tre?');
    expect(result[2].answer).toBe('Risposta tre.');
  });
});

// ---------------------------------------------------------------------------
// Risposte multi-riga
// ---------------------------------------------------------------------------

describe('parseQAFromText() — risposte su più righe', () => {
  it('test_parseQAFromText_withMultilineAnswer_concatenatesLines', () => {
    // Arrange
    const text = [
      'Q1: Qual è l\'impatto?',
      'R1: L\'impatto è significativo.',
      'Ha conseguenze su più settori.',
      'Inclusi quello economico e sociale.',
    ].join('\n');

    // Act
    const result = parseQAFromText(text);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].answer).toContain("L'impatto è significativo.");
    expect(result[0].answer).toContain('Ha conseguenze su più settori.');
    expect(result[0].answer).toContain('Inclusi quello economico e sociale.');
  });

  it('test_parseQAFromText_withMultilineAnswerAndNextQuestion_separatesCorrectly', () => {
    // Arrange
    const text = [
      'Q1: Prima domanda?',
      'R1: Prima riga risposta.',
      'Seconda riga risposta.',
      'Q2: Seconda domanda?',
      'R2: Risposta breve.',
    ].join('\n');

    // Act
    const result = parseQAFromText(text);

    // Assert
    expect(result).toHaveLength(2);
    // La prima risposta deve contenere entrambe le righe
    expect(result[0].answer).toContain('Prima riga risposta.');
    expect(result[0].answer).toContain('Seconda riga risposta.');
    // La seconda risposta non deve essere contaminata dalla prima
    expect(result[1].answer).toBe('Risposta breve.');
  });

  it('test_parseQAFromText_withBlankLinesInAnswer_ignoresBlanks', () => {
    // Righe vuote non vengono concatenate (la guard `line.trim()` le esclude)
    const text = [
      'Q1: Domanda?',
      'R1: Prima riga.',
      '',
      'Seconda riga.',
    ].join('\n');

    const result = parseQAFromText(text);

    expect(result).toHaveLength(1);
    // La riga vuota non aggiunge contenuto
    expect(result[0].answer).toContain('Prima riga.');
  });
});

// ---------------------------------------------------------------------------
// Testo vuoto → default
// ---------------------------------------------------------------------------

describe('parseQAFromText() — testo vuoto', () => {
  it('test_parseQAFromText_withEmptyString_returnsDefaultQA', () => {
    const result = parseQAFromText('');
    expect(result).toEqual(DEFAULT_QA);
  });

  it('test_parseQAFromText_withWhitespaceOnly_returnsDefaultQA', () => {
    const result = parseQAFromText('   \n\n\t  ');
    expect(result).toEqual(DEFAULT_QA);
  });
});

// ---------------------------------------------------------------------------
// Testo senza pattern Q/R → default
// ---------------------------------------------------------------------------

describe('parseQAFromText() — testo senza pattern Q/R', () => {
  it('test_parseQAFromText_withPlainText_returnsDefaultQA', () => {
    const text = 'Questo è un testo normale senza domande e risposte.';
    const result = parseQAFromText(text);
    expect(result).toEqual(DEFAULT_QA);
  });

  it('test_parseQAFromText_withJsonLikeText_returnsDefaultQA', () => {
    // Testo strutturato ma senza il pattern Q/R
    const text = '{ "domanda": "testo", "risposta": "altro testo" }';
    const result = parseQAFromText(text);
    expect(result).toEqual(DEFAULT_QA);
  });

  it('test_parseQAFromText_withQuestionButNoAnswer_returnsDefaultQA', () => {
    // C'è un Q ma nessuna R corrispondente: la coppia non viene salvata
    const text = 'Q1: Domanda senza risposta?';
    const result = parseQAFromText(text);
    expect(result).toEqual(DEFAULT_QA);
  });

  it('test_parseQAFromText_withAnswerButNoQuestion_returnsDefaultQA', () => {
    // C'è un R ma nessuna Q: currentQ è null → la coppia non viene accumulata
    const text = 'R1: Risposta senza domanda.';
    const result = parseQAFromText(text);
    expect(result).toEqual(DEFAULT_QA);
  });
});

// ---------------------------------------------------------------------------
// Struttura delle coppie restituite
// ---------------------------------------------------------------------------

describe('parseQAFromText() — struttura output', () => {
  it('test_parseQAFromText_withValidPair_returnsObjectWithQuestionAndAnswer', () => {
    const text = 'Q1: Test?\nR1: Risposta test.';
    const result = parseQAFromText(text);

    expect(result[0]).toHaveProperty('question');
    expect(result[0]).toHaveProperty('answer');
  });

  it('test_parseQAFromText_returnedPairsAreNotEmpty', () => {
    const text = 'Q1: Domanda valida?\nR1: Risposta valida.';
    const result = parseQAFromText(text);

    expect(result[0].question.length).toBeGreaterThan(0);
    expect(result[0].answer.length).toBeGreaterThan(0);
  });

  it('test_parseQAFromText_defaultQA_hasExactlyOneItem', () => {
    const result = parseQAFromText('');
    expect(result).toHaveLength(1);
  });
});
