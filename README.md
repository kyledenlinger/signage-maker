# Signage Builder

Make ZSR event signage for every screen and print size at once. Fill in the event details one time, pick a template and a theme, check the previews, and download finished files.

Everything happens in your browser. Nothing you type or upload is sent anywhere.

## Making a sign

1. **Fill in the event.** Title, date, start time and location are required; everything else is optional. The date, time and location always appear together on the sign. The weekday is shown short by default ("Fri, Oct 23"); choose *Full* ("Friday") or *None* under **Weekday**. Each text field shows a character count. Going past the recommended count makes a sign harder to read at a glance; going past the limit blocks export until you shorten it.
2. **Add images (optional).**
   - **Photo:** used by Showcase, Split, Band and Frame. Add a short description (it becomes the alt text). Click the part of the photo that must stay visible, or use the *Left to right* and *Top to bottom* sliders, and every format crops around that point. Use a photo at least 1920 px wide.
   - **Illustration:** a transparent PNG or SVG for Showcase. It's placed where it never touches text.
   - **Background image:** fills the whole sign in Showcase and Type only, with every block of text on a solid panel over it. Like the photo, it has a focal point.
   - **Logos:** the WF | Wake Forest ZSR lockup is on by default. You can add up to three more (SVG or PNG with a transparent background).
3. **Choose a design.** Pick a template, a theme and the formats you need. Landscape HD, Portrait HD and Letter poster are selected to start; your choice is remembered.
4. **Check the previews.** All selected formats update as you type. The **Readability check** panel lists anything to fix, as *format · field · problem · fix*. Click an item to jump to the field. Items marked **Blocks export** must be fixed before that format can download; **Warnings** are advice.
5. **Download.**
   - **Download all selected (.zip)** gets every format in one file, plus `event.json` (the project, so you can reopen it) and `alt-text.txt` (ready-to-paste alt text for each file). Choose PNG or JPG for screen formats; print formats come as PDF.
   - Or use the **Download** buttons under any preview for just that format.
   - Files are named like `banned-books-week_landscape-hd_1920x1080.png`.
   - If a format is blocked, it's skipped and the message says why; the others still download.

Submit the files through the usual campus signage form.

## Templates

| Template | Best for |
| --- | --- |
| **Showcase** | The current ZSR look: big title, large date, QR code, details column, logo bottom-left, optional illustration. |
| **Split** | A photo on one side and a solid text panel on the other. |
| **Band** | A full-bleed photo with a solid text band across the bottom. |
| **Type only** | No image: a large title on a solid color. |
| **Frame** | A photo inset with a colored border and text beside or below it. Without a photo it uses Type only. |

Themes: **Black and gold** (closest to current signage), **Athletics Gold**, **Light** and **High contrast**. All pass the contrast rules for signage.

**Match my images** builds a theme from your background, photo and illustration. It appears in the Theme list once you add one of them, with swatches of the colors it picked. The colors are adjusted until every text color passes the same contrast rules as the built-in themes.

## Readable by default

The app enforces readability so you don't have to:

- Text always sits on a solid color, never on top of a photo or background image.
- Text shrinks to fit, but never below a minimum size, and is never cut off or broken mid-word. If it still doesn't fit, that format is blocked and the panel says roughly how many characters to cut.
- The title is always the largest text, then the date, then time and location, then everything else.
- QR codes are always dark on a light tile and large enough to scan (at least 1.25 in on print).
- Text, QR codes and logos stay inside each format's safe margin.

Campus screens often show a slide for only about 10 seconds, so the panel warns when a landscape or square sign has more than 35 words.

## Saving your work

- **Autosave:** your current event is saved in this browser as you work and comes back when you reopen the page. Very large images may not fit in browser storage; if so, the app tells you, and you should use *Save project*.
- **Save project** downloads a `.signage.json` file with everything in it, images included. **Open project** loads one back.
- **Duplicate event** starts the next event in a series: it keeps the template, theme, logos and accommodations line and clears the event details.
- **Start new event** clears everything. Both ask first.

## Custom sizes

Under **Design → Custom sizes**, add a screen size that isn't listed: a name, width and height in pixels, and whether to lay it out as landscape, portrait or square. Custom sizes get a 5% safe margin, download as PNG or JPG, are remembered in this browser, and are saved in project files.

## Accessibility

The app works with a keyboard and screen reader, meets WCAG 2.2 AA, follows your light/dark and reduced-motion settings, and works at 200% zoom and on narrow screens. Previews have descriptive alt text.

---

## For developers

Vite + React + TypeScript (strict), React Hook Form + Zod, html-to-image, jsPDF, JSZip. Static site; no server.

```bash
npm install
npm run dev        # http://localhost:5173 (template gallery at /gallery.html)
npm test           # Vitest unit tests
npm run test:e2e   # Playwright: app, templates, export (Chromium + Firefox), axe
npm run build      # static site in dist/
```

- Sizes, limits, colors, fonts and layout tokens live in `src/config/`. Each template's sizes are in its `manifest.ts`.
- Preview and export share one render path, `src/templates/TemplateRenderer.tsx`, which also runs text fitting.
- Visual snapshot baselines are macOS Chromium only; CI skips them.
- Pushing to `main` runs the tests and deploys `dist/` to GitHub Pages (`.github/workflows/deploy.yml`).
- The lockup in `src/templates/shared/Lockup.tsx` is a placeholder until the official artwork is supplied.
