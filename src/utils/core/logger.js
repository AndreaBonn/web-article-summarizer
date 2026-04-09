// Logger — structured logging with level control
// In production builds, set Logger.level = 'warn' to suppress debug/info output.

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };

export const Logger = {
  level: 'debug',

  _shouldLog(level) {
    return LEVELS[level] >= LEVELS[this.level];
  },

  debug(...args) {
    if (this._shouldLog('debug')) console.log(...args);
  },

  info(...args) {
    if (this._shouldLog('info')) console.log(...args);
  },

  warn(...args) {
    if (this._shouldLog('warn')) console.warn(...args);
  },

  error(...args) {
    if (this._shouldLog('error')) console.error(...args);
  },
};
