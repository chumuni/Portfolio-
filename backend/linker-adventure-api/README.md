# Linker Adventure API

Backend for the B2B tourism matchmaking platform that connects **tour companies** with **tour agents**.

Built on **Node.js 22 + Express**, with **MongoDB** (via Mongoose) as the database.

---

## Why this stack

| Layer | Choice |
| --- | --- |
| Data access | All queries isolated in `src/repositories/` — nothing above that layer knows it's MongoDB |
| Validation | `zod` schemas that strip and whitelist every input |
| Responses | One envelope: `{ success, data, meta }` / `{ success, error }` |
| Schema | Mongoose models in `src/db/models.js`; indexes synced on boot |
| Auth | Access + rotating refresh tokens, stored hashed |
| Collections | 12, covering credentials, vacancies, applications, reviews, notifications, analytics |

---

## Architecture

Requests flow in one direction. Each layer has exactly one job.

```
route  →  middleware  →  controller  →  service  →  repository  →  MongoDB
         (auth,          (HTTP in/out,  (business   (all queries)
          validation,     nothing else)  rules)
          rate limit)
```

```
src/
├── server.js                 Bootstrap: connect + sync indexes, listen, graceful shutdown
├── app.js                    Express assembly (helmet, cors, logging, routes)
├── routes.js                 Mounts every module under /api/v1
├── config/
│   ├── env.js                Typed config, fails fast on missing secrets
│   └── logger.js             Structured JSON logs in production
├── db/
│   ├── index.js              Mongoose connection, transaction/id helpers
│   ├── models.js             Every Mongoose schema/model (12 collections)
│   ├── migrate.js            Syncs collection indexes (MongoDB is schemaless)
│   ├── seed.js                Realistic East African demo data
│   └── reset.js               Drop all collections
├── middleware/
│   ├── authenticate.js       Bearer token → req.user (+ optionalAuth)
│   ├── authorize.js          Role gate: authorize('company')
│   ├── validate.js           Zod validation; REPLACES req.body with clean data
│   ├── upload.js             Multer: type + size limits, random filenames
│   ├── rateLimiters.js       Global + stricter auth limiter
│   └── errorHandler.js       Every error → one response shape
├── repositories/             ← the ONLY place MongoDB/Mongoose is used
├── modules/                  ← one folder per domain
│   └── <name>/{routes,controller,service,schema}.js
└── utils/                    AppError, asyncHandler, pagination, tokens, slugs, objectId
```

**The rule worth keeping:** a controller never touches Mongoose, and a repository never throws HTTP errors. If you need a new feature, add a module — you won't have to touch the others.

---

## Setup

```bash
npm install
cp .env.example .env

# generate real secrets
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# paste into JWT_ACCESS_SECRET and JWT_REFRESH_SECRET (different values)

# set MONGODB_URI in .env to your MongoDB connection string
# (a free MongoDB Atlas cluster works fine — get the string from Atlas → Connect → Drivers)

npm run db:migrate   # syncs indexes — safe to run any time
npm run db:seed      # optional demo data
npm run dev          # http://localhost:3000/api/v1
```

IDs returned by the API are MongoDB ObjectIds — 24-character hex strings — not
numbers. Any client code expecting numeric ids needs updating.

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
users ──┬── companyProfiles ──┬── vacancies ── applications ── agentProfiles
        │                     │                                     │
        └── agentProfiles ────┴── connections ── messages           credentials
                                       │
                    reviews ───────────┘      notifications, profileViews
```

Twelve collections, defined in `src/db/models.js`. Arrays (tour types,
languages, destinations) are native MongoDB array fields, filtered with `$in`
— no JSON-text hacks needed.

---

## Security

- **Passwords**: bcrypt, 12 rounds, configurable. Login compares against a dummy hash when the user doesn't exist so response timing doesn't leak account existence.
- **Refresh tokens**: stored as SHA-256 hashes and rotated on every use. A stolen-and-replayed token is rejected (the smoke test proves this).
- **Input**: every body, query and param passes through a zod schema, and the parsed result *replaces* the raw input. Update schemas are `.strict()`, so a client cannot POST `isVerified: true` and promote itself.
- **Queries**: built with Mongoose's query builder — no raw/string-interpolated queries anywhere. Free-text search input is regex-escaped before use.
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
3. Set env vars from `.env.example` — real secrets, `NODE_ENV=production`, `CORS_ORIGINS=https://your-frontend`, and `MONGODB_URI` pointing at your MongoDB Atlas cluster (Atlas is the easy path — no server to run yourself).
4. Uploaded files (`UPLOAD_DIR`) still live on local disk — attach a **persistent disk** on Render, or move uploads to object storage (S3, R2, Cloudinary) before you rely on them in production, since Render's filesystem is ephemeral across redeploys.

Index sync runs automatically at boot (`runMigrations()`), so a deploy picks up any new indexes for you.

---

## Suggested next steps

1. **Tests.** The smoke test covers the happy paths; `node:test` unit tests around `connections.service.js` would lock in the matching rule.
2. **Real-time messaging.** Swap polling for WebSockets once message volume justifies it.
3. **Email.** Verification, password reset and match notifications — the notification rows are already being written.
