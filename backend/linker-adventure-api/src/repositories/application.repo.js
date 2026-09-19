import { query, nowIso } from '../db/index.js';

const map = (row) => row && ({
  id: row.id,
  vacancyId: row.vacancy_id,
  agentProfileId: row.agent_profile_id,
  coverLetter: row.cover_letter,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  ...(row.title ? { vacancy: { id: row.vacancy_id, title: row.title, companyProfileId: row.company_profile_id, companyName: row.company_name } } : {}),
  ...(row.full_name ? { agent: { id: row.agent_profile_id, name: row.full_name, slug: row.agent_slug, photoUrl: row.photo_path, headline: row.headline, yearsExperience: row.years_experience } } : {}),
});

const JOINED = `
  SELECT a.*, v.title, v.company_profile_id, co.company_name,
         ag.full_name, ag.slug AS agent_slug, ag.photo_path, ag.headline, ag.years_experience
    FROM applications a
    JOIN vacancies v ON v.id = a.vacancy_id
    JOIN company_profiles co ON co.id = v.company_profile_id
    JOIN agent_profiles ag ON ag.id = a.agent_profile_id
`;

export const findById = (id) => map(query.get(`${JOINED} WHERE a.id = ?`, [id]));

export const findExisting = (vacancyId, agentProfileId) =>
  map(query.get(`${JOINED} WHERE a.vacancy_id = ? AND a.agent_profile_id = ?`, [vacancyId, agentProfileId]));

export function create({ vacancyId, agentProfileId, coverLetter }) {
  const id = query.insert(
    'INSERT INTO applications (vacancy_id, agent_profile_id, cover_letter) VALUES (?, ?, ?)',
    [vacancyId, agentProfileId, coverLetter ?? null],
  );
  return findById(id);
}

export function setStatus(id, status) {
  query.run('UPDATE applications SET status = ?, updated_at = ? WHERE id = ?', [status, nowIso(), id]);
  return findById(id);
}

export function listForVacancy(vacancyId, { status, offset, perPage }) {
  const where = ['a.vacancy_id = ?'];
  const params = [vacancyId];
  if (status) { where.push('a.status = ?'); params.push(status); }

  const clause = where.join(' AND ');
  const total = query.count(`SELECT COUNT(*) FROM applications a WHERE ${clause}`, params);
  const rows = query.all(`${JOINED} WHERE ${clause} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`, [...params, perPage, offset]);
  return { items: rows.map(map), total };
}

export function listForAgent(agentProfileId, { status, offset, perPage }) {
  const where = ['a.agent_profile_id = ?'];
  const params = [agentProfileId];
  if (status) { where.push('a.status = ?'); params.push(status); }

  const clause = where.join(' AND ');
  const total = query.count(`SELECT COUNT(*) FROM applications a WHERE ${clause}`, params);
  const rows = query.all(`${JOINED} WHERE ${clause} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`, [...params, perPage, offset]);
  return { items: rows.map(map), total };
}

export const countForCompany = (companyProfileId, status) => query.count(
  `SELECT COUNT(*) FROM applications a
     JOIN vacancies v ON v.id = a.vacancy_id
    WHERE v.company_profile_id = ?${status ? ' AND a.status = ?' : ''}`,
  status ? [companyProfileId, status] : [companyProfileId],
);
