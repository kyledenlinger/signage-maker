import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FONT_FACES } from './fonts';

describe('font files', () => {
  const css = readFileSync('src/styles/fonts.css', 'utf8');

  it.each(FONT_FACES)('$file is self-hosted and declared in fonts.css', (face) => {
    expect(existsSync(`public/fonts/${face.file}`)).toBe(true);
    expect(css).toContain(`/fonts/${face.file}`);
  });

  it('fonts.css declares no other files', () => {
    const declared = [...css.matchAll(/\/fonts\/([\w.-]+\.woff2)/g)].map((m) => m[1]).sort();
    expect(declared).toEqual(FONT_FACES.map((f) => f.file).sort());
  });
});
