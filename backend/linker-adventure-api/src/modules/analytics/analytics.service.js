import * as analyticsRepo from '../../repositories/analytics.repo.js';
import * as connectionRepo from '../../repositories/connection.repo.js';
import * as vacancyRepo from '../../repositories/vacancy.repo.js';
import * as applicationRepo from '../../repositories/application.repo.js';
import * as messageRepo from '../../repositories/message.repo.js';
import * as profileRepo from '../../repositories/profile.repo.js';
import { parsePagination } from '../../utils/pagination.js';
import { notFound } from '../../utils/AppError.js';

const daysAgoIso = (days) => new Date(Date.now() - days * 86_400_000).toISOString();

/** Backs the "Your Dashboard" panel: views, matches, pipeline, unread. */
export async function dashboard(user, { days = 30 } = {}) {
  const since = daysAgoIso(days);
  const subjectType = user.role;

  const profile = subjectType === 'company'
    ? await profileRepo.findCompanyByUserId(user.id)
    : await profileRepo.findAgentByUserId(user.id);
  if (!profile) throw notFound('Profile not found');

  const [
    viewsTotal, viewsWindow, viewsByDay,
    pending, matched, declined,
    unreadMessages, unreadNotifications,
  ] = await Promise.all([
    analyticsRepo.countProfileViews(subjectType, profile.id),
    analyticsRepo.countProfileViews(subjectType, profile.id, since),
    analyticsRepo.viewsByDay(subjectType, profile.id, since),
    connectionRepo.countByStatus(subjectType, profile.id, 'pending'),
    connectionRepo.countByStatus(subjectType, profile.id, 'matched'),
    connectionRepo.countByStatus(subjectType, profile.id, 'declined'),
    messageRepo.countUnreadForUser(user.id),
    analyticsRepo.countUnreadNotifications(user.id),
  ]);

  const common = {
    period: { days, since },
    profileViews: { total: viewsTotal, window: viewsWindow, byDay: viewsByDay },
    connections: { pending, matched, declined },
    rating: profile.rating,
    unreadMessages,
    unreadNotifications,
  };

  if (subjectType === 'company') {
    const [open, total, submitted, shortlisted, accepted] = await Promise.all([
      vacancyRepo.countOpenForCompany(profile.id),
      applicationRepo.countForCompany(profile.id),
      applicationRepo.countForCompany(profile.id, 'submitted'),
      applicationRepo.countForCompany(profile.id, 'shortlisted'),
      applicationRepo.countForCompany(profile.id, 'accepted'),
    ]);
    return {
      ...common,
      vacancies: { open },
      applications: { total, submitted, shortlisted, accepted },
      isRecruiting: profile.isRecruiting,
    };
  }

  return {
    ...common,
    availability: profile.availability,
    isOpenToWork: profile.isOpenToWork,
  };
}

export async function listNotifications(user, filters) {
  const { page, perPage, offset } = parsePagination(filters);
  const [{ items, total }, unread] = await Promise.all([
    analyticsRepo.listNotifications(user.id, { unreadOnly: filters.unreadOnly === true, offset, perPage }),
    analyticsRepo.countUnreadNotifications(user.id),
  ]);
  return { items, meta: { page, perPage, total, unread } };
}

export const markNotificationsRead = async (user) => ({ updated: await analyticsRepo.markNotificationsRead(user.id) });
