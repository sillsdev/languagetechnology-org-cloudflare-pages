import { staticFontData } from "../_lib/staticFontData.js";

const CACHE_TTL_SECONDS = 300;
const CATALOG_KEY = "fonts:catalog";
const dateKey = (date) => `fonts:date:${date}`;

// Mirrors functions/impact/api/products.js's catalog + per-period split: a
// "fonts:catalog" record (font names + every date ever imported) plus one
// "fonts:date:<date>" record per import date. Nothing writes these yet -- there's
// no live sync worker for font usage, just the manual `scripts/import-font-stats.mjs`
// CSV import that regenerates _lib/staticFontData.js -- so in practice this always
// falls through to the static snapshot below until that script (or a future
// replacement) is pointed at KV instead. Kept as its own read path now so the front
// end's date-switching contract already matches products' quarter-switching one.
export async function onRequestGet(context) {
  const { env, request } = context;
  const kv = env.IMPACT_KV;
  const requestedDate = new URL(request.url).searchParams.get("date");

  const catalog = kv ? await kv.get(CATALOG_KEY, "json") : null;
  if (!catalog) {
    return Response.json(sliceStatic(requestedDate));
  }

  const date = catalog.dates.includes(requestedDate) ? requestedDate : catalog.dates[catalog.dates.length - 1];
  const dateDoc = await kv.get(dateKey(date), "json");

  const body = shapeResponse(catalog, date, dateDoc);
  return Response.json(body, {
    headers: { "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}` },
  });
}

function shapeResponse(catalog, date, dateDoc) {
  const metricsByName = dateDoc?.metrics ?? {};
  return {
    generatedAt: dateDoc?.generatedAt ?? catalog.generatedAt,
    date,
    dates: catalog.dates,
    fonts: catalog.fonts.map((f) => ({ ...f, metrics: metricsByName[f.name] ?? {} })),
  };
}

// Adapts the hand-written multi-date fixture to the same single-date response shape
// the live KV path returns, so the front end never has to special-case the
// static-fallback response.
function sliceStatic(requestedDate) {
  const { dates } = staticFontData;
  const date = dates.includes(requestedDate) ? requestedDate : dates[dates.length - 1];
  return {
    generatedAt: staticFontData.generatedAt,
    static: true,
    date,
    dates,
    fonts: staticFontData.fonts.map(({ snapshots, ...rest }) => ({
      ...rest,
      metrics: snapshots[date] ?? {},
    })),
  };
}
