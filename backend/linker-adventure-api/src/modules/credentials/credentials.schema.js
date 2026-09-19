import { z } from 'zod';

export const createCredentialSchema = z.object({
  title: z.string().trim().min(2).max(150),
  issuer: z.string().trim().max(150).optional(),
  credentialType: z.enum(['certificate', 'licence', 'training', 'award', 'other']).optional(),
  issuedAt: z.string().trim().max(30).optional(),
  expiresAt: z.string().trim().max(30).optional(),
});

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
