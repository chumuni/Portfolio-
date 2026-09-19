import multer from 'multer';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';

/** Translates any thrown value into the single API error envelope. */
// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity
export function errorHandler(error, req, res, _next) {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong on our side';
  let details;

  if (error instanceof AppError) {
    ({ statusCode: status, code, message, details } = error);
  } else if (error instanceof multer.MulterError) {
    status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    code = error.code;
    message = error.code === 'LIMIT_FILE_SIZE' ? 'File is larger than the allowed limit' : error.message;
  } else if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE' || /UNIQUE constraint failed/.test(error?.message ?? '')) {
    status = 409;
    code = 'CONFLICT';
    message = 'That record already exists';
  } else if (error?.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'Request body is not valid JSON';
  }

  if (status >= 500) {
    logger.error(error.message, { stack: error.stack, path: req.originalUrl, method: req.method });
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(config.isProduction || status < 500 ? {} : { stack: error.stack }),
    },
  });
}
