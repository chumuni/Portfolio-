import * as service from './profiles.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/respond.js';

export const getMyProfile = asyncHandler(async (req, res) =>
  ok(res, await service.requireOwnProfile(req.user)));

export const updateMyProfile = asyncHandler(async (req, res) =>
  ok(res, await service.updateOwnProfile(req.user, req.body)));

export const uploadMedia = asyncHandler(async (req, res) =>
  ok(res, await service.attachUpload(req.user, req.params.slot, req.file)));

export const getCompanyBySlug = asyncHandler(async (req, res) =>
  ok(res, await service.getPublicCompany(req.params.slug, req.user ?? null)));

export const getAgentBySlug = asyncHandler(async (req, res) =>
  ok(res, await service.getPublicAgent(req.params.slug, req.user ?? null)));
