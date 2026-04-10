// Logger — structured logging with level control
// Production builds auto-set level to 'warn' via Vite's import.meta.env.MODE.

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };

const isProduction = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'production';

export const Logger = {
  level: isProduction ? 'warn' : 'debug',

  _shouldLog(level) {
    return LEVELS[level] >= LEVELS[this.level];
  },

  debug(...args) {
    if (this._shouldLog('debug')) console.debug(...args);
  },

  info(...args) {
    if (this._shouldLog('info')) console.info(...args);
  },

  warn(...args) {
    if (this._shouldLog('warn')) console.warn(...args);
  },

  error(...args) {
    if (this._shouldLog('error')) console.error(...args);
  },
};
