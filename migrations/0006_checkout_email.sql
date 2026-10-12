CREATE TABLE checkout_email_codes (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  requested_at INTEGER NOT NULL,
  delivered_at INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  consumed_token TEXT
);

CREATE TABLE checkout_email_proofs (
  id_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX checkout_email_proofs_expiry ON checkout_email_proofs(expires_at);
