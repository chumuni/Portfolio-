import { query, nowIso, fromBool } from '../db/index.js';
import { parseList, serialiseList } from '../utils/json.js';

const map = (row) => row && ({
  id: row.id,
  companyProfileId: row.company_profile_id,
  title: row.title,
  description: row.description,
  destination: row.destination,
  tourType: row.tour_type,
  engagementType: row.engagement_type,
  isRemote: Boolean(row.is_remote),
  openings: row.openings,
  tags: parseList(row.tags),
  status: row.status,
  closesAt: row.closes_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  applicationCount: row.application_count ?? undefined,
  ...(row.company_name ? { company: { id: row.company_profile_id, name: row.company_name, slug: row.company_slug, logoUrl: row.logo_path, city: row.city, country: row.country } } : {}),
});

const JOINED = `
  SELECT v.*, co.company_name, co.slug AS company_slug, co.logo_path, co.city, co.country,
         (SELECT COUNT(*) FROM applications a WHERE a.vacancy_id = v.id) AS application_count
    FROM vacancies v
    JOIN company_profiles co ON co.id = v.company_profile_id
`;

export const findById = (id) => map(query.get(`${JOINED} WHERE v.id = ?`, [id]));

export function create(companyProfileId, input) {
  const id = query.insert(
    `INSERT INTO vacancies
       (company_profile_id, title, description, destination, tour_type, engagement_type, is_remote, openings, tags, closes_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      companyProfileId,
      input.title,
      input.description,
      input.destination ?? null,
      input.tourType ?? null,
      input.engagementType ?? 'contract',
      fromBool(input.isRemote),
      input.openings ?? 1,
      serialiseList(input.tags),
      input.closesAt ?? null,
    ],
  );
  return findById(id);
}

const FIELDS = {
  title: 'title',
  description: 'description',
  destination: 'destination',
  tourType: 'tour_type',
  engagementType: 'engagement_type',
  openings: 'openings',
  closesAt: 'closes_at',
  status: 'status',
};

export function update(id, patch) {
  const assignments = [];
  const params = [];

  for (const [key, column] of Object.entries(FIELDS)) {
    if (patch[key] === undefined) continue;
    assignments.push(`${column} = ?`);
    params.push(patch[key]);
  }
  if (patch.isRemote !== undefined) {
    assignments.push('is_remote = ?');
    params.push(fromBool(patch.isRemote));
  }
  if (patch.tags !== undefined) {
    assignments.push('tags = ?');
    params.push(serialiseList(patch.tags));
  }
  if (assignments.length === 0) return findById(id);

  assignments.push('updated_at = ?');
  params.push(nowIso(), id);
  query.run(`UPDATE vacancies SET ${assignments.join(', ')} WHERE id = ?`, params);
  return findById(id);
}

export function remove(id) {
  return query.run('DELETE FROM vacancies WHERE id = ?', [id]).changes > 0;
}

export function search(filters, { offset, perPage }) {
  const where = ['1 = 1'];
  const params = [];

  if (filters.q) {
    const like = `%${filters.q.trim()}%`;
    where.push('(v.title LIKE ? OR v.description LIKE ? OR v.tags LIKE ? OR co.company_name LIKE ?)');
    params.push(like, like, like, like);
  }
  if (filters.status) { where.push('v.status = ?'); params.push(filters.status); }
  if (filters.tourType) { where.push('v.tour_type = ?'); params.push(filters.tourType); }
  if (filters.destination) { where.push('v.destination LIKE ?'); params.push(`%${filters.destination}%`); }
  if (filters.engagementType) { where.push('v.engagement_type = ?'); params.push(filters.engagementType); }
  if (filters.isRemote !== undefined) { where.push('v.is_remote = ?'); params.push(fromBool(filters.isRemote)); }
  if (filters.companyProfileId) { where.push('v.company_profile_id = ?'); params.push(filters.companyProfileId); }

  const clause = where.join(' AND ');
  const total = query.count(
    `SELECT COUNT(*) FROM vacancies v JOIN company_profiles co ON co.id = v.company_profile_id WHERE ${clause}`,
    params,
  );
  const rows = query.all(`${JOINED} WHERE ${clause} ORDER BY v.created_at DESC LIMIT ? OFFSET ?`, [...params, perPage, offset]);
  return { items: rows.map(map), total };
}

export const countOpenForCompany = (companyProfileId) =>
  query.count("SELECT COUNT(*) FROM vacancies WHERE company_profile_id = ? AND status = 'open'", [companyProfileId]);
