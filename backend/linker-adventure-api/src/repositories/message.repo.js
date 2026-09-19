import { query, nowIso } from '../db/index.js';

const map = (row) => row && ({
  id: row.id,
  connectionId: row.connection_id,
  senderUserId: row.sender_user_id,
  body: row.body,
  readAt: row.read_at,
  createdAt: row.created_at,
});

export function create({ connectionId, senderUserId, body }) {
  const id = query.insert(
    'INSERT INTO messages (connection_id, sender_user_id, body) VALUES (?, ?, ?)',
    [connectionId, senderUserId, body],
  );
  return map(query.get('SELECT * FROM messages WHERE id = ?', [id]));
}

export function listForConnection(connectionId, { offset, perPage }) {
  const total = query.count('SELECT COUNT(*) FROM messages WHERE connection_id = ?', [connectionId]);
  const rows = query.all(
    'SELECT * FROM messages WHERE connection_id = ? ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?',
    [connectionId, perPage, offset],
  );
  return { items: rows.map(map).reverse(), total };
}

export function markRead(connectionId, readerUserId) {
  return query.run(
    'UPDATE messages SET read_at = ? WHERE connection_id = ? AND sender_user_id != ? AND read_at IS NULL',
    [nowIso(), connectionId, readerUserId],
  ).changes;
}

export const countUnreadForUser = (userId) => query.count(
  `SELECT COUNT(*)
     FROM messages m
     JOIN connections c ON c.id = m.connection_id
     LEFT JOIN company_profiles co ON co.id = c.company_profile_id
     LEFT JOIN agent_profiles  ag ON ag.id = c.agent_profile_id
    WHERE m.read_at IS NULL
      AND m.sender_user_id != ?
      AND (co.user_id = ? OR ag.user_id = ?)`,
  [userId, userId, userId],
);
