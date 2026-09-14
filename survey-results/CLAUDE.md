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

**Feedback category counts**: 385 + 191 + 237 = 813 total comments (straight non-blank
counts per the column map above); 71% positive (encouragement + general feedback) vs.
29% constructive.

**Word cloud ("Echoes" section)**: built from the *full* text of columns 9+10 (579
comments — not just the samples shown in `quoteData`'s click-panels). Known multi-word
product names (`"Scripture Forge"`, `"Scripture App Builder"`, `"Dictionary App Builder"`,
etc.) are matched as whole phrases *before* generic word-splitting, so a shared word like
"Forge" or "Builder" doesn't get misattributed across multiple products. Common stopwords
and words under 4 characters are filtered. The word list in `index.html` is manually
curated from the frequency output (mix of product names + emotionally resonant words),
not a raw top-N dump — re-curate by hand if regenerating, don't just paste the sorted list.

**"Beyond the list" chart + click-to-expand quotes**: sourced from a separate
categorized-feedback project (`<local machine, not shared>\final survey feedback\`,
not in this repo) — 36 "Survey Feedback - [Product] - Final.docx" files, one per
product, built by routing every column 9/10/11 free-text comment that names that
product into its own doc, with the text relevant to that product bolded when a
comment names more than one. That project also produced docs for five products with
**no survey checkbox at all** — respondents named them unprompted in the open-text
questions: PrimerPrep, Toolbox, XLingPaper, LingTree, WeSay. The chart shows each
one's "positive" count (encouragement + general feedback rows, matching the page's
own definition used in the Voices 71%/29% split), pulled by extracting each doc's
`word/document.xml` (docx is a zip) and counting table rows per H2 section:
PrimerPrep 0+9=9, XLingPaper 0+7=7, LingTree 0+3=3, WeSay 2+0=2 — taken as-is, since
in those docs every row (both sections) was substantively positive about that product.
Sample quotes for the click-to-reveal panel (`beyondQuoteData` in the script) were
pulled from the same rows, trimmed for readability where a row was embedded in a
longer multi-topic list (using the doc's own bolded portion to isolate the relevant
sentence). Capped at **7 samples per product, matching Gratitude's `quoteData` cap**
— shown in full where a product has 7 or fewer genuine positive rows (XLingPaper,
LingTree, WeSay), and picked as the 7 strongest/most quotable out of the genuine total
where there were more to choose from (Toolbox: 7 of 11; PrimerPrep: 7 of 9, dropping
the two weakest/most repetitive one-liners and a second-hand "heard good things about
PrimerPro, haven't tried it" mention that isn't really a usage testimonial).

**Toolbox is the one exception, hand-reviewed row by row in both sections**:
- **General Feedback** (18 rows) isn't filtered for sentiment the way it is for
  smaller products — many rows are bare inventory mentions ("Field Linguist's Toolbox
  1.6.4"), entries leaning *away* from Toolbox ("probably need to move it over to FLEX
  soon"), or tangential technical asides. Reading each row's bolded Toolbox-relevant
  portion, only **7 of 18** read as genuine positive sentiment.
- **Encouragements** (6 rows) turned out to need the same treatment once actual quote
  text was pulled for the click-to-reveal panel: 2 of the 6 are false positives from
  keyword-matching on the word "toolbox" rather than the product — "...PT is our
  lifeline and our **complete toolbox**..." (generic English phrase) and "...(post
  **toolbox** to flex conversion)" (a factual aside, not praise) — the same class of
  bug as the FieldWorks/"flex" substring mix-up above. Only **4 of 6** are genuine.

**Toolbox total: 4 + 7 = 11**, not the raw 6 + 18 = 24 — don't recompute from the raw
row count without redoing this filtering pass. If any other product gets this same
treatment later, check for generic-word collisions in Encouragements too, not just
General Feedback — this was missed on the first pass because the review request was
scoped to General Feedback only, and the Encouragement bug only surfaced later while
transcribing actual quote text.

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

**Colors — all values below are verified against the official
`SIL Color Codes.pdf`** (SIL's global brand primary/shade/tint reference, not
tracked in this repo), **except the primary navy**, which is a deliberate
exception (see note below the table). Before this pass, most of the page's
palette was custom (only `#00a7e1`/SIL Light Blue and `#ff6b00`/SIL Orange were
already exact official matches) — every other color has since been swapped to
the nearest exact official value (primary, documented "darker" shade, or a
documented tint percentage):

| Role | Hex | Official SIL name |
|---|---|---|
| Primary text / dark navy | `#003049` | **Not in the PDF** — kept deliberately, see note below |
| Secondary text | `#757575` | SIL Gray, 90% tint |
| Muted text | `#858585` | SIL Gray, 80% tint |
| Borders / dividers | `#E0E0E0` | SIL Gray, 20% tint |
| Brand orange (accent) | `#ff6b00` | SIL Orange (primary) |
| Brand blue | `#00a7e1` | SIL Light Blue (primary) |
| Hero eyebrow text (light, on dark photo) | `#33B9E7` | SIL Light Blue, 80% tint |
| Hero stat sub-label (light, on dark photo) | `#CCDEF1` | SIL Blue, 20% tint |
| Hero caption sub-text (light, on dark photo) | `#99BEE3` | SIL Blue, 40% tint (approximate — the original custom `#93A9B8` was more desaturated/gray than any exact tint step, this is the closest available) |
| Green accent | `#509E2F` | SIL Green (primary) |
| Red accent | `#D52227` | SIL Red (primary) |
| Red accent, dark/hover | `#A6121F` | SIL Darker Red (shade) |
| Darker orange (encouragement-card icon/text) | `#C24F00` | SIL Darker Orange (shade) |
| EncChart hover | `#008AAF` | SIL Lighter Blue (shade) |
| Neutral tints | `#EFEFEF` (Gray 10%), `#F7F7F7` (Gray 5%) | card/section backgrounds |
| Color-tinted backgrounds | `#FFF0E5` (Orange 10% tint), `#E5F6FC` (Light Blue 10% tint), `#E5EEF8` (Blue 10% tint) | paired with matching dark text (`#C24F00`, `#003049`, `#003049`) for the three feedback-category cards |
| Categorical chart/word-cloud palette (in order) | `#003049`, `#ff6b00`, `#00a7e1`, `#509E2F`, `#D52227` | Navy, Orange, Light Blue, Green, Red — used for Chart.js series and word-cloud word coloring |

**Note on the primary navy `#003049`**: this hex isn't in `SIL Color Codes.pdf` at
all (not a primary, shade, or tint of SIL Blue `005CB9`) — it's noticeably darker/
more desaturated than even "SIL Darker Blue" (`034D8A`). It was tried as
`034D8A` during this color-audit pass and reverted per explicit user preference:
`#003049` is also used on sil.org itself, so it's treated as a legitimate SIL
brand color the PDF simply doesn't happen to document, not an error to fix.
**Don't "correct" it to an official-PDF blue in a future pass** — this was a
deliberate, informed choice, not an oversight.

Swapping to `034D8A` also had a real visual side-effect worth remembering: the
hero photo's dark overlay (`rgba(0,48,73,...)` gradient, and the photo-strip nav
buttons) is built from this same color as an alpha-blended rgba fill, not the
`#003049` hex directly — `034D8A` being lighter made that overlay read as a
washed-out, lighter veil over the hero photo instead of the deep dark fade it's
meant to be. If this navy ever changes again, remember to update the matching
`rgba(R,G,B,...)` triplet in those two spots too, not just the `#hex` occurrences.

**History**: this page's palette was originally fully custom (navy `#003049`,
teal `#1D9E75`, orange-brown `#8A3E0A`/`#5C2806`, and assorted bespoke tint
backgrounds), predating a check against the official brand PDF. Recoloring was
done role-by-role, not a blind find-and-replace — some colors served two
different semantic roles under the same hex and needed different targets: e.g.
old `#8A3E0A` was both a generic categorical chart/word-cloud accent (→ first
Violet `#93358D`, then swapped to Red `#D52227` per explicit request — Red was
chosen over Yellow because it also serves as text color in a couple of spots
(the "Beyond the list" quote panel's prev/next nav links) and Yellow's contrast
against white fails WCAG AA even at its "Darker Yellow" shade, ~2.6:1 vs the
4.5:1 minimum, while Red reaches ~5.1:1 and Darker Red ~7.7:1) *and* the
"encouragements" Voices-card's icon/text color, specifically paired with its
orange-tinted background (→ now Darker Orange `#C24F00`, staying in the orange
family rather than following the categorical accent's color). Navy `#003049`
was the one color kept as-is — see the note above.

This color audit only covers this page. `impact/index.html`'s real dashboard
(built on the separate, unmerged `impact-dashboard` branch) already uses the
official 8-color SIL primary swatch set from the start, so it needs no
equivalent fix.

Card corner radius is `10px` (CSS var `--radius`). CSS custom properties for the core text
colors are declared on `:root` (`--text-primary`, `--text-secondary`, `--text-muted`) — reuse
those rather than re-hardcoding `#003049`/`#757575`/`#858585` inline where practical (most of
the existing page uses inline hex directly, so it's fine to match that pattern too — just stay
consistent with these values).

## Page structure (`index.html`)

Full-bleed photo hero (765 stat) → short intro paragraph → rotating quote carousel →
"Did you know?" stat strip → horizontal-scroll photo filmstrip → Reach chart (28 items) →
Coverage chart (6 use-cases) → Gratitude chart (top 10 by encouragement, click-to-expand
quotes) → Beyond the list (chart of unsurveyed products respondents named unprompted,
click-to-expand quotes) → Also loved (encouragement quotes for surveyed tools outside
the top 10) → Insights (synthesis cards) → Echoes (word cloud) → Voices (feedback
category sentiment) → Momentum (response growth over time).

**"Beyond the list" placement history, for context if this comes up again**: it
started right after "Also loved" (simple static chart, no quotes), got promoted to
right after "Coverage" for visibility, then — once click-to-reveal quotes were added,
matching Gratitude's interaction — got pulled back to sit *between* Gratitude and Also
loved: high enough to stay visible, but directly after Gratitude rather than above it,
so its interactivity doesn't visually outrank the top-10 surveyed products' quotes
despite covering 5 products with single-digit mention counts vs. hundreds each.

Everything is one file: inline `<style>`, inline `<script>` at the bottom using Chart.js
(via CDN), no build step. All chart data and quotes are hardcoded in the JS — there is no
live data connection. The survey is now closed (no further waves), so this page's data is
final; the methodology above is documented for posterity/audit, not for a future re-run.
