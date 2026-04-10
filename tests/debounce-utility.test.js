import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DebounceUtility } from '@utils/core/debounce-utility.js';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// debounce()
// ---------------------------------------------------------------------------
describe('DebounceUtility.debounce()', () => {
  it('test_debounce_chiamataSingola_esegueDopoDelay', () => {
    const fn = vi.fn();
    const debounced = DebounceUtility.debounce(fn, 300);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('test_debounce_chiamateMultiple_esegueSoloLUltima', () => {
    const fn = vi.fn();
    const debounced = DebounceUtility.debounce(fn, 300);

    debounced('prima');
    debounced('seconda');
    debounced('terza');

    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('terza');
  });

  it('test_debounce_nuovaChiamataResetTimer_posticipanEsecuzione', () => {
    const fn = vi.fn();
    const debounced = DebounceUtility.debounce(fn, 300);

    debounced();
    vi.advanceTimersByTime(200); // Non ancora scaduto
    debounced();                  // Reset del timer
    vi.advanceTimersByTime(200); // Solo 200ms dal reset → non deve eseguire
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100); // Ora 300ms dal reset → esegue
    expect(fn).toHaveBeenCalledOnce();
  });

  it('test_debounce_waitDefault_usaTreecento', () => {
    const fn = vi.fn();
    const debounced = DebounceUtility.debounce(fn); // nessun wait esplicito

    debounced();
    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('test_debounce_argomentiPassati_arrivanoAllaFunzione', () => {
    const fn = vi.fn();
    const debounced = DebounceUtility.debounce(fn, 100);

    debounced('hello', 42, { key: 'value' });
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('hello', 42, { key: 'value' });
  });
});

// ---------------------------------------------------------------------------
// debounceWithFeedback()
// ---------------------------------------------------------------------------
describe('DebounceUtility.debounceWithFeedback()', () => {
  it('test_debounceWithFeedback_senzaFeedbackEl_esegueNormalmente', () => {
    const fn = vi.fn();
    const debounced = DebounceUtility.debounceWithFeedback(fn, 200, null);

    debounced();
    vi.advanceTimersByTime(200);

    expect(fn).toHaveBeenCalledOnce();
  });

  it('test_debounceWithFeedback_conFeedbackEl_aggiungeSearingClasseSubito', () => {
    const fn = vi.fn();
    const feedbackEl = { classList: { add: vi.fn(), remove: vi.fn() } };
    const debounced = DebounceUtility.debounceWithFeedback(fn, 200, feedbackEl);

    debounced();

    expect(feedbackEl.classList.add).toHaveBeenCalledWith('searching');
    expect(feedbackEl.classList.remove).not.toHaveBeenCalled();
  });

  it('test_debounceWithFeedback_dopoEsecuzione_rimuoveClasseSearching', () => {
    const fn = vi.fn();
    const feedbackEl = { classList: { add: vi.fn(), remove: vi.fn() } };
    const debounced = DebounceUtility.debounceWithFeedback(fn, 200, feedbackEl);

    debounced();
    vi.advanceTimersByTime(200);

    expect(feedbackEl.classList.remove).toHaveBeenCalledWith('searching');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('test_debounceWithFeedback_chiamateMultiple_soloUltimaEsegue', () => {
    const fn = vi.fn();
    const debounced = DebounceUtility.debounceWithFeedback(fn, 300, null);

    debounced('a');
    debounced('b');
    debounced('c');
    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('c');
  });
});

// ---------------------------------------------------------------------------
// throttle()
// ---------------------------------------------------------------------------
describe('DebounceUtility.throttle()', () => {
  it('test_throttle_primaChiamata_esegueImmediatamente', () => {
    const fn = vi.fn();
    const throttled = DebounceUtility.throttle(fn, 300);

    throttled();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('test_throttle_secondaChiamataEntroIlLimite_ignorata', () => {
    const fn = vi.fn();
    const throttled = DebounceUtility.throttle(fn, 300);

    throttled();
    throttled(); // Entro i 300ms → ignorata
    expect(fn).toHaveBeenCalledOnce();
  });

  it('test_throttle_chiamataDopoScadenzaLimite_esegue', () => {
    const fn = vi.fn();
    const throttled = DebounceUtility.throttle(fn, 300);

    throttled();
    vi.advanceTimersByTime(300);
    throttled(); // Dopo il limite → esegue

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// createDebouncer()
// ---------------------------------------------------------------------------
describe('DebounceUtility.createDebouncer()', () => {
  it('test_createDebouncer_debounce_esegueFunzioneDopoWait', () => {
    const fn = vi.fn();
    const debouncer = DebounceUtility.createDebouncer();

    debouncer.debounce('myKey', fn, 200);
    vi.advanceTimersByTime(200);

    expect(fn).toHaveBeenCalledOnce();
  });

  it('test_createDebouncer_cancel_impedisceEsecuzione', () => {
    const fn = vi.fn();
    const debouncer = DebounceUtility.createDebouncer();

    debouncer.debounce('myKey', fn, 200);
    debouncer.cancel('myKey');
    vi.advanceTimersByTime(200);

    expect(fn).not.toHaveBeenCalled();
  });

  it('test_createDebouncer_isPending_veroDopoDebounce', () => {
    const fn = vi.fn();
    const debouncer = DebounceUtility.createDebouncer();

    debouncer.debounce('myKey', fn, 200);
    expect(debouncer.isPending('myKey')).toBe(true);
  });

  it('test_createDebouncer_isPending_falsoDopoEsecuzione', () => {
    const fn = vi.fn();
    const debouncer = DebounceUtility.createDebouncer();

    debouncer.debounce('myKey', fn, 200);
    vi.advanceTimersByTime(200);

    expect(debouncer.isPending('myKey')).toBe(false);
  });

  it('test_createDebouncer_cancelAll_cancellaTuttiIPendenti', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const debouncer = DebounceUtility.createDebouncer();

    debouncer.debounce('key1', fn1, 200);
    debouncer.debounce('key2', fn2, 200);
    debouncer.cancelAll();
    vi.advanceTimersByTime(200);

    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).not.toHaveBeenCalled();
  });
});
