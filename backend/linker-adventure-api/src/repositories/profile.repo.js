import { query, nowIso, fromBool } from '../db/index.js';
import { parseList, serialiseList } from '../utils/json.js';
import { uniqueSlug } from '../utils/slug.js';

/* ------------------------------- mapping --------------------------------- */

const mapCompany = (row) => row && ({
  id: row.id,
  userId: row.user_id,
  companyName: row.company_name,
  slug: row.slug,
  tagline: row.tagline,
  about: row.about,
  country: row.country,
  city: row.city,
  website: row.website,
  phone: row.phone,
  address: row.address,
  managerName: row.manager_name,
  operatorName: row.operator_name,
  logoUrl: row.logo_path,
  coverUrl: row.cover_path,
  licenceUrl: row.license_path,
  tourTypes: parseList(row.tour_types),
  destinations: parseList(row.destinations),
  languages: parseList(row.languages),
  groupSizes: parseList(row.group_sizes),
  teamSize: row.team_size,
  foundedYear: row.founded_year,
  licenceNumber: row.license_number,
  isVerified: Boolean(row.is_verified),
  isRecruiting: Boolean(row.is_recruiting),
  rating: { average: row.rating_average, count: row.rating_count },
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapAgent = (row) => row && ({
  id: row.id,
  userId: row.user_id,
  fullName: row.full_name,
  slug: row.slug,
  headline: row.headline,
  bio: row.bio,
  country: row.country,
  city: row.city,
  phone: row.phone,
  idNumber: row.id_number,
  address: row.address,
  photoUrl: row.photo_path,
  coverUrl: row.cover_path,
  cvUrl: row.cv_path,
  specializations: parseList(row.specializations),
  tourTypes: parseList(row.tour_types),
  languages: parseList(row.languages),
  destinations: parseList(row.destinations),
  yearsExperience: row.years_experience,
  availability: row.availability,
  remoteOnly: Boolean(row.remote_only),
  commissionRate: row.commission_rate,
  isVerified: Boolean(row.is_verified),
  isOpenToWork: Boolean(row.is_open_to_work),
  rating: { average: row.rating_average, count: row.rating_count },
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export { mapCompany, mapAgent };

/* ------------------------------- creation -------------------------------- */

export function createCompanyProfile(userId, input) {
  const id = query.insert(
    `INSERT INTO company_profiles
       (user_id, company_name, slug, tagline, about, country, city, website, phone, address,
        manager_name, operator_name, tour_types, destinations, languages, group_sizes,
        team_size, founded_year, license_number, license_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      input.companyName,
      uniqueSlug(input.companyName),
      input.tagline ?? null,
      input.about ?? null,
      input.country ?? null,
      input.city ?? null,
      input.website ?? null,
      input.phone ?? null,
      input.address ?? null,
      input.managerName ?? null,
      input.operatorName ?? null,
      serialiseList(input.tourTypes),
      serialiseList(input.destinations),
      serialiseList(input.languages),
      serialiseList(input.groupSizes),
      input.teamSize ?? null,
      input.foundedYear ?? null,
      input.licenceNumber ?? null,
      input.licenceUrl ?? null,
    ],
  );
  return findCompanyById(id);
}

export function createAgentProfile(userId, input) {
  const id = query.insert(
    `INSERT INTO agent_profiles
       (user_id, full_name, slug, headline, bio, country, city, phone, id_number, address,
        specializations, tour_types, languages, destinations,
        years_experience, availability, remote_only, commission_rate, cv_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      input.fullName,
      uniqueSlug(input.fullName),
      input.headline ?? null,
      input.bio ?? null,
      input.country ?? null,
      input.city ?? null,
      input.phone ?? null,
      input.idNumber ?? null,
      input.address ?? null,
      serialiseList(input.specializations),
      serialiseList(input.tourTypes),
      serialiseList(input.languages),
      serialiseList(input.destinations),
      input.yearsExperience ?? 0,
      input.availability ?? 'available_now',
      fromBool(input.remoteOnly),
      input.commissionRate ?? null,
      input.cvUrl ?? null,
    ],
  );
  return findAgentById(id);
}

/* -------------------------------- reads ---------------------------------- */

export const findCompanyById = (id) =>
  mapCompany(query.get('SELECT * FROM company_profiles WHERE id = ?', [id]));

export const findCompanyBySlug = (slug) =>
  mapCompany(query.get('SELECT * FROM company_profiles WHERE slug = ?', [slug]));

export const findCompanyByUserId = (userId) =>
  mapCompany(query.get('SELECT * FROM company_profiles WHERE user_id = ?', [userId]));

export const findAgentById = (id) =>
  mapAgent(query.get('SELECT * FROM agent_profiles WHERE id = ?', [id]));

export const findAgentBySlug = (slug) =>
  mapAgent(query.get('SELECT * FROM agent_profiles WHERE slug = ?', [slug]));

export const findAgentByUserId = (userId) =>
  mapAgent(query.get('SELECT * FROM agent_profiles WHERE user_id = ?', [userId]));

/* -------------------------------- updates -------------------------------- */

const COMPANY_FIELDS = {
  companyName: 'company_name',
  tagline: 'tagline',
  about: 'about',
  country: 'country',
  city: 'city',
  website: 'website',
  phone: 'phone',
  address: 'address',
  managerName: 'manager_name',
  operatorName: 'operator_name',
  teamSize: 'team_size',
  foundedYear: 'founded_year',
  licenceNumber: 'license_number',
  logoUrl: 'logo_path',
  coverUrl: 'cover_path',
  licenceUrl: 'license_path',
  isRecruiting: 'is_recruiting',
  tourTypes: 'tour_types',
  destinations: 'destinations',
  languages: 'languages',
  groupSizes: 'group_sizes',
};

const AGENT_FIELDS = {
  fullName: 'full_name',
  headline: 'headline',
  bio: 'bio',
  country: 'country',
  city: 'city',
  phone: 'phone',
  idNumber: 'id_number',
  address: 'address',
  yearsExperience: 'years_experience',
  availability: 'availability',
  remoteOnly: 'remote_only',
  commissionRate: 'commission_rate',
  isOpenToWork: 'is_open_to_work',
  photoUrl: 'photo_path',
  coverUrl: 'cover_path',
  cvUrl: 'cv_path',
  specializations: 'specializations',
  tourTypes: 'tour_types',
  languages: 'languages',
  destinations: 'destinations',
};

const LIST_KEYS = new Set(['tourTypes', 'destinations', 'languages', 'groupSizes', 'specializations']);
const BOOL_KEYS = new Set(['isRecruiting', 'remoteOnly', 'isOpenToWork']);

function buildUpdate(table, fieldMap, id, patch) {
  const assignments = [];
  const params = [];

  for (const [key, column] of Object.entries(fieldMap)) {
    if (!(key in patch) || patch[key] === undefined) continue;
    assignments.push(`${column} = ?`);
    if (LIST_KEYS.has(key)) params.push(serialiseList(patch[key]));
    else if (BOOL_KEYS.has(key)) params.push(fromBool(patch[key]));
    else params.push(patch[key]);
  }

  if (assignments.length === 0) return false;

  assignments.push('updated_at = ?');
  params.push(nowIso(), id);
  query.run(`UPDATE ${table} SET ${assignments.join(', ')} WHERE id = ?`, params);
  return true;
}

export function updateCompanyProfile(id, patch) {
  buildUpdate('company_profiles', COMPANY_FIELDS, id, patch);
  return findCompanyById(id);
}

export function updateAgentProfile(id, patch) {
  buildUpdate('agent_profiles', AGENT_FIELDS, id, patch);
  return findAgentById(id);
}

export function applyRating(subjectType, subjectId, { average, count }) {
  const table = subjectType === 'company' ? 'company_profiles' : 'agent_profiles';
  query.run(`UPDATE ${table} SET rating_average = ?, rating_count = ?, updated_at = ? WHERE id = ?`,
    [average, count, nowIso(), subjectId]);
}

/* ------------------------------ discovery -------------------------------- */

/**
 * Builds a filtered search over either profile table.
 * Every value is bound as a parameter — no string interpolation of user input.
 */
function searchProfiles({ table, mapper, filters, searchColumns, listFilters, scalarFilters, offset, perPage, sort }) {
  const where = ['1 = 1'];
  const params = [];

  if (filters.q) {
    const like = `%${filters.q.trim()}%`;
    where.push(`(${searchColumns.map((column) => `${column} LIKE ?`).join(' OR ')})`);
    searchColumns.forEach(() => params.push(like));
  }

  for (const [key, column] of Object.entries(scalarFilters)) {
    const value = filters[key];
    if (value === undefined || value === null || value === '') continue;
    where.push(`${column} = ?`);
    params.push(typeof value === 'boolean' ? fromBool(value) : value);
  }

  // JSON list columns: match any of the requested values.
  for (const [key, column] of Object.entries(listFilters)) {
    const values = filters[key];
    if (!values || values.length === 0) continue;
    where.push(`(${values.map(() => `${column} LIKE ?`).join(' OR ')})`);
    values.forEach((value) => params.push(`%"${value}"%`));
  }

  if (filters.minExperience !== undefined) {
    where.push('years_experience >= ?');
    params.push(filters.minExperience);
  }

  const clause = where.join(' AND ');
  const total = query.count(`SELECT COUNT(*) FROM ${table} WHERE ${clause}`, params);
  const rows = query.all(
    `SELECT * FROM ${table} WHERE ${clause} ORDER BY ${sort} LIMIT ? OFFSET ?`,
    [...params, perPage, offset],
  );

  return { items: rows.map(mapper), total };
}

export function searchAgents(filters, { offset, perPage }) {
  return searchProfiles({
    table: 'agent_profiles',
    mapper: mapAgent,
    filters,
    offset,
    perPage,
    sort: 'is_verified DESC, rating_average DESC, years_experience DESC, id DESC',
    searchColumns: ['full_name', 'headline', 'bio', 'specializations'],
    scalarFilters: {
      country: 'country',
      city: 'city',
      availability: 'availability',
      remoteOnly: 'remote_only',
      openToWork: 'is_open_to_work',
      verified: 'is_verified',
    },
    listFilters: {
      specializations: 'specializations',
      tourTypes: 'tour_types',
      languages: 'languages',
      destinations: 'destinations',
    },
  });
}

export function searchCompanies(filters, { offset, perPage }) {
  return searchProfiles({
    table: 'company_profiles',
    mapper: mapCompany,
    filters,
    offset,
    perPage,
    sort: 'is_verified DESC, rating_average DESC, id DESC',
    searchColumns: ['company_name', 'tagline', 'about', 'destinations'],
    scalarFilters: {
      country: 'country',
      city: 'city',
      recruiting: 'is_recruiting',
      verified: 'is_verified',
    },
    listFilters: {
      tourTypes: 'tour_types',
      destinations: 'destinations',
      languages: 'languages',
      groupSizes: 'group_sizes',
    },
  });
}
