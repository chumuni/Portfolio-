import { query } from '../db/index.js';

const map = (row) => row && ({
  id: row.id,
  subjectType: row.subject_type,
  subjectId: row.subject_id,
  authorUserId: row.author_user_id,
  connectionId: row.connection_id,
  kind: row.kind,
  rating: row.rating,
  title: row.title,
  body: row.body,
  reviewerName: row.reviewer_name,
  reviewerRole: row.reviewer_role,
  referredBy: row.referred_by,
  isPublished: Boolean(row.is_published),
  createdAt: row.created_at,
});

export const findById = (id) => map(query.get('SELECT * FROM reviews WHERE id = ?', [id]));

export function create(input) {
  const id = query.insert(
    `INSERT INTO reviews
       (subject_type, subject_id, author_user_id, connection_id, kind, rating, title, body, reviewer_name, reviewer_role, referred_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.subjectType,
      input.subjectId,
      input.authorUserId ?? null,
      input.connectionId ?? null,
      input.kind ?? 'partner',
      input.rating,
      input.title ?? null,
      input.body,
      input.reviewerName ?? null,
      input.reviewerRole ?? null,
      input.referredBy ?? null,
    ],
  );
  return findById(id);
}

export function listForSubject(subjectType, subjectId, { kind, offset, perPage }) {
  const where = ['subject_type = ?', 'subject_id = ?', 'is_published = 1'];
  const params = [subjectType, subjectId];
  if (kind) { where.push('kind = ?'); params.push(kind); }

  const clause = where.join(' AND ');
  const total = query.count(`SELECT COUNT(*) FROM reviews WHERE ${clause}`, params);
  const rows = query.all(`SELECT * FROM reviews WHERE ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, perPage, offset]);
  return { items: rows.map(map), total };
}

export const hasReviewed = (authorUserId, subjectType, subjectId) =>
  query.count('SELECT COUNT(*) FROM reviews WHERE author_user_id = ? AND subject_type = ? AND subject_id = ?',
    [authorUserId, subjectType, subjectId]) > 0;

/** Aggregate used to keep the denormalised rating on the profile in step. */
export function aggregateForSubject(subjectType, subjectId) {
  const row = query.get(
    `SELECT COUNT(*) AS count, COALESCE(AVG(rating), 0) AS average
       FROM reviews WHERE subject_type = ? AND subject_id = ? AND is_published = 1`,
    [subjectType, subjectId],
  );
  return { count: Number(row?.count ?? 0), average: Math.round(Number(row?.average ?? 0) * 100) / 100 };
}

export function ratingBreakdown(subjectType, subjectId) {
  const rows = query.all(
    `SELECT rating, COUNT(*) AS count FROM reviews
      WHERE subject_type = ? AND subject_id = ? AND is_published = 1 GROUP BY rating`,
    [subjectType, subjectId],
  );
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of rows) breakdown[row.rating] = Number(row.count);
  return breakdown;
}
