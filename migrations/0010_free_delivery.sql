-- Hong Kong delivery is now free (HK$258 per gift box). 0007 pinned delivery_cents to 3000,
-- and SQLite cannot alter a CHECK, so rebuild commerce_orders with delivery_cents >= 0.
-- Existing HK$30 orders keep their stored snapshot. Apply this before deploying DELIVERY_CENTS = 0.
PRAGMA defer_foreign_keys = true;

DROP TRIGGER commerce_reserve_voucher;
DROP TRIGGER commerce_order_snapshot;

-- Recreate under the same name, then reinsert: reinserted parents satisfy the deferred
-- child references (vouchers, webhooks, fulfillment). A rename would leave them counted.
CREATE TABLE commerce_orders_copy AS SELECT * FROM commerce_orders;
DROP TABLE commerce_orders;

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
  delivery_cents INTEGER NOT NULL CHECK (delivery_cents >= 0),
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
INSERT INTO commerce_orders SELECT * FROM commerce_orders_copy;
DROP TABLE commerce_orders_copy;
CREATE INDEX commerce_orders_created ON commerce_orders(created_at DESC);
CREATE INDEX commerce_orders_status ON commerce_orders(status, created_at DESC);

CREATE TRIGGER commerce_order_snapshot BEFORE UPDATE OF request_id, request_digest, access_hash, access_expires_at, locale, email, details_json, items_json, subtotal_cents, delivery_cents, discount_cents, total_cents, currency, voucher_code, mode, return_origin ON commerce_orders
BEGIN
  SELECT RAISE(ABORT, 'immutable_order_snapshot');
END;

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
