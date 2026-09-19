import { forbidden, unauthorized } from '../utils/AppError.js';

/** Role gate: authorize('company'), authorize('agent', 'admin'), ... */
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (roles.length && !roles.includes(req.user.role)) {
      return next(forbidden(`This endpoint is restricted to: ${roles.join(', ')}`));
    }
    return next();
  };
}
