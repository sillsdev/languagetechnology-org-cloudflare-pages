import { staticProducts } from "../_lib/staticData.js";

const CACHE_TTL_SECONDS = 300;

export async function onRequestGet(context) {
  const { env, request } = context;
  const db = env.DB;

  // No D1 binding (e.g. plain local dev) or nothing synced yet -> static snapshot, so
  // the front end always has something real to render against.
  if (!db) {
    return Response.json(staticProducts);
  }

  const cache = caches.default;
  const cacheKey = new Request(request.url, request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  // Falls back to the static snapshot if the table is empty OR doesn't exist yet
  // (e.g. schema migration not applied yet in this environment) rather than erroring.
  let countRow;
  try {
    countRow = await db.prepare(`SELECT COUNT(*) as n FROM products`).first();
  } catch {
    return Response.json(staticProducts);
  }
  if (!countRow || countRow.n === 0) {
    return Response.json(staticProducts);
  }

  const [productsResult, metricsResult, syncMeta] = await Promise.all([
    db.prepare(`SELECT * FROM products`).all(),
    db.prepare(`SELECT * FROM product_metrics`).all(),
    db.prepare(`SELECT * FROM sync_meta ORDER BY last_synced_at DESC LIMIT 1`).first(),
  ]);

  const body = shapeResponse(productsResult.results, metricsResult.results, syncMeta);

  const response = Response.json(body, {
    headers: { "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}` },
  });
  context.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

function shapeResponse(products, metricRows, syncMeta) {
  // Pivot the key/value metric rows into product_id -> period -> {metricKey: value}.
  const metricsByProduct = new Map();
  for (const row of metricRows) {
    if (!metricsByProduct.has(row.product_id)) metricsByProduct.set(row.product_id, new Map());
    const byPeriod = metricsByProduct.get(row.product_id);
    if (!byPeriod.has(row.period)) byPeriod.set(row.period, {});
    byPeriod.get(row.period)[row.metric_key] = row.value ?? row.value_text ?? null;
  }

  const shaped = products.map((p) => {
    const byPeriod = metricsByProduct.get(p.id) ?? new Map();
    const quarters = {};
    for (const [period, metrics] of byPeriod.entries()) quarters[period] = metrics;
    return {
      name: p.name,
      category: p.category,
      platforms: safeParseArray(p.platforms),
      devStatus: p.dev_status,
      metricsMode: p.metrics_mode,
      productUrl: p.product_url,
      openSource: Boolean(p.open_source),
      quarters,
    };
  });

  const quartersSet = new Set();
  for (const p of shaped) for (const q of Object.keys(p.quarters)) quartersSet.add(q);

  return {
    generatedAt: syncMeta?.last_synced_at ?? null,
    quarters: sortQuarters([...quartersSet]),
    categories: uniqueSorted(shaped.map((p) => p.category)),
    platforms: uniqueSorted(shaped.flatMap((p) => p.platforms)),
    devStatuses: uniqueSorted(shaped.map((p) => p.devStatus)),
    products: shaped,
  };
}

function safeParseArray(json) {
  try {
    const parsed = JSON.parse(json || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function sortQuarters(quarters) {
  return quarters.sort((a, b) => {
    const [ay, aq] = parseQuarter(a);
    const [by, bq] = parseQuarter(b);
    return ay - by || aq - bq;
  });
}

function parseQuarter(q) {
  const m = /FY(\d+)Q(\d)/.exec(q);
  return m ? [Number(m[1]), Number(m[2])] : [0, 0];
}
