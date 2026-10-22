# Signage Builder — UX redesign spec

**For:** Claude Code, working in the `signage-maker` repo (deployed at https://kyledenlinger.github.io/signage-maker/)
**Goal:** Make the preview the center of the app, unify validation into one status, and restyle the UI into a neutral, high-contrast system — without changing how signs are rendered or exported.

Work through the phases in order. Each phase should be its own commit (or PR) and leave the app working.

---

## 0. Before you start

1. Explore the repo and write a short map in your first reply: where the form state lives, where validation/readability checks run, where previews are rendered and scaled, where export (zip/PNG/JPG/PDF) happens, and how autosave and Save/Open project work.
2. **Do not change sign rendering or export output** except where Phase 5 says so. The sign templates, the export pipeline, `event.json` and `alt-text.txt` must keep producing the same files for the same input.
3. Keep the existing project-file format readable. If you add fields, make them optional so old project files and existing autosave data still load.
4. Keep everything that already works well: field help text, character counters, the error summary that links to fields, the 10-second reading warning, export blocking for too-long text, the inline confirmation for New/Next-in-series, the skip link, and the alt-text file.

---

## Phase 1 — Unified status and export gating

Today there are two checks that disagree: the form's “Check for problems” summary and the Export panel's “Readability check.” With a blank title, the form reports an error but Export says “no problems found” and every Download button stays enabled. With a too-long title, formats show “blocked” but their Download buttons still work.

**Build one validation source of truth** (a single function or hook, e.g. `getProblems(event, settings)`) that returns:

```ts
type Problem = {
  id: string;
  severity: "blocker" | "warning";
  fieldId?: string;          // DOM id of the field to jump to
  formatIds?: string[];      // formats affected; omit = all
  message: string;           // plain language, e.g. "Title is required."
  actionLabel: string;       // e.g. "Add a title", "Shorten it", "Replace it"
};
```

It must include everything both current checks cover:
- required fields (title, date, start time, location, at least one format)
- character limits (title 60, subtitle 90, recurring note 40, location 60, description 180, highlights 6 × 25, call to action 35, display URL 40, accommodations line 120)
- all existing readability/fit rules (too much text for a 10-second read, image too small for a size, etc.)
- **new:** any `[...]` placeholder text left in any text field is a **blocker**. The default accommodations line currently ships as `Accessibility requests: [email]` and passes every check. Message: “The accommodations line still says [email].” Action: “Replace it.”

**Status bar** (one component, top of the preview column — see Phase 2):
- Blocked: red treatment, heading “1 problem blocks export” / “N problems block export,” then each blocker as one line with a link that focuses and scrolls to its field. Warnings follow, visually secondary.
- Ready: green treatment, heading “Ready to export,” one line saying what the zip will contain (“3 formats, plus alt text and the project file”).
- Has `role="status"` so screen readers hear changes.
- Updates live as the user types — no “Check for problems” click required. Remove that button, or keep it only as a “Jump to first problem” shortcut.

**Gating:**
- “Download all (.zip)” is `disabled` while any blocker exists, labeled “Download blocked,” with `aria-describedby` pointing at the status bar.
- Every per-format download button is disabled when a blocker applies to that format.
- Each format in the format strip shows “Ready” or “Blocked” (text plus icon, not color alone).

**Field-level errors:** a field with a blocker gets a 2px red border, `aria-invalid="true"`, and an error message below it linked with `aria-describedby`. Its form section header shows “Needs a fix” (Phase 3).

**Acceptance:**
- Clearing the title, or leaving `[email]` in place, disables every download and is listed in the status bar.
- Fixing the last blocker flips the status bar to ready and enables all downloads without a page reload or button click.
- Old project files with `[email]` load fine and show the blocker.

---

## Phase 2 — Preview-first layout

Today previews are locked at 224px wide (Landscape HD shows at 224 × 126), and the expanded Design panel sits above them, so changing a template happens off-screen.

**Page structure (desktop, ≥ 1024px):**

```
┌───────────────────────── App header (dark bar) ─────────────────────────┐
│ Signage Builder · tagline       Saved in this browser · New event ·     │
│                                 Next in this series · Save/Open project │
├──────────────────┬──────────────────────────────────────────────────────┤
│ Form column      │ Status bar (Phase 1) + PNG/JPG toggle + Download    │
│ 340–420px        ├──────────────────────────────────────────────────────┤
│ numbered         │ Preview card                                         │
│ sections         │  header: “Preview · Landscape HD · 1920 × 1080”      │
│ (Phase 3)        │          [Fit to screen | From across the room] [⤢] │
│                  │  stage: one large sign on a dark neutral background  │
│                  │  format strip: one button per selected format,       │
│                  │                with thumbnail, size, Ready/Blocked,  │
│                  │                plus “Add a format”                   │
│                  ├──────────────────────────────────────────────────────┤
│                  │ Look card (Phase 4): Template cards, Colors,         │
│                  │ “More design options” (collapsed)                    │
└──────────────────┴──────────────────────────────────────────────────────┘
```

- **One large preview** at a time. The selected format renders as large as the stage allows (landscape up to ~840px wide; portrait/letter fit the stage height of ~500px+).
- **Format strip** replaces the grid of small previews. Clicking a format shows it in the stage. Buttons use `aria-pressed`.
- **“From across the room”** toggle renders the same sign at roughly 25–30% of its fit size, with the caption: “Roughly how this reads from 20–25 feet away. If you can’t read the date and place here, neither can someone walking past.”
- **Full screen** button opens the current format in a fullscreen overlay (Esc to close, focus returns to the button).
- The preview must be scaled from the real render, not a separate approximation: whatever produces the export should produce the preview, scaled with CSS transform or container units.
- The preview and status bar should stay visible while the user scrolls the form (sticky right column, or sticky preview card), as long as it doesn't hide controls on short screens.
- **Below 1024px:** single column in this order: status bar, preview, form, Look. No horizontal page scroll at 375px.

**Acceptance:** at 1440 × 900, changing a template, color or any field visibly updates the large preview without scrolling.

---

## Phase 3 — Form: order, grouping, progressive disclosure

Reorder and group the form into numbered sections. Each section is a card with a header row: a number badge, the section name, and a status chip.

| # | Section | Contents | Status chip |
|---|---|---|---|
| 1 | The event | Title, Subtitle | Done / Needs a fix |
| 2 | Image | Photo or illustration upload (moved up from near the bottom); a link “Use a full background image instead” reveals the background upload | Optional / Done |
| 3 | When and where | Date, Start, End, Location; “+ Multi-day or recurring note” link reveals that field | Done / Needs a fix |
| 4 | Details | Collapsed by default (`<details>`), summary line reads e.g. “5 highlights, description, call to action.” Inside: highlights as removable chips + “Add a highlight,” Description, Call to action | Optional / Done / Needs a fix |
| 5 | Link and QR code | Web address, QR checkbox; “+ Add a short display URL” link reveals that field | Optional / Done |
| 6 | Accommodations line | Show-line checkbox and text field | Done / Needs a fix |

- Status chips use text plus color: green “Done,” gray “Optional,” red “Needs a fix.” A section with a blocker also gets a red border.
- Subtitle help text: “Speaker, series or tagline. Sits right under the title.”
- Image upload is a real drop zone (drag-and-drop plus a “Choose a file” button), showing a thumbnail and a Remove button once an image is added. Help text: “JPG, PNG, WebP or SVG, at least 1920 px wide. Unlocks Split, Band and Frame, and colors matched to your image.”
- Replace all native `<input type="file">` UI (including co-sponsor logos) with the same drop-zone pattern; the current co-sponsor field truncates to “No fil…chosen.”
- Keep every existing character counter and help text.

---

## Phase 4 — Look card: visual template and color pickers

Move design controls out from above the preview into a **Look** card below it.

**Template:** replace the dropdown with a grid of selectable cards (`<button aria-pressed>`), `repeat(auto-fill, minmax(150px, 1fr))`. Each card has:
- a small 16:9 sketch of the layout (blocks for photo, title, text lines, QR) — static SVG or CSS is fine
- the name
- one line: Showcase “Text panel over a background image” · Split “Photo beside the text · needs a photo” · Band “Photo above a text band · needs a photo” · Type only “Big type, no image needed” · Frame “Photo inside a gold frame · needs a photo”
- selected state: blue border/ring plus a check badge

If a photo template is chosen with no photo, the preview should show a labeled placeholder where the photo goes (not silently fall back to looking like Showcase).

**Colors:** replace the theme dropdown with pill buttons showing a two-color swatch and the name (Black and gold, Athletics gold, Light, High contrast). The “Match my image” options appear as one disabled pill — “Match my image · add an image first” — until an image exists, then expand into the three options.

**More design options:** a collapsed `<details>` holding everything else: title font, body font, date style, weekday, highlight style, logo version/layout/color, co-sponsor logos, custom sizes. Keep these controls as they are; just move them.

**Formats** selection (which sizes to produce) moves to the “Add a format” button in the format strip: it opens a small menu/dialog with the existing checkbox list and custom-size form. The “Your choice is remembered next time” behavior stays.

---

## Phase 5 — Header actions and copy

- Move project actions into the app header: **New event**, **Next in this series** (renamed from “Duplicate event” — it keeps template, theme, logos and the accommodations line but clears the event details, which isn't a duplicate), **Save project file**, **Open project file**. Keep the existing inline confirmation text for the first two.
- Autosave note: “Saved in this browser” with a check icon. Add a tooltip or help text: “Only in this browser. Use Save project file to keep a copy or move to another computer.”
- “Save project file” help/tooltip: “Downloads a .json file you can reopen later.”

---

## Phase 6 — Sign layout fixes (the one place rendering changes)

These change the rendered signs, so check exports after each fix.

1. **Highlight separators:** separators currently dangle at line ends (“Tarot Reading ·”). Render each highlight as a non-wrapping unit with the separator leading the next item (“· Pizza”), so a wrap never leaves a trailing dot. If items wrap onto 3+ lines, switch to a stacked list.
2. **Portrait/letter Showcase spacing:** the subtitle sits far below the title with a large empty gap above it. Put the subtitle directly under the title; let leftover space collect above the footer (logo, accommodations line, QR) instead of mid-sign.
3. **Accommodations line size:** it's the smallest text on screen formats. Raise it to at least the size of the URL line. (Alternatively make it print-only, but default to bigger.)
4. In the preview only (never in exports), outline any field still holding a `[...]` placeholder with a dashed red box and a small “Preview only: placeholder” tag.

---

## Visual system

Neutral, high-contrast app chrome so the signs are what stand out. Use CSS custom properties.

**Fonts**
- UI: **Public Sans** 400/500/600/700 (Google Fonts)
- Signs: keep **Atkinson Hyperlegible** and the existing sign font options

**Colors**

| Token | Value | Use |
|---|---|---|
| `--bg` | `#F4F5F7` | page background |
| `--surface` | `#FFFFFF` | cards |
| `--surface-muted` | `#F8F9FB` | drop zones, chips |
| `--border` | `#D4D7DD` | card borders |
| `--divider` | `#E8EAEE` | inner dividers |
| `--border-input` | `#6B7080` | inputs, secondary buttons (≥ 3:1) |
| `--text` | `#111318` | body text |
| `--text-muted` | `#4B5161` | help text (≥ 4.5:1 on white) |
| `--header-bg` | `#111318` | app header |
| `--accent` | `#1D4ED8` | every clickable/selected thing: primary buttons, links, focus ring, selected cards |
| `--accent-tint` | `#EEF3FF` | selected card background |
| `--danger` / `--danger-tint` / `--danger-border` | `#B42318` / `#FEF3F2` / `#F3B4AE` | blocked status, field errors |
| `--success` / `--success-tint` / `--success-border` | `#1E7A3C` / `#EDF7EF` / `#A7D7B3` | ready status, “Done” chips |
| `--stage` | `#3A3D44` | preview stage background |
| `--brand-gold` | `#C9A55C` | app logo mark only (and on signs) |

Rules: blue means interactive; red and green only mean status; gold only appears on signs and the logo. Every status uses an icon or text as well as color.

**Shape and size:** radius 8px (controls), 10px (option cards), 12px (panels); all interactive targets ≥ 44px tall (40px allowed in the header and segmented controls); spacing on a 4px scale; inputs have 1.5px borders, 2px red when invalid.

**Focus:** `outline: 3px solid var(--accent); outline-offset: 2px` on every focusable element via `:focus-visible`.

---

## Accessibility checklist (apply throughout)

- All controls are real `<button>`, `<a>`, `<input>`/`<label>` elements; toggles and option cards use `aria-pressed`.
- Form sections use `<fieldset>`/`<legend>` (legend can be visually hidden if the header row repeats it).
- Status bar is `role="status"`; field errors use `aria-describedby` and `aria-invalid`.
- Preview signs have an `aria-label` summarizing the sign (format, title, date, time, location).
- Text and essential UI meet WCAG 2.2 AA contrast; no information is carried by color alone.
- Fullscreen preview traps focus, closes on Esc and returns focus.
- Keep the “Skip to design and preview” link, pointing at the new preview card.

---

## Done when

- [ ] One live status bar; all downloads disabled on any blocker; `[...]` placeholders block export.
- [ ] One large preview with a format strip, across-the-room toggle and fullscreen.
- [ ] Form reordered into six numbered sections with status chips; optional fields collapsed; image upload in step 2 with a drop zone.
- [ ] Template cards with sketches; color pills; other design controls in “More design options.”
- [ ] “Next in this series” rename and header project actions.
- [ ] Highlight separators, portrait spacing and accommodations-line size fixed in the sign renderer.
- [ ] New visual tokens applied; Public Sans for UI; WCAG AA contrast.
- [ ] Existing project files and autosave data still load; exports for the same input are unchanged except for the Phase 6 fixes.
- [ ] Verified in a browser at 1440 × 900 and 375 × 812 with no horizontal scroll, and with keyboard only.
