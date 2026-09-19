import * as messageRepo from '../../repositories/message.repo.js';
import * as analyticsRepo from '../../repositories/analytics.repo.js';
import * as profileRepo from '../../repositories/profile.repo.js';
import { getOwnedConnection, assertMatched } from '../connections/connections.service.js';
import { parsePagination } from '../../utils/pagination.js';

/** Every entry point re-checks ownership AND match status — no shortcuts. */
function gate(user, connectionId) {
  return assertMatched(getOwnedConnection(user, connectionId));
}

export function send(user, connectionId, { body }) {
  const connection = gate(user, connectionId);
  const message = messageRepo.create({ connectionId: connection.id, senderUserId: user.id, body });

  const recipientProfile = user.role === 'company'
    ? profileRepo.findAgentById(connection.agentProfileId)
    : profileRepo.findCompanyById(connection.companyProfileId);

  if (recipientProfile?.userId) {
    analyticsRepo.createNotification({
      userId: recipientProfile.userId,
      type: 'message.received',
      title: 'New message',
      body: body.slice(0, 140),
      payload: { connectionId: connection.id, messageId: message.id },
    });
  }

  return message;
}

export function history(user, connectionId, paginationInput) {
  const connection = gate(user, connectionId);
  const { page, perPage, offset } = parsePagination(paginationInput);
  const { items, total } = messageRepo.listForConnection(connection.id, { offset, perPage });
  messageRepo.markRead(connection.id, user.id);
  return { items, meta: { page, perPage, total } };
}

export function markRead(user, connectionId) {
  const connection = gate(user, connectionId);
  return { updated: messageRepo.markRead(connection.id, user.id) };
}

export const unreadCount = (user) => ({ unread: messageRepo.countUnreadForUser(user.id) });
