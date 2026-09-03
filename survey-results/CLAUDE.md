# SIL Language Technology — 2026 Impact Survey page

This repo is a single self-contained page, `index.html`, presenting results of the
**"SIL Language Technology Impact & Use Survey"** (765 respondents, May 4–Jul 30, 2026 —
closed Jul 30, though the last response actually came in Jul 29).
It's built for two audiences: internal show-off of the Language Technology team's impact,
and donor/sponsor-facing communications (SIL is a faith-based nonprofit reliant on
donations — keep tone warm and human, avoid anything politically sensitive).

The survey's original intro (for context on tone/mission): *"We develop innovative
technologies that enable communities to engage with Scripture and flourish in the
languages they value the most. To prioritize our resources wisely, we need to hear from
you which tools and fonts are important to you and your work."*

## Data source

The raw survey export is **not** in this repo — it lives at:

```
<local machine, not shared>\SIL Language Technology_ Impact & Usage Survey (Final - July 30th).xlsx
```

Sheet `Form Responses 1`, 765 response rows (rows 2–766), 75 columns. Two other sheets
(`PA users`, `Cog users`) are empty/unused.

No Python is available in this environment. Node.js is available. To read the `.xlsx`,
use Excel via PowerShell COM interop — bulk-read with `$ws.UsedRange.Value2` (a 2D array)
rather than cell-by-cell, which is far faster:

```powershell
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$wb = $excel.Workbooks.Open($path)
$ws = $wb.Worksheets.Item("Form Responses 1")
$data = $ws.UsedRange.Value2   # $data[row, col], 1-indexed
$wb.Close($false); $excel.Quit()
```

**Gotcha:** when exporting a free-text column to a line-based `.txt` file for word/phrase
analysis, collapse embedded `\r\n` within each cell first (`-replace "[\r\n]+", " "`)
*before* writing. Otherwise a single multi-line survey response splits across several
physical lines in the output file, and any phrase-matching that happens to straddle the
injected line break silently misses (this caused an undercount of "Language Forge"
mentions in the word cloud until caught).

## Column map

| Col | # | Content |
|---|---|---|
| Timestamp | 1 | — |
| Keyboarding | 2 | multi-select, "important to you" |
| Literacy | 3 | multi-select, "important to you" |
| Linguistics and Language Data | 4 | multi-select, "important to you" |
| Scripture Drafting | 5 | multi-select, "important to you" |
| Scripture Audio | 6 | multi-select, "important to you" |
| Scripture Publishing | 7 | multi-select, "important to you" |
| Which SIL fonts are important | 8 | free text (treated as one aggregate "Fonts" category) |
| Encouragement / positive impact | 9 | free text — 385 non-blank |
| General feedback | 10 | free text — ~194 non-blank (page shows 191) |
| Constructive feedback | 11 | free text — 237 non-blank |
| "Do you have a few more minutes?" | 12 | Yes/No opt-in — 415 said Yes |
| Tool usage frequency grid | 13–38 | 26 tools, one column each |
| Font usage frequency grid | 39–75 | 37 fonts, one column each |

Columns 2–7 and 13–75 are Google Forms checkbox questions: if multiple options were
picked, the exported cell is a comma-joined list of the full option label text
(e.g. `"FieldWorks - linguistic data management for lexicography and language analysis, FieldWorks Lite - offline simplified dictionary editor that syncs with FieldWorks"`).
Each tool/font's option text is a fixed, constant string — use `.Contains(fullOptionString)`
for reliable presence checks rather than splitting on commas (description text can itself
contain commas).

Columns 13–75 use a different option vocabulary: `"At least weekly"`, `"At least once
every 3 months"`, `"In the past 2 years"`, `"I don't use it, but it's important"`.

## Methodology used on the page

**"Reach" chart (all 28 tools & fonts)** — % = respondents whose relevant column (2–7)
contains that tool's exact option string, ÷ **765** (total respondents). Fonts (aggregate)
= non-blank count in column 8 ÷ 765 = 84%. This exactly reproduces every number that was
already on the page before this was verified (Paratext 64%, FieldWorks 56%, Keyman 55%,
Bloom 50%, Scripture App Builder 46%, Fonts 84%) — confirmed methodology, don't second-guess it.

Do **not** confuse this with the usage-frequency grid (columns 13–75), which uses a
different, smaller denominator (415, the opt-in subsample) — that grid was explored during
analysis but isn't what any current page number is based on.

**Combined app-builder reach**: 515 of 765 (67%) marked at least one of Keyboard/Dictionary/
Reading/Scripture App Builder as important (unique respondents, not sum — the four
individually total 1,061 selections, so there's heavy overlap).

**Gratitude chart + quote panels + `quoteData`**: sourced from column 9 (encouragement
text), tagged by product mention. Verified authentic against the raw file (e.g. the
Chickasaw Nation quote traces to row 104). Top 10 products account for 375 of 385 total
encouragement comments (97%); the rest are spread across other tools.

**Note on product-mention tagging**: respondents often used short forms instead of full
product names (PT → Paratext, FLEx → FieldWorks, APM → Audio Project Manager, RAB →
Reading App Builder, SAB → Scripture App Builder, DAB → Dictionary App Builder, KAB →
Keyboard App Builder), plus informal spelling variants (e.g. "PTX Print" for PTXprint,
"Alpha Tiles" for AlphaTiles, "Boom" as a typo for Bloom). A separate, manually-curated
cross-check (the `Survey Feedback - [Product].docx` files behind the board presentation,
as of 2026-08-05) already accounts for these variants; Scripture App Builder and
Dictionary App Builder's counts on this page matched that cross-check exactly (40 and
15), confirming those two were tagged correctly here. Paratext/Bloom/Andika/PTXprint were
each off by 1-2 against that cross-check — small enough, and the doc-based source
revised/updated enough since the page's July 30 export, that it wasn't treated as a page
correction.

FieldWorks was a real bug, since fixed: the page's original count of 62 wasn't FieldWorks
(FLEx) at all — it was FieldWorks (FLEx) 59 + FieldWorks Lite 2 + FlexTrans 1, three
distinct tracked products conflated into one "FieldWorks" bucket (these three happen to
share the substring "flex", which is almost certainly how the mix-up happened). The
Gratitude chart's FieldWorks bar, `quoteData.FieldWorks.total`, and the "372 of 385"
top-10-coverage stat were all corrected to reflect FieldWorks (FLEx) alone (59), matching
the doc-based cross-check exactly. **The survey is now closed (no further waves)**, so
this is a closed record, not an action item for a future re-export.

**Feedback category counts** (813 total, 71% positive / 29% constructive): column 9 = 385,
column 10 ≈ 191–194, column 11 = 237, straight non-blank counts.

**Word cloud ("Echoes" section)**: built from the *full* text of columns 9+10 (579
comments — not just the samples shown in `quoteData`'s click-panels). Known multi-word
product names (`"Scripture Forge"`, `"Scripture App Builder"`, `"Dictionary App Builder"`,
etc.) are matched as whole phrases *before* generic word-splitting, so a shared word like
"Forge" or "Builder" doesn't get misattributed across multiple products. Common stopwords
and words under 4 characters are filtered. The word list in `index.html` is manually
curated from the frequency output (mix of product names + emotionally resonant words),
not a raw top-N dump — re-curate by hand if regenerating, don't just paste the sorted list.

**Known non-issue**: an earlier "37 tools & fonts referenced" stat was wrong — 37 is only
the font count (columns 39–75); the true combined distinct-item count is 64 (27 tools +
37 fonts). That stat was removed/replaced rather than corrected, since a raw catalog-size
number added little value to the donor audience — see the "Insights" section instead for
what actually resonates.

## Visual style

Colors and fonts are aligned with the SIL global brand (global.sil.org) — match these
rather than introducing new ones when adding sections or charts.

**Fonts** (Google Fonts, loaded via `<link>` in `<head>`):
- `Playfair Display` (serif, weights 500/600, italic 500) — headings, big stat numbers,
  pull-quotes.
- `Source Sans 3` (sans-serif, weights 400/500) — body text, UI controls (buttons, captions).
- `Caveat` (cursive, weight 500) — the handwritten-style section "eyebrow" labels (e.g.
  "Reach", "Coverage", "Gratitude"), always in the brand blue `#00a7e1`.

**Colors:**
| Role | Hex | Notes |
|---|---|---|
| Primary text / dark navy | `#003049` | headings, stat numbers, primary text |
| Secondary text | `#727272` | body copy, captions |
| Muted text | `#8a8a8a` | least prominent labels |
| Borders / dividers | `#e4e4e4` | hairlines, card borders |
| Brand orange (accent) | `#ff6b00` | dividers, CTAs, highlight accents |
| Brand blue | `#00a7e1` | section eyebrow headings, links, accents |
| Light blue | `#4FC3E8` | hero eyebrow text on dark background |
| Green accent | `#1D9E75` | tertiary chart/category color |
| Dark orange-brown | `#8A3E0A` | quaternary chart/category color, "constructive feedback" tint |
| Deep brown | `#5C2806` | darkest orange-family text (on `#FCEEE3` tint) |
| Neutral tints | `#eef1f3`, `#f9fafb`, `#E7ECF1` | card/section backgrounds |
| Color-tinted backgrounds | `#FCEEE3` (orange), `#E3F3FA` (blue), `#E7ECF1` (neutral) | paired with matching dark text (`#8A3E0A`/`#5C2806`, `#0C4A63`/`#093646`, `#003049`/`#081F30`) for the three feedback-category cards |
| Categorical chart/word-cloud palette (in order) | `#003049`, `#ff6b00`, `#00a7e1`, `#1D9E75`, `#8A3E0A` | used for Chart.js series and word-cloud word coloring |

Card corner radius is `10px` (CSS var `--radius`). CSS custom properties for the core text
colors are declared on `:root` (`--text-primary`, `--text-secondary`, `--text-muted`) — reuse
those rather than re-hardcoding `#003049`/`#727272`/`#8a8a8a` inline where practical (most of
the existing page uses inline hex directly, so it's fine to match that pattern too — just stay
consistent with these values).

## Page structure (`index.html`)

Full-bleed photo hero (765 stat) → short intro paragraph → rotating quote carousel →
"Did you know?" stat strip → horizontal-scroll photo filmstrip → Reach chart (28 items) →
Coverage chart (6 use-cases) → Insights (synthesis cards) → Gratitude chart (top 10 by
encouragement, click-to-expand quotes) → Echoes (word cloud) → Voices (feedback category
sentiment) → Momentum (response growth over time).

Everything is one file: inline `<style>`, inline `<script>` at the bottom using Chart.js
(via CDN), no build step. All chart data and quotes are hardcoded in the JS — there is no
live data connection. The survey is now closed (no further waves), so this page's data is
final; the methodology above is documented for posterity/audit, not for a future re-run.
