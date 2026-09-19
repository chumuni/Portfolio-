import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';

export const hashPassword = (plain) => bcrypt.hash(plain, config.security.bcryptRounds);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

/**
 * Synchronous variant, used only inside SQLite transactions — node:sqlite is
 * synchronous, so an awaited hash mid-transaction would hold the write lock
 * across the event loop.
 */
export const hashPasswordSync = (plain) => bcrypt.hashSync(plain, config.security.bcryptRounds);
