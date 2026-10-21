import { existsSync } from 'node:fs';
import { imageSize } from './testing/imageSize';
import { describe, expect, it } from 'vitest';
import { COLORWAYS, colorwayReadable, LOCKUPS, pickColorway } from './logos';
import { THEMES } from './themes';

describe('logo files', () => {
  it.each(LOCKUPS)('$name ships every orientation and colorway at the listed size', (lockup) => {
    for (const orientation of ['horizontal', 'vertical'] as const) {
      for (const colorway of Object.keys(COLORWAYS)) {
        const path = `public/logos/${lockup.id}/${orientation}-${colorway}.png`;
        expect(existsSync(path), path).toBe(true);
        expect(imageSize(path), path).toEqual(lockup.size[orientation]);
      }
    }
  });
});

describe('automatic colorway', () => {
  it('uses the full-color logo where it reads, one color where it would not', () => {
    expect(pickColorway('#000000')).toBe('reverse'); // black and gold, high contrast
    expect(pickColorway('#FFFFFF')).toBe('color'); // light
    expect(pickColorway('#CEB888')).toBe('black'); // Athletics Gold: the gold mark would vanish
    expect(pickColorway('#12343B')).toBe('reverse');
  });

  it('is always readable on every WFU theme and on any background', () => {
    for (const theme of THEMES) expect(colorwayReadable(pickColorway(theme.panel), theme.panel), theme.name).toBe(true);
    for (let v = 0; v <= 255; v += 5) {
      for (const tint of [[v, v, v], [v, 0, 0], [0, v, 0], [0, 0, v], [v, v, 0]]) {
        const hex = `#${tint.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
        const pick = pickColorway(hex);
        // White or black always clears the bar on one side; the full-color version only when it does too.
        if (pick === 'reverse' || pick === 'color') expect(colorwayReadable(pick, hex), hex).toBe(true);
      }
    }
  });
});
