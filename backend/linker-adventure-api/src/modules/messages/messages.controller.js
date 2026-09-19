import * as service from './messages.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/respond.js';

export const send = asyncHandler(async (req, res) =>
  created(res, service.send(req.user, req.params.connectionId, req.body)));

export const history = asyncHandler(async (req, res) => {
  const { items, meta } = service.history(req.user, req.params.connectionId, req.query);
  return paginated(res, items, meta);
});

export const markRead = asyncHandler(async (req, res) =>
  ok(res, service.markRead(req.user, req.params.connectionId)));

export const unreadCount = asyncHandler(async (req, res) =>
  ok(res, service.unreadCount(req.user)));
