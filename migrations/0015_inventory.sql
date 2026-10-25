-- Staff-controlled availability. A scent with sold_out = 1 cannot be bought. shop_state.closed sells out
-- everything without touching the per-scent flags, so reopening the shop restores them as they were.
CREATE TABLE shop_inventory (
  slug TEXT PRIMARY KEY,
  sold_out INTEGER NOT NULL DEFAULT 0 CHECK (sold_out IN (0, 1)),
  updated_by TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE shop_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  closed INTEGER NOT NULL DEFAULT 0 CHECK (closed IN (0, 1)),
  updated_by TEXT,
  updated_at INTEGER
);
INSERT INTO shop_state (id, closed) VALUES (1, 0);
