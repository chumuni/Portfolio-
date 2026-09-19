import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user.id), role: user.role, email: user.email },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessTtl, issuer: config.jwt.issuer },
  );
}

export function signRefreshToken(user) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ sub: String(user.id), jti }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshTtl,
    issuer: config.jwt.issuer,
  });
  return { token, jti };
}

export const verifyAccessToken = (token) =>
  jwt.verify(token, config.jwt.accessSecret, { issuer: config.jwt.issuer });

export const verifyRefreshToken = (token) =>
  jwt.verify(token, config.jwt.refreshSecret, { issuer: config.jwt.issuer });

/** Refresh tokens are stored hashed, so a database leak cannot mint sessions. */
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
