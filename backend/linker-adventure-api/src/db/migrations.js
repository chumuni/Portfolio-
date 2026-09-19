/**
 * Ordered, append-only migration list.
 *
 * Never edit a migration that has already shipped — add a new one. The runner
 * records applied names in `schema_migrations` and skips them next time.
 */
export const migrations = [
  {
    name: '001_core_identity',
    sql: `
      CREATE TABLE users (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        email           TEXT    NOT NULL UNIQUE COLLATE NOCASE,
        password_hash   TEXT    NOT NULL,
        role            TEXT    NOT NULL CHECK (role IN ('company', 'agent', 'admin')),
        status          TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
        email_verified  INTEGER NOT NULL DEFAULT 0,
        last_login_at   TEXT,
        created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE refresh_tokens (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash  TEXT    NOT NULL UNIQUE,
        user_agent  TEXT,
        expires_at  TEXT    NOT NULL,
        revoked_at  TEXT,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
    `,
  },
  {
    name: '002_profiles',
    sql: `
      CREATE TABLE company_profiles (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id           INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        company_name      TEXT    NOT NULL,
        slug              TEXT    NOT NULL UNIQUE,
        tagline           TEXT,
        about             TEXT,
        country           TEXT,
        city              TEXT,
        website           TEXT,
        phone             TEXT,
        logo_path         TEXT,
        cover_path        TEXT,
        tour_types        TEXT    NOT NULL DEFAULT '[]',
        destinations      TEXT    NOT NULL DEFAULT '[]',
        languages         TEXT    NOT NULL DEFAULT '[]',
        group_sizes       TEXT    NOT NULL DEFAULT '[]',
        team_size         INTEGER,
        founded_year      INTEGER,
        license_number    TEXT,
        license_path      TEXT,
        is_verified       INTEGER NOT NULL DEFAULT 0,
        is_recruiting     INTEGER NOT NULL DEFAULT 0,
        rating_average    REAL    NOT NULL DEFAULT 0,
        rating_count      INTEGER NOT NULL DEFAULT 0,
        created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE agent_profiles (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id           INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        full_name         TEXT    NOT NULL,
        slug              TEXT    NOT NULL UNIQUE,
        headline          TEXT,
        bio               TEXT,
        country           TEXT,
        city              TEXT,
        phone             TEXT,
        photo_path        TEXT,
        cover_path        TEXT,
        cv_path           TEXT,
        specializations   TEXT    NOT NULL DEFAULT '[]',
        tour_types        TEXT    NOT NULL DEFAULT '[]',
        languages         TEXT    NOT NULL DEFAULT '[]',
        destinations      TEXT    NOT NULL DEFAULT '[]',
        years_experience  INTEGER NOT NULL DEFAULT 0,
        availability      TEXT    NOT NULL DEFAULT 'available_now'
                          CHECK (availability IN ('available_now', 'available_soon', 'unavailable')),
        remote_only       INTEGER NOT NULL DEFAULT 0,
        commission_rate   REAL,
        is_verified       INTEGER NOT NULL DEFAULT 0,
        is_open_to_work   INTEGER NOT NULL DEFAULT 1,
        rating_average    REAL    NOT NULL DEFAULT 0,
        rating_count      INTEGER NOT NULL DEFAULT 0,
        created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX idx_company_country   ON company_profiles(country, city);
      CREATE INDEX idx_company_recruit   ON company_profiles(is_recruiting);
      CREATE INDEX idx_agent_country     ON agent_profiles(country, city);
      CREATE INDEX idx_agent_available   ON agent_profiles(availability, is_open_to_work);

      CREATE TABLE credentials (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_profile_id  INTEGER NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
        title             TEXT    NOT NULL,
        issuer            TEXT,
        credential_type   TEXT    NOT NULL DEFAULT 'certificate'
                          CHECK (credential_type IN ('certificate', 'licence', 'training', 'award', 'other')),
        issued_at         TEXT,
        expires_at        TEXT,
        file_path         TEXT,
        is_verified       INTEGER NOT NULL DEFAULT 0,
        created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX idx_credentials_agent ON credentials(agent_profile_id);
    `,
  },
  {
    name: '003_matching_and_messaging',
    sql: `
      CREATE TABLE connections (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        company_profile_id  INTEGER NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
        agent_profile_id    INTEGER NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
        initiated_by        TEXT    NOT NULL CHECK (initiated_by IN ('company', 'agent')),
        company_interested  INTEGER NOT NULL DEFAULT 0,
        agent_interested    INTEGER NOT NULL DEFAULT 0,
        status              TEXT    NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'matched', 'declined', 'archived')),
        note                TEXT,
        matched_at          TEXT,
        created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at          TEXT    NOT NULL DEFAULT (datetime('now')),
        UNIQUE (company_profile_id, agent_profile_id)
      );

      CREATE INDEX idx_connections_company ON connections(company_profile_id, status);
      CREATE INDEX idx_connections_agent   ON connections(agent_profile_id, status);

      CREATE TABLE messages (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        connection_id   INTEGER NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
        sender_user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body            TEXT    NOT NULL,
        read_at         TEXT,
        created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX idx_messages_connection ON messages(connection_id, created_at);
    `,
  },
  {
    name: '004_vacancies_and_applications',
    sql: `
      CREATE TABLE vacancies (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        company_profile_id  INTEGER NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
        title               TEXT    NOT NULL,
        description         TEXT    NOT NULL,
        destination         TEXT,
        tour_type           TEXT,
        engagement_type     TEXT    NOT NULL DEFAULT 'contract'
                            CHECK (engagement_type IN ('contract', 'commission', 'full_time', 'seasonal')),
        is_remote           INTEGER NOT NULL DEFAULT 0,
        openings            INTEGER NOT NULL DEFAULT 1,
        tags                TEXT    NOT NULL DEFAULT '[]',
        status              TEXT    NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
        closes_at           TEXT,
        created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX idx_vacancies_company ON vacancies(company_profile_id, status);
      CREATE INDEX idx_vacancies_status  ON vacancies(status, created_at);

      CREATE TABLE applications (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        vacancy_id        INTEGER NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
        agent_profile_id  INTEGER NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
        cover_letter      TEXT,
        status            TEXT    NOT NULL DEFAULT 'submitted'
                          CHECK (status IN ('submitted', 'shortlisted', 'accepted', 'rejected', 'withdrawn')),
        created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at        TEXT    NOT NULL DEFAULT (datetime('now')),
        UNIQUE (vacancy_id, agent_profile_id)
      );

      CREATE INDEX idx_applications_vacancy ON applications(vacancy_id, status);
      CREATE INDEX idx_applications_agent   ON applications(agent_profile_id, status);
    `,
  },
  {
    name: '005_reviews_notifications_analytics',
    sql: `
      CREATE TABLE reviews (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_type    TEXT    NOT NULL CHECK (subject_type IN ('company', 'agent')),
        subject_id      INTEGER NOT NULL,
        author_user_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
        connection_id   INTEGER REFERENCES connections(id) ON DELETE SET NULL,
        kind            TEXT    NOT NULL DEFAULT 'partner' CHECK (kind IN ('partner', 'tourist')),
        rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        title           TEXT,
        body            TEXT    NOT NULL,
        reviewer_name   TEXT,
        reviewer_role   TEXT,
        referred_by     TEXT,
        is_published    INTEGER NOT NULL DEFAULT 1,
        created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX idx_reviews_subject ON reviews(subject_type, subject_id, is_published);

      CREATE TABLE notifications (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type        TEXT    NOT NULL,
        title       TEXT    NOT NULL,
        body        TEXT,
        payload     TEXT    NOT NULL DEFAULT '{}',
        read_at     TEXT,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX idx_notifications_user ON notifications(user_id, read_at, created_at);

      CREATE TABLE profile_views (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_type    TEXT    NOT NULL CHECK (subject_type IN ('company', 'agent')),
        subject_id      INTEGER NOT NULL,
        viewer_user_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
        viewed_at       TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX idx_profile_views_subject ON profile_views(subject_type, subject_id, viewed_at);
    `,
  },
];
