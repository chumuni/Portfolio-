import { config } from './env.js';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const activeLevel = LEVELS[process.env.LOG_LEVEL ?? (config.isProduction ? 'info' : 'debug')] ?? 2;

function emit(level, message, meta) {
  if (LEVELS[level] > activeLevel) return;
  const entry = { ts: new Date().toISOString(), level, message, ...(meta ? { meta } : {}) };
  const line = config.isProduction ? JSON.stringify(entry) : `${entry.ts} ${level.toUpperCase().padEnd(5)} ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  error: (message, meta) => emit('error', message, meta),
  warn: (message, meta) => emit('warn', message, meta),
  info: (message, meta) => emit('info', message, meta),
  debug: (message, meta) => emit('debug', message, meta),
};
