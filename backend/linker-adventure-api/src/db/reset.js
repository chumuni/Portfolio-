import fs from 'node:fs';
import { config } from '../config/env.js';
import { closeDb } from './index.js';
import { runMigrations } from './migrate.js';
import { logger } from '../config/logger.js';

closeDb();
for (const suffix of ['', '-wal', '-shm']) {
  const file = `${config.db.file}${suffix}`;
  if (fs.existsSync(file)) fs.rmSync(file);
}
logger.warn('Database dropped', { file: config.db.file });
runMigrations();
closeDb();
