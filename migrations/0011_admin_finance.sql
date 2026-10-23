-- Admin finance: fee/share rates, CJ's monthly share payouts, onsite selling days and sales,
-- the shipping cost paid per dispatched order, and printable voucher sets.

-- Each rate applies from effective_from (ms) until a later row. Airwallex stays NULL until
-- the owner enters her actual pricing; reports never assume a fee rate.
CREATE TABLE admin_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  effective_from INTEGER NOT NULL,
  airwallex_bp INTEGER CHECK (airwallex_bp IS NULL OR airwallex_bp BETWEEN 0 AND 2000),
  airwallex_fixed_cents INTEGER NOT NULL DEFAULT 0 CHECK (airwallex_fixed_cents BETWEEN 0 AND 10000),
  partner_bp INTEGER NOT NULL CHECK (partner_bp BETWEEN 0 AND 5000),
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX admin_rates_effective ON admin_rates(effective_from DESC, id DESC);
INSERT INTO admin_rates (effective_from, airwallex_bp, airwallex_fixed_cents, partner_bp, created_by, created_at)
VALUES (0, NULL, 0, 500, 'migration', 0);

-- A month is marked paid with the amount owed at that moment.
CREATE TABLE admin_partner_payouts (
  month TEXT PRIMARY KEY CHECK (month GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]'),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  paid_at INTEGER NOT NULL,
  paid_by TEXT NOT NULL
);

CREATE TABLE admin_onsite_days (
  id TEXT PRIMARY KEY,
  place TEXT NOT NULL CHECK (length(place) BETWEEN 1 AND 120),
  day TEXT NOT NULL CHECK (day GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]-[0-3][0-9]'),
  usual_price_cents INTEGER CHECK (usual_price_cents IS NULL OR usual_price_cents BETWEEN 0 AND 10000000),
  stall_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (stall_fee_cents BETWEEN 0 AND 100000000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  closed_at INTEGER
);
CREATE INDEX admin_onsite_days_day ON admin_onsite_days(day DESC, created_at DESC);

-- Sale ids come from the phone, so a retried save after a dropped connection is idempotent.
CREATE TABLE admin_onsite_sales (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL REFERENCES admin_onsite_days(id),
  slug TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 100),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents BETWEEN 0 AND 10000000),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'fps', 'payme', 'octopus', 'card', 'other')),
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX admin_onsite_sales_day ON admin_onsite_sales(day_id, created_at);

-- Earlier dispatched orders keep a NULL shipping cost, which the Money page flags.
ALTER TABLE admin_order_fulfillment ADD COLUMN shipping_cents INTEGER CHECK (shipping_cents IS NULL OR shipping_cents BETWEEN 0 AND 10000000);
ALTER TABLE admin_order_fulfillment ADD COLUMN shipped_email_at INTEGER;

-- Record history for operator edits only, not for the shipped-email marker.
DROP TRIGGER admin_fulfillment_updated;
CREATE TRIGGER admin_fulfillment_updated AFTER UPDATE OF status, courier, tracking_number, note, shipping_cents ON admin_order_fulfillment
BEGIN
  INSERT INTO admin_order_history (order_id, previous_status, status, courier, tracking_number, note, actor, created_at)
  VALUES (NEW.order_id, OLD.status, NEW.status, NEW.courier, NEW.tracking_number, NEW.note, NEW.updated_by, NEW.updated_at);
END;

ALTER TABLE commerce_vouchers ADD COLUMN batch TEXT;
CREATE INDEX commerce_vouchers_batch ON commerce_vouchers(batch);
