import { Vacancy, Application } from '../db/models.js';
import { escapeRegex } from '../utils/regex.js';

function map(doc, applicationCount) {
  if (!doc) return null;
  const company = doc.companyProfileId && typeof doc.companyProfileId === 'object' ? doc.companyProfileId : null;

  return {
    id: doc._id.toString(),
    companyProfileId: (company ? company._id : doc.companyProfileId).toString(),
    title: doc.title,
    description: doc.description,
    destination: doc.destination ?? null,
    tourType: doc.tourType ?? null,
    engagementType: doc.engagementType,
    isRemote: Boolean(doc.isRemote),
    openings: doc.openings,
    tags: doc.tags ?? [],
    status: doc.status,
    closesAt: doc.closesAt ? doc.closesAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    applicationCount,
    ...(company ? { company: { id: company._id.toString(), name: company.companyName, slug: company.slug, logoUrl: company.logoPath ?? null, city: company.city ?? null, country: company.country ?? null } } : {}),
  };
}

const populate = (query) => query.populate('companyProfileId', 'companyName slug logoPath city country');

async function withCount(doc) {
  if (!doc) return null;
  const count = await Application.countDocuments({ vacancyId: doc._id });
  return map(doc, count);
}

export const findById = async (id) => withCount(await populate(Vacancy.findById(id)));

export async function create(companyProfileId, input) {
  const doc = await Vacancy.create({
    companyProfileId,
    title: input.title,
    description: input.description,
    destination: input.destination ?? null,
    tourType: input.tourType ?? null,
    engagementType: input.engagementType ?? 'contract',
    isRemote: Boolean(input.isRemote),
    openings: input.openings ?? 1,
    tags: input.tags ?? [],
    closesAt: input.closesAt ? new Date(input.closesAt) : null,
  });
  return findById(doc._id);
}

const FIELDS = ['title', 'description', 'destination', 'tourType', 'engagementType', 'openings', 'status'];

export async function update(id, patch) {
  const update = {};
  for (const key of FIELDS) if (patch[key] !== undefined) update[key] = patch[key];
  if (patch.isRemote !== undefined) update.isRemote = Boolean(patch.isRemote);
  if (patch.tags !== undefined) update.tags = patch.tags;
  if (patch.closesAt !== undefined) update.closesAt = patch.closesAt ? new Date(patch.closesAt) : null;
  if (Object.keys(update).length > 0) await Vacancy.updateOne({ _id: id }, update);
  return findById(id);
}

export async function remove(id) {
  const result = await Vacancy.deleteOne({ _id: id });
  return result.deletedCount > 0;
}

export async function search(filters, { offset, perPage }) {
  const where = {};

  if (filters.q?.trim()) {
    const regex = new RegExp(escapeRegex(filters.q.trim()), 'i');
    where.$or = [{ title: regex }, { description: regex }, { tags: regex }];
  }
  if (filters.status) where.status = filters.status;
  if (filters.tourType) where.tourType = filters.tourType;
  if (filters.destination) where.destination = new RegExp(escapeRegex(filters.destination), 'i');
  if (filters.engagementType) where.engagementType = filters.engagementType;
  if (filters.isRemote !== undefined) where.isRemote = Boolean(filters.isRemote);
  if (filters.companyProfileId) where.companyProfileId = filters.companyProfileId;

  const [total, docs] = await Promise.all([
    Vacancy.countDocuments(where),
    populate(Vacancy.find(where).sort({ createdAt: -1 }).skip(offset).limit(perPage)),
  ]);
  const items = await Promise.all(docs.map(withCount));
  return { items, total };
}

export const countOpenForCompany = (companyProfileId) =>
  Vacancy.countDocuments({ companyProfileId, status: 'open' });
