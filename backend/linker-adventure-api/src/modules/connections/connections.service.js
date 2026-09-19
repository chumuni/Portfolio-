import * as connectionRepo from '../../repositories/connection.repo.js';
import * as profileRepo from '../../repositories/profile.repo.js';
import * as analyticsRepo from '../../repositories/analytics.repo.js';
import { parsePagination } from '../../utils/pagination.js';
import { notFound, forbidden, badRequest, conflict } from '../../utils/AppError.js';

/**
 * Core product rule: a connection is only "matched" when BOTH sides have
 * expressed interest. One-sided interest stays pending and unlocks nothing.
 */
async function reconcile(connection) {
  if (connection.status === 'declined' || connection.status === 'archived') return connection;
  if (connection.companyInterested && connection.agentInterested && connection.status !== 'matched') {
    return connectionRepo.markMatched(connection.id);
  }
  return connection;
}

async function ownProfileOf(user) {
  const profile = user.role === 'company'
    ? await profileRepo.findCompanyByUserId(user.id)
    : await profileRepo.findAgentByUserId(user.id);
  if (!profile) throw notFound('Set up your profile before connecting with others');
  return profile;
}

/** Throws unless the user is one of the two parties on this connection. */
export async function assertParticipant(user, connection) {
  const profile = await ownProfileOf(user);
  const isParty = user.role === 'company'
    ? connection.companyProfileId === profile.id
    : connection.agentProfileId === profile.id;
  if (!isParty) throw forbidden('This connection does not belong to you');
  return profile;
}

export async function expressInterest(user, { targetProfileId, note }) {
  const ownProfile = await ownProfileOf(user);
  const side = user.role;

  const companyProfileId = side === 'company' ? ownProfile.id : targetProfileId;
  const agentProfileId = side === 'agent' ? ownProfile.id : targetProfileId;

  const counterpart = side === 'company'
    ? await profileRepo.findAgentById(agentProfileId)
    : await profileRepo.findCompanyById(companyProfileId);
  if (!counterpart) throw notFound('That profile does not exist');

  const existing = await connectionRepo.findPair(companyProfileId, agentProfileId);

  if (!existing) {
    const connection = await connectionRepo.create({ companyProfileId, agentProfileId, initiatedBy: side, note });
    await notifyCounterpart(connection, side, 'connection.interest', 'New interest in your profile');
    return { connection, matched: false };
  }

  if (existing.status === 'declined') throw conflict('This connection was declined and cannot be reopened');

  const alreadyInterested = side === 'company' ? existing.companyInterested : existing.agentInterested;
  if (alreadyInterested && existing.status !== 'pending') {
    return { connection: existing, matched: existing.status === 'matched' };
  }

  const updated = await reconcile(await connectionRepo.setInterest(existing.id, side, true));
  const matched = updated.status === 'matched';

  await notifyCounterpart(
    updated,
    side,
    matched ? 'connection.matched' : 'connection.interest',
    matched ? 'You have a new match' : 'New interest in your profile',
  );
  if (matched) await notifySelf(updated, side, 'connection.matched', 'You have a new match');

  return { connection: updated, matched };
}

export async function withdrawInterest(user, connectionId) {
  const connection = await getOwnedConnection(user, connectionId);
  const updated = await connectionRepo.setInterest(connection.id, user.role, false);
  return connectionRepo.setStatus(updated.id, 'pending');
}

export async function decline(user, connectionId) {
  const connection = await getOwnedConnection(user, connectionId);
  return connectionRepo.setStatus(connection.id, 'declined');
}

export async function archive(user, connectionId) {
  const connection = await getOwnedConnection(user, connectionId);
  return connectionRepo.setStatus(connection.id, 'archived');
}

export async function getOwnedConnection(user, connectionId) {
  const connection = await connectionRepo.findById(connectionId);
  if (!connection) throw notFound('Connection not found');
  await assertParticipant(user, connection);
  return connection;
}

export async function list(user, { status, ...paginationInput }) {
  const profile = await ownProfileOf(user);
  const { page, perPage, offset } = parsePagination(paginationInput);
  const { items, total } = await connectionRepo.listForProfile({
    profileType: user.role,
    profileId: profile.id,
    status,
    offset,
    perPage,
  });
  return { items, meta: { page, perPage, total } };
}

/** Messaging and contact-detail exchange both depend on this gate. */
export function assertMatched(connection) {
  if (connection.status !== 'matched') {
    throw badRequest('Both sides must express interest before this connection unlocks');
  }
  return connection;
}

/* ------------------------------ notifications ---------------------------- */

async function counterpartUserId(connection, actingSide) {
  const profile = actingSide === 'company'
    ? await profileRepo.findAgentById(connection.agentProfileId)
    : await profileRepo.findCompanyById(connection.companyProfileId);
  return profile?.userId ?? null;
}

async function selfUserId(connection, actingSide) {
  const profile = actingSide === 'company'
    ? await profileRepo.findCompanyById(connection.companyProfileId)
    : await profileRepo.findAgentById(connection.agentProfileId);
  return profile?.userId ?? null;
}

async function notifyCounterpart(connection, actingSide, type, title) {
  const userId = await counterpartUserId(connection, actingSide);
  if (userId) await analyticsRepo.createNotification({ userId, type, title, payload: { connectionId: connection.id } });
}

async function notifySelf(connection, actingSide, type, title) {
  const userId = await selfUserId(connection, actingSide);
  if (userId) await analyticsRepo.createNotification({ userId, type, title, payload: { connectionId: connection.id } });
}
