# Signage Builder

Make ZSR event signage for every screen and print size at once. Fill in the event details one time, pick a template and a theme, check the previews, and download finished files.

Everything happens in your browser. Nothing you type or upload is sent anywhere.

## Making a sign

1. **Fill in the event.** The form has six numbered steps: **The event**, **Image**, **When and where**, **Details**, **Link and QR code** and **Accommodations line**. Each step's chip says **Done**, **Optional** or **Needs a fix**. Extras stay out of the way until you want them: **+ Multi-day or recurring note**, **+ Add a short display URL**, **Use a full background image instead**, and the **Details** step (highlights, description, call to action), which opens with a click. Highlights are chips you can edit or remove. Uploads are drop zones: drag a file in, or use **Choose a file**.

   Title, date, start time and location are required; everything else is optional. The date, time and location always appear together on the sign. The weekday is shown short by default ("Fri, Oct 23"); choose *Full* ("Friday") or *None* under **Weekday**. Each text field shows a character count. Going past the recommended count makes a sign harder to read at a glance; going past the limit blocks export until you shorten it.
2. **Add images (optional).**
   - **Photo or illustration:** one featured image, beside or above the text, in Showcase, Split, Band and Frame. Choose how to show it: as a **Photo** (fills its space, cropped around a focal point you set by clicking or with the sliders; needs a short description for alt text) or as an **Illustration** (shown whole, never cropped; description optional). Transparent PNGs and SVGs start out as illustrations. Photos look best at 1920 px or more.
   - **Background image** (under **Use a full background image instead**): fills the whole sign in Showcase and Type only, with every block of text on a solid panel over it. It has its own focal point.
   - **ZSR Library logo:** the approved WF | ZSR Library logo is on by default, as *Semiformal: Wake Forest ZSR Library*, horizontal. You can pick any approved version (Formal, Semiformal or Informal; with or without "Library"), horizontal or vertical. Its color (Color, Reverse, Gold, Black or White) is matched to the theme automatically so it stays readable; you can override it, and the panel warns if your pick is hard to see.
   - **More logos:** add up to three co-sponsor logos (SVG or PNG with a transparent background).
3. **Choose a look.** The **Look** card under the preview has the template cards (each with a sketch and a line on what it needs) and the color pills: the four WFU themes, plus **Match my image** (Light, Dark, High contrast) once you add an image. Split, Band and Frame are built around a photo: without one, the preview shows a labeled placeholder and export waits until you add an image. Fonts, date and highlight style, and logos are under **More design options**. To choose which sizes to make, use **+ Add a format** at the end of the format strip (custom sizes are there too); Landscape HD, Portrait HD and Letter poster are selected to start, and your choice is remembered.
   - **The preview** shows one format at a time, large. Pick another from the strip of formats under it (each says **Ready** or **Blocked**). **From across the room** shrinks the sign to roughly how it reads from 20–25 feet away; the **⤢** button shows it full screen (Esc closes it). On a wide screen the status and preview stay in view while you scroll the form.
4. **Check the status.** The status bar above the previews updates as you type. Red means something blocks export: each problem is listed with a link that jumps to the field (which is outlined in red). Green means **Ready to export**. Suggestions, like text that's long for a 10-second read, are listed too but don't block anything. Placeholder text in brackets, such as the "[email]" in the default accommodations line, always blocks export until you replace it.
5. **Download.**
   - **Download all (.zip)** gets every format in one file, plus `event.json` (the project, so you can reopen it) and `alt-text.txt` (ready-to-paste alt text for each file). Choose PNG or JPG for screen formats; print formats come as PDF.
   - Or use the **Download** buttons under any preview for just that format.
   - Files are named like `banned-books-week_landscape-hd_1920x1080.png`.
   - While anything blocks export, the zip button reads **Download blocked**, and a format with its own problem (say, a photo too small for print) shows **Blocked** with its buttons turned off. Fix the problem, or untick that format, and the buttons come back.

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

**Fonts:** pick a title font and a body font under Design. All are self-hosted, openly licensed and chosen for legibility at a distance: Atkinson Hyperlegible (the default, designed for low-vision readers), Lexend, Public Sans, Source Sans 3, Inter and Source Serif 4.

**Match my images** builds themes from your background, photo and illustration, in three moods: **Light**, **Dark** and **High contrast**. They appear in the Theme list under the WFU themes once you add one of those images, with swatches of the colors picked. Colors are adjusted until every text color passes the same contrast rules as the WFU themes; High contrast holds all text to 7:1.

## Readable by default

The app enforces readability so you don't have to:

- Text always sits on a solid color, never on top of a photo or background image.
- Text shrinks to fit, but never below a minimum size, and is never cut off or broken mid-word. If it still doesn't fit, that format is blocked and the panel says roughly how many characters to cut.
- The title is always the largest text, then the date, then time and location, then everything else.
- QR codes are always dark on a light tile and large enough to scan (at least 1.25 in on print).
- Text, QR codes and logos stay inside each format's safe margin.

Campus screens often show a slide for only about 10 seconds, so the panel warns when a landscape or square sign has more than 35 words.

## Saving your work

- **Autosave:** your current event is saved in this browser as you work (the header says **Saved in this browser**) and comes back when you reopen the page. It is only in this browser: use **Save project file** to keep a copy or move to another computer. Very large images may not fit in browser storage; if so, the app tells you, and you should use *Save project*.
- **Save project file** downloads a `.signage.json` file with everything in it, images included. **Open project file** loads one back.
- **Next in this series** starts the next event in a series: it keeps the template, theme, logos and accommodations line and clears the event details.
- **New event** clears everything. Both ask first.

## Custom sizes

Under **+ Add a format** → **Custom sizes**, add a screen size that isn't listed: a name, width and height in pixels, and whether to lay it out as landscape, portrait or square. Custom sizes get a 5% safe margin, download as PNG or JPG, are remembered in this browser, and are saved in project files.

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
- Logos in `public/logos/` are web-sized copies of the library's approved PNGs (trimmed, 400 px tall horizontal, 720 px vertical). `src/config/logos.ts` lists them and picks the colorway by contrast.
