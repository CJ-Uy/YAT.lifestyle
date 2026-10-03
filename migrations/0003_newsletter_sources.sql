-- SQLite cannot alter a CHECK constraint, so rebuild the table with the Element order and gift sources allowed.
CREATE TABLE newsletter_subscribers_new (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'zh-Hant', 'zh-Hans')),
  consented_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  policy_version TEXT NOT NULL,
  marketing_consent TEXT NOT NULL,
  privacy_acknowledged INTEGER NOT NULL CHECK (privacy_acknowledged = 1),
  source TEXT NOT NULL CHECK (source IN ('shop', 'element-order', 'element-gift')),
  status TEXT NOT NULL DEFAULT 'unverified' CHECK (status IN ('unverified', 'subscribed', 'unsubscribed'))
);
INSERT INTO newsletter_subscribers_new (email, locale, consented_at, policy_version, marketing_consent, privacy_acknowledged, source, status)
  SELECT email, locale, consented_at, policy_version, marketing_consent, privacy_acknowledged, source, status FROM newsletter_subscribers;
DROP TABLE newsletter_subscribers;
ALTER TABLE newsletter_subscribers_new RENAME TO newsletter_subscribers;
