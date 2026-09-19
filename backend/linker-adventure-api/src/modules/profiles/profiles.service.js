import * as profileRepo from '../../repositories/profile.repo.js';
import * as credentialRepo from '../../repositories/credential.repo.js';
import * as reviewRepo from '../../repositories/review.repo.js';
import * as analyticsRepo from '../../repositories/analytics.repo.js';
import * as connectionRepo from '../../repositories/connection.repo.js';
import { notFound, badRequest } from '../../utils/AppError.js';
import { publicUploadPath } from '../../middleware/upload.js';

/** Resolves the profile owned by the authenticated user, whatever their role. */
export async function requireOwnProfile(user) {
  const profile = user.role === 'company'
    ? await profileRepo.findCompanyByUserId(user.id)
    : await profileRepo.findAgentByUserId(user.id);
  if (!profile) throw notFound('Your profile has not been set up yet');
  return profile;
}

export async function updateOwnProfile(user, patch) {
  const profile = await requireOwnProfile(user);
  return user.role === 'company'
    ? profileRepo.updateCompanyProfile(profile.id, patch)
    : profileRepo.updateAgentProfile(profile.id, patch);
}

const COMPANY_SLOTS = { logo: 'logoUrl', cover: 'coverUrl', licence: 'licenceUrl' };
const AGENT_SLOTS = { photo: 'photoUrl', cover: 'coverUrl', cv: 'cvUrl' };

export async function attachUpload(user, slot, file) {
  if (!file) throw badRequest('No file was uploaded');

  const slots = user.role === 'company' ? COMPANY_SLOTS : AGENT_SLOTS;
  const field = slots[slot];
  if (!field) throw badRequest(`Unknown upload slot "${slot}". Expected one of: ${Object.keys(slots).join(', ')}`);

  const profile = await requireOwnProfile(user);
  const patch = { [field]: publicUploadPath(file.filename) };

  return user.role === 'company'
    ? profileRepo.updateCompanyProfile(profile.id, patch)
    : profileRepo.updateAgentProfile(profile.id, patch);
}

/** Public profile view: profile + credentials + reviews + viewer relationship. */
export async function getPublicCompany(slug, viewer) {
  const company = await profileRepo.findCompanyBySlug(slug);
  if (!company) throw notFound('Company profile not found');

  await recordView('company', company.id, viewer);

  const [reviews, ratingBreakdown, relationship] = await Promise.all([
    reviewRepo.listForSubject('company', company.id, { offset: 0, perPage: 5 }).then((r) => r.items),
    reviewRepo.ratingBreakdown('company', company.id),
    relationshipFor(viewer, { companyProfileId: company.id }),
  ]);

  return { ...company, reviews, ratingBreakdown, relationship };
}

export async function getPublicAgent(slug, viewer) {
  const agent = await profileRepo.findAgentBySlug(slug);
  if (!agent) throw notFound('Agent profile not found');

  await recordView('agent', agent.id, viewer);

  const [credentials, reviews, ratingBreakdown, relationship] = await Promise.all([
    credentialRepo.listForAgent(agent.id),
    reviewRepo.listForSubject('agent', agent.id, { offset: 0, perPage: 5 }).then((r) => r.items),
    reviewRepo.ratingBreakdown('agent', agent.id),
    relationshipFor(viewer, { agentProfileId: agent.id }),
  ]);

  return { ...agent, credentials, reviews, ratingBreakdown, relationship };
}

async function recordView(subjectType, subjectId, viewer) {
  // Owners viewing their own page should not inflate their numbers.
  const ownProfile = viewer ? await safeOwnProfile(viewer) : null;
  const isOwner = ownProfile && viewer.role === subjectType && ownProfile.id === subjectId;
  if (isOwner) return;
  await analyticsRepo.recordProfileView({ subjectType, subjectId, viewerUserId: viewer?.id ?? null });
}

async function safeOwnProfile(user) {
  try {
    return await requireOwnProfile(user);
  } catch {
    return null;
  }
}

/** Tells the client whether the viewer is connected/matched with this profile. */
async function relationshipFor(viewer, target) {
  if (!viewer) return { status: 'anonymous' };
  const ownProfile = await safeOwnProfile(viewer);
  if (!ownProfile) return { status: 'none' };

  let connection = null;
  if (viewer.role === 'company' && target.agentProfileId) {
    connection = await connectionRepo.findPair(ownProfile.id, target.agentProfileId);
  } else if (viewer.role === 'agent' && target.companyProfileId) {
    connection = await connectionRepo.findPair(target.companyProfileId, ownProfile.id);
  } else {
    return { status: 'same_role' };
  }

  if (!connection) return { status: 'none' };
  return { status: connection.status, connectionId: connection.id };
}
