import * as service from './vacancies.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/respond.js';

export const create = asyncHandler(async (req, res) => created(res, service.create(req.user, req.body)));

export const search = asyncHandler(async (req, res) => {
  const { items, meta } = service.search(req.query);
  return paginated(res, items, meta);
});

export const listMine = asyncHandler(async (req, res) => {
  const { items, meta } = service.listMine(req.user, req.query);
  return paginated(res, items, meta);
});

export const getOne = asyncHandler(async (req, res) => ok(res, service.getPublic(req.params.id)));

export const update = asyncHandler(async (req, res) => ok(res, service.update(req.user, req.params.id, req.body)));

export const remove = asyncHandler(async (req, res) => ok(res, service.remove(req.user, req.params.id)));
