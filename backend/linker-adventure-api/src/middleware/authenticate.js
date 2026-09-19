import { verifyAccessToken } from '../utils/tokens.js';
import { unauthorized, forbidden } from '../utils/AppError.js';
import * as userRepo from '../repositories/user.repo.js';

function readBearer(req) {
  const header = req.get('authorization') ?? '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

async function authenticateImpl(req, _res, next) {
  const token = readBearer(req);
  if (!token) return next(unauthorized('Missing bearer token'));

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    const message = error.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token';
    return next(unauthorized(message));
  }

  const user = await userRepo.findById(payload.sub);
  if (!user) return next(unauthorized('Account no longer exists'));
  if (user.status !== 'active') return next(forbidden('Account is not active'));

  req.user = user;
  return next();
}

async function optionalAuthImpl(req, _res, next) {
  const token = readBearer(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await userRepo.findById(payload.sub);
    if (user && user.status === 'active') req.user = user;
  } catch {
    // An invalid token on a public route is simply ignored.
  }
  return next();
}

/** Rejects the request unless a valid access token is present. */
export const authenticate = (req, res, next) => { authenticateImpl(req, res, next).catch(next); };

/** Attaches req.user when a token is present, but never blocks the request. */
export const optionalAuth = (req, res, next) => { optionalAuthImpl(req, res, next).catch(next); };
