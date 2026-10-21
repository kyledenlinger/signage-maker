import { CONTRAST_MIN } from '../config/limits';
import type { ImagePalettes, ImageThemeMode, ThemeColors } from '../config/themes';
import type { ImageAsset } from '../schema/event';
import { contrastRatio, parseHex, relativeLuminance } from './contrast';

/*
 * Builds the "Match my images" theme. Colors come from the images; the theme rules come from the
 * spec. Background and text are chosen first, then each text color is lightened or darkened (hue
 * kept) until it passes its contrast minimum, so a generated theme always passes the same checks
 * as the built-in ones.
 */

export type Rgb = [number, number, number];

export interface Swatch {
  hex: string;
  /** Share of sampled pixels, 0–1. */
  weight: number;
}

/** Extra headroom over each contrast minimum, so rounding never tips a pair below it. */
const MARGIN = 0.3;
const WHITE = '#FFFFFF';
const NEAR_BLACK = '#111111';
/** Swatches less saturated than this count as gray: no accent color from them. */
const MIN_ACCENT_SATURATION = 0.25;
const SAMPLE_EDGE = 64;
const CLUSTERS = 6;

const toHex = ([r, g, b]: Rgb) =>
  `#${[r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  return [h * 60, s, l];
}

function hslToRgb([h, s, l]: [number, number, number]): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

const hsl = (hex: string) => rgbToHsl(parseHex(hex));
const fromHsl = (h: number, s: number, l: number) => toHex(hslToRgb([h, s, l]));

/** Moves a color's lightness (keeping hue and saturation) until it meets `min` contrast against `against`. */
export function adjustForContrast(hex: string, against: string, min: number): string {
  if (contrastRatio(hex, against) >= min) return hex;
  const [h, s, l] = hsl(hex);
  const lighten = relativeLuminance(against) < 0.18;
  for (let step = 1; step <= 100; step++) {
    const next = fromHsl(h, s, Math.min(1, Math.max(0, l + (lighten ? step : -step) / 100)));
    if (contrastRatio(next, against) >= min) return next;
  }
  return lighten ? WHITE : '#000000';
}

/** k-means over sampled pixels, with deterministic seeds (luminance quantiles). */
export function quantize(pixels: Rgb[], k = CLUSTERS): Swatch[] {
  if (pixels.length === 0) return [];
  const lum = (p: Rgb) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
  const sorted = [...pixels].sort((a, b) => lum(a) - lum(b));
  const count = Math.min(k, pixels.length);
  let centers: Rgb[] = Array.from({ length: count }, (_, i) => sorted[Math.floor(((i + 0.5) / count) * sorted.length)]);
  let assignment = new Array<number>(pixels.length).fill(0);
  for (let iter = 0; iter < 12; iter++) {
    assignment = pixels.map((p) => {
      let best = 0;
      let bestDist = Infinity;
      centers.forEach((c, i) => {
        const dist = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      return best;
    });
    centers = centers.map((c, i) => {
      const members = pixels.filter((_, j) => assignment[j] === i);
      if (members.length === 0) return c;
      return [0, 1, 2].map((ch) => members.reduce((sum, p) => sum + p[ch], 0) / members.length) as Rgb;
    });
  }
  return centers
    .map((c, i) => ({ hex: toHex(c), weight: assignment.filter((a) => a === i).length / pixels.length }))
    .filter((s) => s.weight > 0)
    .sort((a, b) => b.weight - a.weight);
}

function hueDistance(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * A complete, contrast-safe set of theme colors from image swatches.
 * - light: a pale tint of the dominant color, near-black text
 * - dark: a deep shade of the dominant color, white text
 * - contrast: black background, white text, and accents held to 7:1 like all the text
 */
export function buildTheme(swatches: Swatch[], mode: ImageThemeMode): ThemeColors {
  const dark = mode !== 'light';
  const text = dark ? WHITE : NEAR_BLACK;
  const smallPrintMin = CONTRAST_MIN.smallPrint + MARGIN;
  const colorMin = (mode === 'contrast' ? CONTRAST_MIN.smallPrint : CONTRAST_MIN.text) + MARGIN;

  // Background: the dominant color, deepened (or lightened) until body text and small print pass.
  const [bh, bs] = swatches.length ? hsl(swatches[0].hex) : [0, 0];
  const background =
    mode === 'contrast' ? '#000000' : adjustForContrast(fromHsl(bh, Math.min(bs, 0.6), dark ? 0.16 : 0.92), text, smallPrintMin);

  // Accent: the most vivid color, favoring ones that cover more of the image. The dominant color
  // already set the background, so a different hue makes the better accent when there is one.
  const vivid = swatches
    .map((s, i) => ({ ...s, hsl: hsl(s.hex), dominant: i === 0 }))
    .filter((s) => s.hsl[1] >= MIN_ACCENT_SATURATION)
    .sort((a, b) => Number(a.dominant) - Number(b.dominant) || b.hsl[1] * (0.3 + b.weight) - a.hsl[1] * (0.3 + a.weight));
  const title = vivid.length ? adjustForContrast(vivid[0].hex, background, colorMin) : text;
  const second = vivid.find((s) => vivid[0] && hueDistance(s.hsl[0], vivid[0].hsl[0]) >= 40);
  const emphasis = second ? adjustForContrast(second.hex, background, colorMin) : title;

  const accentText = contrastRatio('#000000', title) >= contrastRatio(WHITE, title) ? '#000000' : WHITE;
  return {
    background,
    panel: background,
    text,
    textMuted: text,
    title,
    emphasis,
    highlight: title,
    accent: title,
    accentText,
    rule: title,
    qrTile: WHITE,
    qrFrame: title,
    qrDark: '#000000',
    logoVariant: dark ? 'light' : 'dark',
  };
}

export function buildPalettes(swatches: Swatch[]): ImagePalettes {
  return { light: buildTheme(swatches, 'light'), dark: buildTheme(swatches, 'dark'), contrast: buildTheme(swatches, 'contrast') };
}

/** Samples opaque pixels from an image, downscaled so every image counts about the same. */
async function samplePixels(image: ImageAsset): Promise<Rgb[]> {
  const img = new Image();
  img.src = image.dataUrl;
  await img.decode();
  const scale = SAMPLE_EDGE / Math.max(img.naturalWidth || 1, img.naturalHeight || 1);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
  canvas.height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const out: Rgb[] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] >= 128) out.push([data[i], data[i + 1], data[i + 2]]);
  }
  return out;
}

/** Light, dark and high-contrast theme colors from the event's images, or null when there are none. */
export async function palettesFromImages(images: ImageAsset[]): Promise<ImagePalettes | null> {
  if (images.length === 0) return null;
  const pixels = (await Promise.all(images.map((img) => samplePixels(img).catch(() => [])))).flat();
  return pixels.length ? buildPalettes(quantize(pixels)) : null;
}
