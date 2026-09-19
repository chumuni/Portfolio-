import { z } from 'zod';
import { objectId } from '../../utils/objectId.js';

export const applySchema = z.object({
  coverLetter: z.string().trim().max(4000).optional(),
});

export const listSchema = z.object({
  status: z.enum(['submitted', 'shortlisted', 'accepted', 'rejected', 'withdrawn']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(50).optional(),
});

export const decisionSchema = z.object({
  status: z.enum(['shortlisted', 'accepted', 'rejected']),
});

export const idParamSchema = z.object({ id: objectId });
