/**
 * Mongoose collections for the Linker Adventure API.
 *
 * One file for all of them: there are twelve small schemas here, and keeping
 * them together is easier to scan than a folder of one-liners. Field names
 * are camelCase per Mongo convention; repositories translate to/from the
 * snake_case shape older callers (auth.service.js, etc.) still expect.
 */
import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ['company', 'agent', 'admin'] },
  status: { type: String, required: true, enum: ['active', 'suspended', 'deleted'], default: 'active' },
  emailVerified: { type: Boolean, default: false },
  lastLoginAt: { type: Date, default: null },
}, { timestamps: true });

const refreshTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  userAgent: { type: String, default: null },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
}, { timestamps: { createdAt: true, updatedAt: false } });

const companyProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  companyName: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  tagline: String,
  about: String,
  country: String,
  city: String,
  website: String,
  phone: String,
  address: String,
  managerName: String,
  operatorName: String,
  logoPath: String,
  coverPath: String,
  licensePath: String,
  licenseNumber: String,
  tourTypes: { type: [String], default: [] },
  destinations: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  groupSizes: { type: [String], default: [] },
  teamSize: Number,
  foundedYear: Number,
  isVerified: { type: Boolean, default: false },
  isRecruiting: { type: Boolean, default: false },
  ratingAverage: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
}, { timestamps: true });
companyProfileSchema.index({ country: 1, city: 1 });
companyProfileSchema.index({ isRecruiting: 1 });

const agentProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  headline: String,
  bio: String,
  country: String,
  city: String,
  phone: String,
  idNumber: String,
  address: String,
  photoPath: String,
  coverPath: String,
  cvPath: String,
  specializations: { type: [String], default: [] },
  tourTypes: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  destinations: { type: [String], default: [] },
  yearsExperience: { type: Number, default: 0 },
  availability: { type: String, enum: ['available_now', 'available_soon', 'unavailable'], default: 'available_now' },
  remoteOnly: { type: Boolean, default: false },
  commissionRate: Number,
  isVerified: { type: Boolean, default: false },
  isOpenToWork: { type: Boolean, default: true },
  ratingAverage: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
}, { timestamps: true });
agentProfileSchema.index({ country: 1, city: 1 });
agentProfileSchema.index({ availability: 1, isOpenToWork: 1 });

const credentialSchema = new Schema({
  agentProfileId: { type: Schema.Types.ObjectId, ref: 'AgentProfile', required: true, index: true },
  title: { type: String, required: true },
  issuer: String,
  credentialType: { type: String, enum: ['certificate', 'licence', 'training', 'award', 'other'], default: 'certificate' },
  issuedAt: String,
  expiresAt: String,
  filePath: String,
  isVerified: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } });

const connectionSchema = new Schema({
  companyProfileId: { type: Schema.Types.ObjectId, ref: 'CompanyProfile', required: true },
  agentProfileId: { type: Schema.Types.ObjectId, ref: 'AgentProfile', required: true },
  initiatedBy: { type: String, enum: ['company', 'agent'], required: true },
  companyInterested: { type: Boolean, default: false },
  agentInterested: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'matched', 'declined', 'archived'], default: 'pending' },
  note: String,
  matchedAt: Date,
}, { timestamps: true });
connectionSchema.index({ companyProfileId: 1, agentProfileId: 1 }, { unique: true });
connectionSchema.index({ companyProfileId: 1, status: 1 });
connectionSchema.index({ agentProfileId: 1, status: 1 });

const messageSchema = new Schema({
  connectionId: { type: Schema.Types.ObjectId, ref: 'Connection', required: true, index: true },
  senderUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  readAt: Date,
}, { timestamps: { createdAt: true, updatedAt: false } });

const vacancySchema = new Schema({
  companyProfileId: { type: Schema.Types.ObjectId, ref: 'CompanyProfile', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  destination: String,
  tourType: String,
  engagementType: { type: String, enum: ['contract', 'commission', 'full_time', 'seasonal'], default: 'contract' },
  isRemote: { type: Boolean, default: false },
  openings: { type: Number, default: 1 },
  tags: { type: [String], default: [] },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  closesAt: Date,
}, { timestamps: true });

const applicationSchema = new Schema({
  vacancyId: { type: Schema.Types.ObjectId, ref: 'Vacancy', required: true },
  agentProfileId: { type: Schema.Types.ObjectId, ref: 'AgentProfile', required: true },
  coverLetter: String,
  status: { type: String, enum: ['submitted', 'shortlisted', 'accepted', 'rejected', 'withdrawn'], default: 'submitted' },
}, { timestamps: true });
applicationSchema.index({ vacancyId: 1, agentProfileId: 1 }, { unique: true });

const reviewSchema = new Schema({
  subjectType: { type: String, enum: ['company', 'agent'], required: true },
  subjectId: { type: Schema.Types.ObjectId, required: true },
  authorUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  connectionId: { type: Schema.Types.ObjectId, ref: 'Connection', default: null },
  kind: { type: String, enum: ['partner', 'tourist'], default: 'partner' },
  rating: { type: Number, min: 1, max: 5, required: true },
  title: String,
  body: { type: String, required: true },
  reviewerName: String,
  reviewerRole: String,
  referredBy: String,
  isPublished: { type: Boolean, default: true },
}, { timestamps: { createdAt: true, updatedAt: false } });
reviewSchema.index({ subjectType: 1, subjectId: 1, isPublished: 1 });

const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  body: String,
  payload: { type: Schema.Types.Mixed, default: {} },
  readAt: Date,
}, { timestamps: { createdAt: true, updatedAt: false } });

const profileViewSchema = new Schema({
  subjectType: { type: String, enum: ['company', 'agent'], required: true },
  subjectId: { type: Schema.Types.ObjectId, required: true },
  viewerUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: { createdAt: 'viewedAt', updatedAt: false } });
profileViewSchema.index({ subjectType: 1, subjectId: 1, viewedAt: 1 });

export const User = mongoose.model('User', userSchema);
export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export const CompanyProfile = mongoose.model('CompanyProfile', companyProfileSchema);
export const AgentProfile = mongoose.model('AgentProfile', agentProfileSchema);
export const Credential = mongoose.model('Credential', credentialSchema);
export const Connection = mongoose.model('Connection', connectionSchema);
export const Message = mongoose.model('Message', messageSchema);
export const Vacancy = mongoose.model('Vacancy', vacancySchema);
export const Application = mongoose.model('Application', applicationSchema);
export const Review = mongoose.model('Review', reviewSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
export const ProfileView = mongoose.model('ProfileView', profileViewSchema);
