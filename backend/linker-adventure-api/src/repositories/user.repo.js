import { User, RefreshToken } from '../db/models.js';
import { isValidId } from '../db/index.js';

/**
 * Field names here intentionally match the old SQL row shape (snake_case for
 * created_at/password_hash) — auth.service.js and middleware/authenticate.js
 * read those names directly, and keeping them avoids touching those files.
 */
const toUserRow = (doc) => doc && ({
  id: doc._id.toString(),
  email: doc.email,
  password_hash: doc.passwordHash,
  role: doc.role,
  status: doc.status,
  email_verified: doc.emailVerified,
  last_login_at: doc.lastLoginAt ? doc.lastLoginAt.toISOString() : null,
  created_at: doc.createdAt.toISOString(),
  updated_at: doc.updatedAt.toISOString(),
});

export async function findById(id) {
  if (!isValidId(id)) return null;
  return toUserRow(await User.findById(id));
}

export async function findByEmail(email) {
  return toUserRow(await User.findOne({ email: email.toLowerCase() }));
}

export async function emailExists(email) {
  return (await User.exists({ email: email.toLowerCase() })) !== null;
}

export async function create({ email, passwordHash, role }) {
  const doc = await User.create({ email, passwordHash, role });
  return toUserRow(doc);
}

/** Compensating rollback for a registration whose profile step failed. */
export async function remove(id) {
  await User.deleteOne({ _id: id });
}

export async function touchLogin(id) {
  await User.updateOne({ _id: id }, { lastLoginAt: new Date() });
}

export async function updatePassword(id, passwordHash) {
  await User.updateOne({ _id: id }, { passwordHash });
}

export async function findPasswordHash(id) {
  const doc = await User.findById(id).select('passwordHash');
  return doc?.passwordHash ?? null;
}

/* ----------------------------- refresh tokens ---------------------------- */

export async function storeRefreshToken({ userId, tokenHash, expiresAt, userAgent }) {
  const doc = await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt: new Date(expiresAt),
    userAgent: userAgent ?? null,
  });
  return doc._id.toString();
}

export async function findRefreshToken(tokenHash) {
  const doc = await RefreshToken.findOne({ tokenHash });
  return doc && {
    id: doc._id.toString(),
    user_id: doc.userId.toString(),
    token_hash: doc.tokenHash,
    user_agent: doc.userAgent,
    expires_at: doc.expiresAt.toISOString(),
    revoked_at: doc.revokedAt ? doc.revokedAt.toISOString() : null,
    created_at: doc.createdAt.toISOString(),
  };
}

export async function revokeRefreshToken(tokenHash) {
  await RefreshToken.updateOne({ tokenHash, revokedAt: null }, { revokedAt: new Date() });
}

export async function revokeAllRefreshTokens(userId) {
  await RefreshToken.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
}

export async function purgeExpiredRefreshTokens() {
  const result = await RefreshToken.deleteMany({ expiresAt: { $lt: new Date() } });
  return result.deletedCount;
}
