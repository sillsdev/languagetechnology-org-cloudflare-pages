// Two kinds of KV records, so a sync run for the (usual) case of "just the newest
// quarter" only ever writes two small values instead of re-shaping the whole
// history:
//
// - "products:catalog"        -- one record: product metadata (name, category,
//                                 platforms, dev status, ...) from the single
//                                 "Product List" tab, plus the list of quarters ever
//                                 synced. Rewritten every run (metadata can change
//                                 even when the target quarter doesn't).
// - "products:quarter:<period>" -- one record per quarter, holding just that
//                                 quarter's per-product metric values. A sync run
//                                 only ever writes the quarter it was asked to sync
//                                 -- older quarters' records are untouched.
//
// functions/impact/api/products.js reads the catalog plus exactly one quarter
// record per request (defaulting to the latest), so onboarding a new metric or a
// whole new quarter never touches a schema -- just new keys.

const CATALOG_KEY = "products:catalog";
const STATUS_KEY = "products:sync-status";
const SOURCE = "langtech_sheet";

export function quarterKey(period) {
  return `products:quarter:${period}`;
}

function splitMultiValue(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

// products: [{ name, category, platforms, devStatus, metricsMode, productUrl, openSource }]
// metrics: Map<productName, {metricKey: value}> -- rows for `quarter` only
export async function writeSync(kv, { quarter, products, metrics }) {
  const now = new Date().toISOString();

  const shapedProducts = products.map((p) => ({
    name: p.name,
    category: p.category ?? null,
    platforms: splitMultiValue(p.platforms),
    devStatus: p.devStatus ?? null,
    metricsMode: p.metricsMode ?? null,
    productUrl: p.productUrl ?? null,
    openSource: Boolean(p.openSource),
  }));

  const existingCatalog = await kv.get(CATALOG_KEY, "json");
  const quarters = uniqueSorted([...(existingCatalog?.quarters ?? []), quarter]);

  const catalog = {
    generatedAt: now,
    quarters,
    categories: uniqueSorted(shapedProducts.map((p) => p.category)),
    platforms: uniqueSorted(shapedProducts.flatMap((p) => p.platforms)),
    devStatuses: uniqueSorted(shapedProducts.map((p) => p.devStatus)),
    products: shapedProducts,
  };

  const metricsByName = {};
  for (const [name, values] of metrics.entries()) {
    const cleaned = {};
    for (const [key, value] of Object.entries(values)) {
      if (value === null || value === undefined || value === "") continue;
      cleaned[key] = value;
    }
    if (Object.keys(cleaned).length > 0) metricsByName[name] = cleaned;
  }

  const quarterDoc = { period: quarter, generatedAt: now, metrics: metricsByName };

  await kv.put(CATALOG_KEY, JSON.stringify(catalog));
  await kv.put(quarterKey(quarter), JSON.stringify(quarterDoc));
  await kv.put(
    STATUS_KEY,
    JSON.stringify({
      lastSyncedAt: now,
      status: "ok",
      detail: `${products.length} products synced for ${quarter}`,
      source: SOURCE,
    })
  );
}

export async function recordSyncError(kv, message) {
  await kv.put(
    STATUS_KEY,
    JSON.stringify({
      lastSyncedAt: new Date().toISOString(),
      status: "error",
      detail: message.slice(0, 500),
      source: SOURCE,
    })
  );
}
