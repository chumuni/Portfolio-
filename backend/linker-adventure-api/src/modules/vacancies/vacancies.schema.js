import { z } from 'zod';

const bool = z.preprocess((value) => {
  if (value === undefined || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
}, z.boolean().optional());

export const createVacancySchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(20).max(8000),
  destination: z.string().trim().max(120).optional(),
  tourType: z.string().trim().max(60).optional(),
  engagementType: z.enum(['contract', 'commission', 'full_time', 'seasonal']).optional(),
  isRemote: bool,
  openings: z.coerce.number().int().min(1).max(500).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(15).optional(),
  closesAt: z.string().datetime().optional(),
});

export const updateVacancySchema = createVacancySchema.partial().extend({
  status: z.enum(['open', 'closed']).optional(),
});

export const searchVacanciesSchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(['open', 'closed']).optional(),
  tourType: z.string().trim().max(60).optional(),
  destination: z.string().trim().max(120).optional(),
  engagementType: z.enum(['contract', 'commission', 'full_time', 'seasonal']).optional(),
  isRemote: bool,
  companyProfileId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(50).optional(),
});

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
