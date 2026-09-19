import { z } from 'zod';

export const dashboardSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional(),
});

export const notificationsSchema = z.object({
  unreadOnly: z.preprocess(
    (value) => (value === undefined || value === '' ? undefined : ['true', '1', 'yes'].includes(String(value).toLowerCase())),
    z.boolean().optional(),
  ),
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(50).optional(),
});
