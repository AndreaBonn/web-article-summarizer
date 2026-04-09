import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger } from '../src/utils/core/logger.js';

describe('Logger', () => {
  beforeEach(() => {
    Logger.level = 'debug';
    vi.restoreAllMocks();
  });

  it('logs debug messages when level is debug', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    Logger.debug('test message');
    expect(spy).toHaveBeenCalledWith('test message');
  });

  it('logs info messages when level is debug', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    Logger.info('info message');
    expect(spy).toHaveBeenCalledWith('info message');
  });

  it('logs warn messages', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    Logger.warn('warning');
    expect(spy).toHaveBeenCalledWith('warning');
  });

  it('logs error messages', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    Logger.error('error');
    expect(spy).toHaveBeenCalledWith('error');
  });

  it('suppresses debug when level is info', () => {
    Logger.level = 'info';
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    Logger.debug('should not appear');
    expect(spy).not.toHaveBeenCalled();
  });

  it('suppresses debug and info when level is warn', () => {
    Logger.level = 'warn';
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    Logger.debug('no');
    Logger.info('no');
    Logger.warn('yes');
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('yes');
  });

  it('suppresses everything when level is silent', () => {
    Logger.level = 'silent';
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    Logger.debug('no');
    Logger.info('no');
    Logger.warn('no');
    Logger.error('no');
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('passes multiple arguments through', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    Logger.info('msg', { data: 1 }, [2, 3]);
    expect(spy).toHaveBeenCalledWith('msg', { data: 1 }, [2, 3]);
  });
});
