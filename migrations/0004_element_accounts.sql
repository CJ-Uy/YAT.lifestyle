-- Email-code sign-in sessions. Only a SHA-256 of the random cookie value is stored.
CREATE TABLE element_logins (
  id_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX element_logins_email ON element_logins (email);

-- Profiles are private until their owner shares them; share_id stays unguessable and unlisted.
ALTER TABLE element_profiles ADD COLUMN shared INTEGER NOT NULL DEFAULT 0 CHECK (shared IN (0, 1));

-- The founder profile, always shared, so the demo can compare against it.
INSERT INTO element_profiles (id, share_id, first_name, likes, nose_type, nose_name, tags, shared, created_at) VALUES (
  'founder-profile', 'founder', 'YAT',
  '{"citrus":3,"green":5,"water":3,"floral":5,"woody":3,"amber":2}',
  'floral', '{"en":"Floral-leaning","zh-Hant":"花香傾向","zh-Hans":"花香倾向"}',
  '["trail-memory","aircon-office"]', 1, '2026-10-04T00:00:00.000Z'
);
