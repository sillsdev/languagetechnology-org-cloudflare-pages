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
- **Everything else — the API, its KV-backed storage, static-data fallback, and
  whatever eventually syncs real data into it — lives in `langtech-metrics`**, a
  separate repo with its own deploy (a Cloudflare Worker on
  `metrics.languagetechnology.org`, not a Pages Function in this repo). See that
  repo's README for the read API shape, the KV record layout, and the current state
  of data sourcing (as of this writing, nothing syncs live data — the API falls back
  to a hand-maintained static snapshot).

## Shared snippets

Per this repo's no-shared-CSS/JS convention (see root `CLAUDE.md`), there's no import
for this — just copy the block below into a page's own `<style>`/`<body>` verbatim so
both pages stay in sync.

- **In-review banner** — shown at the top of both `impact/index.html` and
  `impact/methodology/index.html` while the dashboard is still being finalized.
  Remove the `.review-banner` CSS rule, media query, and `<div class="review-banner">`
  from both pages once the dashboard is out of review.

  ```css
  .review-banner {
    box-sizing: border-box; width: 100vw; margin-left: calc(50% - 50vw); background: #FF6B00; color: #fff;
    padding: 8px 1rem; text-align: center; font-size: 13px; font-weight: 600; line-height: 1.4;
  }
  @media (max-width: 480px) { .review-banner { font-size: 12px; } }
  ```

  ```html
  <div class="review-banner">
    This dashboard is in review — layout and features may still change.
  </div>
  ```

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
