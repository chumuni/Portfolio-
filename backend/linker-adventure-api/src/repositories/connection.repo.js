import { query, nowIso } from '../db/index.js';

const map = (row) => row && ({
  id: row.id,
  companyProfileId: row.company_profile_id,
  agentProfileId: row.agent_profile_id,
  initiatedBy: row.initiated_by,
  companyInterested: Boolean(row.company_interested),
  agentInterested: Boolean(row.agent_interested),
  status: row.status,
  note: row.note,
  matchedAt: row.matched_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  ...(row.company_name ? { company: { id: row.company_profile_id, name: row.company_name, slug: row.company_slug, logoUrl: row.logo_path } } : {}),
  ...(row.full_name ? { agent: { id: row.agent_profile_id, name: row.full_name, slug: row.agent_slug, photoUrl: row.photo_path, headline: row.headline } } : {}),
});

const JOINED = `
  SELECT c.*,
         co.company_name, co.slug AS company_slug, co.logo_path,
         ag.full_name, ag.slug AS agent_slug, ag.photo_path, ag.headline
    FROM connections c
    JOIN company_profiles co ON co.id = c.company_profile_id
    JOIN agent_profiles  ag ON ag.id = c.agent_profile_id
`;

export const findById = (id) => map(query.get(`${JOINED} WHERE c.id = ?`, [id]));

export const findPair = (companyProfileId, agentProfileId) =>
  map(query.get(`${JOINED} WHERE c.company_profile_id = ? AND c.agent_profile_id = ?`, [companyProfileId, agentProfileId]));

export function create({ companyProfileId, agentProfileId, initiatedBy, note }) {
  const id = query.insert(
    `INSERT INTO connections
       (company_profile_id, agent_profile_id, initiated_by, company_interested, agent_interested, note)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      companyProfileId,
      agentProfileId,
      initiatedBy,
      initiatedBy === 'company' ? 1 : 0,
      initiatedBy === 'agent' ? 1 : 0,
      note ?? null,
    ],
  );
  return findById(id);
}

export function setInterest(id, side, interested) {
  const column = side === 'company' ? 'company_interested' : 'agent_interested';
  query.run(`UPDATE connections SET ${column} = ?, updated_at = ? WHERE id = ?`, [interested ? 1 : 0, nowIso(), id]);
  return findById(id);
}

export function markMatched(id) {
  query.run('UPDATE connections SET status = ?, matched_at = ?, updated_at = ? WHERE id = ?',
    ['matched', nowIso(), nowIso(), id]);
  return findById(id);
}

export function setStatus(id, status) {
  query.run('UPDATE connections SET status = ?, updated_at = ? WHERE id = ?', [status, nowIso(), id]);
  return findById(id);
}

export function listForProfile({ profileType, profileId, status, offset, perPage }) {
  const column = profileType === 'company' ? 'c.company_profile_id' : 'c.agent_profile_id';
  const where = [`${column} = ?`];
  const params = [profileId];

  if (status) {
    where.push('c.status = ?');
    params.push(status);
  }

  const clause = where.join(' AND ');
  const total = query.count(`SELECT COUNT(*) FROM connections c WHERE ${clause}`, params);
  const rows = query.all(
    `${JOINED} WHERE ${clause} ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`,
    [...params, perPage, offset],
  );
  return { items: rows.map(map), total };
}

export const countByStatus = (profileType, profileId, status) => {
  const column = profileType === 'company' ? 'company_profile_id' : 'agent_profile_id';
  return query.count(`SELECT COUNT(*) FROM connections WHERE ${column} = ? AND status = ?`, [profileId, status]);
};
