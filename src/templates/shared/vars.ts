import type { CSSProperties } from 'react';
import { canvasUnit, type FormatPreset } from '../../config/formats';
import { LINE_HEIGHT } from '../../config/limits';
import type { Theme } from '../../config/themes';
import type { TemplateManifest } from '../types';

/** CSS custom properties every template can rely on. */
export function templateVars(manifest: TemplateManifest, theme: Theme, format: FormatPreset): CSSProperties {
  const vars: Record<string, string> = {
    '--u': `${canvasUnit(format)}px`,
    '--w': `${format.width}px`,
    '--h': `${format.height}px`,
    '--safe-x': `${format.safeZone.x}px`,
    '--safe-y': `${format.safeZone.y}px`,
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
  };
  for (const [name, slot] of Object.entries(manifest.slots)) {
    vars[`--fs-${name}`] = `calc(var(--u) * ${slot.maxU})`;
  }
  return vars as CSSProperties;
}
