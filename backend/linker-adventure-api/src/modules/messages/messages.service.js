import * as messageRepo from '../../repositories/message.repo.js';
import * as analyticsRepo from '../../repositories/analytics.repo.js';
import * as profileRepo from '../../repositories/profile.repo.js';
import { getOwnedConnection, assertMatched } from '../connections/connections.service.js';
import { parsePagination } from '../../utils/pagination.js';

/** Every entry point re-checks ownership AND match status — no shortcuts. */
async function gate(user, connectionId) {
  return assertMatched(await getOwnedConnection(user, connectionId));
}

export async function send(user, connectionId, { body }) {
  const connection = await gate(user, connectionId);
  const message = await messageRepo.create({ connectionId: connection.id, senderUserId: user.id, body });

  const recipientProfile = user.role === 'company'
    ? await profileRepo.findAgentById(connection.agentProfileId)
    : await profileRepo.findCompanyById(connection.companyProfileId);

  if (recipientProfile?.userId) {
    await analyticsRepo.createNotification({
      userId: recipientProfile.userId,
      type: 'message.received',
      title: 'New message',
      body: body.slice(0, 140),
      payload: { connectionId: connection.id, messageId: message.id },
    });
  }

  return message;
}

export async function history(user, connectionId, paginationInput) {
  const connection = await gate(user, connectionId);
  const { page, perPage, offset } = parsePagination(paginationInput);
  const { items, total } = await messageRepo.listForConnection(connection.id, { offset, perPage });
  await messageRepo.markRead(connection.id, user.id);
  return { items, meta: { page, perPage, total } };
}

export async function markRead(user, connectionId) {
  const connection = await gate(user, connectionId);
  return { updated: await messageRepo.markRead(connection.id, user.id) };
}

export const unreadCount = async (user) => ({ unread: await messageRepo.countUnreadForUser(user.id) });
