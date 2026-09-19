import * as service from './analytics.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, paginated } from '../../utils/respond.js';

export const dashboard = asyncHandler(async (req, res) => ok(res, service.dashboard(req.user, req.query)));

export const notifications = asyncHandler(async (req, res) => {
  const { items, meta } = service.listNotifications(req.user, req.query);
  return paginated(res, items, meta);
});

export const readNotifications = asyncHandler(async (req, res) =>
  ok(res, service.markNotificationsRead(req.user)));
