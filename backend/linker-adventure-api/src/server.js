import { createApp } from './app.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { runMigrations } from './db/migrate.js';
import { closeDb } from './db/index.js';
import * as userRepo from './repositories/user.repo.js';

await runMigrations();

const purged = await userRepo.purgeExpiredRefreshTokens();
if (purged > 0) logger.info(`Purged ${purged} expired refresh tokens`);

const server = createApp().listen(config.port, () => {
  logger.info(`Linker Adventure API listening on http://localhost:${config.port}${config.apiPrefix}`, {
    environment: config.env,
  });
});

function shutdown(signal) {
  logger.info(`${signal} received — shutting down`);
  server.close(async () => {
    await closeDb();
    process.exit(0);
  });
  // Don't hang forever on a stuck connection.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception — exiting', { message: error.message, stack: error.stack });
  process.exit(1);
});
