import { Connection } from '../db/models.js';

function map(doc) {
  if (!doc) return null;
  const company = doc.companyProfileId && typeof doc.companyProfileId === 'object' ? doc.companyProfileId : null;
  const agent = doc.agentProfileId && typeof doc.agentProfileId === 'object' ? doc.agentProfileId : null;

  return {
    id: doc._id.toString(),
    companyProfileId: (company ? company._id : doc.companyProfileId).toString(),
    agentProfileId: (agent ? agent._id : doc.agentProfileId).toString(),
    initiatedBy: doc.initiatedBy,
    companyInterested: Boolean(doc.companyInterested),
    agentInterested: Boolean(doc.agentInterested),
    status: doc.status,
    note: doc.note ?? null,
    matchedAt: doc.matchedAt ? doc.matchedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    ...(company ? { company: { id: company._id.toString(), name: company.companyName, slug: company.slug, logoUrl: company.logoPath ?? null } } : {}),
    ...(agent ? { agent: { id: agent._id.toString(), name: agent.fullName, slug: agent.slug, photoUrl: agent.photoPath ?? null, headline: agent.headline ?? null } } : {}),
  };
}

const populate = (query) => query
  .populate('companyProfileId', 'companyName slug logoPath')
  .populate('agentProfileId', 'fullName slug photoPath headline');

export const findById = async (id) => map(await populate(Connection.findById(id)));

export const findPair = async (companyProfileId, agentProfileId) =>
  map(await populate(Connection.findOne({ companyProfileId, agentProfileId })));

export async function create({ companyProfileId, agentProfileId, initiatedBy, note }) {
  const doc = await Connection.create({
    companyProfileId,
    agentProfileId,
    initiatedBy,
    companyInterested: initiatedBy === 'company',
    agentInterested: initiatedBy === 'agent',
    note: note ?? null,
  });
  return findById(doc._id);
}

export async function setInterest(id, side, interested) {
  const field = side === 'company' ? 'companyInterested' : 'agentInterested';
  await Connection.updateOne({ _id: id }, { [field]: interested });
  return findById(id);
}

export async function markMatched(id) {
  await Connection.updateOne({ _id: id }, { status: 'matched', matchedAt: new Date() });
  return findById(id);
}

export async function setStatus(id, status) {
  await Connection.updateOne({ _id: id }, { status });
  return findById(id);
}

export async function listForProfile({ profileType, profileId, status, offset, perPage }) {
  const field = profileType === 'company' ? 'companyProfileId' : 'agentProfileId';
  const where = { [field]: profileId };
  if (status) where.status = status;

  const [total, docs] = await Promise.all([
    Connection.countDocuments(where),
    populate(Connection.find(where).sort({ updatedAt: -1 }).skip(offset).limit(perPage)),
  ]);
  return { items: docs.map(map), total };
}

export async function countByStatus(profileType, profileId, status) {
  const field = profileType === 'company' ? 'companyProfileId' : 'agentProfileId';
  return Connection.countDocuments({ [field]: profileId, status });
}
