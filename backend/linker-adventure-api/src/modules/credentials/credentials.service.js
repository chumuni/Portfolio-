import * as credentialRepo from '../../repositories/credential.repo.js';
import * as profileRepo from '../../repositories/profile.repo.js';
import { publicUploadPath } from '../../middleware/upload.js';
import { notFound, forbidden } from '../../utils/AppError.js';

async function ownAgent(user) {
  const agent = await profileRepo.findAgentByUserId(user.id);
  if (!agent) throw notFound('Agent profile not found');
  return agent;
}

export async function listMine(user) {
  const agent = await ownAgent(user);
  return credentialRepo.listForAgent(agent.id);
}

export async function create(user, input, file) {
  const agent = await ownAgent(user);
  return credentialRepo.create(agent.id, { ...input, fileUrl: file ? publicUploadPath(file.filename) : null });
}

export async function remove(user, credentialId) {
  const agent = await ownAgent(user);
  const credential = await credentialRepo.findById(credentialId);

  if (!credential) throw notFound('Credential not found');
  if (credential.agentProfileId !== agent.id) throw forbidden('This credential is not yours');

  await credentialRepo.remove(credential.id);
  return { deleted: true, id: credential.id };
}
