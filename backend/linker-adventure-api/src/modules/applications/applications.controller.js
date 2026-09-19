import * as service from './applications.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/respond.js';

export const apply = asyncHandler(async (req, res) =>
  created(res, await service.apply(req.user, req.params.id, req.body)));

export const listForVacancy = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listForVacancy(req.user, req.params.id, req.query);
  return paginated(res, items, meta);
});

export const listMine = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listMine(req.user, req.query);
  return paginated(res, items, meta);
});

export const decide = asyncHandler(async (req, res) =>
  ok(res, await service.decide(req.user, req.params.id, req.body)));

export const withdraw = asyncHandler(async (req, res) =>
  ok(res, await service.withdraw(req.user, req.params.id)));
