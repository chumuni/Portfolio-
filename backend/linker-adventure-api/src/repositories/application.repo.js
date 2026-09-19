import { Application, Vacancy } from '../db/models.js';

function map(doc) {
  if (!doc) return null;
  const vacancy = doc.vacancyId && typeof doc.vacancyId === 'object' ? doc.vacancyId : null;
  const agent = doc.agentProfileId && typeof doc.agentProfileId === 'object' ? doc.agentProfileId : null;

  return {
    id: doc._id.toString(),
    vacancyId: (vacancy ? vacancy._id : doc.vacancyId).toString(),
    agentProfileId: (agent ? agent._id : doc.agentProfileId).toString(),
    coverLetter: doc.coverLetter ?? null,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    ...(vacancy ? { vacancy: { id: vacancy._id.toString(), title: vacancy.title, companyProfileId: vacancy.companyProfileId.toString() } } : {}),
    ...(agent ? { agent: { id: agent._id.toString(), name: agent.fullName, slug: agent.slug, photoUrl: agent.photoPath ?? null, headline: agent.headline ?? null, yearsExperience: agent.yearsExperience } } : {}),
  };
}

const populate = (query) => query
  .populate('vacancyId', 'title companyProfileId')
  .populate('agentProfileId', 'fullName slug photoPath headline yearsExperience');

export const findById = async (id) => map(await populate(Application.findById(id)));

export const findExisting = async (vacancyId, agentProfileId) =>
  map(await populate(Application.findOne({ vacancyId, agentProfileId })));

export async function create({ vacancyId, agentProfileId, coverLetter }) {
  const doc = await Application.create({ vacancyId, agentProfileId, coverLetter: coverLetter ?? null });
  return findById(doc._id);
}

export async function setStatus(id, status) {
  await Application.updateOne({ _id: id }, { status });
  return findById(id);
}

export async function listForVacancy(vacancyId, { status, offset, perPage }) {
  const where = { vacancyId };
  if (status) where.status = status;
  const [total, docs] = await Promise.all([
    Application.countDocuments(where),
    populate(Application.find(where).sort({ createdAt: -1 }).skip(offset).limit(perPage)),
  ]);
  return { items: docs.map(map), total };
}

export async function listForAgent(agentProfileId, { status, offset, perPage }) {
  const where = { agentProfileId };
  if (status) where.status = status;
  const [total, docs] = await Promise.all([
    Application.countDocuments(where),
    populate(Application.find(where).sort({ createdAt: -1 }).skip(offset).limit(perPage)),
  ]);
  return { items: docs.map(map), total };
}

export async function countForCompany(companyProfileId, status) {
  const vacancyIds = await Vacancy.find({ companyProfileId }).distinct('_id');
  const where = { vacancyId: { $in: vacancyIds } };
  if (status) where.status = status;
  return Application.countDocuments(where);
}
