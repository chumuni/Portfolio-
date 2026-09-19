import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Read a required variable, failing fast at boot rather than at first request. */
function required(name, fallbackInDev) {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NODE_ENV !== 'production' && fallbackInDev !== undefined) return fallbackInDev;
  throw new Error(`Missing required environment variable: ${name}`);
}

function int(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(value) ? value : fallback;
}

function list(name, fallback = []) {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

export const config = Object.freeze({
  env: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: int('PORT', 3000),
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',
  rootDir,

  db: {
    file: path.resolve(rootDir, process.env.DATABASE_FILE ?? './storage/linker-adventure.db'),
  },

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev-only-access-secret'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev-only-refresh-secret'),
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
    issuer: 'linker-adventure',
  },

  security: {
    bcryptRounds: int('BCRYPT_ROUNDS', 12),
    corsOrigins: list('CORS_ORIGINS', ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500']),
    rateLimitWindowMs: int('RATE_LIMIT_WINDOW_MINUTES', 15) * 60 * 1000,
    rateLimitMax: int('RATE_LIMIT_MAX', 300),
    authRateLimitMax: int('AUTH_RATE_LIMIT_MAX', 20),
  },

  uploads: {
    dir: path.resolve(rootDir, process.env.UPLOAD_DIR ?? './storage/uploads'),
    maxBytes: int('MAX_UPLOAD_MB', 5) * 1024 * 1024,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ],
  },
});
