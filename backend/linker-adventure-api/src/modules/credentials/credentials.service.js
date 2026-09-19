import * as credentialRepo from '../../repositories/credential.repo.js';
import * as profileRepo from '../../repositories/profile.repo.js';
import { publicUploadPath } from '../../middleware/upload.js';
import { notFound, forbidden } from '../../utils/AppError.js';

function ownAgent(user) {
  const agent = profileRepo.findAgentByUserId(user.id);
  if (!agent) throw notFound('Agent profile not found');
  return agent;
}

export function listMine(user) {
  return credentialRepo.listForAgent(ownAgent(user).id);
}

export function create(user, input, file) {
  const agent = ownAgent(user);
  return credentialRepo.create(agent.id, { ...input, fileUrl: file ? publicUploadPath(file.filename) : null });
}

export function remove(user, credentialId) {
  const agent = ownAgent(user);
  const credential = credentialRepo.findById(credentialId);

  if (!credential) throw notFound('Credential not found');
  if (credential.agentProfileId !== agent.id) throw forbidden('This credential is not yours');

  credentialRepo.remove(credential.id);
  return { deleted: true, id: credential.id };
}
