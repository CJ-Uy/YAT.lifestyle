-- The owner's first look at each order, and the daily email that lists paid orders she has not opened yet.
CREATE TABLE admin_order_seen (
  order_id TEXT PRIMARY KEY REFERENCES commerce_orders(id),
  seen_at INTEGER NOT NULL
);

-- digest_time is Hong Kong local time; last_sent_day guards against a second email on the same Hong Kong date.
CREATE TABLE admin_notify_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  digest_enabled INTEGER NOT NULL DEFAULT 1 CHECK (digest_enabled IN (0, 1)),
  digest_time TEXT NOT NULL DEFAULT '19:00' CHECK (digest_time GLOB '[0-2][0-9]:[0-5][0-9]' AND digest_time < '24:00'),
  digest_email TEXT CHECK (digest_email IS NULL OR length(digest_email) BETWEEN 3 AND 254),
  last_sent_day TEXT,
  last_run_at INTEGER,
  last_count INTEGER,
  last_error TEXT
);
INSERT INTO admin_notify_settings (id) VALUES (1);
