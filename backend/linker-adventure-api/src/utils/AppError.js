/**
 * Operational error: something the caller did wrong, or a rule they broke.
 * Anything that is NOT an AppError is treated as a bug and logged with a stack.
 */
export class AppError extends Error {
  constructor(message, statusCode = 400, code = 'BAD_REQUEST', details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, AppError);
  }
}

export const badRequest   = (msg = 'Invalid request', details) => new AppError(msg, 400, 'BAD_REQUEST', details);
export const unauthorized = (msg = 'Authentication required')   => new AppError(msg, 401, 'UNAUTHORIZED');
export const forbidden    = (msg = 'You may not do that')       => new AppError(msg, 403, 'FORBIDDEN');
export const notFound     = (msg = 'Resource not found')        => new AppError(msg, 404, 'NOT_FOUND');
export const conflict     = (msg = 'Resource already exists')   => new AppError(msg, 409, 'CONFLICT');
export const tooLarge     = (msg = 'Payload too large')         => new AppError(msg, 413, 'PAYLOAD_TOO_LARGE');
