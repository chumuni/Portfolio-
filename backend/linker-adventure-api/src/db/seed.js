import { closeDb, connectDb } from './index.js';
import { User } from './models.js';
import { runMigrations } from './migrate.js';
import { logger } from '../config/logger.js';
import * as userRepo from '../repositories/user.repo.js';
import * as profileRepo from '../repositories/profile.repo.js';
import * as connectionRepo from '../repositories/connection.repo.js';
import * as vacancyRepo from '../repositories/vacancy.repo.js';
import * as reviewRepo from '../repositories/review.repo.js';
import * as credentialRepo from '../repositories/credential.repo.js';
import { hashPassword } from '../utils/password.js';

const DEMO_PASSWORD = 'Passw0rd!';

const COMPANIES = [
  {
    email: 'ops@serengetihorizon.co.tz',
    companyName: 'Serengeti Horizon Safaris',
    tagline: 'Small-group migration safaris out of Arusha',
    about: 'Family-run operator running Northern Circuit safaris since 2011, with our own fleet and guides.',
    country: 'Tanzania', city: 'Arusha',
    tourTypes: ['Safari', 'Adventure', 'Photography'],
    destinations: ['Serengeti', 'Ngorongoro', 'Tarangire'],
    languages: ['English', 'Swahili'],
    groupSizes: ['Private (1-4)', 'Small Group (5-12)'],
    teamSize: 24, foundedYear: 2011, isRecruiting: true,
  },
  {
    email: 'partners@zanzibarblue.co.tz',
    companyName: 'Zanzibar Blue Expeditions',
    tagline: 'Island escapes, dhow charters and reef diving',
    about: 'Coastal specialist combining Stone Town culture with marine conservation experiences.',
    country: 'Tanzania', city: 'Zanzibar',
    tourTypes: ['Beach', 'Cultural', 'Eco-tourism'],
    destinations: ['Zanzibar', 'Pemba', 'Mafia Island'],
    languages: ['English', 'Swahili', 'Italian'],
    groupSizes: ['Private (1-4)', 'Large Group (13+)'],
    teamSize: 12, foundedYear: 2016, isRecruiting: true,
  },
  {
    email: 'hello@kilimanjarotrails.co.tz',
    companyName: 'Kilimanjaro Trails Co.',
    tagline: 'Summit-focused trekking with a 94% success rate',
    about: 'Mountain-only operator on all seven Kilimanjaro routes, KPAP partner for fair porter treatment.',
    country: 'Tanzania', city: 'Moshi',
    tourTypes: ['Trekking', 'Adventure'],
    destinations: ['Kilimanjaro', 'Mount Meru'],
    languages: ['English', 'Swahili', 'German'],
    groupSizes: ['Small Group (5-12)'],
    teamSize: 40, foundedYear: 2008, isRecruiting: false,
  },
];

const AGENTS = [
  {
    email: 'amina.hassan@example.com',
    fullName: 'Amina Hassan',
    headline: 'Luxury safari specialist | East Africa',
    bio: 'Twelve years placing high-value clients with vetted East African operators. Based in Dar es Salaam.',
    country: 'Tanzania', city: 'Dar es Salaam',
    specializations: ['Luxury Travel', 'Safari', 'Honeymoon'],
    tourTypes: ['Safari', 'Beach'],
    languages: ['English', 'Swahili', 'Arabic'],
    destinations: ['Serengeti', 'Zanzibar'],
    yearsExperience: 12, availability: 'available_now', commissionRate: 12.5,
  },
  {
    email: 'j.mwangi@example.com',
    fullName: 'Joseph Mwangi',
    headline: 'Adventure and trekking agent | Nairobi',
    bio: 'Sends European trekking groups to Kilimanjaro and Mount Kenya every season.',
    country: 'Kenya', city: 'Nairobi',
    specializations: ['Trekking', 'Adventure', 'Group Travel'],
    tourTypes: ['Trekking', 'Adventure'],
    languages: ['English', 'Swahili'],
    destinations: ['Kilimanjaro', 'Mount Kenya'],
    yearsExperience: 8, availability: 'available_now', remoteOnly: true,
  },
  {
    email: 'sofia.lindqvist@example.com',
    fullName: 'Sofia Lindqvist',
    headline: 'Nordic outbound agent | eco and wildlife travel',
    bio: 'Places Scandinavian travellers with certified eco-tourism operators across Africa.',
    country: 'Sweden', city: 'Stockholm',
    specializations: ['Eco-tourism', 'Wildlife', 'Family Travel'],
    tourTypes: ['Safari', 'Eco-tourism'],
    languages: ['English', 'Swedish', 'German'],
    destinations: ['Serengeti', 'Ngorongoro'],
    yearsExperience: 6, availability: 'available_soon',
  },
  {
    email: 'daniel.okoro@example.com',
    fullName: 'Daniel Okoro',
    headline: 'Corporate and incentive travel | Lagos',
    bio: 'Builds incentive trips and team retreats for West African corporates.',
    country: 'Nigeria', city: 'Lagos',
    specializations: ['Corporate Travel', 'Incentive Trips'],
    tourTypes: ['Cultural', 'Beach'],
    languages: ['English', 'French'],
    destinations: ['Zanzibar', 'Cape Town'],
    yearsExperience: 4, availability: 'available_now',
  },
];

async function seed() {
  await connectDb();
  await runMigrations();

  if ((await User.countDocuments()) > 0) {
    logger.warn('Database already contains users — skipping seed. Run `npm run db:reset` first to reseed.');
    return;
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const companies = [];
  for (const input of COMPANIES) {
    const user = await userRepo.create({ email: input.email, passwordHash, role: 'company' });
    const profile = await profileRepo.createCompanyProfile(user.id, input);
    companies.push(await profileRepo.updateCompanyProfile(profile.id, { isRecruiting: input.isRecruiting ?? false }));
  }

  const agents = [];
  for (const input of AGENTS) {
    const user = await userRepo.create({ email: input.email, passwordHash, role: 'agent' });
    agents.push(await profileRepo.createAgentProfile(user.id, input));
  }

  await credentialRepo.create(agents[0].id, {
    title: 'Certified Tourism Professional (CTP)',
    issuer: 'Global Travel Association',
    credentialType: 'certificate',
    issuedAt: '2022-01-15',
    expiresAt: '2026-01-15',
  });
  await credentialRepo.create(agents[1].id, {
    title: 'Wilderness First Responder',
    issuer: 'NOLS',
    credentialType: 'training',
    issuedAt: '2023-08-02',
  });

  // A fully matched pair, plus a one-sided pending one to show the gate working.
  const matched = await connectionRepo.create({
    companyProfileId: companies[0].id,
    agentProfileId: agents[0].id,
    initiatedBy: 'company',
    note: 'Your luxury client base is a strong fit for our private migration departures.',
  });
  await connectionRepo.setInterest(matched.id, 'agent', true);
  await connectionRepo.markMatched(matched.id);

  await connectionRepo.create({
    companyProfileId: companies[1].id,
    agentProfileId: agents[3].id,
    initiatedBy: 'agent',
    note: 'Interested in your dhow charters for a 30-person incentive group.',
  });

  await vacancyRepo.create(companies[0].id, {
    title: 'European Market Agent — Migration Season',
    description: 'We are looking for agents with an established European client base to sell our June–October migration departures. Commission-based, with familiarisation trip included.',
    destination: 'Serengeti',
    tourType: 'Safari',
    engagementType: 'commission',
    isRemote: true,
    openings: 3,
    tags: ['Safari', 'Europe', 'Commission'],
  });
  await vacancyRepo.create(companies[1].id, {
    title: 'Beach and Diving Specialist Agent',
    description: 'Represent our Zanzibar reef and dhow programmes in the Gulf and East Asian markets. Training on our full product line provided.',
    destination: 'Zanzibar',
    tourType: 'Beach',
    engagementType: 'contract',
    isRemote: true,
    openings: 2,
    tags: ['Beach', 'Diving'],
  });

  await reviewRepo.create({
    subjectType: 'company', subjectId: companies[0].id,
    authorUserId: agents[0].userId, connectionId: matched.id,
    kind: 'partner', rating: 5,
    title: 'Reliable operator, excellent communication',
    body: 'Three seasons of bookings without a single service failure. Quotes come back within hours and their guides are consistently praised by my clients.',
    reviewerName: 'Amina Hassan', reviewerRole: 'Luxury Safari Specialist',
  });
  await reviewRepo.create({
    subjectType: 'company', subjectId: companies[0].id,
    kind: 'tourist', rating: 5,
    body: 'Our seven-day migration safari was flawless from airport pickup to the final camp. The guiding made the trip.',
    reviewerName: 'Elena Rodriguez', referredBy: 'Amina Hassan',
  });
  const aggregate = await reviewRepo.aggregateForSubject('company', companies[0].id);
  await profileRepo.applyRating('company', companies[0].id, aggregate);

  logger.info('Seed complete', {
    companies: companies.length,
    agents: agents.length,
    password: DEMO_PASSWORD,
    sampleCompanyLogin: COMPANIES[0].email,
    sampleAgentLogin: AGENTS[0].email,
  });
}

seed()
  .then(closeDb)
  .catch(async (error) => {
    logger.error(`Seed failed: ${error.message}`);
    await closeDb();
    process.exit(1);
  });
