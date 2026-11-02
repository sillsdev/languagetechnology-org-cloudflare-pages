# Product Impact Dashboard (`/impact`)

Per-product usage statistics for every SIL Language Technology product. Static
HTML/CSS/JS, no build step, self-contained (matches this repo's convention) —
everything about how the *data* is sourced, synced, and served lives in the separate
`langtech-metrics` repo.

## How it's put together

- **`impact/index.html`** — the page itself. Fetches from
  `https://metrics.languagetechnology.org` (`GET /api/products`, optionally
  `?quarter=<period>`; `GET /api/fonts`, optionally `?date=<date>`) and renders a
  filterable/sortable product table and a Font Usage section client-side. Switching
  the quarter or date dropdown re-fetches rather than filtering in-memory, since the
  API only ever returns one period at a time. The page's `API_ORIGIN` constant
  switches to a local API dev server automatically when the page itself is served
  from localhost — see "Running it locally" below.
- **`impact/methodology/index.html`** — a static, self-contained page explaining how
  the metrics are defined/collected and their known limitations (e.g. Active Users
  mixing tool-usage and website-traffic semantics, Countries Reached being a max not
  a union). Linked from the dashboard's header nav. No data fetching of its own —
  update it by hand when the methodology or a known limitation changes.
- **Per-product "what changed this quarter" notes** — each product's `metrics` object
  can carry an optional `notes` string (see `api/_data/products.template.js` in
  `langtech-metrics`), sourced from that quarter's spreadsheet Notes/Comments column.
  When present, it's shown in the dashboard's "What changed this quarter" card; the
  card is hidden entirely for a quarter where no product has a note.
- **Products with no data yet** — a product with no metric reported for the selected
  quarter gets a "No data yet" badge next to its name, a highlighted (pale yellow) table
  row, and "Stats not in yet" in place of its metric cells; it's also excluded from the
  "Products Reporting" stat tile. Driven by `metrics.pending` from the API (set by
  `langtech-metrics`' converter); `index.html`'s `isPending()` falls back to checking the
  metrics themselves for quarters pushed before that flag existed.
- **Provisional change indicators** — while the selected quarter still has pending
  products, the API's top-level `complete: false` (set at push time, see
  `langtech-metrics/scripts/push-products.mjs`) makes the stat-tile deltas render grey
  with a trailing `*` instead of a colored up/down arrow, since a dropout product can
  make a still-filling-in total look like a real decline. The note under the stat strip
  explains why.
- **Everything else — the API, its KV-backed storage, static-data fallback, and
  whatever eventually syncs real data into it — lives in `langtech-metrics`**, a
  separate repo with its own deploy (a Cloudflare Worker on
  `metrics.languagetechnology.org`, not a Pages Function in this repo). See that
  repo's README for the read API shape, the KV record layout, and the current state
  of data sourcing (as of this writing, nothing syncs live data — the API falls back
  to a hand-maintained static snapshot).

## Cross-origin note

`metrics.languagetechnology.org` is a different origin from this site, so the API
echoes back `Access-Control-Allow-Origin` for a small allow-list of origins (this
site's production origin, plus the two localhost origins used for local dev — see
`langtech-metrics/api/src/index.js`). If this site's domain or the API's domain ever
changes, both that allow-list and `impact/index.html`'s `API_ORIGIN` constant need
updating.

## Running it locally

This page's data comes from a separate repo's Worker, so testing `/impact` fully
locally means running both dev servers side by side:

1. In the `langtech-metrics` repo, run its local dev server (**http://localhost:3000**).
2. In this repo's root, run `npx wrangler pages dev .` (**http://localhost:8788**) — the
   trailing `.` is required, it tells wrangler to serve the current directory.

`impact/index.html` detects it's running on `localhost`/`127.0.0.1` and points
`API_ORIGIN` at `http://localhost:3000` instead of production, and the API worker's
CORS allow-list already includes `http://localhost:8788`, so the two talk to each
other with no extra config. Local KV in the API worker starts empty, so you'll see
the static snapshot until you seed it — that's expected.

If you only need to work on the static page itself (not touching data), step 1 is
optional — without a local API running, the page just shows its "couldn't load live
data" state instead of a working table.

## TODO

Recommendations from the App Usage design work (Oct 2026). Design canvas, private
until shared from its Share menu: https://claude.ai/artifact/DsBTBXrKpXDqgeCLxtZm5c

### App Usage section (new)

- [ ] **Clear the data for publication first.** The App Catalogue is marked "SIL and
      partners internal use only", and the sharing guidelines rule it out for
      donors and the public. Get the product owner's approval for these figures
      before this section goes live.
- [ ] Add an "App Usage" section in the same pattern as Font Usage: stat strip
      (Android apps, installs, languages, countries, developers), a bar chart and a
      table by app type (Scripture / Dictionary / Reading / Keyboard), cards for iOS
      and offline (FCBH) apps, and a dated source line.
- [ ] Serve the data from `langtech-metrics`, like products and fonts — for example
      `GET /api/apps?month=YYYY-MM` — fed from the monthly App Catalogue snapshots.
- [ ] Add a **Month** dropdown, matching the existing Quarter and Date dropdowns
      (re-fetch on change).
- [ ] Add the "Scripture app installs, past 3 years" line chart, from the
      catalogue's Trends tab: monthly points, a label every six months on the
      x-axis, axis titles, and a hover tooltip.
- [ ] Find out what caused the Mar → Apr 2026 jump in Scripture installs
      (69.3M → 90.1M, +20.8M in one month; other months add 1–4M). If it is a
      counting change, explain it in a "What changed" note before publishing.

### Monthly data process

- [ ] Save a snapshot of `app catalogue.xlsx` every month, e.g.
      `App Catalogue snapshots/app catalogue YYYY-MM.xlsx`. Month-over-month change
      indicators need the previous month's file.
- [ ] Ask the catalogue maintainer to log all-app totals (apps, installs,
      languages, countries, developers) in the Trends tab next to the Scripture
      columns, so indicators and the growth chart can cover all app types.

### Change indicators (whole dashboard)

- [ ] Show the absolute change as well as the percentage, e.g. "▲ +759,720 (+0.8%)".
      Most metrics are running totals, so monthly or quarterly percentages are
      tiny and almost always positive on their own.
- [ ] Show changes under about 0.1%, and known data corrections, in grey (●)
      rather than red: a −1 language after catalogue clean-up is not a loss.
- [ ] Use the darker brand shades for indicators: green `#38751C` and red `#A6121F`.
      The current `#509E2F` and `#D52227` fall below 4.5:1 contrast for 13px text
      on the grey `#F9FAFB` tiles.
- [ ] Add screen-reader text to each indicator (e.g. "Up 8% compared with
      FY26Q2"); "▲" is read aloud as "up-pointing triangle".
- [ ] Label the comparison period in every section: the product strip compares
      quarters, App Usage compares months.
- [ ] Put the indicator on its own line under long values (e.g. 97,265,218)
      instead of inline, so it doesn't wrap.
