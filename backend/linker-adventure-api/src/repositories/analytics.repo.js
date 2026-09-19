import { query } from '../db/index.js';

export function recordProfileView({ subjectType, subjectId, viewerUserId }) {
  query.insert(
    'INSERT INTO profile_views (subject_type, subject_id, viewer_user_id) VALUES (?, ?, ?)',
    [subjectType, subjectId, viewerUserId ?? null],
  );
}

export const countProfileViews = (subjectType, subjectId, sinceIso) => query.count(
  `SELECT COUNT(*) FROM profile_views
    WHERE subject_type = ? AND subject_id = ?${sinceIso ? ' AND viewed_at >= ?' : ''}`,
  sinceIso ? [subjectType, subjectId, sinceIso] : [subjectType, subjectId],
);

export const viewsByDay = (subjectType, subjectId, sinceIso) => query.all(
  `SELECT date(viewed_at) AS day, COUNT(*) AS count
     FROM profile_views
    WHERE subject_type = ? AND subject_id = ? AND viewed_at >= ?
    GROUP BY day ORDER BY day`,
  [subjectType, subjectId, sinceIso],
).map((row) => ({ day: row.day, count: Number(row.count) }));

/* ------------------------------ notifications ---------------------------- */

const mapNotification = (row) => row && ({
  id: row.id,
  type: row.type,
  title: row.title,
  body: row.body,
  payload: JSON.parse(row.payload ?? '{}'),
  readAt: row.read_at,
  createdAt: row.created_at,
});

export function createNotification({ userId, type, title, body, payload }) {
  query.insert(
    'INSERT INTO notifications (user_id, type, title, body, payload) VALUES (?, ?, ?, ?, ?)',
    [userId, type, title, body ?? null, JSON.stringify(payload ?? {})],
  );
}

export function listNotifications(userId, { unreadOnly, offset, perPage }) {
  const where = ['user_id = ?'];
  const params = [userId];
  if (unreadOnly) where.push('read_at IS NULL');

  const clause = where.join(' AND ');
  const total = query.count(`SELECT COUNT(*) FROM notifications WHERE ${clause}`, params);
  const rows = query.all(`SELECT * FROM notifications WHERE ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, perPage, offset]);
  return { items: rows.map(mapNotification), total };
}

export const countUnreadNotifications = (userId) =>
  query.count('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND read_at IS NULL', [userId]);

export const markNotificationsRead = (userId) =>
  query.run("UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND read_at IS NULL", [userId]).changes;
