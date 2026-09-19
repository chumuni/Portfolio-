import { z } from 'zod';
import { objectId } from '../../utils/objectId.js';

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1, 'Message cannot be empty').max(4000),
});

export const listMessagesSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(50).optional(),
});

export const connectionParamSchema = z.object({ connectionId: objectId });
