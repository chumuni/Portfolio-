import * as vacancyRepo from '../../repositories/vacancy.repo.js';
import * as profileRepo from '../../repositories/profile.repo.js';
import { parsePagination } from '../../utils/pagination.js';
import { notFound, forbidden } from '../../utils/AppError.js';

async function ownCompany(user) {
  const company = await profileRepo.findCompanyByUserId(user.id);
  if (!company) throw notFound('Company profile not found');
  return company;
}

export async function create(user, input) {
  const company = await ownCompany(user);
  return vacancyRepo.create(company.id, input);
}

/** Loads a vacancy and verifies the caller's company owns it. */
export async function getOwned(user, vacancyId) {
  const vacancy = await vacancyRepo.findById(vacancyId);
  if (!vacancy) throw notFound('Vacancy not found');
  const company = await ownCompany(user);
  if (vacancy.companyProfileId !== company.id) throw forbidden('This vacancy belongs to another company');
  return vacancy;
}

export async function update(user, vacancyId, patch) {
  const vacancy = await getOwned(user, vacancyId);
  return vacancyRepo.update(vacancy.id, patch);
}

export async function remove(user, vacancyId) {
  const vacancy = await getOwned(user, vacancyId);
  await vacancyRepo.remove(vacancy.id);
  return { deleted: true, id: vacancy.id };
}

export async function getPublic(vacancyId) {
  const vacancy = await vacancyRepo.findById(vacancyId);
  if (!vacancy) throw notFound('Vacancy not found');
  return vacancy;
}

export async function search(filters) {
  const { page, perPage, offset } = parsePagination(filters);
  const { items, total } = await vacancyRepo.search(filters, { offset, perPage });
  return { items, meta: { page, perPage, total } };
}

export async function listMine(user, filters) {
  const company = await ownCompany(user);
  return search({ ...filters, companyProfileId: company.id });
}
