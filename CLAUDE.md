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
| Section accent — Products | `#005CB9` | `impact/index.html`'s numbered section banner (icon, border, eyebrow) |
| Section accent — Apps | `#00A7E1` / eyebrow `#034D8A` | Apps section banner; `#F2F7FB` tints that section's background |
| Section accent — Fonts | `#042C54` | Fonts section banner |
| Change indicator — up / down | `#38751C` / `#A6121F` | darker than the base SIL green/red (`#509E2F`/`#D52227`), which fall below 4.5:1 contrast at 13px on `#f9fafb` tiles |
| Trend line / card accents | `#008AAF` | Apps trend chart's line + tooltip accents |
| Tint ramps used for section bands/borders | `#CCDEF1` `#E5EEF8` | light section borders and card backgrounds between the full-strength section colors and white |

Fonts: `Playfair Display` (headings, stat/hero values), `Source Sans 3` (body,
UI), `Caveat` (section-title accents, handwritten-style eyebrow headings).

## TODO

- Extract a shared styling/theme (colors, fonts, common component CSS) instead
  of copy-pasting inline `<style>` blocks per page. Blocked on updating the
  homepage (`index.html`) off its deprecated styling first — see intro above;
  that update is out of scope for now.
