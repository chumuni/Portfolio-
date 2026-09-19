/** Escapes user input for safe use inside a `new RegExp(...)` (e.g. free-text search). */
export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
