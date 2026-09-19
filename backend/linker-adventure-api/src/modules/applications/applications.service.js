import * as applicationRepo from '../../repositories/application.repo.js';
import * as vacancyRepo from '../../repositories/vacancy.repo.js';
import * as profileRepo from '../../repositories/profile.repo.js';
import * as analyticsRepo from '../../repositories/analytics.repo.js';
import { parsePagination } from '../../utils/pagination.js';
import { notFound, forbidden, conflict, badRequest } from '../../utils/AppError.js';

async function ownAgent(user) {
  const agent = await profileRepo.findAgentByUserId(user.id);
  if (!agent) throw notFound('Agent profile not found');
  return agent;
}

async function ownCompany(user) {
  const company = await profileRepo.findCompanyByUserId(user.id);
  if (!company) throw notFound('Company profile not found');
  return company;
}

export async function apply(user, vacancyId, { coverLetter }) {
  const agent = await ownAgent(user);
  const vacancy = await vacancyRepo.findById(vacancyId);

  if (!vacancy) throw notFound('Vacancy not found');
  if (vacancy.status !== 'open') throw badRequest('This vacancy is closed');
  if (vacancy.closesAt && new Date(vacancy.closesAt) < new Date()) throw badRequest('The deadline for this vacancy has passed');
  if (await applicationRepo.findExisting(vacancy.id, agent.id)) throw conflict('You have already applied to this vacancy');

  const application = await applicationRepo.create({ vacancyId: vacancy.id, agentProfileId: agent.id, coverLetter });

  const company = await profileRepo.findCompanyById(vacancy.companyProfileId);
  if (company?.userId) {
    await analyticsRepo.createNotification({
      userId: company.userId,
      type: 'application.received',
      title: `New application for ${vacancy.title}`,
      body: agent.fullName,
      payload: { vacancyId: vacancy.id, applicationId: application.id },
    });
  }

  return application;
}

export async function listForVacancy(user, vacancyId, filters) {
  const company = await ownCompany(user);
  const vacancy = await vacancyRepo.findById(vacancyId);

  if (!vacancy) throw notFound('Vacancy not found');
  if (vacancy.companyProfileId !== company.id) throw forbidden('This vacancy belongs to another company');

  const { page, perPage, offset } = parsePagination(filters);
  const { items, total } = await applicationRepo.listForVacancy(vacancy.id, { status: filters.status, offset, perPage });
  return { items, meta: { page, perPage, total } };
}

export async function listMine(user, filters) {
  const agent = await ownAgent(user);
  const { page, perPage, offset } = parsePagination(filters);
  const { items, total } = await applicationRepo.listForAgent(agent.id, { status: filters.status, offset, perPage });
  return { items, meta: { page, perPage, total } };
}

export async function decide(user, applicationId, { status }) {
  const company = await ownCompany(user);
  const application = await applicationRepo.findById(applicationId);

  if (!application) throw notFound('Application not found');
  const vacancy = await vacancyRepo.findById(application.vacancyId);
  if (vacancy.companyProfileId !== company.id) throw forbidden('This application belongs to another company');
  if (application.status === 'withdrawn') throw badRequest('This application was withdrawn by the agent');

  const updated = await applicationRepo.setStatus(application.id, status);

  const agent = await profileRepo.findAgentById(application.agentProfileId);
  if (agent?.userId) {
    await analyticsRepo.createNotification({
      userId: agent.userId,
      type: `application.${status}`,
      title: `Your application was ${status}`,
      body: vacancy.title,
      payload: { applicationId: application.id, vacancyId: vacancy.id },
    });
  }

  return updated;
}

export async function withdraw(user, applicationId) {
  const agent = await ownAgent(user);
  const application = await applicationRepo.findById(applicationId);

  if (!application) throw notFound('Application not found');
  if (application.agentProfileId !== agent.id) throw forbidden('This application is not yours');

  return applicationRepo.setStatus(application.id, 'withdrawn');
}
