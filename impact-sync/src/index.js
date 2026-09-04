import { getAccessToken } from "./googleAuth.js";
import {
  extractRows,
  isProductListRow,
  isQuarterlyMetricRow,
  PRODUCT_LIST_SCHEMA,
  QUARTER_METRIC_SCHEMA,
} from "./sheetParse.js";
import { writeSync, recordSyncError } from "./kv.js";

// The quarter synced by default (cron, and a manual "POST /sync" with no body).
// Bump this one-line constant when a new quarterly tab is added to the sheet --
// parsing itself is header-driven and needs no other change. A manual trigger with
// a JSON body like {"quarter": "FY26Q1"} can target any other quarter on demand
// (e.g. a correction to an already-closed quarter) without touching this constant.
const CURRENT_QUARTER = "FY26Q3";

async function fetchSheetValues(env, ranges) {
  const token = await getAccessToken(env);
  const params = new URLSearchParams({ valueRenderOption: "UNFORMATTED_VALUE" });
  for (const range of ranges) params.append("ranges", range);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.SHEET_ID}/values:batchGet?${params}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    throw new Error(`Sheets API batchGet failed (${res.status}): ${await res.text()}`);
  }
  const { valueRanges } = await res.json();
  return ranges.reduce((acc, range, i) => {
    acc[range] = valueRanges[i]?.values ?? [];
    return acc;
  }, {});
}

function normalize(sheetValues, quarter) {
  const products = extractRows(sheetValues["Product List"], {
    headerMatch: "Product Name",
    schema: PRODUCT_LIST_SCHEMA,
    isValidRow: isProductListRow,
  });

  const rows = extractRows(sheetValues[quarter], {
    headerMatch: "Product Name",
    schema: QUARTER_METRIC_SCHEMA,
    isValidRow: isQuarterlyMetricRow,
  });

  const metrics = new Map();
  for (const row of rows) {
    const { name, ...values } = row;
    metrics.set(name, values);
  }

  return { products, metrics };
}

export async function runSync(env, { quarter } = {}) {
  const targetQuarter = quarter || CURRENT_QUARTER;
  const sheetValues = await fetchSheetValues(env, ["Product List", targetQuarter]);
  const { products, metrics } = normalize(sheetValues, targetQuarter);
  await writeSync(env.IMPACT_KV, { quarter: targetQuarter, products, metrics });
  return { productsSynced: products.length, quarter: targetQuarter };
}

function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      runSync(env).catch((err) => recordSyncError(env.IMPACT_KV, String(err?.message ?? err)))
    );
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/sync") {
      return new Response("Not found", { status: 404 });
    }

    const auth = request.headers.get("Authorization") ?? "";
    if (auth !== `Bearer ${env.SYNC_TOKEN}`) return unauthorized();

    // Optional {"quarter": "FY26Q1"} body to target a specific quarter (e.g. a
    // backfill/correction); an empty or absent body just means "the current one".
    let quarter;
    try {
      quarter = (await request.json())?.quarter;
    } catch {
      quarter = undefined;
    }

    try {
      const result = await runSync(env, { quarter });
      return Response.json({ ok: true, ...result });
    } catch (err) {
      const message = String(err?.message ?? err);
      await recordSyncError(env.IMPACT_KV, message);
      return Response.json({ ok: false, error: message }, { status: 502 });
    }
  },
};
