import { z } from 'zod';

const list = z.array(z.string().trim().min(1)).max(25).optional();

export const updateCompanySchema = z.object({
  companyName: z.string().trim().min(2).max(120).optional(),
  tagline: z.string().trim().max(200).optional(),
  about: z.string().trim().max(4000).optional(),
  country: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  website: z.string().trim().url().max(255).optional(),
  phone: z.string().trim().max(40).optional(),
  teamSize: z.coerce.number().int().positive().max(100000).optional(),
  foundedYear: z.coerce.number().int().min(1800).max(new Date().getFullYear()).optional(),
  licenceNumber: z.string().trim().max(80).optional(),
  isRecruiting: z.coerce.boolean().optional(),
  tourTypes: list,
  destinations: list,
  languages: list,
  groupSizes: list,
}).strict();

export const updateAgentSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  headline: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(4000).optional(),
  country: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(40).optional(),
  yearsExperience: z.coerce.number().int().min(0).max(70).optional(),
  availability: z.enum(['available_now', 'available_soon', 'unavailable']).optional(),
  remoteOnly: z.coerce.boolean().optional(),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  isOpenToWork: z.coerce.boolean().optional(),
  specializations: list,
  tourTypes: list,
  languages: list,
  destinations: list,
}).strict();

export const slugParamSchema = z.object({ slug: z.string().trim().min(1).max(80) });
