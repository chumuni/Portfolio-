const MAX_PER_PAGE = 50;

export function parsePagination(queryParams = {}) {
  const page = Math.max(1, Number.parseInt(queryParams.page ?? '1', 10) || 1);
  const requested = Number.parseInt(queryParams.perPage ?? '12', 10) || 12;
  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, requested));
  return { page, perPage, offset: (page - 1) * perPage };
}
