/**
 * Theme tokens. Colors from the WFU web palette (brand.wfu.edu).
 *
 * Text roles and the backgrounds they may sit on:
 * - title, text, emphasis: on background and panel (>= 4.5:1)
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

export const FONT_STACK = '"Atkinson Hyperlegible", sans-serif';

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
