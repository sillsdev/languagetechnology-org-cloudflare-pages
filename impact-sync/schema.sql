-- D1 schema for the /impact dashboard's product statistics.
--
-- Metrics are stored key/value (one row per product+period+metric), not as fixed
-- columns, for two reasons: (1) not every metric applies to every product (the
-- source sheet's own "Required Field Configuration" tab already encodes this), so a
-- metric that doesn't apply simply has no row rather than a fabricated NULL; (2) a
-- future data source can introduce a brand-new metric as new rows with a new
-- metric_key, with no schema migration and no change to the read API's query shape.

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  platforms TEXT,        -- JSON array, e.g. ["Windows","Mac"]
  dev_status TEXT,
  metrics_mode TEXT,     -- "Opt In" | "Opt Out" | "Unconditional" | "Unknown"
  product_url TEXT,
  open_source INTEGER    -- 0/1, nullable
);

-- Self-registering dictionary: a sync job upserts a row here (INSERT OR IGNORE) the
-- first time it ever writes a given metric_key, so metric metadata lives in one place
-- without a manual registration step blocking a new connector.
CREATE TABLE IF NOT EXISTS metric_definitions (
  key TEXT PRIMARY KEY,   -- e.g. 'active_users', 'downloads'
  label TEXT NOT NULL,    -- display label, e.g. "Active Users"
  unit TEXT,              -- 'count' | 'percent' | 'fte' | 'text' | 'date'
  source TEXT NOT NULL    -- which connector defines it, e.g. 'langtech_sheet'
);

CREATE TABLE IF NOT EXISTS product_metrics (
  product_id TEXT NOT NULL REFERENCES products(id),
  period TEXT NOT NULL,       -- e.g. 'FY26Q3' - generic text, not quarter-specific,
                               -- so a future source reporting monthly/daily periods
                               -- can coexist without a schema change
  metric_key TEXT NOT NULL REFERENCES metric_definitions(key),
  value REAL,                 -- numeric metrics
  value_text TEXT,            -- non-numeric metrics (e.g. release version string)
  source TEXT NOT NULL,       -- provenance: which sync job wrote this row
  updated_at TEXT NOT NULL,
  PRIMARY KEY (product_id, period, metric_key, source)
);

CREATE TABLE IF NOT EXISTS sync_meta (
  source TEXT PRIMARY KEY,    -- e.g. 'langtech_sheet'
  last_synced_at TEXT NOT NULL,
  status TEXT NOT NULL,       -- 'ok' | 'error'
  detail TEXT                 -- error message, or a short summary on success
);
