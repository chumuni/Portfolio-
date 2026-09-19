import { verifyAccessToken } from '../utils/tokens.js';
import { unauthorized, forbidden } from '../utils/AppError.js';
import * as userRepo from '../repositories/user.repo.js';

function readBearer(req) {
  const header = req.get('authorization') ?? '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

/** Rejects the request unless a valid access token is present. */
export function authenticate(req, _res, next) {
  const token = readBearer(req);
  if (!token) return next(unauthorized('Missing bearer token'));

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    const message = error.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token';
    return next(unauthorized(message));
  }

  const user = userRepo.findById(Number(payload.sub));
  if (!user) return next(unauthorized('Account no longer exists'));
  if (user.status !== 'active') return next(forbidden('Account is not active'));

  req.user = user;
  return next();
}

/** Attaches req.user when a token is present, but never blocks the request. */
export function optionalAuth(req, _res, next) {
  const token = readBearer(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = userRepo.findById(Number(payload.sub));
    if (user && user.status === 'active') req.user = user;
  } catch {
    // An invalid token on a public route is simply ignored.
  }
  return next();
}
