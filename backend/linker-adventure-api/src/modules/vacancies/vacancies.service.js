import * as vacancyRepo from '../../repositories/vacancy.repo.js';
import * as profileRepo from '../../repositories/profile.repo.js';
import { parsePagination } from '../../utils/pagination.js';
import { notFound, forbidden } from '../../utils/AppError.js';

function ownCompany(user) {
  const company = profileRepo.findCompanyByUserId(user.id);
  if (!company) throw notFound('Company profile not found');
  return company;
}

export function create(user, input) {
  const company = ownCompany(user);
  return vacancyRepo.create(company.id, input);
}

/** Loads a vacancy and verifies the caller's company owns it. */
export function getOwned(user, vacancyId) {
  const vacancy = vacancyRepo.findById(vacancyId);
  if (!vacancy) throw notFound('Vacancy not found');
  const company = ownCompany(user);
  if (vacancy.companyProfileId !== company.id) throw forbidden('This vacancy belongs to another company');
  return vacancy;
}

export function update(user, vacancyId, patch) {
  const vacancy = getOwned(user, vacancyId);
  return vacancyRepo.update(vacancy.id, patch);
}

export function remove(user, vacancyId) {
  const vacancy = getOwned(user, vacancyId);
  vacancyRepo.remove(vacancy.id);
  return { deleted: true, id: vacancy.id };
}

export function getPublic(vacancyId) {
  const vacancy = vacancyRepo.findById(vacancyId);
  if (!vacancy) throw notFound('Vacancy not found');
  return vacancy;
}

export function search(filters) {
  const { page, perPage, offset } = parsePagination(filters);
  const { items, total } = vacancyRepo.search(filters, { offset, perPage });
  return { items, meta: { page, perPage, total } };
}

export function listMine(user, filters) {
  const company = ownCompany(user);
  return search({ ...filters, companyProfileId: company.id });
}
