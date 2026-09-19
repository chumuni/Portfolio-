import { transaction, nowIso } from '../../db/index.js';
import * as userRepo from '../../repositories/user.repo.js';
import * as profileRepo from '../../repositories/profile.repo.js';
import { hashPassword, hashPasswordSync, verifyPassword } from '../../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from '../../utils/tokens.js';
import { publicUploadPath } from '../../middleware/upload.js';
import { conflict, unauthorized, badRequest } from '../../utils/AppError.js';

function issueSession(user, userAgent) {
  const accessToken = signAccessToken(user);
  const { token: refreshToken } = signRefreshToken(user);
  const decoded = verifyRefreshToken(refreshToken);

  userRepo.storeRefreshToken({
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

/** Registration is atomic: an account without its profile is never left behind. */
function register({ role, credentials, profileInput, userAgent }) {
  if (userRepo.emailExists(credentials.email)) {
    throw conflict('An account with that email already exists');
  }
  const passwordHash = hashPasswordSync(credentials.password);

  const { user, profile } = transaction(() => {
    const createdUser = userRepo.create({ email: credentials.email, passwordHash, role });
    const createdProfile = role === 'company'
      ? profileRepo.createCompanyProfile(createdUser.id, profileInput)
      : profileRepo.createAgentProfile(createdUser.id, profileInput);
    return { user: createdUser, profile: createdProfile };
  });

  return { user: publicUser(user), profile, tokens: issueSession(user, userAgent) };
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
  const user = userRepo.findByEmail(email);
  // Compare against a dummy hash when the user is missing so timing stays flat.
  const hash = user?.password_hash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
  const matches = await verifyPassword(password, hash);

  if (!user || !matches) throw unauthorized('Email or password is incorrect');
  if (user.status !== 'active') throw unauthorized('This account is not active');

  userRepo.touchLogin(user.id);
  return { user: publicUser(user), tokens: issueSession(user, userAgent) };
}

export function refresh({ refreshToken }, userAgent) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw unauthorized('Refresh token is invalid or expired');
  }

  const tokenHash = hashToken(refreshToken);
  const stored = userRepo.findRefreshToken(tokenHash);

  if (!stored || stored.revoked_at) throw unauthorized('Refresh token has been revoked');
  if (new Date(stored.expires_at) < new Date()) throw unauthorized('Refresh token has expired');

  const user = userRepo.findById(Number(payload.sub));
  if (!user || user.status !== 'active') throw unauthorized('Account is unavailable');

  // Rotation: the presented token dies as the new pair is issued.
  userRepo.revokeRefreshToken(tokenHash);
  return { user: publicUser(user), tokens: issueSession(user, userAgent) };
}

export function logout({ refreshToken }) {
  if (refreshToken) userRepo.revokeRefreshToken(hashToken(refreshToken));
  return { loggedOutAt: nowIso() };
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const hash = userRepo.findPasswordHash(userId);
  if (!hash) throw unauthorized();
  if (!(await verifyPassword(currentPassword, hash))) throw badRequest('Current password is incorrect');

  userRepo.updatePassword(userId, await hashPassword(newPassword));
  userRepo.revokeAllRefreshTokens(userId); // force every other device to sign in again
  return { changedAt: nowIso() };
}

export function currentUser(user) {
  const profile = user.role === 'company'
    ? profileRepo.findCompanyByUserId(user.id)
    : profileRepo.findAgentByUserId(user.id);
  return { user: publicUser(user), profile };
}
