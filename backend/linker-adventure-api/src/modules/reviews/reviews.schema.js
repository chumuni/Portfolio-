import { z } from 'zod';
import { objectId } from '../../utils/objectId.js';

export const createReviewSchema = z.object({
  subjectType: z.enum(['company', 'agent']),
  subjectId: objectId,
  kind: z.enum(['partner', 'tourist']).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(150).optional(),
  body: z.string().trim().min(10, 'Please write at least 10 characters').max(4000),
  reviewerName: z.string().trim().max(120).optional(),
  reviewerRole: z.string().trim().max(120).optional(),
  referredBy: z.string().trim().max(120).optional(),
});

export const listReviewsSchema = z.object({
  kind: z.enum(['partner', 'tourist']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(50).optional(),
});

export const subjectParamSchema = z.object({
  subjectType: z.enum(['company', 'agent']),
  subjectId: objectId,
});
