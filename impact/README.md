# Product Impact Dashboard (`/impact`)

Per-product usage statistics for every SIL Language Technology product, sourced from
the "LangTech Analytics Dashboard" Google Sheet that the team updates each fiscal
quarter.

## How it's put together

- **`impact/index.html`** — the page itself. Static HTML/CSS/JS, no build step,
  self-contained (matches this repo's convention). Fetches `/impact/api/products` and
  renders a filterable/sortable product table client-side.
- **`functions/impact/api/products.js`** — a Cloudflare Pages Function that serves that
  JSON. It reads from a D1 database (`env.DB`) when one is bound and populated, and
  otherwise falls back to a static snapshot.
- **`functions/impact/_lib/staticData.js`** — the current data source in practice: a
  real snapshot (32 products, last two fiscal quarters) extracted by hand from a sheet
  export. This is a stopgap until the pipeline below is fully wired up — see that
  file's header comment for how to refresh it.
- **`impact-sync/`** — a separate Cloudflare Worker (own deploy, own `wrangler.toml`)
  that will sync the live Google Sheet into D1 on a cron schedule plus a manual
  trigger. Not live yet — needs a Google service account and D1 database to be
  provisioned (Cloudflare/Google Cloud access required, so this part is manual setup,
  not something done from this repo alone).

Once `impact-sync` is deployed and D1 is populated, `products.js` picks that up
automatically — no changes needed to `index.html` or `staticData.js`.

## Running it locally

From the repo root (not this directory):

```
npx wrangler pages dev .
```

This serves the whole static site plus its Pages Functions, including `/impact`, at
**http://localhost:8788**. Local D1 is emulated but starts empty, so
`/impact/api/products` will serve the static snapshot until the sync pipeline is live.

## Data notes

- `impact/input/` holds the raw sheet export (`.xlsx`) used to generate the static
  snapshot. It's git-ignored (SIL-internal data) — never commit it.
- The static snapshot excludes the sheet's "Fonts" section and any placeholder rows
  with no dev status and no metrics ever recorded.

## TODO

- [ ] Finish the manual D1 + Google service account setup (see `impact-sync/`) and
  deploy the sync worker, so the page reads live data instead of the static snapshot.
- [ ] Update styling to match the SIL theme, including a menu/nav that at least links
  to `/survey-results` (and presumably back to the site root) — currently there's just
  a bare "&larr; Language Technology" link back to `/`, no shared nav between pages.
- [ ] Add analytics to the page (no site-wide analytics exist anywhere in this repo
  yet, so this also means picking an approach/provider).
