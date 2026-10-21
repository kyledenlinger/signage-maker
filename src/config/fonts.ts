/**
 * Fonts people can pick for the title and the body. All are self-hosted in public/fonts (SIL Open
 * Font License, see OFL-*.txt there) and declared in src/styles/fonts.css, so neither the preview
 * nor an export ever falls back to a system font. Each was chosen for legibility at a distance; no
 * novelty display faces.
 */
export interface FontFamily {
  id: string;
  name: string;
  /** CSS font-family name. */
  family: string;
  generic: 'sans-serif' | 'serif';
  note: string;
}

export interface FontFaceFile {
  family: string;
  weight: 400 | 700;
  style: 'normal' | 'italic';
  file: string;
}

export const FONT_FAMILIES: FontFamily[] = [
  {
    id: 'atkinson',
    name: 'Atkinson Hyperlegible',
    family: 'Atkinson Hyperlegible',
    generic: 'sans-serif',
    note: 'Designed for low-vision readers.',
  },
  { id: 'lexend', name: 'Lexend', family: 'Lexend', generic: 'sans-serif', note: 'Wide letters, made for reading ease.' },
  { id: 'public-sans', name: 'Public Sans', family: 'Public Sans', generic: 'sans-serif', note: 'Plain and neutral.' },
  { id: 'source-sans', name: 'Source Sans 3', family: 'Source Sans 3', generic: 'sans-serif', note: 'Compact; fits more text.' },
  { id: 'inter', name: 'Inter', family: 'Inter', generic: 'sans-serif', note: 'Made for screens.' },
  { id: 'source-serif', name: 'Source Serif 4', family: 'Source Serif 4', generic: 'serif', note: 'A sturdy serif, for titles.' },
];

export const DEFAULT_FONT_ID = 'atkinson';

const FILE_PREFIX: Record<string, string> = {
  atkinson: 'atkinson-hyperlegible',
  lexend: 'lexend',
  'public-sans': 'public-sans',
  'source-sans': 'source-sans-3',
  inter: 'inter',
  'source-serif': 'source-serif-4',
};

/** Every self-hosted face. Atkinson also ships italics (the app UI may use them). */
export const FONT_FACES: FontFaceFile[] = FONT_FAMILIES.flatMap((font) => {
  const styles: ('normal' | 'italic')[] = font.id === 'atkinson' ? ['normal', 'italic'] : ['normal'];
  return styles.flatMap((style) =>
    ([400, 700] as const).map((weight) => ({
      family: font.family,
      weight,
      style,
      file: `${FILE_PREFIX[font.id]}-latin-${weight}-${style}.woff2`,
    })),
  );
});

export function findFont(id: string): FontFamily {
  return FONT_FAMILIES.find((f) => f.id === id) ?? FONT_FAMILIES[0];
}

export function fontStack(id: string): string {
  const font = findFont(id);
  return `"${font.family}", ${font.generic}`;
}
