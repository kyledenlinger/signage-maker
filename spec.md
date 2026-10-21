# Signage Builder — Spec for Claude Code

Oct 21, 2026 · @Kyle Denlinger

## Overview and goals

Build a small browser app that turns one set of event details into finished signage graphics in every format ZSR needs, in one click. The user fills in a form once, picks a template and theme, previews all formats side by side, and downloads a zip of correctly sized images.

**Primary user:** ZSR’s event promotion lead. Not a developer; comfortable with forms and Canva-level tools. Uses it a few times a week under deadline.

**Goals**

- One form, many outputs: 16:9, 9:16, portrait print, square, and any other preset in config, generated together.
- Readable by default: large type, high contrast, short text, no text over busy imagery. The app enforces this rather than trusting the user to.
- Accessible app UI: the form and preview meet WCAG 2.2 AA.
- Zero infrastructure: static site, no server, no accounts, no data leaves the browser.
- Easy to change: sizes, templates, colors, and fonts live in config files, not scattered through components.

**Non-goals**

- No AI image generation, no AI copywriting.
- No decorative or stylized text effects (outlines, warps, gradients on text, drop-shadow-as-legibility-fix).
- No freeform canvas editing or drag-and-drop layout. Templates decide placement; the user supplies content.
- No animation or video output (v1).
- No direct upload to the campus signage system; the app produces files the user submits through the existing form.

## Reference: current ZSR signage

The app should reproduce the structure of the current Halloween Game Night set (three files, same content, hand-built per format), without the decorative text effects. Default colors come from the WFU brand palette (see Themes). The files were built in inches (16 × 9 in), so their pixel sizes are incidental: the app keeps the ratios but exports standard sizes (1920 × 1080, 1080 × 1920, letter at 300 dpi).

| File | Pixels (W × H) | Ratio | Layout |
| --- | --- | --- | --- |
| Landscape | 2000 × 1125 | 16:9 | Title top-left, big date center, QR top-right, details right-aligned bottom-right, logo bottom-left |
| Vertical | 1125 × 2000 | 9:16 | Title top, illustration band, QR right, stacked date (“23 / Oct”) left, details right-aligned, logo bottom-left |
| Letter flyer | 1545 × 1999 | 8.5 × 11 (\~180 dpi) | Same as Vertical, more room for illustration |

**Keep:** black background with white and gold text; info order title → date → tagline → time and location (gold) → highlights list; QR on a rounded cream tile; the WF | Wake Forest ZSR lockup bottom-left; one consistent look across all three formats.

**Drop or replace:** glowing text and the novelty display face (replace with a plain bold face); right-aligned multi-line body text (left-align it); clip-art scattered around text (allowed only in zones that never touch text).

## Architecture and tech stack

A single-page, client-only app: React renders each format as a fixed-pixel DOM node, and an export step rasterizes those nodes to image files. Deploy as static files to GitHub Pages (or any static host).

| Concern | Choice | Notes |
| --- | --- | --- |
| Build | Vite + React + TypeScript | Strict TS. |
| Styling | Plain CSS modules or CSS variables | Theme tokens as CSS custom properties so templates stay declarative. No Tailwind inside templates (keeps sizing math explicit). |
| Form state | React Hook Form + Zod | Zod schema is the single source of truth for fields, limits, and validation messages. |
| QR codes | `qrcode` (npm) | Generate as SVG, error correction level M, always dark-on-light with a quiet zone of 4 modules. |
| Rasterizing | `html-to-image` (`toPng` / `toJpeg`) | Render each format at its true pixel size off-screen, then capture. Wait for `document.fonts.ready` and image decode before capture. |
| Print PDF | `jspdf` | Wrap the rasterized image for print presets only. |
| Zip | `jszip` | “Download all” bundles every selected format. |
| Image handling | Browser-native (`createImageBitmap`, canvas) | Downscale uploads over 4000 px on the long edge; keep the original aspect ratio. |
| Fonts | Self-hosted WOFF2 in `/public/fonts` | No Google Fonts CDN at render time, so exports never fall back to a system font. |
| Tests | Vitest, Playwright, `@axe-core/playwright` | See Build phases. |

**Rendering model.** Each template is a React component that receives `(event, theme, format)` and lays itself out using only proportional units derived from the format (e.g. `--u: min(format.width, format.height) / 100`). The preview shows the same component scaled down with a CSS `transform`; export renders it at 1:1. Preview and export must never use different code paths.

**Suggested layout**

```
src/
  config/formats.ts      # size presets, safe zones, file types
  config/themes.ts       # color + font tokens
  config/limits.ts       # character limits, min font sizes
  schema/event.ts        # Zod schema
  templates/             # one folder per template
  components/            # form, preview grid, export bar, warnings panel
  lib/contrast.ts        # WCAG contrast math
  lib/fitText.ts         # text fitting with a floor
  lib/export.ts          # rasterize, zip, pdf
  lib/storage.ts         # localStorage + JSON import/export
```

## Output formats

All sizes live in `config/formats.ts`. v1 must ship the three formats ZSR already produces (Landscape HD, Portrait HD, Letter poster; see Reference) as the default selection. The others are optional extras until screen specs are confirmed. Every preset carries a size, an orientation class, a safe-zone inset, and allowed file types.

| Preset | Pixels (W × H) | Orientation class | Safe zone | Files | Typical use |
| --- | --- | --- | --- | --- | --- |
| Landscape HD | 1920 × 1080 | landscape | 5% each edge | PNG, JPG | Campus TV screens (16:9) |
| Landscape 4K | 3840 × 2160 | landscape | 5% | PNG, JPG | High-res screens |
| Portrait HD | 1080 × 1920 | portrait | 5% | PNG, JPG | Vertical kiosks (9:16) |
| Square | 1080 × 1080 | square | 5% | PNG, JPG | Social posts |
| Social portrait | 1080 × 1350 | portrait | 5% | PNG, JPG | Instagram feed (4:5) |
| Letter poster | 2550 × 3300 (8.5 × 11 in @ 300 dpi) | portrait | 0.5 in | PDF, PNG | Printed flyers |
| Tabloid poster | 3300 × 5100 (11 × 17 in @ 300 dpi) | portrait | 0.5 in | PDF, PNG | Printed posters |

**Rules**

- Templates design for three orientation classes (landscape, portrait, square), not for each preset. A new preset should work with no template changes.
- No text, QR code, or logo may sit outside the safe zone. Background images and color fields may bleed to the edge.
- Users can add a custom preset (name, width, height, orientation class) in a settings panel; custom presets persist in localStorage and in exported project files.
- Export all images in sRGB. JPG quality 0.92. Filenames: `{event-slug}_{preset-slug}_{W}x{H}.{ext}` (e.g. `banned-books-week_landscape-hd_1920x1080.png`).
- Many campus systems show each slide for only about 10 seconds, so templates assume a passing glance, not a read.

## Event form

The form is defined by one Zod schema; field order below is the on-screen order. Character limits are hard caps with a live counter, plus a softer “recommended” count that triggers a readability warning.

| Field | Type | Required | Limit (recommended / max chars) | Notes |
| --- | --- | --- | --- | --- |
| Title | text | yes | 40 / 60 | Largest text on every format. |
| Subtitle | text | no | 60 / 90 | Speaker, series name, or tagline. |
| Date | date | yes | — | Displayed as “Thu, Nov 6” by default. |
| Start time / End time | time | start yes | — | Displayed as “4–5:30 p.m.” (AP-style, configurable). |
| Multi-day or recurring note | text | no | 30 / 40 | Free text, e.g. “Every Tuesday in March”. Overrides date display when filled. |
| Location | text | yes | 40 / 60 | E.g. “ZSR Library, Room 204”. |
| Description | textarea | no | 120 / 180 | Shown on portrait and print formats; hidden on landscape and square unless the template has room. |
| Call to action | text | no | 25 / 35 | E.g. “Register now”, “Free and open to all”. |
| URL | url | no | — | Validated. Displayed in a cleaned form (no `https://`, no trailing slash). Separate optional “display URL” field for a short link. |
| QR code | toggle | — | — | On by default when URL is set. Encodes the full URL. |
| Image | file (JPG, PNG, WebP) | no | — | Warn under 1920 px on the long edge. Focal-point picker (click to set) controls cropping across formats. |
| Image description | text | if image | 150 max | Used in the alt text for web exports and the project file; not printed on the sign. |
| Image credit | text | no | 60 max | Small text, rendered in the safe zone. |
| Logos | file × up to 3 | no | — | SVG or PNG with transparency. The WF \| Wake Forest ZSR lockup is preloaded (white for dark themes, black for light) and on by default, bottom-left as in current signage. |
| Accommodations line | text | no | 120 max | Prefilled default, e.g. “Accessibility requests: \[email\]”. Toggle on/off. |
| Template | select | yes | — | See Templates. |
| Theme | select | yes | — | See Templates. |
| Formats | multi-select | yes | — | Defaults remembered from last session. |

**Fields added from the reference examples**

- **Highlights:** a list of up to 6 short items (25 chars each), e.g. “Games, Pizza, Candy, Tarot Reading, Prizes & More!”. Rendered as a wrapped list in the details column.
- **Date style:** inline (“Oct 23”) or stacked (“23 / Oct”); Showcase uses stacked on portrait formats by default.
- **Illustration:** optional transparent PNG or SVG (separate from the photo field), placed only in the template’s illustration zone and never under text. Marked decorative (empty alt text).

**Behavior**

- Preview updates live as the user types (debounce 150 ms).
- Validation messages appear under the field, are tied with `aria-describedby`, and are summarized at the top on submit/export.
- Over-limit text is never silently truncated in the output; export is blocked with a clear message instead.

## Templates and themes

Ship five templates and four themes in v1; build Showcase first, since it matches what ZSR uses now. Every template must render correctly in all three orientation classes, with or without an image, and with or without a QR code.

| Template | Landscape | Portrait | Square | Without image |
| --- | --- | --- | --- | --- |
| **Split** | Image left 50%, solid text panel right | Image top 45%, text panel below | Image top 50%, text below | Text panel fills; accent bar on left edge |
| **Band** | Full-bleed image, solid text band across bottom 40% | Full-bleed image, solid band bottom 55% | Same as portrait at 50% | Solid background, band becomes the layout |
| **Type only** | No image slot. Large title on solid color, details in a column, QR bottom-right | Stacked, QR bottom-center | Stacked, QR bottom-right | — (always imageless) |
| **Frame** | Image inset with a theme-colored border; text block beside it | Image inset top; text below | Image inset top; text below | Falls back to Type only |

**Showcase** (default template, modeled on the reference set). Landscape: title top-left across \~60% width; large date block center; QR tile top-right; tagline, time and location, and highlights in a left-aligned column on the right; logo bottom-left; optional illustration in the remaining open area. Portrait and letter: title across the top; illustration band; date stacked large on the left (“23 / Oct”) beside a details column; QR beside the illustration; logo bottom-left. Without an illustration, the date and details column grow to fill the space.

**Template rules**

- Text never sits directly on a photo. It always sits on a solid panel (opacity 1.0, no translucent scrims).
- Size hierarchy is fixed: title largest, then date, then time and location, then everything else (tagline, highlights, description, call to action, URL), then small print (credit, accommodations line). Templates may place items differently, but never render a lower item larger than a higher one.
- QR code minimum size: 12% of the shorter canvas edge on screens, 1.25 in on print presets. Always placed in the safe zone with a white quiet zone.
- Logos sit in a single footer row, sized by height, never stretched.
- Each template exports a manifest: name, description, supported orientation classes, which optional fields it uses, and its text slots with min/max font sizes in canvas units.

**Themes** (`config/themes.ts`)

A theme is a set of tokens: `background`, `panel`, `text`, `textMuted`, `accent`, `accentText`, `fontDisplay`, `fontBody`. Starting themes use the WFU web palette (brand.wfu.edu, Color, Patterns & Papers; strict adherence not required). With no photo uploaded, a theme sets the full background; with a photo, it colors the text panel:

- **Black and gold** — default, closest to current ZSR signage. Background Black #000000; body text White #FFFFFF (21:1); title Athletics Gold #CEB888 (10.8:1); time and location Old Gold #9E7E38 (5.5:1, large text only); QR on a white tile.
- **Athletics Gold** — background Athletics Gold #CEB888; all text Black #000000 (10.8:1); accent bars and QR tile frame in Black. Old Gold is not offered as a full background: black text on it is 5.5:1, below the small-print floor.
- **Light** — background White #FFFFFF; text Web Text Black #222222 (15.9:1); time and location Web Text Gold #8C6D2C (4.8:1, large text only); Old Gold #9E7E38 for rules and bars only (3.8:1 on white, too low for text).
- **High contrast** — background Black #000000; text White #FFFFFF (21:1); accent Yellow #FDC314 (13:1).

Default fonts: Atkinson Hyperlegible for body and display (designed for low-vision readers, SIL Open Font License). Make the font tokens swappable so a WFU brand typeface can replace it later. Weights: 700 for title, 400 and 700 for body. No italics below 40 px rendered size, no all-caps for more than four words.

Pairs that must never carry text: Old Gold on White (3.8:1), Yellow or Athletics Gold on White (under 2:1), Gray #53565A on Black (2.9:1). Adding a theme must not allow a token pair that fails the contrast rules in the next section: themes are validated at build time by a unit test.

## Accessibility and readability

The app enforces readability in the outputs and meets WCAG 2.2 AA in its own interface. Rules that protect the sign are blocking; style suggestions are warnings.

**Output rules (blocking unless marked)**

- Contrast: every text color ≥ 4.5:1 against its background (WCAG AAA for large text, and nearly all signage text is large); small print (credit, accommodations line) ≥ 7:1. Old Gold on Black (#9E7E38 on #000000) measures 5.5:1, so it is allowed for time and location at headline size but never for small print. Computed with the WCAG relative-luminance formula in `lib/contrast.ts`.
- Minimum rendered text size, in canvas units (`u` = 1% of the shorter edge): title ≥ 7u, date/time/location ≥ 4u, everything else ≥ 2.5u. Small print (credit, accommodations) ≥ 2u.
- Text fitting (`lib/fitText.ts`): start at the slot’s max size, shrink in steps to fit, stop at the slot’s minimum. If it still doesn’t fit, flag the field and block export for that format. Never shrink below the floor, never clip, never add ellipses.
- Line length: max \~40 characters per line for the title on landscape, \~25 on portrait; break on word boundaries, avoid single-word orphan lines in the title.
- Line height 1.1–1.2 for display text, 1.35 for body. Left-aligned body text (no justified text).
- Image resolution below 1920 px long edge → warning; below 1000 px → blocking for 4K and print presets.
- Text never on photos (enforced by templates, not checked at runtime).
- Warning: total visible word count over 35 on landscape/square formats (“too much to read in a 10-second slot”).
- Warning: title in all caps.

**Warnings panel.** A persistent panel lists each issue as “format → field → problem → fix”, e.g. “Portrait HD · Description · doesn’t fit at minimum size · shorten by \~20 characters.” Clicking an item focuses the field.

**App UI (WCAG 2.2 AA)**

- Every input has a visible `<label>`; required fields marked in text, not color alone.
- Full keyboard operation, including the focal-point picker (arrow keys move the point) and format multi-select.
- Visible focus indicator with ≥ 3:1 contrast; no focus traps.
- Live region (`aria-live="polite"`) announces validation summary and export completion.
- Preview images have alt text generated from the event fields (“Signage preview, Landscape HD: Banned Books Week, Thu Nov 6…”).
- Respects `prefers-reduced-motion` and `prefers-color-scheme`; usable at 200% zoom and 320 px width.
- axe-core reports zero violations on every screen (enforced in CI).

## Export and saving

Export produces files the user can submit as-is; saving lets her reuse an event or template setup next week.

**Export**

- “Download” button on each preview card (single format) and “Download all selected” (zip).
- Zip contains every selected format, plus `event.json` (the project file) and `alt-text.txt` (one line per file: filename and generated alt text, for web or social reuse).
- Show progress per format; a 4K or tabloid render should finish in under 5 seconds on a typical laptop.
- Export is blocked per format when that format has a blocking issue; the zip skips blocked formats and lists them in the completion message.
- Rendered output must look the same in current Chrome, Edge, and Firefox: same fonts (self-hosted, no system fallbacks), same line breaks, same layout. Minor anti-aliasing differences are fine.

**Saving**

- Autosave the working project to localStorage on every change; restore on load with a “Start new event” option.
- “Save project” downloads `event-slug.signage.json`, with images embedded as data URLs. “Open project” loads one back.
- A “Duplicate event” action keeps template, theme, logos, and accommodations line but clears event-specific fields, for recurring series.
- Optional (v1.1): a small list of recent projects in IndexedDB, since localStorage caps out around 5 MB once images are embedded.

**Privacy.** No analytics, no network calls after load. Uploaded images never leave the browser.

## Build phases and acceptance

Build in four phases; each ends with a working, deployed app and passing tests. Stop after each phase for review.

1. **Skeleton.** Vite + React + TS scaffold, config files, Zod schema, form with all fields, live preview of the Showcase template in Landscape HD, Portrait HD and Letter poster.
   - Accept: typing in the form updates all three previews; axe reports zero violations on the form.
2. **Rendering core.** The other four templates, all five across the three orientation classes, themes, `fitText`, contrast checks, QR codes, image focal point, warnings panel.
   - Accept: every template × theme × orientation renders with and without image and QR; a too-long title shows a warning and never clips; theme contrast unit tests pass.
3. **Export.** PNG/JPG per format, PDF for print presets, zip with `event.json` and `alt-text.txt`, filename convention, blocking rules.
   - Accept: exported 1920 × 1080 PNG is exactly 1920 × 1080; fonts match the preview; a blocked format is skipped and reported.
4. **Persistence and polish.** Autosave, save/open project, duplicate event, custom presets, deploy to GitHub Pages, short README for the end user.
   - Accept: reload restores the last project; a saved project file reopens identically.

**Testing**

- Vitest: contrast math against known WCAG pairs, `fitText` floor behavior, schema limits, filename slugging, every theme passes contrast.
- Playwright visual snapshots: a fixed fixture event rendered in every template × preset, compared against committed baselines.
- Playwright + axe-core: zero violations on every app screen and in the warnings panel state.
- One manual check before launch: view the 1920 × 1080 export full-screen on an actual campus display from 3 m (10 ft) away.

**Instructions for Claude Code**

- Read this whole spec before writing code; ask before deviating from the stack or the readability rules.
- Keep all sizes, limits, colors, and fonts in `src/config/`. No magic numbers in templates.
- Commit at the end of each phase with a short summary of what changed and what’s left.

## Open questions

- [ ] Are there screens, sizes or safe-zone requirements beyond 16:9, 9:16 and letter? (Standard sizes are settled: 1920 × 1080 and 1080 × 1920.)
- [ ] Is a WFU brand typeface required, or is Atkinson Hyperlegible acceptable?
- [ ] Which logo variants (ZSR, WFU, co-sponsor) need to be preloaded, and any rules on their minimum size or clear space.
- [ ] Standard wording and contact for the accommodations line.
- [ ] Where to host: GitHub Pages under a personal or library org account.
