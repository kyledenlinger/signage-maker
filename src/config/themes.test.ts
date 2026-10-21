import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../lib/contrast';
import { CONTRAST_MIN } from './limits';
import { THEMES } from './themes';

describe.each(THEMES)('theme $name', (theme) => {
  const surfaces = { background: theme.background, panel: theme.panel };

  it.each(['title', 'text', 'emphasis', 'highlight'] as const)('%s text meets 4.5:1 on every surface', (role) => {
    for (const [surface, color] of Object.entries(surfaces)) {
      const ratio = contrastRatio(theme[role], color);
      expect(ratio, `${role} on ${surface}`).toBeGreaterThanOrEqual(CONTRAST_MIN.text);
    }
  });

  it('small print meets 7:1 on every surface', () => {
    for (const [surface, color] of Object.entries(surfaces)) {
      expect(contrastRatio(theme.textMuted, color), `textMuted on ${surface}`).toBeGreaterThanOrEqual(
        CONTRAST_MIN.smallPrint,
      );
    }
  });

  it('text on accent fills meets 4.5:1', () => {
    expect(contrastRatio(theme.accentText, theme.accent)).toBeGreaterThanOrEqual(CONTRAST_MIN.text);
  });

  it('QR code is dark on a light tile with strong contrast', () => {
    expect(contrastRatio(theme.qrDark, theme.qrTile)).toBeGreaterThanOrEqual(CONTRAST_MIN.smallPrint);
    expect(contrastRatio(theme.qrTile, '#000000')).toBeGreaterThan(contrastRatio(theme.qrDark, '#000000'));
  });
});
