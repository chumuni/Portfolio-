import mongoose from 'mongoose';
import { ProfileView, Notification } from '../db/models.js';

export async function recordProfileView({ subjectType, subjectId, viewerUserId }) {
  await ProfileView.create({ subjectType, subjectId, viewerUserId: viewerUserId ?? null });
}

export async function countProfileViews(subjectType, subjectId, sinceIso) {
  const where = { subjectType, subjectId };
  if (sinceIso) where.viewedAt = { $gte: new Date(sinceIso) };
  return ProfileView.countDocuments(where);
}

export async function viewsByDay(subjectType, subjectId, sinceIso) {
  const rows = await ProfileView.aggregate([
    {
      $match: {
        subjectType,
        subjectId: new mongoose.Types.ObjectId(subjectId),
        viewedAt: { $gte: new Date(sinceIso) },
      },
    },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$viewedAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((row) => ({ day: row._id, count: row.count }));
}

/* ------------------------------ notifications ---------------------------- */

const mapNotification = (doc) => doc && ({
  id: doc._id.toString(),
  type: doc.type,
  title: doc.title,
  body: doc.body ?? null,
  payload: doc.payload ?? {},
  readAt: doc.readAt ? doc.readAt.toISOString() : null,
  createdAt: doc.createdAt.toISOString(),
});

export async function createNotification({ userId, type, title, body, payload }) {
  await Notification.create({ userId, type, title, body: body ?? null, payload: payload ?? {} });
}

export async function listNotifications(userId, { unreadOnly, offset, perPage }) {
  const where = { userId };
  if (unreadOnly) where.readAt = null;

  const [total, docs] = await Promise.all([
    Notification.countDocuments(where),
    Notification.find(where).sort({ createdAt: -1 }).skip(offset).limit(perPage),
  ]);
  return { items: docs.map(mapNotification), total };
}

export const countUnreadNotifications = (userId) => Notification.countDocuments({ userId, readAt: null });

export async function markNotificationsRead(userId) {
  const result = await Notification.updateMany({ userId, readAt: null }, { readAt: new Date() });
  return result.modifiedCount;
}
