import { DEFAULT_FONT_ID, fontStack } from './fonts';

/**
 * Theme tokens. Colors from the WFU web palette (brand.wfu.edu).
 *
 * Text roles and the backgrounds they may sit on:
 * - title, text, emphasis, highlight: on background and panel (>= 4.5:1)
 * - textMuted (small print: credit, accommodations): on background and panel (>= 7:1)
 * - accentText: on accent fills (>= 4.5:1)
 * - qrDark on qrTile: the QR code itself
 * accent and rule are for bars and rules only, never text.
 * Every theme is checked by src/config/themes.test.ts.
 */
export interface Theme {
  id: string;
  name: string;
  background: string;
  panel: string;
  text: string;
  textMuted: string;
  title: string;
  /** Time and location. Large text only. */
  emphasis: string;
  /** Highlights (Games · Pizza · …), when shown in color. Body size, so >= 4.5:1. */
  highlight: string;
  accent: string;
  accentText: string;
  rule: string;
  qrTile: string;
  qrFrame: string;
  qrDark: string;
  /** Which preloaded lockup to use: light (white) art for dark backgrounds. */
  logoVariant: 'light' | 'dark';
  fontDisplay: string;
  fontBody: string;
}

/** Built-in themes use the default font; people pick title and body fonts separately. */
export const FONT_STACK = fontStack(DEFAULT_FONT_ID);

const WFU = {
  black: '#000000',
  white: '#FFFFFF',
  athleticsGold: '#CEB888',
  oldGold: '#9E7E38',
  webTextBlack: '#222222',
  webTextGold: '#8C6D2C',
  yellow: '#FDC314',
};

export const THEMES: Theme[] = [
  {
    id: 'black-gold',
    name: 'Black and gold',
    background: WFU.black,
    panel: WFU.black,
    text: WFU.white,
    textMuted: WFU.white,
    title: WFU.athleticsGold,
    emphasis: WFU.oldGold,
    highlight: WFU.athleticsGold,
    accent: WFU.athleticsGold,
    accentText: WFU.black,
    rule: WFU.oldGold,
    qrTile: WFU.white,
    qrFrame: WFU.white,
    qrDark: WFU.black,
    logoVariant: 'light',
    fontDisplay: FONT_STACK,
    fontBody: FONT_STACK,
  },
  {
    id: 'athletics-gold',
    name: 'Athletics Gold',
    background: WFU.athleticsGold,
    panel: WFU.athleticsGold,
    text: WFU.black,
    textMuted: WFU.black,
    title: WFU.black,
    emphasis: WFU.black,
    highlight: WFU.black,
    accent: WFU.black,
    accentText: WFU.athleticsGold,
    rule: WFU.black,
    qrTile: WFU.white,
    qrFrame: WFU.black,
    qrDark: WFU.black,
    logoVariant: 'dark',
    fontDisplay: FONT_STACK,
    fontBody: FONT_STACK,
  },
  {
    id: 'light',
    name: 'Light',
    background: WFU.white,
    panel: WFU.white,
    text: WFU.webTextBlack,
    textMuted: WFU.webTextBlack,
    title: WFU.webTextBlack,
    emphasis: WFU.webTextGold,
    highlight: WFU.webTextGold,
    accent: WFU.oldGold,
    accentText: WFU.black,
    rule: WFU.oldGold,
    qrTile: WFU.white,
    qrFrame: WFU.oldGold,
    qrDark: WFU.black,
    logoVariant: 'dark',
    fontDisplay: FONT_STACK,
    fontBody: FONT_STACK,
  },
  {
    id: 'high-contrast',
    name: 'High contrast',
    background: WFU.black,
    panel: WFU.black,
    text: WFU.white,
    textMuted: WFU.white,
    title: WFU.white,
    emphasis: WFU.yellow,
    highlight: WFU.yellow,
    accent: WFU.yellow,
    accentText: WFU.black,
    rule: WFU.yellow,
    qrTile: WFU.white,
    qrFrame: WFU.white,
    qrDark: WFU.black,
    logoVariant: 'light',
    fontDisplay: FONT_STACK,
    fontBody: FONT_STACK,
  },
];

export const DEFAULT_THEME_ID = 'black-gold';

export function findTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/**
 * "Match my images" themes: colors drawn from the event's images (see lib/palette.ts), in three
 * moods. They sit alongside the WFU themes; they don't replace them.
 */
export type ImageThemeMode = 'light' | 'dark' | 'contrast';

export const IMAGE_THEMES: { id: string; mode: ImageThemeMode; name: string }[] = [
  { id: 'images-light', mode: 'light', name: 'Match my image: Light' },
  { id: 'images-dark', mode: 'dark', name: 'Match my image: Dark' },
  { id: 'images-contrast', mode: 'contrast', name: 'Match my image: High contrast' },
];

export function findImageTheme(id: string) {
  return IMAGE_THEMES.find((t) => t.id === id);
}

export const THEME_COLOR_KEYS = [
  'background',
  'panel',
  'text',
  'textMuted',
  'title',
  'emphasis',
  'highlight',
  'accent',
  'accentText',
  'rule',
  'qrTile',
  'qrFrame',
  'qrDark',
] as const;
export type ThemeColorKey = (typeof THEME_COLOR_KEYS)[number];

/** The colors of a generated theme; stored with the event so every render and export matches. */
export type ThemeColors = Pick<Theme, ThemeColorKey | 'logoVariant'>;
export type ImagePalettes = Record<ImageThemeMode, ThemeColors>;

interface ThemeChoice {
  themeId: string;
  imagePalettes: ImagePalettes | null;
  fontTitle?: string;
  fontBody?: string;
}

/** One theme object per theme, color set and font pair, so renders that depend on it stay stable. */
const staticThemes = new Map<string, Theme>();
const imageThemes = new WeakMap<ThemeColors, Map<string, Theme>>();

/**
 * The theme an event renders with: its colors (a WFU theme, or a "Match my images" theme, which
 * falls back to the default until the images' colors exist) and its title and body fonts.
 */
export function resolveTheme(event: ThemeChoice): Theme {
  const fonts = { fontDisplay: fontStack(event.fontTitle ?? DEFAULT_FONT_ID), fontBody: fontStack(event.fontBody ?? DEFAULT_FONT_ID) };
  const fontKey = `${fonts.fontDisplay}|${fonts.fontBody}`;
  const imageTheme = findImageTheme(event.themeId);
  const colors = imageTheme && event.imagePalettes ? event.imagePalettes[imageTheme.mode] : null;

  if (!imageTheme || !colors) {
    const base = findTheme(imageTheme ? DEFAULT_THEME_ID : event.themeId);
    const key = `${base.id}|${fontKey}`;
    let theme = staticThemes.get(key);
    if (!theme) staticThemes.set(key, (theme = { ...base, ...fonts }));
    return theme;
  }
  let byFont = imageThemes.get(colors);
  if (!byFont) imageThemes.set(colors, (byFont = new Map()));
  let theme = byFont.get(fontKey);
  if (!theme) {
    theme = { ...findTheme(DEFAULT_THEME_ID), ...colors, ...fonts, id: imageTheme.id, name: imageTheme.name };
    byFont.set(fontKey, theme);
  }
  return theme;
}
