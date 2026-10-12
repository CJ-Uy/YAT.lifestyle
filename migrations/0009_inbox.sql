CREATE TABLE commerce_inbox (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL UNIQUE,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  text_body TEXT NOT NULL,
  attachment_names TEXT NOT NULL DEFAULT '[]',
  received_at INTEGER NOT NULL,
  forwarded_at INTEGER,
  forward_lock_until INTEGER,
  forward_error INTEGER NOT NULL DEFAULT 0 CHECK (forward_error IN (0, 1))
);
CREATE INDEX commerce_inbox_received ON commerce_inbox(received_at DESC);
CREATE TABLE commerce_mail_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  forward_enabled INTEGER NOT NULL DEFAULT 1 CHECK (forward_enabled IN (0, 1))
);
INSERT INTO commerce_mail_settings (id, forward_enabled) VALUES (1, 1);
