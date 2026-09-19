import { Message, Connection, CompanyProfile, AgentProfile } from '../db/models.js';

const map = (doc) => doc && ({
  id: doc._id.toString(),
  connectionId: doc.connectionId.toString(),
  senderUserId: doc.senderUserId.toString(),
  body: doc.body,
  readAt: doc.readAt ? doc.readAt.toISOString() : null,
  createdAt: doc.createdAt.toISOString(),
});

export async function create({ connectionId, senderUserId, body }) {
  const doc = await Message.create({ connectionId, senderUserId, body });
  return map(doc);
}

export async function listForConnection(connectionId, { offset, perPage }) {
  const [total, docs] = await Promise.all([
    Message.countDocuments({ connectionId }),
    Message.find({ connectionId }).sort({ createdAt: -1, _id: -1 }).skip(offset).limit(perPage),
  ]);
  return { items: docs.map(map).reverse(), total };
}

export async function markRead(connectionId, readerUserId) {
  const result = await Message.updateMany(
    { connectionId, senderUserId: { $ne: readerUserId }, readAt: null },
    { readAt: new Date() },
  );
  return result.modifiedCount;
}

export async function countUnreadForUser(userId) {
  const [company, agent] = await Promise.all([
    CompanyProfile.findOne({ userId }).select('_id'),
    AgentProfile.findOne({ userId }).select('_id'),
  ]);

  const or = [];
  if (company) or.push({ companyProfileId: company._id });
  if (agent) or.push({ agentProfileId: agent._id });
  if (or.length === 0) return 0;

  const connectionIds = await Connection.find({ $or: or }).distinct('_id');
  if (connectionIds.length === 0) return 0;

  return Message.countDocuments({
    connectionId: { $in: connectionIds },
    senderUserId: { $ne: userId },
    readAt: null,
  });
}
