import { badRequest } from '../utils/AppError.js';

/**
 * Validates and REPLACES req.body / req.query / req.params with the parsed
 * result, so controllers only ever see clean, typed, whitelisted input.
 */
export function validate(schemas) {
  return (req, _res, next) => {
    for (const source of ['body', 'query', 'params']) {
      const schema = schemas[source];
      if (!schema) continue;

      const result = schema.safeParse(req[source]);
      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          field: issue.path.join('.') || source,
          message: issue.message,
        }));
        return next(badRequest('Validation failed', details));
      }
      Object.defineProperty(req, source, { value: result.data, writable: true, configurable: true });
    }
    return next();
  };
}
