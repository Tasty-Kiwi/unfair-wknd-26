CREATE TABLE projects (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 120),
  workspace_json TEXT NOT NULL
    CHECK(length(CAST(workspace_json AS BLOB)) <= 1000000),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX projects_owner_updated
  ON projects(owner_id, updated_at DESC, id);

CREATE INDEX projects_owner_created
  ON projects(owner_id, created_at DESC);
