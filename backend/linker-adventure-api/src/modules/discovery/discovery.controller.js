import * as service from './discovery.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { paginated } from '../../utils/respond.js';

export const findAgents = asyncHandler(async (req, res) => {
  const { items, meta } = service.findAgents(req.query, req.user ?? null);
  return paginated(res, items, meta);
});

export const findCompanies = asyncHandler(async (req, res) => {
  const { items, meta } = service.findCompanies(req.query, req.user ?? null);
  return paginated(res, items, meta);
});

export const suggestions = asyncHandler(async (req, res) => {
  const { items, meta } = service.suggestionsFor(req.user);
  return paginated(res, items, meta);
});
