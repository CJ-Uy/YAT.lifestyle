-- Staff corrections to delivery details. The checkout snapshot in commerce_orders stays immutable;
-- admin views and the shipped email read the corrected copy when one exists.
CREATE TABLE admin_order_details (
  order_id TEXT PRIMARY KEY REFERENCES commerce_orders(id),
  details_json TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
