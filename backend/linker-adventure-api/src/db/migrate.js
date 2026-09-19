import { getDb, closeDb } from './index.js';
import { migrations } from './migrations.js';
import { logger } from '../config/logger.js';

export function runMigrations() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(db.prepare('SELECT name FROM schema_migrations').all().map((row) => row.name));
  let count = 0;

  for (const migration of migrations) {
    if (applied.has(migration.name)) continue;

    db.exec('BEGIN');
    try {
      db.exec(migration.sql);
      db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(migration.name);
      db.exec('COMMIT');
      logger.info(`Migration applied: ${migration.name}`);
      count += 1;
    } catch (error) {
      db.exec('ROLLBACK');
      throw new Error(`Migration ${migration.name} failed: ${error.message}`);
    }
  }

  if (count === 0) logger.info('Database schema already up to date');
  return count;
}

// Allow `npm run db:migrate` as well as import from server bootstrap.
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
  closeDb();
}
