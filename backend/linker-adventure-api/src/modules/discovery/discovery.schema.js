import { z } from 'zod';

/** Query strings arrive as `a,b,c` or repeated keys — normalise both. */
const csv = z.preprocess((value) => {
  if (value === undefined || value === '') return undefined;
  if (Array.isArray(value)) return value;
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}, z.array(z.string().max(60)).max(10).optional());

const bool = z.preprocess((value) => {
  if (value === undefined || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
}, z.boolean().optional());

const pagination = {
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(50).optional(),
};

export const searchAgentsSchema = z.object({
  q: z.string().trim().max(120).optional(),
  country: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  availability: z.enum(['available_now', 'available_soon', 'unavailable']).optional(),
  specializations: csv,
  tourTypes: csv,
  languages: csv,
  destinations: csv,
  minExperience: z.coerce.number().int().min(0).max(70).optional(),
  remoteOnly: bool,
  openToWork: bool,
  verified: bool,
  ...pagination,
});

export const searchCompaniesSchema = z.object({
  q: z.string().trim().max(120).optional(),
  country: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  tourTypes: csv,
  destinations: csv,
  languages: csv,
  groupSizes: csv,
  recruiting: bool,
  verified: bool,
  ...pagination,
});
