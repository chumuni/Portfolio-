import { nowIso } from '../../db/index.js';
import * as userRepo from '../../repositories/user.repo.js';
import * as profileRepo from '../../repositories/profile.repo.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from '../../utils/tokens.js';
import { publicUploadPath } from '../../middleware/upload.js';
import { conflict, unauthorized, badRequest } from '../../utils/AppError.js';

async function issueSession(user, userAgent) {
  const accessToken = signAccessToken(user);
  const { token: refreshToken } = signRefreshToken(user);
  const decoded = verifyRefreshToken(refreshToken);

  await userRepo.storeRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(decoded.exp * 1000).toISOString(),
    userAgent,
  });

  return { accessToken, refreshToken, tokenType: 'Bearer' };
}

function publicUser(user) {
  return { id: user.id, email: user.email, role: user.role, status: user.status, createdAt: user.created_at };
}

/**
 * Registration in two steps: create the user, then the profile. If the
 * profile step fails, the just-created user is deleted so no account is
 * ever left without a profile.
 */
async function register({ role, credentials, profileInput, userAgent }) {
  if (await userRepo.emailExists(credentials.email)) {
    throw conflict('An account with that email already exists');
  }
  const passwordHash = await hashPassword(credentials.password);
  const user = await userRepo.create({ email: credentials.email, passwordHash, role });

  try {
    const profile = role === 'company'
      ? await profileRepo.createCompanyProfile(user.id, profileInput)
      : await profileRepo.createAgentProfile(user.id, profileInput);
    return { user: publicUser(user), profile, tokens: await issueSession(user, userAgent) };
  } catch (error) {
    await userRepo.remove(user.id);
    throw error;
  }
}

export function registerCompany(input, userAgent, file) {
  const { email, password, ...profileInput } = input;
  if (file) profileInput.licenceUrl = publicUploadPath(file.filename);
  return register({ role: 'company', credentials: { email, password }, profileInput, userAgent });
}

export function registerAgent(input, userAgent, file) {
  const { email, password, ...profileInput } = input;
  if (file) profileInput.cvUrl = publicUploadPath(file.filename);
  return register({ role: 'agent', credentials: { email, password }, profileInput, userAgent });
}

export async function login({ email, password }, userAgent) {
  const user = await userRepo.findByEmail(email);
  // Compare against a dummy hash when the user is missing so timing stays flat.
  const hash = user?.password_hash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
  const matches = await verifyPassword(password, hash);

  if (!user || !matches) throw unauthorized('Email or password is incorrect');
  if (user.status !== 'active') throw unauthorized('This account is not active');

  await userRepo.touchLogin(user.id);
  return { user: publicUser(user), tokens: await issueSession(user, userAgent) };
}

export async function refresh({ refreshToken }, userAgent) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw unauthorized('Refresh token is invalid or expired');
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await userRepo.findRefreshToken(tokenHash);

  if (!stored || stored.revoked_at) throw unauthorized('Refresh token has been revoked');
  if (new Date(stored.expires_at) < new Date()) throw unauthorized('Refresh token has expired');

  const user = await userRepo.findById(payload.sub);
  if (!user || user.status !== 'active') throw unauthorized('Account is unavailable');

  // Rotation: the presented token dies as the new pair is issued.
  await userRepo.revokeRefreshToken(tokenHash);
  return { user: publicUser(user), tokens: await issueSession(user, userAgent) };
}

export async function logout({ refreshToken }) {
  if (refreshToken) await userRepo.revokeRefreshToken(hashToken(refreshToken));
  return { loggedOutAt: nowIso() };
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const hash = await userRepo.findPasswordHash(userId);
  if (!hash) throw unauthorized();
  if (!(await verifyPassword(currentPassword, hash))) throw badRequest('Current password is incorrect');

  await userRepo.updatePassword(userId, await hashPassword(newPassword));
  await userRepo.revokeAllRefreshTokens(userId); // force every other device to sign in again
  return { changedAt: nowIso() };
}

export async function currentUser(user) {
  const profile = user.role === 'company'
    ? await profileRepo.findCompanyByUserId(user.id)
    : await profileRepo.findAgentByUserId(user.id);
  return { user: publicUser(user), profile };
}
