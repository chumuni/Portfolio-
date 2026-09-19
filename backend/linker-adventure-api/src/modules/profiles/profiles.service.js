import * as profileRepo from '../../repositories/profile.repo.js';
import * as credentialRepo from '../../repositories/credential.repo.js';
import * as reviewRepo from '../../repositories/review.repo.js';
import * as analyticsRepo from '../../repositories/analytics.repo.js';
import * as connectionRepo from '../../repositories/connection.repo.js';
import { notFound, badRequest } from '../../utils/AppError.js';
import { publicUploadPath } from '../../middleware/upload.js';

/** Resolves the profile owned by the authenticated user, whatever their role. */
export function requireOwnProfile(user) {
  const profile = user.role === 'company'
    ? profileRepo.findCompanyByUserId(user.id)
    : profileRepo.findAgentByUserId(user.id);
  if (!profile) throw notFound('Your profile has not been set up yet');
  return profile;
}

export function updateOwnProfile(user, patch) {
  const profile = requireOwnProfile(user);
  return user.role === 'company'
    ? profileRepo.updateCompanyProfile(profile.id, patch)
    : profileRepo.updateAgentProfile(profile.id, patch);
}

const COMPANY_SLOTS = { logo: 'logoUrl', cover: 'coverUrl', licence: 'licenceUrl' };
const AGENT_SLOTS = { photo: 'photoUrl', cover: 'coverUrl', cv: 'cvUrl' };

export function attachUpload(user, slot, file) {
  if (!file) throw badRequest('No file was uploaded');

  const slots = user.role === 'company' ? COMPANY_SLOTS : AGENT_SLOTS;
  const field = slots[slot];
  if (!field) throw badRequest(`Unknown upload slot "${slot}". Expected one of: ${Object.keys(slots).join(', ')}`);

  const profile = requireOwnProfile(user);
  const patch = { [field]: publicUploadPath(file.filename) };

  return user.role === 'company'
    ? profileRepo.updateCompanyProfile(profile.id, patch)
    : profileRepo.updateAgentProfile(profile.id, patch);
}

/** Public profile view: profile + credentials + reviews + viewer relationship. */
export function getPublicCompany(slug, viewer) {
  const company = profileRepo.findCompanyBySlug(slug);
  if (!company) throw notFound('Company profile not found');

  recordView('company', company.id, viewer);

  return {
    ...company,
    reviews: reviewRepo.listForSubject('company', company.id, { offset: 0, perPage: 5 }).items,
    ratingBreakdown: reviewRepo.ratingBreakdown('company', company.id),
    relationship: relationshipFor(viewer, { companyProfileId: company.id }),
  };
}

export function getPublicAgent(slug, viewer) {
  const agent = profileRepo.findAgentBySlug(slug);
  if (!agent) throw notFound('Agent profile not found');

  recordView('agent', agent.id, viewer);

  return {
    ...agent,
    credentials: credentialRepo.listForAgent(agent.id),
    reviews: reviewRepo.listForSubject('agent', agent.id, { offset: 0, perPage: 5 }).items,
    ratingBreakdown: reviewRepo.ratingBreakdown('agent', agent.id),
    relationship: relationshipFor(viewer, { agentProfileId: agent.id }),
  };
}

function recordView(subjectType, subjectId, viewer) {
  // Owners viewing their own page should not inflate their numbers.
  const ownProfile = viewer ? safeOwnProfile(viewer) : null;
  const isOwner = ownProfile && viewer.role === subjectType && ownProfile.id === subjectId;
  if (isOwner) return;
  analyticsRepo.recordProfileView({ subjectType, subjectId, viewerUserId: viewer?.id ?? null });
}

function safeOwnProfile(user) {
  try {
    return requireOwnProfile(user);
  } catch {
    return null;
  }
}

/** Tells the client whether the viewer is connected/matched with this profile. */
function relationshipFor(viewer, target) {
  if (!viewer) return { status: 'anonymous' };
  const ownProfile = safeOwnProfile(viewer);
  if (!ownProfile) return { status: 'none' };

  let connection = null;
  if (viewer.role === 'company' && target.agentProfileId) {
    connection = connectionRepo.findPair(ownProfile.id, target.agentProfileId);
  } else if (viewer.role === 'agent' && target.companyProfileId) {
    connection = connectionRepo.findPair(target.companyProfileId, ownProfile.id);
  } else {
    return { status: 'same_role' };
  }

  if (!connection) return { status: 'none' };
  return { status: connection.status, connectionId: connection.id };
}
