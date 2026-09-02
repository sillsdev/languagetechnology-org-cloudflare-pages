import { staticFontData } from "../_lib/staticFontData.js";

// No D1 branch here (unlike products.js): font usage has no live API source,
// just a quarterly manual CSV export (see scripts/import-font-stats.mjs), so
// the static snapshot is the only data source for now.
export async function onRequestGet() {
  return Response.json(staticFontData);
}
