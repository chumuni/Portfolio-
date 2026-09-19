import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

let connectPromise = null;

/** Single shared connection, memoised so repeated calls are free. */
export function connectDb() {
  if (connectPromise) return connectPromise;

  mongoose.set('strictQuery', true);
  connectPromise = mongoose
    .connect(config.db.uri, config.db.name ? { dbName: config.db.name } : undefined)
    .then((conn) => {
      logger.info('MongoDB connection opened', {
        host: conn.connection.host,
        db: conn.connection.name,
      });
      return conn.connection;
    })
    .catch((error) => {
      connectPromise = null;
      throw error;
    });

  return connectPromise;
}

export async function closeDb() {
  if (!connectPromise) return;
  await mongoose.disconnect();
  connectPromise = null;
}

export const nowIso = () => new Date().toISOString();

/** True when the value can be used as a MongoDB ObjectId (route params are pre-validated by zod; this guards internal lookups, e.g. an id decoded from a JWT). */
export const isValidId = (id) => mongoose.isValidObjectId(id);
