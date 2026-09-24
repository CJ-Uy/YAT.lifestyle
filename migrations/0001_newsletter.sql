CREATE TABLE newsletter_subscribers (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'zh-Hant', 'zh-Hans')),
  consented_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  policy_version TEXT NOT NULL,
  marketing_consent TEXT NOT NULL,
  privacy_acknowledged INTEGER NOT NULL CHECK (privacy_acknowledged = 1),
  source TEXT NOT NULL CHECK (source = 'shop'),
  status TEXT NOT NULL DEFAULT 'unverified' CHECK (status IN ('unverified', 'subscribed', 'unsubscribed'))
);
