import { z } from 'zod';

export const expressInterestSchema = z.object({
  targetProfileId: z.coerce.number().int().positive(),
  note: z.string().trim().max(500).optional(),
});

export const listConnectionsSchema = z.object({
  status: z.enum(['pending', 'matched', 'declined', 'archived']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(50).optional(),
});

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
