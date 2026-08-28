import { METRIC_LABELS } from "./sheetParse.js";

const SOURCE = "langtech_sheet";

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// products: [{ name, category, platforms, devStatus, metricsMode, productUrl, openSource }]
// metricsByProduct: Map<productName, Map<period, {metricKey: value}>>
export async function upsertAll(db, { products, metricsByProduct }) {
  const now = new Date().toISOString();

  const statements = [
    db.prepare(`DELETE FROM product_metrics WHERE source = ?`).bind(SOURCE),
    db.prepare(`DELETE FROM products`),
  ];

  const metricKeysSeen = new Set();

  for (const p of products) {
    const id = slugify(p.name);
    statements.push(
      db
        .prepare(
          `INSERT INTO products (id, name, category, platforms, dev_status, metrics_mode, product_url, open_source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          id,
          p.name,
          p.category ?? null,
          JSON.stringify(splitMultiValue(p.platforms)),
          p.devStatus ?? null,
          p.metricsMode ?? null,
          p.productUrl ?? null,
          p.openSource ? 1 : 0
        )
    );

    const byPeriod = metricsByProduct.get(p.name);
    if (!byPeriod) continue;

    for (const [period, metrics] of byPeriod.entries()) {
      for (const [metricKey, rawValue] of Object.entries(metrics)) {
        if (rawValue === null || rawValue === undefined || rawValue === "") continue;
        metricKeysSeen.add(metricKey);

        const isNumeric = typeof rawValue === "number";
        statements.push(
          db
            .prepare(
              `INSERT INTO product_metrics (product_id, period, metric_key, value, value_text, source, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT (product_id, period, metric_key, source)
               DO UPDATE SET value = excluded.value, value_text = excluded.value_text, updated_at = excluded.updated_at`
            )
            .bind(
              id,
              period,
              metricKey,
              isNumeric ? rawValue : null,
              isNumeric ? null : String(rawValue),
              SOURCE,
              now
            )
        );
      }
    }
  }

  for (const key of metricKeysSeen) {
    statements.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO metric_definitions (key, label, unit, source) VALUES (?, ?, ?, ?)`
        )
        .bind(key, METRIC_LABELS[key] ?? key, "count", SOURCE)
    );
  }

  statements.push(
    db
      .prepare(
        `INSERT INTO sync_meta (source, last_synced_at, status, detail)
         VALUES (?, ?, 'ok', ?)
         ON CONFLICT (source) DO UPDATE SET last_synced_at = excluded.last_synced_at, status = excluded.status, detail = excluded.detail`
      )
      .bind(SOURCE, now, `${products.length} products synced`)
  );

  await db.batch(statements);
}

export async function recordSyncError(db, message) {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sync_meta (source, last_synced_at, status, detail)
       VALUES (?, ?, 'error', ?)
       ON CONFLICT (source) DO UPDATE SET last_synced_at = excluded.last_synced_at, status = excluded.status, detail = excluded.detail`
    )
    .bind(SOURCE, now, message.slice(0, 500))
    .run();
}

function splitMultiValue(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
