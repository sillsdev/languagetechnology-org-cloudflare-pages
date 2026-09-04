import { staticProducts } from "../_lib/staticData.js";

const CACHE_TTL_SECONDS = 300;
const CATALOG_KEY = "products:catalog";
const quarterKey = (period) => `products:quarter:${period}`;

// The sync worker (impact-sync/) pre-shapes product metadata into one "catalog" KV
// value and each quarter's metrics into its own KV value (impact-sync/src/kv.js), so
// a request only ever needs two reads: the catalog, and whichever single quarter was
// asked for via ?quarter= (defaulting to the latest). Older quarters are never
// touched unless a caller explicitly asks for one -- there's no "fetch everything"
// path.
export async function onRequestGet(context) {
  const { env, request } = context;
  const kv = env.IMPACT_KV;
  const requestedQuarter = new URL(request.url).searchParams.get("quarter");

  const catalog = kv ? await kv.get(CATALOG_KEY, "json") : null;
  if (!catalog) {
    return Response.json(sliceStatic(requestedQuarter));
  }

  const quarter = catalog.quarters.includes(requestedQuarter)
    ? requestedQuarter
    : catalog.quarters[catalog.quarters.length - 1];
  const quarterDoc = await kv.get(quarterKey(quarter), "json");

  const body = shapeResponse(catalog, quarter, quarterDoc);
  return Response.json(body, {
    headers: { "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}` },
  });
}

function shapeResponse(catalog, quarter, quarterDoc) {
  const metricsByName = quarterDoc?.metrics ?? {};
  return {
    generatedAt: quarterDoc?.generatedAt ?? catalog.generatedAt,
    quarter,
    quarters: catalog.quarters,
    categories: catalog.categories,
    platforms: catalog.platforms,
    devStatuses: catalog.devStatuses,
    products: catalog.products.map((p) => ({ ...p, metrics: metricsByName[p.name] ?? {} })),
  };
}

// Adapts the hand-written multi-quarter fixture to the same single-quarter response
// shape the live KV path returns, so the front end never has to special-case the
// static-fallback response.
function sliceStatic(requestedQuarter) {
  const { quarters } = staticProducts;
  const quarter = quarters.includes(requestedQuarter) ? requestedQuarter : quarters[quarters.length - 1];
  return {
    generatedAt: staticProducts.generatedAt,
    static: true,
    quarter,
    quarters,
    categories: staticProducts.categories,
    platforms: staticProducts.platforms,
    devStatuses: staticProducts.devStatuses,
    products: staticProducts.products.map(({ quarters: byQuarter, ...rest }) => ({
      ...rest,
      metrics: byQuarter[quarter] ?? {},
    })),
  };
}
