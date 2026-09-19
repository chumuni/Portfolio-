import * as service from './reviews.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { created, paginated } from '../../utils/respond.js';

export const create = asyncHandler(async (req, res) => created(res, service.create(req.user, req.body)));

export const listForSubject = asyncHandler(async (req, res) => {
  const { items, meta } = service.listForSubject(req.params, req.query);
  return paginated(res, items, meta);
});
