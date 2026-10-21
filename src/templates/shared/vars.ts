import type { CSSProperties } from 'react';
import { canvasUnit, type FormatPreset } from '../../config/formats';
import { LAYOUT } from '../../config/layout';
import { LINE_HEIGHT, TITLE_MAX_CHARS_PER_LINE } from '../../config/limits';
import type { Theme } from '../../config/themes';

/**
 * CSS custom properties every template can rely on. Font sizes (--fs-*) are set separately by
 * the text fitter on the host element.
 */
export function templateVars(
  theme: Theme,
  format: FormatPreset,
  extra: Record<string, string> = {},
  options: { backdrop?: boolean } = {},
): CSSProperties {
  const u = canvasUnit(format);
  const px = (units: number) => `${units * u}px`;
  return {
    '--u': `${u}px`,
    '--w': `${format.width}px`,
    '--h': `${format.height}px`,
    '--safe-x': `${format.safeZone.x}px`,
    '--safe-y': `${format.safeZone.y}px`,
    '--gap': px(options.backdrop ? LAYOUT.panel.gapU : LAYOUT.gapU),
    '--accent-bar': px(LAYOUT.accentBarU),
    '--panel-pad': px(LAYOUT.panel.paddingU),
    '--panel-radius': px(LAYOUT.panel.radiusU),
    '--qr-tile-radius': px(LAYOUT.qrTile.radiusU),
    '--qr-tile-pad': px(LAYOUT.qrTile.paddingU),
    '--qr-tile-border': px(LAYOUT.qrTile.borderU),
    '--date-month-scale': String(LAYOUT.dateMonthScale),
    '--photo-min': LAYOUT.photoMinShare,
    '--title-measure': `${TITLE_MAX_CHARS_PER_LINE[format.orientation]}ch`,
    '--lh-display': String(LINE_HEIGHT.display),
    '--lh-body': String(LINE_HEIGHT.body),
    '--c-bg': theme.background,
    '--c-panel': theme.panel,
    '--c-text': theme.text,
    '--c-muted': theme.textMuted,
    '--c-title': theme.title,
    '--c-emphasis': theme.emphasis,
    '--c-accent': theme.accent,
    '--c-accent-text': theme.accentText,
    '--c-rule': theme.rule,
    '--c-qr-tile': theme.qrTile,
    '--c-qr-frame': theme.qrFrame,
    '--font-display': theme.fontDisplay,
    '--font-body': theme.fontBody,
    ...extra,
  } as CSSProperties;
}
