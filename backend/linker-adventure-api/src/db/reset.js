import { connectDb, closeDb } from './index.js';
import * as models from './models.js';
import { logger } from '../config/logger.js';

async function reset() {
  await connectDb();
  const modelList = Object.values(models);
  await Promise.all(modelList.map((model) => model.deleteMany({})));
  logger.warn(`Cleared ${modelList.length} collections`);
}

reset()
  .then(closeDb)
  .catch((error) => {
    logger.error(`Reset failed: ${error.message}`);
    process.exit(1);
  });
