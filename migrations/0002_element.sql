-- Element: one session per walkthrough. Photos live in R2 under element/{session}/.
CREATE TABLE element_sessions (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('demo', 'kit')),
  kit_code TEXT,
  first_name TEXT,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'zh-Hant', 'zh-Hans')),
  consented_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Skin readings measured on the phone, plus the vision check flags. Kept with the method version so they can be recomputed.
CREATE TABLE element_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES element_sessions(id) ON DELETE CASCADE,
  zone TEXT NOT NULL CHECK (zone IN ('blot', 'ph')),
  n INTEGER NOT NULL CHECK (n BETWEEN 1 AND 9),
  photo_key TEXT NOT NULL,
  readings TEXT NOT NULL,
  flags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  UNIQUE (session_id, zone, n)
);

-- Every question is stored exactly as shown; AI follow-ups differ per person.
CREATE TABLE element_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES element_sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('bank', 'ai')),
  chips TEXT NOT NULL,
  tags TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (session_id, question_id)
);

CREATE TABLE element_results (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES element_sessions(id) ON DELETE CASCADE,
  base TEXT NOT NULL,
  formula TEXT NOT NULL,
  changes TEXT NOT NULL,
  explanations TEXT NOT NULL,
  concentration TEXT NOT NULL,
  projection TEXT NOT NULL,
  nose TEXT NOT NULL,
  label_key TEXT,
  created_at TEXT NOT NULL
);

-- What a shared profile may show: family likes, nose type and tags. Never skin or pH readings.
CREATE TABLE element_profiles (
  id TEXT PRIMARY KEY,
  share_id TEXT NOT NULL UNIQUE,
  result_id TEXT REFERENCES element_results(id) ON DELETE SET NULL,
  email TEXT COLLATE NOCASE,
  first_name TEXT,
  likes TEXT NOT NULL,
  nose_type TEXT NOT NULL,
  nose_name TEXT NOT NULL,
  tags TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX element_profiles_email ON element_profiles (email);

CREATE TABLE element_auth_codes (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
