import { z } from 'zod';

/** A MongoDB ObjectId as it arrives over HTTP: a 24-character hex string. */
export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
