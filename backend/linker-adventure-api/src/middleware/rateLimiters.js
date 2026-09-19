import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

const shared = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down' } },
};

export const apiLimiter = rateLimit({
  ...shared,
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
});

/** Tighter budget on credential endpoints to blunt password spraying. */
export const authLimiter = rateLimit({
  ...shared,
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.authRateLimitMax,
  skipSuccessfulRequests: true,
});
