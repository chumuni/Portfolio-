/**
 * End-to-end smoke test against a running server.
 *   npm run db:reset && npm run db:seed && npm start
 *   npm run smoke
 * Exits non-zero on the first failed assertion.
 */
const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const API = `${BASE}${process.env.API_PREFIX ?? '/api/v1'}`;

let passed = 0;
const failures = [];

function check(label, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${label}`);
  } else {
    failures.push(label);
    console.error(`  FAIL ${label}${detail ? ` — ${JSON.stringify(detail)}` : ''}`);
  }
}

async function call(method, path, { token, body } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => ({}));
  return { status: response.status, payload };
}

const unique = Date.now();

async function run() {
  console.log(`Smoke testing ${API}\n`);

  const health = await fetch(`${BASE}/health`).then((r) => r.json());
  check('health endpoint responds', health.status === 'ok', health);

  // --- registration -------------------------------------------------------
  const company = await call('POST', '/auth/register/company', {
    body: {
      email: `smoke.company.${unique}@example.com`,
      password: 'Passw0rd!',
      companyName: `Smoke Safaris ${unique}`,
      country: 'Tanzania',
      city: 'Mwanza',
      tourTypes: ['Safari'],
    },
  });
  check('company registration returns 201', company.status === 201, company.payload);
  const companyToken = company.payload?.data?.tokens?.accessToken;
  const companyProfileId = company.payload?.data?.profile?.id;

  const agent = await call('POST', '/auth/register/agent', {
    body: {
      email: `smoke.agent.${unique}@example.com`,
      password: 'Passw0rd!',
      fullName: `Smoke Agent ${unique}`,
      country: 'Kenya',
      specializations: ['Safari'],
      yearsExperience: 5,
    },
  });
  check('agent registration returns 201', agent.status === 201, agent.payload);
  const agentToken = agent.payload?.data?.tokens?.accessToken;
  const agentProfileId = agent.payload?.data?.profile?.id;

  // --- validation ---------------------------------------------------------
  const weak = await call('POST', '/auth/register/agent', {
    body: { email: 'bad', password: 'short', fullName: 'X' },
  });
  check('invalid registration is rejected with 400', weak.status === 400, weak.payload?.error?.code);

  const duplicate = await call('POST', '/auth/register/company', {
    body: { email: `smoke.company.${unique}@example.com`, password: 'Passw0rd!', companyName: 'Duplicate' },
  });
  check('duplicate email returns 409', duplicate.status === 409, duplicate.payload?.error?.code);

  // --- auth ---------------------------------------------------------------
  const me = await call('GET', '/auth/me', { token: companyToken });
  check('authenticated /auth/me works', me.status === 200 && me.payload.data.user.role === 'company');

  const anonymous = await call('GET', '/auth/me');
  check('unauthenticated /auth/me returns 401', anonymous.status === 401);

  const refreshed = await call('POST', '/auth/refresh', {
    body: { refreshToken: company.payload?.data?.tokens?.refreshToken },
  });
  check('refresh token rotation works', refreshed.status === 200 && !!refreshed.payload.data.tokens.accessToken);

  const replay = await call('POST', '/auth/refresh', {
    body: { refreshToken: company.payload?.data?.tokens?.refreshToken },
  });
  check('rotated refresh token cannot be replayed', replay.status === 401);

  // --- role enforcement ---------------------------------------------------
  const wrongRole = await call('POST', '/vacancies', {
    token: agentToken,
    body: { title: 'Agent should not post this', description: 'x'.repeat(30) },
  });
  check('agent cannot create a vacancy (403)', wrongRole.status === 403);

  // --- discovery ----------------------------------------------------------
  const discovery = await call('GET', '/discovery/agents?perPage=5', { token: companyToken });
  check('agent discovery returns a page', discovery.status === 200 && Array.isArray(discovery.payload.data));

  // --- mutual matching ----------------------------------------------------
  const interest = await call('POST', '/connections/interest', {
    token: companyToken,
    body: { targetProfileId: agentProfileId, note: 'Smoke test interest' },
  });
  check('company expresses interest', interest.status === 201 && interest.payload.data.matched === false);
  const connectionId = interest.payload?.data?.connection?.id;

  const earlyMessage = await call('POST', `/messages/${connectionId}`, {
    token: companyToken,
    body: { body: 'Should be blocked' },
  });
  check('messaging is blocked before a match', earlyMessage.status === 400, earlyMessage.payload?.error);

  const reciprocate = await call('POST', '/connections/interest', {
    token: agentToken,
    body: { targetProfileId: companyProfileId },
  });
  check('mutual interest produces a match', reciprocate.status === 201 && reciprocate.payload.data.matched === true);

  const message = await call('POST', `/messages/${connectionId}`, {
    token: companyToken,
    body: { body: 'Hello from the smoke test' },
  });
  check('messaging works once matched', message.status === 201);

  const history = await call('GET', `/messages/${connectionId}`, { token: agentToken });
  check('message history is readable by both parties', history.status === 200 && history.payload.data.length === 1);

  // --- vacancies and applications ----------------------------------------
  const vacancy = await call('POST', '/vacancies', {
    token: companyToken,
    body: {
      title: 'Smoke Test Vacancy',
      description: 'A description long enough to satisfy the validator rules.',
      tourType: 'Safari',
      isRemote: true,
    },
  });
  check('company creates a vacancy', vacancy.status === 201);
  const vacancyId = vacancy.payload?.data?.id;

  const application = await call('POST', `/vacancies/${vacancyId}/apply`, {
    token: agentToken,
    body: { coverLetter: 'I would like to represent this product.' },
  });
  check('agent applies to the vacancy', application.status === 201);

  const doubleApply = await call('POST', `/vacancies/${vacancyId}/apply`, { token: agentToken, body: {} });
  check('duplicate application returns 409', doubleApply.status === 409);

  const decision = await call('PATCH', `/applications/${application.payload?.data?.id}/decision`, {
    token: companyToken,
    body: { status: 'shortlisted' },
  });
  check('company shortlists the application', decision.status === 200 && decision.payload.data.status === 'shortlisted');

  // --- reviews ------------------------------------------------------------
  const review = await call('POST', '/reviews', {
    token: agentToken,
    body: {
      subjectType: 'company',
      subjectId: companyProfileId,
      rating: 5,
      body: 'Responsive, professional and well organised throughout.',
    },
  });
  check('matched agent can review the company', review.status === 201);

  // --- dashboard ----------------------------------------------------------
  const dashboard = await call('GET', '/analytics/dashboard', { token: companyToken });
  check('dashboard returns metrics', dashboard.status === 200 && dashboard.payload.data.connections.matched >= 1);

  const notFound = await call('GET', '/does-not-exist');
  check('unknown route returns 404 envelope', notFound.status === 404 && notFound.payload.success === false);

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.error('Failed checks:', failures.join(', '));
    process.exit(1);
  }
}

run().catch((error) => {
  console.error('Smoke test crashed:', error.message);
  process.exit(1);
});
