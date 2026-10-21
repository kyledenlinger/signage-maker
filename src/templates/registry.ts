import type { EventData } from '../schema/event';
import { Band } from './band/Band';
import { bandManifest } from './band/manifest';
import { Frame } from './frame/Frame';
import { frameManifest } from './frame/manifest';
import { Showcase } from './showcase/Showcase';
import { showcaseManifest } from './showcase/manifest';
import { Split } from './split/Split';
import { splitManifest } from './split/manifest';
import { TypeOnly } from './type-only/TypeOnly';
import { typeOnlyManifest } from './type-only/manifest';
import type { TemplateDefinition } from './types';

export const TEMPLATES: TemplateDefinition[] = [
  { manifest: showcaseManifest, Component: Showcase },
  { manifest: splitManifest, Component: Split },
  { manifest: bandManifest, Component: Band },
  { manifest: typeOnlyManifest, Component: TypeOnly },
  { manifest: frameManifest, Component: Frame },
];

export const DEFAULT_TEMPLATE_ID = 'showcase';

export function findTemplate(id: string): TemplateDefinition {
  return TEMPLATES.find((t) => t.manifest.id === id) ?? TEMPLATES[0];
}

/** The template that actually renders, after any fallback (Frame without a photo becomes Type only). */
export function resolveTemplate(id: string, event: Pick<EventData, 'image'>): TemplateDefinition {
  const chosen = findTemplate(id);
  const fallback = chosen.manifest.fallbackWithoutImage;
  return fallback && !event.image ? findTemplate(fallback) : chosen;
}
