import mongoose from 'mongoose';
import { Review } from '../db/models.js';

const map = (doc) => doc && ({
  id: doc._id.toString(),
  subjectType: doc.subjectType,
  subjectId: doc.subjectId.toString(),
  authorUserId: doc.authorUserId ? doc.authorUserId.toString() : null,
  connectionId: doc.connectionId ? doc.connectionId.toString() : null,
  kind: doc.kind,
  rating: doc.rating,
  title: doc.title ?? null,
  body: doc.body,
  reviewerName: doc.reviewerName ?? null,
  reviewerRole: doc.reviewerRole ?? null,
  referredBy: doc.referredBy ?? null,
  isPublished: Boolean(doc.isPublished),
  createdAt: doc.createdAt.toISOString(),
});

export const findById = async (id) => map(await Review.findById(id));

export async function create(input) {
  const doc = await Review.create({
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    authorUserId: input.authorUserId ?? null,
    connectionId: input.connectionId ?? null,
    kind: input.kind ?? 'partner',
    rating: input.rating,
    title: input.title ?? null,
    body: input.body,
    reviewerName: input.reviewerName ?? null,
    reviewerRole: input.reviewerRole ?? null,
    referredBy: input.referredBy ?? null,
  });
  return map(doc);
}

export async function listForSubject(subjectType, subjectId, { kind, offset, perPage }) {
  const where = { subjectType, subjectId, isPublished: true };
  if (kind) where.kind = kind;

  const [total, docs] = await Promise.all([
    Review.countDocuments(where),
    Review.find(where).sort({ createdAt: -1 }).skip(offset).limit(perPage),
  ]);
  return { items: docs.map(map), total };
}

export async function hasReviewed(authorUserId, subjectType, subjectId) {
  return (await Review.exists({ authorUserId, subjectType, subjectId })) !== null;
}

/** Aggregate used to keep the denormalised rating on the profile in step. */
export async function aggregateForSubject(subjectType, subjectId) {
  const [result] = await Review.aggregate([
    { $match: { subjectType, subjectId: new mongoose.Types.ObjectId(subjectId), isPublished: true } },
    { $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$rating' } } },
  ]);
  return {
    count: result?.count ?? 0,
    average: Math.round((result?.average ?? 0) * 100) / 100,
  };
}

export async function ratingBreakdown(subjectType, subjectId) {
  const rows = await Review.aggregate([
    { $match: { subjectType, subjectId: new mongoose.Types.ObjectId(subjectId), isPublished: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of rows) breakdown[row._id] = row.count;
  return breakdown;
}
