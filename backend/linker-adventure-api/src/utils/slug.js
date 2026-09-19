import crypto from 'node:crypto';

export function slugify(input) {
  const base = String(input)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'profile';
}

/** Appends a short random suffix so slugs stay unique without a retry loop. */
export function uniqueSlug(input) {
  return `${slugify(input)}-${crypto.randomBytes(3).toString('hex')}`;
}
