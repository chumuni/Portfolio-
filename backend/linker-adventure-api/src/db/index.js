import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

let instance = null;

/**
 * Single shared connection. node:sqlite is synchronous, so a connection pool
 * buys nothing — one handle per process is the correct shape.
 */
export function getDb() {
  if (instance) return instance;

  fs.mkdirSync(path.dirname(config.db.file), { recursive: true });
  instance = new DatabaseSync(config.db.file);

  instance.exec('PRAGMA journal_mode = WAL');
  instance.exec('PRAGMA foreign_keys = ON');
  instance.exec('PRAGMA busy_timeout = 5000');

  logger.info('SQLite connection opened', { file: config.db.file });
  return instance;
}

export function closeDb() {
  if (!instance) return;
  instance.close();
  instance = null;
}

/** Rows as plain objects (node:sqlite returns null-prototype objects). */
const plain = (row) => (row ? { ...row } : row);

export const query = {
  all(sql, params = []) {
    return getDb().prepare(sql).all(...params).map(plain);
  },
  get(sql, params = []) {
    return plain(getDb().prepare(sql).get(...params)) ?? null;
  },
  run(sql, params = []) {
    const result = getDb().prepare(sql).run(...params);
    return { changes: Number(result.changes), lastInsertRowid: Number(result.lastInsertRowid) };
  },
  /** Insert and return the created row id. */
  insert(sql, params = []) {
    return this.run(sql, params).lastInsertRowid;
  },
  /** Scalar helper for COUNT(*) style queries. */
  count(sql, params = []) {
    const row = this.get(sql, params);
    return row ? Number(Object.values(row)[0]) : 0;
  },
};

/** Run a unit of work atomically. Throwing inside the callback rolls back. */
export function transaction(work) {
  const db = getDb();
  db.exec('BEGIN');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

/** SQLite stores booleans as integers; keep the conversion in one place. */
export const toBool = (value) => value === 1 || value === true;
export const fromBool = (value) => (value ? 1 : 0);
export const nowIso = () => new Date().toISOString();
