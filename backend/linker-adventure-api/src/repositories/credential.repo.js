import { Credential } from '../db/models.js';

const map = (doc) => doc && ({
  id: doc._id.toString(),
  agentProfileId: doc.agentProfileId.toString(),
  title: doc.title,
  issuer: doc.issuer ?? null,
  credentialType: doc.credentialType,
  issuedAt: doc.issuedAt ?? null,
  expiresAt: doc.expiresAt ?? null,
  fileUrl: doc.filePath ?? null,
  isVerified: Boolean(doc.isVerified),
  createdAt: doc.createdAt.toISOString(),
});

export const findById = async (id) => map(await Credential.findById(id));

export async function listForAgent(agentProfileId) {
  const docs = await Credential.find({ agentProfileId }).sort({ issuedAt: -1, createdAt: -1 });
  return docs.map(map);
}

export async function create(agentProfileId, input) {
  const doc = await Credential.create({
    agentProfileId,
    title: input.title,
    issuer: input.issuer ?? null,
    credentialType: input.credentialType ?? 'certificate',
    issuedAt: input.issuedAt ?? null,
    expiresAt: input.expiresAt ?? null,
    filePath: input.fileUrl ?? null,
  });
  return map(doc);
}

export async function remove(id) {
  const result = await Credential.deleteOne({ _id: id });
  return result.deletedCount > 0;
}
