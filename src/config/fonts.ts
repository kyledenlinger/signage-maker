/**
 * Self-hosted font files (public/fonts). Must match src/styles/fonts.css. Exports embed these
 * directly so a capture never falls back to a system font.
 */
export const FONT_FACES = [
  { family: 'Atkinson Hyperlegible', weight: 400, style: 'normal', file: 'atkinson-hyperlegible-latin-400-normal.woff2' },
  { family: 'Atkinson Hyperlegible', weight: 700, style: 'normal', file: 'atkinson-hyperlegible-latin-700-normal.woff2' },
  { family: 'Atkinson Hyperlegible', weight: 400, style: 'italic', file: 'atkinson-hyperlegible-latin-400-italic.woff2' },
  { family: 'Atkinson Hyperlegible', weight: 700, style: 'italic', file: 'atkinson-hyperlegible-latin-700-italic.woff2' },
];
