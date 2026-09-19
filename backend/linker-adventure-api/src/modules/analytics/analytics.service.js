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
export function dashboard(user, { days = 30 } = {}) {
  const since = daysAgoIso(days);
  const subjectType = user.role;

  const profile = subjectType === 'company'
    ? profileRepo.findCompanyByUserId(user.id)
    : profileRepo.findAgentByUserId(user.id);
  if (!profile) throw notFound('Profile not found');

  const common = {
    period: { days, since },
    profileViews: {
      total: analyticsRepo.countProfileViews(subjectType, profile.id),
      window: analyticsRepo.countProfileViews(subjectType, profile.id, since),
      byDay: analyticsRepo.viewsByDay(subjectType, profile.id, since),
    },
    connections: {
      pending: connectionRepo.countByStatus(subjectType, profile.id, 'pending'),
      matched: connectionRepo.countByStatus(subjectType, profile.id, 'matched'),
      declined: connectionRepo.countByStatus(subjectType, profile.id, 'declined'),
    },
    rating: profile.rating,
    unreadMessages: messageRepo.countUnreadForUser(user.id),
    unreadNotifications: analyticsRepo.countUnreadNotifications(user.id),
  };

  if (subjectType === 'company') {
    return {
      ...common,
      vacancies: { open: vacancyRepo.countOpenForCompany(profile.id) },
      applications: {
        total: applicationRepo.countForCompany(profile.id),
        submitted: applicationRepo.countForCompany(profile.id, 'submitted'),
        shortlisted: applicationRepo.countForCompany(profile.id, 'shortlisted'),
        accepted: applicationRepo.countForCompany(profile.id, 'accepted'),
      },
      isRecruiting: profile.isRecruiting,
    };
  }

  return {
    ...common,
    availability: profile.availability,
    isOpenToWork: profile.isOpenToWork,
  };
}

export function listNotifications(user, filters) {
  const { page, perPage, offset } = parsePagination(filters);
  const { items, total } = analyticsRepo.listNotifications(user.id, {
    unreadOnly: filters.unreadOnly === true,
    offset,
    perPage,
  });
  return { items, meta: { page, perPage, total, unread: analyticsRepo.countUnreadNotifications(user.id) } };
}

export const markNotificationsRead = (user) => ({ updated: analyticsRepo.markNotificationsRead(user.id) });
