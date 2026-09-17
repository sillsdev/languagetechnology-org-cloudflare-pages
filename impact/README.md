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

1. In `langtech-metrics/api`, run `npx wrangler dev` (default **http://localhost:8787**).
2. In this repo's root, run `npx wrangler pages dev .` (**http://localhost:8788**).

`impact/index.html` detects it's running on `localhost`/`127.0.0.1` and points
`API_ORIGIN` at `http://localhost:8787` instead of production, and the API worker's
CORS allow-list already includes `http://localhost:8788`, so the two talk to each
other with no extra config. Local KV in the API worker starts empty, so you'll see
the static snapshot until you seed it — that's expected.

If you only need to work on the static page itself (not touching data), step 1 is
optional — without a local API running, the page just shows its "couldn't load live
data" state instead of a working table.

## TODO

- [ ] Update styling to match the SIL theme, including a menu/nav that at least links
  to `/survey-results` (and presumably back to the site root) — currently there's just
  a bare "&larr; Language Technology" link back to `/`, no shared nav between pages.
- [ ] Add analytics to the page (no site-wide analytics exist anywhere in this repo
  yet, so this also means picking an approach/provider).
