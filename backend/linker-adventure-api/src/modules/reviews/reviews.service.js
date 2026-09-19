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
async function assertEntitled(user, subjectType, subjectId) {
  if (user.role === subjectType) throw badRequest('You cannot review your own side of the marketplace');

  const ownProfile = user.role === 'company'
    ? await profileRepo.findCompanyByUserId(user.id)
    : await profileRepo.findAgentByUserId(user.id);
  if (!ownProfile) throw notFound('Set up your profile first');

  const connection = user.role === 'company'
    ? await connectionRepo.findPair(ownProfile.id, subjectId)
    : await connectionRepo.findPair(subjectId, ownProfile.id);

  if (!connection || connection.status !== 'matched') {
    throw forbidden('You can only review a partner you are matched with');
  }
  return connection;
}

export async function create(user, input) {
  const subject = await subjectExists(input.subjectType, input.subjectId);
  if (!subject) throw notFound('The profile you are reviewing does not exist');

  const connection = await assertEntitled(user, input.subjectType, input.subjectId);
  if (await reviewRepo.hasReviewed(user.id, input.subjectType, input.subjectId)) {
    throw conflict('You have already reviewed this partner');
  }

  const review = await reviewRepo.create({ ...input, authorUserId: user.id, connectionId: connection.id });
  const aggregate = await reviewRepo.aggregateForSubject(input.subjectType, input.subjectId);
  await profileRepo.applyRating(input.subjectType, input.subjectId, aggregate);
  return { review, rating: aggregate };
}

export async function listForSubject({ subjectType, subjectId }, filters) {
  if (!(await subjectExists(subjectType, subjectId))) throw notFound('Profile not found');

  const { page, perPage, offset } = parsePagination(filters);
  const [{ items, total }, summary, breakdown] = await Promise.all([
    reviewRepo.listForSubject(subjectType, subjectId, { kind: filters.kind, offset, perPage }),
    reviewRepo.aggregateForSubject(subjectType, subjectId),
    reviewRepo.ratingBreakdown(subjectType, subjectId),
  ]);

  return { items, meta: { page, perPage, total, summary, breakdown } };
}
