import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import routes from './routes.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // correct client IPs behind Render/Heroku style proxies
  app.disable('x-powered-by');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    origin(origin, callback) {
      // Same-origin and tooling requests arrive with no Origin header.
      if (!origin || config.security.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(morgan(config.isProduction ? 'combined' : 'dev', {
    stream: { write: (line) => logger.info(line.trim()) },
    skip: (req) => req.path === '/health',
  }));

  app.get('/health', (_req, res) => res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    environment: config.env,
    timestamp: new Date().toISOString(),
  }));

  // Uploaded media. In production put these behind a CDN or object store.
  app.use('/uploads', express.static(config.uploads.dir, { maxAge: '7d', index: false }));

  app.use(config.apiPrefix, apiLimiter, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
