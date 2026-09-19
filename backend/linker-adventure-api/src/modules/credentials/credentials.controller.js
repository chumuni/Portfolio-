import * as service from './credentials.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/respond.js';

export const listMine = asyncHandler(async (req, res) => ok(res, await service.listMine(req.user)));

export const create = asyncHandler(async (req, res) =>
  created(res, await service.create(req.user, req.body, req.file)));

export const remove = asyncHandler(async (req, res) => ok(res, await service.remove(req.user, req.params.id)));
