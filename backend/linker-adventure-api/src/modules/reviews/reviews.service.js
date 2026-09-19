import { transaction } from '../../db/index.js';
import * as reviewRepo from '../../repositories/review.repo.js';
import * as profileRepo from '../../repositories/profile.repo.js';
import * as connectionRepo from '../../repositories/connection.repo.js';
import { parsePagination } from '../../utils/pagination.js';
import { notFound, forbidden, conflict, badRequest } from '../../utils/AppError.js';

function subjectExists(subjectType, subjectId) {
  return subjectType === 'company'
    ? profileRepo.findCompanyById(subjectId)
    : profileRepo.findAgentById(subjectId);
}

/**
 * "Verified review": only a matched counterparty may review you. That is what
 * makes the badge on the profile mean something.
 */
function assertEntitled(user, subjectType, subjectId) {
  if (user.role === subjectType) throw badRequest('You cannot review your own side of the marketplace');

  const ownProfile = user.role === 'company'
    ? profileRepo.findCompanyByUserId(user.id)
    : profileRepo.findAgentByUserId(user.id);
  if (!ownProfile) throw notFound('Set up your profile first');

  const connection = user.role === 'company'
    ? connectionRepo.findPair(ownProfile.id, subjectId)
    : connectionRepo.findPair(subjectId, ownProfile.id);

  if (!connection || connection.status !== 'matched') {
    throw forbidden('You can only review a partner you are matched with');
  }
  return connection;
}

export function create(user, input) {
  const subject = subjectExists(input.subjectType, input.subjectId);
  if (!subject) throw notFound('The profile you are reviewing does not exist');

  const connection = assertEntitled(user, input.subjectType, input.subjectId);
  if (reviewRepo.hasReviewed(user.id, input.subjectType, input.subjectId)) {
    throw conflict('You have already reviewed this partner');
  }

  return transaction(() => {
    const review = reviewRepo.create({ ...input, authorUserId: user.id, connectionId: connection.id });
    const aggregate = reviewRepo.aggregateForSubject(input.subjectType, input.subjectId);
    profileRepo.applyRating(input.subjectType, input.subjectId, aggregate);
    return { review, rating: aggregate };
  });
}

export function listForSubject({ subjectType, subjectId }, filters) {
  if (!subjectExists(subjectType, subjectId)) throw notFound('Profile not found');

  const { page, perPage, offset } = parsePagination(filters);
  const { items, total } = reviewRepo.listForSubject(subjectType, subjectId, { kind: filters.kind, offset, perPage });

  return {
    items,
    meta: {
      page,
      perPage,
      total,
      summary: reviewRepo.aggregateForSubject(subjectType, subjectId),
      breakdown: reviewRepo.ratingBreakdown(subjectType, subjectId),
    },
  };
}
