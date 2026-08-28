// Header-driven parsing for the LangTech Analytics Dashboard sheet. Column layout
// drifts release to release (e.g. "Product Name" is column A in one quarter's sheet
// and column B in another), so every lookup resolves by header text, never by
// position. Divider rows (bare category names) and footer/notes rows are filtered
// out by a caller-supplied validity predicate rather than a fixed row range.

export function findHeaderRow(rows, headerMatch = "Product Name", maxScan = 5) {
  for (let i = 0; i < Math.min(maxScan, rows.length); i++) {
    const row = rows[i] || [];
    if (row.some((cell) => String(cell ?? "").trim() === headerMatch)) return i;
  }
  throw new Error(`Header row containing "${headerMatch}" not found in first ${maxScan} rows`);
}

export function buildHeaderMap(headerRow) {
  const map = {};
  (headerRow || []).forEach((cell, i) => {
    const key = String(cell ?? "").trim();
    if (key) map[key] = i; // last-write-wins if a header repeats
  });
  return map;
}

// schema: { canonicalKey: "Header Text" }. isValidRow(row, headerMap) decides whether
// a row is a real data row (vs. a category divider or footer notes row).
export function extractRows(values, { headerMatch, schema, isValidRow }) {
  if (!values || values.length === 0) return [];
  const headerRowIdx = findHeaderRow(values, headerMatch);
  const headerMap = buildHeaderMap(values[headerRowIdx]);

  const out = [];
  for (const row of values.slice(headerRowIdx + 1)) {
    if (!row || !isValidRow(row, headerMap)) continue;
    const obj = {};
    for (const [canonicalKey, headerText] of Object.entries(schema)) {
      const idx = headerMap[headerText];
      obj[canonicalKey] = idx != null && row[idx] !== "" ? row[idx] ?? null : null;
    }
    out.push(obj);
  }
  return out;
}

export function isProductListRow(row, headerMap) {
  const name = row[headerMap["Product Name"]];
  const category = row[headerMap["Category"]];
  return Boolean(name) && Boolean(category);
}

export function isQuarterlyMetricRow(row, headerMap) {
  const name = row[headerMap["Product Name"]];
  if (!name) return false;
  const populated = row.filter((c) => c !== "" && c != null).length;
  return populated >= 3;
}

export const PRODUCT_LIST_SCHEMA = {
  name: "Product Name",
  category: "Category",
  platforms: "Platform(s)",
  devStatus: "Development Status",
  metricsMode: "Metrics collection mode",
  productUrl: "Product Page",
  openSource: "Open Source Repo?",
};

// Canonical metric key -> header text. Reused unchanged across every quarterly
// sheet — this is exactly how column drift is absorbed, since a column's *position*
// may move but its header text is stable.
export const QUARTER_METRIC_SCHEMA = {
  active_users: "Active Users",
  downloads: "Downloads",
  installs: "Installs",
  active_projects: "Active Projects",
  new_projects_started: "New Projects Started",
  avg_mau: "Avg MAU",
  countries: "Number of User Countries",
  languages_impacted: "Number of Languages Impacted",
  release_version: "Latest Release Version",
  release_date: "Latest Release Date",
  supported_fte: "Supported FTE",
  paid_fte: "Paid FTE",
  new_support_tickets: "New Support Tickets",
  new_community_topics: "New Community Topics",
};

export const METRIC_LABELS = {
  active_users: "Active Users",
  downloads: "Downloads",
  installs: "Installs",
  active_projects: "Active Projects",
  new_projects_started: "New Projects Started",
  avg_mau: "Avg. Monthly Active Users",
  countries: "Countries Reached",
  languages_impacted: "Languages Impacted",
  release_version: "Latest Release Version",
  release_date: "Latest Release Date",
  supported_fte: "Supported FTE",
  paid_fte: "Paid FTE",
  new_support_tickets: "New Support Tickets",
  new_community_topics: "New Community Topics",
};
