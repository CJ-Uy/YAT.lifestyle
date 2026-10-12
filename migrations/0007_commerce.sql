CREATE TABLE commerce_vouchers (
  code TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('percent', 'fixed')),
  amount INTEGER NOT NULL CHECK (amount > 0 AND (kind = 'fixed' OR amount <= 100)),
  min_subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (min_subtotal_cents >= 0),
  expires_at INTEGER,
  max_uses INTEGER CHECK (max_uses > 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at INTEGER NOT NULL
);

CREATE TABLE commerce_orders (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  request_digest TEXT NOT NULL,
  access_hash TEXT NOT NULL,
  access_expires_at INTEGER NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'zh-Hant', 'zh-Hans')),
  email TEXT NOT NULL,
  details_json TEXT NOT NULL,
  items_json TEXT NOT NULL,
  subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents > 0),
  delivery_cents INTEGER NOT NULL CHECK (delivery_cents = 3000),
  discount_cents INTEGER NOT NULL CHECK (discount_cents >= 0 AND discount_cents <= subtotal_cents),
  total_cents INTEGER NOT NULL CHECK (total_cents = subtotal_cents + delivery_cents - discount_cents AND total_cents > 0),
  currency TEXT NOT NULL DEFAULT 'HKD' CHECK (currency = 'HKD'),
  voucher_code TEXT REFERENCES commerce_vouchers(code),
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'cancelled', 'failed')),
  payment_intent_id TEXT UNIQUE,
  payment_status TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('prod', 'sandbox')),
  return_origin TEXT NOT NULL,
  intent_lock_until INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  paid_at INTEGER,
  receipt_sent_at INTEGER,
  receipt_lock_until INTEGER
);
CREATE INDEX commerce_orders_created ON commerce_orders(created_at DESC);
CREATE INDEX commerce_orders_status ON commerce_orders(status, created_at DESC);

CREATE TRIGGER commerce_order_snapshot BEFORE UPDATE OF request_id, request_digest, access_hash, access_expires_at, locale, email, details_json, items_json, subtotal_cents, delivery_cents, discount_cents, total_cents, currency, voucher_code, mode, return_origin ON commerce_orders
BEGIN
  SELECT RAISE(ABORT, 'immutable_order_snapshot');
END;

CREATE TABLE commerce_voucher_reservations (
  order_id TEXT PRIMARY KEY REFERENCES commerce_orders(id),
  voucher_code TEXT NOT NULL REFERENCES commerce_vouchers(code),
  status TEXT NOT NULL CHECK (status IN ('reserved', 'redeemed', 'released')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX commerce_voucher_usage ON commerce_voucher_reservations(voucher_code, status);

-- A reservation and its pending order are inserted in one atomic D1 batch.
CREATE TRIGGER commerce_reserve_voucher BEFORE INSERT ON commerce_voucher_reservations
BEGIN
  SELECT RAISE(ABORT, 'voucher_unavailable') WHERE NOT EXISTS (
    SELECT 1 FROM commerce_vouchers v JOIN commerce_orders o ON o.id = NEW.order_id
    WHERE v.code = NEW.voucher_code AND o.voucher_code = v.code
      AND v.active = 1 AND (v.expires_at IS NULL OR v.expires_at > NEW.created_at)
      AND o.subtotal_cents >= v.min_subtotal_cents
      AND ((v.kind = 'percent' AND o.discount_cents = MIN(o.subtotal_cents, (o.subtotal_cents * v.amount) / 100))
        OR (v.kind = 'fixed' AND o.discount_cents = MIN(o.subtotal_cents, v.amount)))
      AND (v.max_uses IS NULL OR (
        SELECT COUNT(*) FROM commerce_voucher_reservations r
        WHERE r.voucher_code = v.code AND r.status IN ('reserved', 'redeemed')
      ) < v.max_uses)
  );
END;

CREATE TABLE commerce_webhook_events (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES commerce_orders(id),
  created_at INTEGER NOT NULL
);
