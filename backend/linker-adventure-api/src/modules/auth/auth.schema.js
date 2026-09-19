import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('A valid email address is required').max(255);

const password = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

/**
 * Accepts a real array (JSON callers) or a comma-separated string (multipart
 * form submissions, where every field arrives as text).
 */
const list = z.preprocess((value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}, z.array(z.string().trim().min(1)).max(25).optional());

export const registerCompanySchema = z.object({
  email,
  password,
  companyName: z.string().trim().min(2).max(120),
  country: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  tagline: z.string().trim().max(200).optional(),
  about: z.string().trim().max(4000).optional(),
  website: z.string().trim().url().max(255).optional(),
  phone: z.string().trim().max(40).optional(),
  tourTypes: list,
  destinations: list,
  languages: list,
  groupSizes: list,
  teamSize: z.coerce.number().int().positive().max(100000).optional(),
  foundedYear: z.coerce.number().int().min(1800).max(new Date().getFullYear()).optional(),
  licenceNumber: z.string().trim().max(80).optional(),
  managerName: z.string().trim().max(120).optional(),
  operatorName: z.string().trim().max(120).optional(),
  address: z.string().trim().max(255).optional(),
});

export const registerAgentSchema = z.object({
  email,
  password,
  fullName: z.string().trim().min(2).max(120),
  headline: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(4000).optional(),
  country: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(40).optional(),
  idNumber: z.string().trim().max(60).optional(),
  address: z.string().trim().max(255).optional(),
  specializations: list,
  tourTypes: list,
  languages: list,
  destinations: list,
  yearsExperience: z.coerce.number().int().min(0).max(70).optional(),
  availability: z.enum(['available_now', 'available_soon', 'unavailable']).optional(),
  remoteOnly: z.coerce.boolean().optional(),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
});

export const loginSchema = z.object({ email, password: z.string().min(1, 'Password is required') });

export const refreshSchema = z.object({ refreshToken: z.string().min(10) });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});
