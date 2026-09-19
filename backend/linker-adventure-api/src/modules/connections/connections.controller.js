import * as service from './connections.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/respond.js';

export const expressInterest = asyncHandler(async (req, res) => {
  const result = service.expressInterest(req.user, req.body);
  return created(res, result);
});

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = service.list(req.user, req.query);
  return paginated(res, items, meta);
});

export const getOne = asyncHandler(async (req, res) =>
  ok(res, service.getOwnedConnection(req.user, req.params.id)));

export const withdraw = asyncHandler(async (req, res) =>
  ok(res, service.withdrawInterest(req.user, req.params.id)));

export const decline = asyncHandler(async (req, res) =>
  ok(res, service.decline(req.user, req.params.id)));

export const archive = asyncHandler(async (req, res) =>
  ok(res, service.archive(req.user, req.params.id)));
