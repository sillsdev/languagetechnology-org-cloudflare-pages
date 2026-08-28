import { getAccessToken } from "./googleAuth.js";
import {
  extractRows,
  isProductListRow,
  isQuarterlyMetricRow,
  PRODUCT_LIST_SCHEMA,
  QUARTER_METRIC_SCHEMA,
} from "./sheetParse.js";
import { upsertAll, recordSyncError } from "./db.js";

// Quarterly sheets to pull, most recent first. Adding a future quarter is a one-line
// addition here — no other code changes, since parsing is header-driven.
const QUARTER_SHEETS = ["FY26Q3", "FY26Q2", "FY26Q1", "FY25Q4"];
const SHEET_RANGES = ["Product List", ...QUARTER_SHEETS];

async function fetchSheetValues(env) {
  const token = await getAccessToken(env);
  const params = new URLSearchParams({ valueRenderOption: "UNFORMATTED_VALUE" });
  for (const range of SHEET_RANGES) params.append("ranges", range);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.SHEET_ID}/values:batchGet?${params}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    throw new Error(`Sheets API batchGet failed (${res.status}): ${await res.text()}`);
  }
  const { valueRanges } = await res.json();
  return SHEET_RANGES.reduce((acc, range, i) => {
    acc[range] = valueRanges[i]?.values ?? [];
    return acc;
  }, {});
}

function normalize(sheetValues) {
  const products = extractRows(sheetValues["Product List"], {
    headerMatch: "Product Name",
    schema: PRODUCT_LIST_SCHEMA,
    isValidRow: isProductListRow,
  });

  const metricsByProduct = new Map();
  for (const period of QUARTER_SHEETS) {
    const rows = extractRows(sheetValues[period], {
      headerMatch: "Product Name",
      schema: QUARTER_METRIC_SCHEMA,
      isValidRow: isQuarterlyMetricRow,
    });
    for (const row of rows) {
      const { name, ...metrics } = row;
      if (!metricsByProduct.has(name)) metricsByProduct.set(name, new Map());
      metricsByProduct.get(name).set(period, metrics);
    }
  }

  return { products, metricsByProduct };
}

export async function runSync(env) {
  const sheetValues = await fetchSheetValues(env);
  const normalized = normalize(sheetValues);
  await upsertAll(env.DB, normalized);
  return { productsSynced: normalized.products.length, quarters: QUARTER_SHEETS };
}

function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      runSync(env).catch((err) => recordSyncError(env.DB, String(err?.message ?? err)))
    );
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/sync") {
      return new Response("Not found", { status: 404 });
    }

    const auth = request.headers.get("Authorization") ?? "";
    if (auth !== `Bearer ${env.SYNC_TOKEN}`) return unauthorized();

    try {
      const result = await runSync(env);
      return Response.json({ ok: true, ...result });
    } catch (err) {
      const message = String(err?.message ?? err);
      await recordSyncError(env.DB, message);
      return Response.json({ ok: false, error: message }, { status: 502 });
    }
  },
};
