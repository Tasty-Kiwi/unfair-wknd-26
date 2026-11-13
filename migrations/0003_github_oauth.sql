CREATE TABLE github_identities (
  github_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE cloud_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES github_identities(user_id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE INDEX cloud_sessions_user_id_idx
  ON cloud_sessions(user_id);

CREATE INDEX cloud_sessions_expires_at_idx
  ON cloud_sessions(expires_at);

CREATE TABLE oauth_attempts (
  state_hash TEXT PRIMARY KEY,
  browser_hash TEXT NOT NULL,
  code_verifier TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX oauth_attempts_expires_at_idx
  ON oauth_attempts(expires_at);

CREATE TABLE oauth_limits (
  key TEXT PRIMARY KEY,
  window INTEGER NOT NULL,
  count INTEGER NOT NULL
);

INSERT INTO github_identities (github_id, user_id, name)
SELECT DISTINCT
  a."accountId",
  a."userId",
  u."name"
FROM "account" a
INNER JOIN "user" u ON u."id" = a."userId"
WHERE a."providerId" = 'github';
