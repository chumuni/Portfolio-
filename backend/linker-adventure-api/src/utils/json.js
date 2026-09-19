/** SQLite has no array type — list columns are stored as JSON text. */
export function parseList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serialiseList(value) {
  if (!value) return '[]';
  const list = Array.isArray(value) ? value : [value];
  return JSON.stringify(list.map((item) => String(item).trim()).filter(Boolean));
}

export function parseObject(value, fallback = {}) {
  if (value && typeof value === 'object') return value;
  try {
    return JSON.parse(value ?? '{}');
  } catch {
    return fallback;
  }
}
