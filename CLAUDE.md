# languagetechnology-org-cloudflare-pages

Static site for SIL Language Technology's Cloudflare Pages deployment. Each page
(`index.html`, `survey-results/index.html`, `impact/index.html`) is self-contained —
inline `<style>`/`<script>`, no shared CSS/JS, no build step. That's a deliberate
convention (see `survey-results/CLAUDE.md`) — the current homepage
(`index.html`) still runs deprecated styling (Inter font, `#003a89` blue) that
predates the brand colors below, and updating it is explicitly out of scope
for now, so a single shared stylesheet across the whole site isn't possible
yet. This file documents shared values to **copy into** a new page's own
inline styles, not to link/import.

## Brand colors

Established by `survey-results/index.html` and carried into `impact/index.html`.
Reuse these exact hex values in any new page rather than picking new ones.

| Role | Hex | Notes |
|---|---|---|
| Navy (primary ink / headings) | `#003049` | body text color, stat values, product names |
| Accent blue (links, eyebrows, section titles) | `#00a7e1` | `.eyebrow`, `.section-title` |
| Secondary text | `#727272` | labels, captions |
| Muted text | `#8a8a8a` | timestamps, fine print |
| Border (light) | `#e4e4e4` | pills, dividers |
| Border (hairline) | `#eef1f3` | table/card borders |
| Surface (off-white) | `#f9fafb` | filter bars, table headers, quote panels |
| Chart categorical (8, in order) | `#005CB9` `#FF6B00` `#93358D` `#509E2F` `#00A7E1` `#D52227` `#666666` `#FFB71B` | SIL brand swatch colors, from `impact/index.html`'s product-category chart; keep the order (CVD-safe), don't add a 9th hue — fold extra categories into gray |

Fonts: `Playfair Display` (headings, stat/hero values), `Source Sans 3` (body,
UI), `Caveat` (section-title accents, handwritten-style eyebrow headings).

## TODO

- Extract a shared styling/theme (colors, fonts, common component CSS) instead
  of copy-pasting inline `<style>` blocks per page. Blocked on updating the
  homepage (`index.html`) off its deprecated styling first — see intro above;
  that update is out of scope for now.
