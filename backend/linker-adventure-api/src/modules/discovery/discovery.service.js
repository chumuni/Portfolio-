import * as profileRepo from '../../repositories/profile.repo.js';
import * as connectionRepo from '../../repositories/connection.repo.js';
import { parsePagination } from '../../utils/pagination.js';

/**
 * Discovery hides profiles the viewer has already acted on, so the feed always
 * shows fresh candidates — the same idea as a dating app's card stack.
 */
async function decorateWithRelationship(items, viewer, side) {
  if (!viewer) return items.map((item) => ({ ...item, relationship: { status: 'anonymous' } }));

  const ownProfile = viewer.role === 'company'
    ? await profileRepo.findCompanyByUserId(viewer.id)
    : await profileRepo.findAgentByUserId(viewer.id);
  if (!ownProfile) return items.map((item) => ({ ...item, relationship: { status: 'none' } }));

  return Promise.all(items.map(async (item) => {
    const connection = side === 'agent'
      ? await connectionRepo.findPair(ownProfile.id, item.id)
      : await connectionRepo.findPair(item.id, ownProfile.id);
    return {
      ...item,
      relationship: connection
        ? { status: connection.status, connectionId: connection.id }
        : { status: 'none' },
    };
  }));
}

export async function findAgents(filters, viewer) {
  const { page, perPage, offset } = parsePagination(filters);
  const { items, total } = await profileRepo.searchAgents(filters, { offset, perPage });
  return { items: await decorateWithRelationship(items, viewer, 'agent'), meta: { page, perPage, total } };
}

export async function findCompanies(filters, viewer) {
  const { page, perPage, offset } = parsePagination(filters);
  const { items, total } = await profileRepo.searchCompanies(filters, { offset, perPage });
  return { items: await decorateWithRelationship(items, viewer, 'company'), meta: { page, perPage, total } };
}

/** Suggestions: the other side of the marketplace, ranked by overlap with you. */
export async function suggestionsFor(user) {
  const { page, perPage, offset } = parsePagination({ perPage: '10' });

  if (user.role === 'company') {
    const own = await profileRepo.findCompanyByUserId(user.id);
    const filters = own
      ? { tourTypes: own.tourTypes.slice(0, 5), openToWork: true }
      : { openToWork: true };
    const { items, total } = await profileRepo.searchAgents(filters, { offset, perPage });
    return { items: await decorateWithRelationship(items, user, 'agent'), meta: { page, perPage, total } };
  }

  const own = await profileRepo.findAgentByUserId(user.id);
  const filters = own
    ? { tourTypes: own.tourTypes.slice(0, 5), recruiting: true }
    : { recruiting: true };
  const { items, total } = await profileRepo.searchCompanies(filters, { offset, perPage });
  return { items: await decorateWithRelationship(items, user, 'company'), meta: { page, perPage, total } };
}
