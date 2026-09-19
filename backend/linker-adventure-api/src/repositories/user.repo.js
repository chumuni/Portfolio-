import { query, nowIso } from '../db/index.js';

const SAFE_COLUMNS = 'id, email, role, status, email_verified, last_login_at, created_at, updated_at';

export const findById = (id) => query.get(`SELECT ${SAFE_COLUMNS} FROM users WHERE id = ?`, [id]);

export const findByEmail = (email) => query.get('SELECT * FROM users WHERE email = ?', [email]);

export const emailExists = (email) => query.count('SELECT COUNT(*) FROM users WHERE email = ?', [email]) > 0;

export function create({ email, passwordHash, role }) {
  const id = query.insert(
    'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
    [email, passwordHash, role],
  );
  return findById(id);
}

export function touchLogin(id) {
  query.run('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?', [nowIso(), nowIso(), id]);
}

export function updatePassword(id, passwordHash) {
  query.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [passwordHash, nowIso(), id]);
}

export function findPasswordHash(id) {
  return query.get('SELECT password_hash FROM users WHERE id = ?', [id])?.password_hash ?? null;
}

/* ----------------------------- refresh tokens ---------------------------- */

export function storeRefreshToken({ userId, tokenHash, expiresAt, userAgent }) {
  return query.insert(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent) VALUES (?, ?, ?, ?)',
    [userId, tokenHash, expiresAt, userAgent ?? null],
  );
}

export const findRefreshToken = (tokenHash) =>
  query.get('SELECT * FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);

export function revokeRefreshToken(tokenHash) {
  query.run('UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL', [nowIso(), tokenHash]);
}

export function revokeAllRefreshTokens(userId) {
  query.run('UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL', [nowIso(), userId]);
}

export function purgeExpiredRefreshTokens() {
  return query.run('DELETE FROM refresh_tokens WHERE expires_at < ?', [nowIso()]).changes;
}
