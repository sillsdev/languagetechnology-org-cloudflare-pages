# SIL Language Technology — 2026 Impact Survey page

This repo is a single self-contained page, `index.html`, presenting results of the
**"SIL Language Technology Impact & Use Survey"** (765 respondents, May 4–Jul 29, 2026).
It's built for two audiences: internal show-off of the Language Technology team's impact,
and donor/sponsor-facing communications (SIL is a faith-based nonprofit reliant on
donations — keep tone warm and human, avoid anything politically sensitive; e.g. we
deliberately dropped a quote mentioning laptops "confiscated by hostile authorities").

The survey's original intro (for context on tone/mission): *"We develop innovative
technologies that enable communities to engage with Scripture and flourish in the
languages they value the most. To prioritize our resources wisely, we need to hear from
you which tools and fonts are important to you and your work."*

## Data source

The raw survey export is **not** in this repo — it lives at:

```
C:\Users\peter\Documents\Claude\Projects\Analytics Project\SIL Language Technology_ Impact & Usage Survey (Final - July 30th).xlsx
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

## Page structure (`index.html`)

Full-bleed photo hero (765 stat) → short intro paragraph → rotating quote carousel →
"Did you know?" stat strip → horizontal-scroll photo filmstrip → Reach chart (28 items) →
Coverage chart (6 use-cases) → Insights (synthesis cards) → Gratitude chart (top 10 by
encouragement, click-to-expand quotes) → Echoes (word cloud) → Voices (feedback category
sentiment) → Momentum (response growth over time).

Everything is one file: inline `<style>`, inline `<script>` at the bottom using Chart.js
(via CDN), no build step. All chart data and quotes are hardcoded in the JS — there is no
live data connection, so any new survey wave means manually re-deriving numbers from a
fresh export using the methodology above.
