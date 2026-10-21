import { Showcase } from './showcase/Showcase';
import { showcaseManifest } from './showcase/manifest';
import type { TemplateDefinition } from './types';

/** Split, Band, Type only and Frame arrive in phase 2. */
export const TEMPLATES: TemplateDefinition[] = [{ manifest: showcaseManifest, Component: Showcase }];

export const DEFAULT_TEMPLATE_ID = 'showcase';

export function findTemplate(id: string): TemplateDefinition {
  return TEMPLATES.find((t) => t.manifest.id === id) ?? TEMPLATES[0];
}
