import { describe, expect, it } from 'vitest';
import { findTheme } from '../config/themes';
import { themeContrastIssues } from './checks';
import { contrastRatio } from './contrast';
import { adjustForContrast, buildPalettes, buildTheme, quantize, type Rgb, type Swatch } from './palette';

/** Small deterministic PRNG so the property test is repeatable. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

function randomSwatches(next: () => number): Swatch[] {
  const n = 1 + Math.floor(next() * 6);
  const raw = Array.from({ length: n }, () => next());
  const total = raw.reduce((a, b) => a + b, 0);
  return raw.map((w) => ({
    hex: `#${[next(), next(), next()].map((c) => Math.floor(c * 256).toString(16).padStart(2, '0')).join('')}`,
    weight: w / total,
  }));
}

describe('image themes', () => {
  it('always pass the contrast rules in all three moods, whatever the image colors', () => {
    const next = rng(42);
    for (let i = 0; i < 500; i++) {
      for (const colors of Object.values(buildPalettes(randomSwatches(next)))) {
        const theme = { ...findTheme('black-gold'), ...colors };
        expect(themeContrastIssues(theme), JSON.stringify(colors)).toEqual([]);
        expect(contrastRatio(colors.accentText, colors.accent)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(colors.qrDark, colors.qrTile)).toBeGreaterThanOrEqual(7);
      }
    }
  });

  it('give light, dark and high-contrast versions of the same images', () => {
    const swatches = [
      { hex: '#1A2A3A', weight: 0.8 },
      { hex: '#E0A030', weight: 0.2 },
    ];
    const { light, dark, contrast } = buildPalettes(swatches);
    expect(light).toMatchObject({ text: '#111111', logoVariant: 'dark' });
    expect(dark).toMatchObject({ text: '#FFFFFF', logoVariant: 'light' });
    expect(contrast).toMatchObject({ background: '#000000', text: '#FFFFFF', logoVariant: 'light' });
    // Light is pale, dark is deep, and both keep the image's blue cast.
    expect(contrastRatio(light.background, '#000000')).toBeGreaterThan(15);
    expect(contrastRatio(dark.background, '#FFFFFF')).toBeGreaterThan(7);
  });

  it('hold every text color to 7:1 in high contrast', () => {
    const next = rng(7);
    for (let i = 0; i < 200; i++) {
      const c = buildTheme(randomSwatches(next), 'contrast');
      for (const color of [c.title, c.emphasis, c.highlight, c.text]) {
        expect(contrastRatio(color, c.background)).toBeGreaterThanOrEqual(7);
      }
    }
  });

  it('keep the hue of the image accent', () => {
    const colors = buildTheme([{ hex: '#101418', weight: 0.7 }, { hex: '#D04020', weight: 0.3 }], 'dark');
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(colors.title.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
  });

  it('prefer an accent other than the dominant color', () => {
    const colors = buildTheme(
      [
        { hex: '#12343B', weight: 0.85 },
        { hex: '#E8833A', weight: 0.15 },
      ],
      'dark',
    );
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(colors.title.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(b); // orange, not teal
    expect(g).toBeGreaterThan(b);
  });

  it('fall back to the text color when the images are all gray', () => {
    const colors = buildTheme([{ hex: '#202020', weight: 0.6 }, { hex: '#808080', weight: 0.4 }], 'dark');
    expect(colors.title).toBe(colors.text);
  });
});

describe('quantize', () => {
  it('finds the main colors and their shares', () => {
    const pixels: Rgb[] = [...Array(75).fill([200, 30, 30]), ...Array(25).fill([20, 20, 200])];
    const swatches = quantize(pixels, 2);
    expect(swatches.map((s) => s.hex)).toEqual(['#C81E1E', '#1414C8']);
    expect(swatches.map((s) => s.weight)).toEqual([0.75, 0.25]);
  });
});

describe('adjustForContrast', () => {
  it('lightens on dark backgrounds and darkens on light ones', () => {
    expect(contrastRatio(adjustForContrast('#203060', '#000000', 4.5), '#000000')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(adjustForContrast('#A0C0FF', '#FFFFFF', 4.5), '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });
});
