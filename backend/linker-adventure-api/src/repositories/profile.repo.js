import { CompanyProfile, AgentProfile } from '../db/models.js';
import { uniqueSlug } from '../utils/slug.js';
import { escapeRegex } from '../utils/regex.js';

/* ------------------------------- mapping --------------------------------- */

const mapCompany = (doc) => doc && ({
  id: doc._id.toString(),
  userId: doc.userId.toString(),
  companyName: doc.companyName,
  slug: doc.slug,
  tagline: doc.tagline ?? null,
  about: doc.about ?? null,
  country: doc.country ?? null,
  city: doc.city ?? null,
  website: doc.website ?? null,
  phone: doc.phone ?? null,
  address: doc.address ?? null,
  managerName: doc.managerName ?? null,
  operatorName: doc.operatorName ?? null,
  logoUrl: doc.logoPath ?? null,
  coverUrl: doc.coverPath ?? null,
  licenceUrl: doc.licensePath ?? null,
  tourTypes: doc.tourTypes ?? [],
  destinations: doc.destinations ?? [],
  languages: doc.languages ?? [],
  groupSizes: doc.groupSizes ?? [],
  teamSize: doc.teamSize ?? null,
  foundedYear: doc.foundedYear ?? null,
  licenceNumber: doc.licenseNumber ?? null,
  isVerified: Boolean(doc.isVerified),
  isRecruiting: Boolean(doc.isRecruiting),
  rating: { average: doc.ratingAverage, count: doc.ratingCount },
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

const mapAgent = (doc) => doc && ({
  id: doc._id.toString(),
  userId: doc.userId.toString(),
  fullName: doc.fullName,
  slug: doc.slug,
  headline: doc.headline ?? null,
  bio: doc.bio ?? null,
  country: doc.country ?? null,
  city: doc.city ?? null,
  phone: doc.phone ?? null,
  idNumber: doc.idNumber ?? null,
  address: doc.address ?? null,
  photoUrl: doc.photoPath ?? null,
  coverUrl: doc.coverPath ?? null,
  cvUrl: doc.cvPath ?? null,
  specializations: doc.specializations ?? [],
  tourTypes: doc.tourTypes ?? [],
  languages: doc.languages ?? [],
  destinations: doc.destinations ?? [],
  yearsExperience: doc.yearsExperience,
  availability: doc.availability,
  remoteOnly: Boolean(doc.remoteOnly),
  commissionRate: doc.commissionRate ?? null,
  isVerified: Boolean(doc.isVerified),
  isOpenToWork: Boolean(doc.isOpenToWork),
  rating: { average: doc.ratingAverage, count: doc.ratingCount },
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

export { mapCompany, mapAgent };

/* ------------------------------- creation -------------------------------- */

export async function createCompanyProfile(userId, input) {
  const doc = await CompanyProfile.create({
    userId,
    companyName: input.companyName,
    slug: uniqueSlug(input.companyName),
    tagline: input.tagline ?? null,
    about: input.about ?? null,
    country: input.country ?? null,
    city: input.city ?? null,
    website: input.website ?? null,
    phone: input.phone ?? null,
    address: input.address ?? null,
    managerName: input.managerName ?? null,
    operatorName: input.operatorName ?? null,
    tourTypes: input.tourTypes ?? [],
    destinations: input.destinations ?? [],
    languages: input.languages ?? [],
    groupSizes: input.groupSizes ?? [],
    teamSize: input.teamSize ?? null,
    foundedYear: input.foundedYear ?? null,
    licenseNumber: input.licenceNumber ?? null,
    licensePath: input.licenceUrl ?? null,
  });
  return mapCompany(doc);
}

export async function createAgentProfile(userId, input) {
  const doc = await AgentProfile.create({
    userId,
    fullName: input.fullName,
    slug: uniqueSlug(input.fullName),
    headline: input.headline ?? null,
    bio: input.bio ?? null,
    country: input.country ?? null,
    city: input.city ?? null,
    phone: input.phone ?? null,
    idNumber: input.idNumber ?? null,
    address: input.address ?? null,
    specializations: input.specializations ?? [],
    tourTypes: input.tourTypes ?? [],
    languages: input.languages ?? [],
    destinations: input.destinations ?? [],
    yearsExperience: input.yearsExperience ?? 0,
    availability: input.availability ?? 'available_now',
    remoteOnly: Boolean(input.remoteOnly),
    commissionRate: input.commissionRate ?? null,
    cvPath: input.cvUrl ?? null,
  });
  return mapAgent(doc);
}

/* -------------------------------- reads ---------------------------------- */

export const findCompanyById = async (id) => mapCompany(await CompanyProfile.findById(id));
export const findCompanyBySlug = async (slug) => mapCompany(await CompanyProfile.findOne({ slug }));
export const findCompanyByUserId = async (userId) => mapCompany(await CompanyProfile.findOne({ userId }));

export const findAgentById = async (id) => mapAgent(await AgentProfile.findById(id));
export const findAgentBySlug = async (slug) => mapAgent(await AgentProfile.findOne({ slug }));
export const findAgentByUserId = async (userId) => mapAgent(await AgentProfile.findOne({ userId }));

/* -------------------------------- updates -------------------------------- */

const COMPANY_FIELD_MAP = {
  companyName: 'companyName', tagline: 'tagline', about: 'about', country: 'country', city: 'city',
  website: 'website', phone: 'phone', address: 'address', managerName: 'managerName', operatorName: 'operatorName',
  teamSize: 'teamSize', foundedYear: 'foundedYear', licenceNumber: 'licenseNumber',
  logoUrl: 'logoPath', coverUrl: 'coverPath', licenceUrl: 'licensePath',
  isRecruiting: 'isRecruiting', tourTypes: 'tourTypes', destinations: 'destinations',
  languages: 'languages', groupSizes: 'groupSizes',
};

const AGENT_FIELD_MAP = {
  fullName: 'fullName', headline: 'headline', bio: 'bio', country: 'country', city: 'city', phone: 'phone',
  idNumber: 'idNumber', address: 'address', yearsExperience: 'yearsExperience', availability: 'availability',
  remoteOnly: 'remoteOnly', commissionRate: 'commissionRate', isOpenToWork: 'isOpenToWork',
  photoUrl: 'photoPath', coverUrl: 'coverPath', cvUrl: 'cvPath',
  specializations: 'specializations', tourTypes: 'tourTypes', languages: 'languages', destinations: 'destinations',
};

function buildUpdate(fieldMap, patch) {
  const update = {};
  for (const [key, field] of Object.entries(fieldMap)) {
    if (key in patch && patch[key] !== undefined) update[field] = patch[key];
  }
  return update;
}

export async function updateCompanyProfile(id, patch) {
  const update = buildUpdate(COMPANY_FIELD_MAP, patch);
  if (Object.keys(update).length > 0) await CompanyProfile.updateOne({ _id: id }, update);
  return findCompanyById(id);
}

export async function updateAgentProfile(id, patch) {
  const update = buildUpdate(AGENT_FIELD_MAP, patch);
  if (Object.keys(update).length > 0) await AgentProfile.updateOne({ _id: id }, update);
  return findAgentById(id);
}

export async function applyRating(subjectType, subjectId, { average, count }) {
  const Model = subjectType === 'company' ? CompanyProfile : AgentProfile;
  await Model.updateOne({ _id: subjectId }, { ratingAverage: average, ratingCount: count });
}

/* ------------------------------ discovery -------------------------------- */

/** Builds a filtered, paginated search over either profile collection. */
async function searchProfiles({ Model, mapper, filters, searchFields, listFilters, scalarFilters, offset, perPage, sort }) {
  const where = {};

  if (filters.q?.trim()) {
    const regex = new RegExp(escapeRegex(filters.q.trim()), 'i');
    where.$or = searchFields.map((field) => ({ [field]: regex }));
  }

  for (const [key, field] of Object.entries(scalarFilters)) {
    const value = filters[key];
    if (value === undefined || value === null || value === '') continue;
    where[field] = value;
  }

  // Array columns: match any of the requested values.
  for (const [key, field] of Object.entries(listFilters)) {
    const values = filters[key];
    if (!values || values.length === 0) continue;
    where[field] = { $in: values };
  }

  if (filters.minExperience !== undefined) {
    where.yearsExperience = { $gte: filters.minExperience };
  }

  const [total, docs] = await Promise.all([
    Model.countDocuments(where),
    Model.find(where).sort(sort).skip(offset).limit(perPage),
  ]);

  return { items: docs.map(mapper), total };
}

export function searchAgents(filters, { offset, perPage }) {
  return searchProfiles({
    Model: AgentProfile,
    mapper: mapAgent,
    filters,
    offset,
    perPage,
    sort: { isVerified: -1, ratingAverage: -1, yearsExperience: -1, _id: -1 },
    searchFields: ['fullName', 'headline', 'bio', 'specializations'],
    scalarFilters: {
      country: 'country',
      city: 'city',
      availability: 'availability',
      remoteOnly: 'remoteOnly',
      openToWork: 'isOpenToWork',
      verified: 'isVerified',
    },
    listFilters: {
      specializations: 'specializations',
      tourTypes: 'tourTypes',
      languages: 'languages',
      destinations: 'destinations',
    },
  });
}

export function searchCompanies(filters, { offset, perPage }) {
  return searchProfiles({
    Model: CompanyProfile,
    mapper: mapCompany,
    filters,
    offset,
    perPage,
    sort: { isVerified: -1, ratingAverage: -1, _id: -1 },
    searchFields: ['companyName', 'tagline', 'about', 'destinations'],
    scalarFilters: {
      country: 'country',
      city: 'city',
      recruiting: 'isRecruiting',
      verified: 'isVerified',
    },
    listFilters: {
      tourTypes: 'tourTypes',
      destinations: 'destinations',
      languages: 'languages',
      groupSizes: 'groupSizes',
    },
  });
}
