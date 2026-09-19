# Linker Adventure API

Backend for the B2B tourism matchmaking platform that connects **tour companies** with **tour agents**.

Built on **Node.js 22 + Express**, with **`node:sqlite`** as the database — no native compilation, no external database server, deployable anywhere Node runs.

---

## Why this stack

Your earlier build already settled on `node:sqlite` specifically to avoid native build failures on hosts like Render. That decision is preserved. What changed is the *structure* around it:

| Before | Now |
| --- | --- |
| SQL scattered through route handlers | All SQL isolated in `src/repositories/` |
| Ad-hoc validation | `zod` schemas that strip and whitelist every input |
| Mixed response shapes | One envelope: `{ success, data, meta }` / `{ success, error }` |
| Schema created on boot | Versioned, append-only migrations |
| JWT only | Access + rotating refresh tokens, stored hashed |
| 5 tables | 12 tables covering credentials, vacancies, applications, reviews, notifications, analytics |

---

## Architecture

Requests flow in one direction. Each layer has exactly one job.

```
route  →  middleware  →  controller  →  service  →  repository  →  SQLite
         (auth,          (HTTP in/out,  (business   (all SQL)
          validation,     nothing else)  rules)
          rate limit)
```

```
src/
├── server.js                 Bootstrap: migrate, listen, graceful shutdown
├── app.js                    Express assembly (helmet, cors, logging, routes)
├── routes.js                 Mounts every module under /api/v1
├── config/
│   ├── env.js                Typed config, fails fast on missing secrets
│   └── logger.js             Structured JSON logs in production
├── db/
│   ├── index.js              Connection, query helpers, transactions
│   ├── migrations.js         Append-only schema history
│   ├── migrate.js            Versioned runner
│   ├── seed.js               Realistic East African demo data
│   └── reset.js              Drop and rebuild
├── middleware/
│   ├── authenticate.js       Bearer token → req.user (+ optionalAuth)
│   ├── authorize.js          Role gate: authorize('company')
│   ├── validate.js           Zod validation; REPLACES req.body with clean data
│   ├── upload.js             Multer: type + size limits, random filenames
│   ├── rateLimiters.js       Global + stricter auth limiter
│   └── errorHandler.js       Every error → one response shape
├── repositories/             ← the ONLY place SQL is written
├── modules/                  ← one folder per domain
│   └── <name>/{routes,controller,service,schema}.js
└── utils/                    AppError, asyncHandler, pagination, tokens, slugs
```

**The rule worth keeping:** a controller never touches SQL, and a repository never throws HTTP errors. If you need a new feature, add a module — you won't have to touch the others.

---

## Setup

```bash
npm install
cp .env.example .env

# generate real secrets
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# paste into JWT_ACCESS_SECRET and JWT_REFRESH_SECRET (different values)

npm run db:migrate
npm run db:seed      # optional demo data
npm run dev          # http://localhost:3000/api/v1
```

Verify the whole thing end-to-end:

```bash
npm start        # in one terminal
npm run smoke    # in another — 23 checks including the matching gate
```

Seeded logins (password `Passw0rd!`):
`ops@serengetihorizon.co.tz` (company) · `amina.hassan@example.com` (agent)

---

## The two rules that define the product

**1. Matching is mutual.** A connection is created the moment one side expresses
interest, but its status stays `pending` until *both* sides have. Only then does
it become `matched`. This lives in `connections.service.js` and nowhere else.

**2. Messaging is gated behind a match.** Every message endpoint calls the same
`gate()` function, which re-checks both ownership and match status on every
request. There is no path to a message that skips it.

```
company expresses interest  →  pending   →  POST /messages  → 400 blocked
agent reciprocates          →  matched   →  POST /messages  → 201 created
```

Reviews use the same gate: only a matched counterparty can review you. That is
what makes the "Verified Review" badge on your profile pages mean something.

---

## API reference

Base URL: `/api/v1`. All responses are `{ success, data, meta? }` or `{ success, error }`.
Authenticated requests send `Authorization: Bearer <accessToken>`.

### Auth
| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register/company` | public | Create company account + profile (atomic) |
| POST | `/auth/register/agent` | public | Create agent account + profile (atomic) |
| POST | `/auth/login` | public | Returns access + refresh tokens |
| POST | `/auth/refresh` | public | Rotates the refresh token; old one dies |
| POST | `/auth/logout` | public | Revokes the presented refresh token |
| GET | `/auth/me` | any | Current user + profile |
| POST | `/auth/change-password` | any | Revokes all other sessions |

### Profiles
| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/profiles/me` | any | Own profile |
| PATCH | `/profiles/me/company` | company | Update own company profile |
| PATCH | `/profiles/me/agent` | agent | Update own agent profile |
| POST | `/profiles/me/media/:slot` | any | Upload `logo`/`cover`/`licence` (company) or `photo`/`cover`/`cv` (agent) |
| GET | `/profiles/companies/:slug` | public | Public profile + reviews + your relationship to it |
| GET | `/profiles/agents/:slug` | public | Public profile + credentials + reviews |

### Discovery — powers "Find Agent" and "Find Company"
| Method | Path | Filters |
| --- | --- | --- |
| GET | `/discovery/agents` | `q, country, city, availability, specializations, tourTypes, languages, destinations, minExperience, remoteOnly, openToWork, verified, page, perPage` |
| GET | `/discovery/companies` | `q, country, city, tourTypes, destinations, languages, groupSizes, recruiting, verified, page, perPage` |
| GET | `/discovery/suggestions` | Ranked opposite-side matches based on your own tour types |

List filters accept CSV: `?specializations=Trekking,Safari&languages=Swahili`.
Every result carries a `relationship` field so the UI knows whether to show
*Connect*, *Pending* or *Message*.

### Connections
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/connections?status=matched` | Your connections |
| POST | `/connections/interest` | `{ targetProfileId, note? }` → returns `{ connection, matched }` |
| GET | `/connections/:id` | One connection |
| POST | `/connections/:id/withdraw` | Take back your interest |
| POST | `/connections/:id/decline` | Permanent — cannot be reopened |
| POST | `/connections/:id/archive` | Hide without declining |

### Messages — matched connections only
`GET /messages/unread-count` · `GET /messages/:connectionId` · `POST /messages/:connectionId` · `POST /messages/:connectionId/read`

### Vacancies & applications — powers the Partnership Hub
| Method | Path | Access |
| --- | --- | --- |
| GET | `/vacancies` | public, filterable |
| GET | `/vacancies/mine` | company |
| POST | `/vacancies` | company |
| PATCH / DELETE | `/vacancies/:id` | company (owner only) |
| POST | `/vacancies/:id/apply` | agent |
| GET | `/vacancies/:id/applications` | company (owner only) |
| GET | `/applications/mine` | agent |
| PATCH | `/applications/:id/decision` | company — `shortlisted` / `accepted` / `rejected` |
| POST | `/applications/:id/withdraw` | agent |

### Reviews, credentials, analytics
`GET /reviews/:subjectType/:subjectId` (public, with rating breakdown) · `POST /reviews` (matched only)
`GET|POST /credentials`, `DELETE /credentials/:id` (agent)
`GET /analytics/dashboard` · `GET /analytics/notifications` · `POST /analytics/notifications/read`

---

## Data model

```
users ──┬── company_profiles ──┬── vacancies ── applications ── agent_profiles
        │                      │                                     │
        └── agent_profiles ────┴── connections ── messages           credentials
                                        │
                     reviews ───────────┘      notifications, profile_views
```

Twelve tables. Arrays (tour types, languages, destinations) are stored as JSON
text and filtered with indexed `LIKE` matching — the pragmatic choice for
SQLite at this scale. If a list grows into a first-class entity with its own
pages, promote it to a join table in a new migration.

---

## Security

- **Passwords**: bcrypt, 12 rounds, configurable. Login compares against a dummy hash when the user doesn't exist so response timing doesn't leak account existence.
- **Refresh tokens**: stored as SHA-256 hashes and rotated on every use. A stolen-and-replayed token is rejected (the smoke test proves this).
- **Input**: every body, query and param passes through a zod schema, and the parsed result *replaces* the raw input. Update schemas are `.strict()`, so a client cannot POST `isVerified: true` and promote itself.
- **SQL**: every value is a bound parameter. No string interpolation of user input anywhere.
- **Uploads**: MIME allow-list, size cap, random filenames — an uploaded `.php` or `.html` can never be executed or reflected under your origin.
- **Rate limits**: global budget plus a tighter one on auth routes that only counts failures.
- **Ownership**: checked in the service layer on every mutation, not just at the route.

Before production: put this behind HTTPS, set real secrets, restrict `CORS_ORIGINS` to your actual frontend domain, and move uploads to object storage (S3, R2, Cloudinary) rather than local disk.

---

## Connecting your frontend

Your existing pages map onto this directly:

| Page | Endpoint |
| --- | --- |
| Find Agent | `GET /discovery/agents` + `POST /connections/interest` |
| Find Tour Company | `GET /discovery/companies` |
| Agent Profile | `GET /profiles/agents/:slug`, `POST /credentials` |
| Verified Reviews | `GET /reviews/company/:id` (`?kind=partner` vs `?kind=tourist`) |
| Partnership Hub | `GET /vacancies/mine`, `GET /vacancies/:id/applications` |
| Your Dashboard panel | `GET /analytics/dashboard` |

The dashboard response already contains profile views, matched-connection counts
and application pipeline totals — the numbers currently hardcoded in the markup.

A note on the frontend itself: the five pages use two different visual systems.
The uploaded set is a blue LinkedIn-style Material palette, while your earlier
build used the rose/green dating-app language. Worth deciding which one is the
product before wiring the API in, otherwise you'll rebuild the views twice.

---

## Deploying to Render

1. Push to GitHub, create a Web Service.
2. Build `npm install`, start `npm start` (the `Procfile` is included).
3. Set env vars from `.env.example` — real secrets, `NODE_ENV=production`, `CORS_ORIGINS=https://your-frontend`.
4. Attach a **persistent disk** and point `DATABASE_FILE` and `UPLOAD_DIR` at it. Without a disk, Render's filesystem is ephemeral and your database vanishes on redeploy.

Migrations run automatically at boot, so a deploy applies any new ones for you.

---

## Suggested next steps

1. **Tests.** The smoke test covers the happy paths; `node:test` unit tests around `connections.service.js` would lock in the matching rule.
2. **Real-time messaging.** Swap polling for WebSockets once message volume justifies it.
3. **Email.** Verification, password reset and match notifications — the notification rows are already being written.
4. **Postgres.** If you outgrow SQLite (concurrent writes are the usual trigger), the repository layer is the only thing that changes. That isolation was the point.
