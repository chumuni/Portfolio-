/** One response envelope for the whole API, so clients parse one shape. */
export function ok(res, data, meta) {
  return res.status(200).json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function created(res, data) {
  return res.status(201).json({ success: true, data });
}

export function noContent(res) {
  return res.status(204).send();
}

export function paginated(res, items, { page, perPage, total }) {
  return res.status(200).json({
    success: true,
    data: items,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
      hasNextPage: page * perPage < total,
    },
  });
}
