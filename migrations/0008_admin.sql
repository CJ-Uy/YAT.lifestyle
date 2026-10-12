CREATE TABLE admin_sessions (
  id_hash TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX admin_sessions_expiry ON admin_sessions(expires_at);

CREATE TABLE admin_order_fulfillment (
  order_id TEXT PRIMARY KEY REFERENCES commerce_orders(id),
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'making', 'packed', 'dispatched')),
  courier TEXT NOT NULL DEFAULT '',
  tracking_number TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL CHECK(version >= 1),
  updated_by TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK(status != 'dispatched' OR (length(courier) >= 2 AND length(tracking_number) >= 3))
);

CREATE TABLE admin_order_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES commerce_orders(id),
  previous_status TEXT,
  status TEXT NOT NULL,
  courier TEXT NOT NULL,
  tracking_number TEXT NOT NULL,
  note TEXT NOT NULL,
  actor TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX admin_order_history_order ON admin_order_history(order_id, id);

CREATE TRIGGER admin_fulfillment_created AFTER INSERT ON admin_order_fulfillment
BEGIN
  INSERT INTO admin_order_history (order_id, previous_status, status, courier, tracking_number, note, actor, created_at)
  VALUES (NEW.order_id, 'new', NEW.status, NEW.courier, NEW.tracking_number, NEW.note, NEW.updated_by, NEW.updated_at);
END;

CREATE TRIGGER admin_fulfillment_updated AFTER UPDATE ON admin_order_fulfillment
BEGIN
  INSERT INTO admin_order_history (order_id, previous_status, status, courier, tracking_number, note, actor, created_at)
  VALUES (NEW.order_id, OLD.status, NEW.status, NEW.courier, NEW.tracking_number, NEW.note, NEW.updated_by, NEW.updated_at);
END;
