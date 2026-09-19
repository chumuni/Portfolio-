import { connectDb, closeDb } from './index.js';
import * as models from './models.js';
import { logger } from '../config/logger.js';

/**
 * MongoDB is schemaless, so there is no SQL migration to run. What still
 * needs doing on every boot is making sure the indexes declared in
 * models.js actually exist on the collections — this does that.
 */
export async function runMigrations() {
  await connectDb();
  const modelList = Object.values(models);
  await Promise.all(modelList.map((model) => model.syncIndexes()));
  logger.info(`MongoDB indexes synced for ${modelList.length} collections`);
}

// Allow `npm run db:migrate` as well as import from server bootstrap.
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(closeDb)
    .catch((error) => {
      logger.error(`Migration failed: ${error.message}`);
      process.exit(1);
    });
}
