# Product Impact Dashboard (`/impact`)

Per-product usage statistics for every SIL Language Technology product, sourced from
the "LangTech Analytics Dashboard" Google Sheet that the team updates each fiscal
quarter.

## How it's put together

- **`impact/index.html`** — the page itself. Static HTML/CSS/JS, no build step,
  self-contained (matches this repo's convention). Fetches `/impact/api/products`
  (defaulting to the latest quarter) and renders a filterable/sortable product table
  client-side. Switching the quarter dropdown re-fetches (`?quarter=<period>`) rather
  than filtering in-memory — see "One record per quarter" below for why.
- **`functions/impact/api/products.js`** — a Cloudflare Pages Function that serves that
  JSON. It reads two keys from a KV namespace (`env.IMPACT_KV`) when bound and
  populated — the product catalog, plus whichever single quarter was requested — and
  otherwise falls back to a static snapshot.
- **`functions/impact/_lib/staticData.js`** — the current data source in practice: a
  real snapshot (32 products, last two fiscal quarters) extracted by hand from a sheet
  export. This is a stopgap until the pipeline below is fully wired up — see that
  file's header comment for how to refresh it.
- **`impact-sync/`** — a separate Cloudflare Worker (own deploy, own `wrangler.toml`)
  that will sync the live Google Sheet, shape it into the exact JSON the front end
  expects, and write it into KV (see `src/kv.js`), on a cron schedule plus a manual
  trigger. Not live yet — needs a Google service account and KV namespace to be
  provisioned (Cloudflare/Google Cloud access required, so this part is manual setup,
  not something done from this repo alone).
- **`functions/impact/api/fonts.js`** — same shape as `products.js`: reads a
  `fonts:catalog` + `fonts:date:<date>` pair from the same `IMPACT_KV` namespace,
  falling back to `functions/impact/_lib/staticFontData.js`. **Nothing writes those KV
  keys yet** — `scripts/import-font-stats.mjs` still only rewrites the static file, so
  this always falls through to the static snapshot in practice. The read side and the
  front end's date-switching were still wired up now (deliberately, ahead of that
  writer) so the API/UI contract already matches products; only the population
  mechanism (script writing to KV directly, or a future live sync worker) is out of
  scope for now.

`IMPACT_KV` is one shared namespace across every /impact data source, each under its
own key prefix (`products:*`, `fonts:*`, and any future source) — see "Why KV, not a
database" below. Once a source's KV keys are populated, its read Function picks that
up automatically — no changes needed to `index.html` or the static fixtures.

### One record per quarter, not one record for everything

`impact-sync/src/kv.js` writes two kinds of records: one `products:catalog` record
(product metadata — name, category, platforms, dev status — from the sheet's single
"Product List" tab, plus the list of quarters ever synced) and one
`products:quarter:<period>` record per fiscal quarter (that quarter's metric values
only). A sync run only ever writes the quarter it's targeting — older quarters' records
are left alone — because in practice a sync only ever imports the newest quarter.
`impact-sync/src/index.js`'s `CURRENT_QUARTER` constant is the default target (bump it
once each new fiscal quarter, same as the old `QUARTER_SHEETS` list needed); a manual
`POST /sync` with `{"quarter": "FY26Q1"}` can target any other quarter for a backfill
or correction.

The trade-off: this used to be one big blob so switching quarters in the UI was
instant and client-side, like every other filter. Now it's a real network request
(`onQuarterChange` in `index.html`) — with a loading indicator, an error state, an
in-memory cache of quarters already fetched this session, and a request-token guard
against a slow response for an older selection landing after a newer one. That's a
deliberate trade for a smaller default payload and an incremental sync (see also "Why
KV, not a database" below).

### Why KV, not a database

Every data source on this page (product metrics, font usage, and any future source
like a Mixpanel export) is read wholesale on page load and filtered/sorted
client-side — nothing ever queries for a subset. Each source's sync job pre-shapes
its own JSON document once and writes it under its own KV key; the read Function is
just a `GET`. There's no shared schema across sources to migrate, because each
source's shape lives only in the code that writes and reads it — the same pattern
`staticFontData.js` already used before KV existed. A relational database only earns
its keep here if a future source needs server-side cross-source queries or is
event-level and too large to pre-aggregate into one small JSON blob (at that point,
look at Cloudflare's Workers Analytics Engine rather than reaching back for D1).

## Running it locally

From the repo root (not this directory):

```
npx wrangler pages dev .
```

This serves the whole static site plus its Pages Functions, including `/impact`, at
**http://localhost:8788**. Local KV is emulated but starts empty, so
`/impact/api/products` will serve the static snapshot until the sync pipeline is live.

## Data notes

- `impact/input/` holds the raw sheet export (`.xlsx`) used to generate the static
  snapshot. It's git-ignored (SIL-internal data) — never commit it.
- The static snapshot excludes the sheet's "Fonts" section and any placeholder rows
  with no dev status and no metrics ever recorded.

## TODO

- [ ] Finish the manual KV namespace + Google service account setup (see
  `impact-sync/`) and deploy the sync worker, so the page reads live data instead of
  the static snapshot.
- [ ] Update styling to match the SIL theme, including a menu/nav that at least links
  to `/survey-results` (and presumably back to the site root) — currently there's just
  a bare "&larr; Language Technology" link back to `/`, no shared nav between pages.
- [ ] Add analytics to the page (no site-wide analytics exist anywhere in this repo
  yet, so this also means picking an approach/provider).
