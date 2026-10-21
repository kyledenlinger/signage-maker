import type { ComponentType } from 'react';
import type { FormatPreset, OrientationClass } from '../config/formats';
import type { Theme } from '../config/themes';
import type { EventData } from '../schema/event';

/** Font size range for a text slot, in canvas units (u = 1% of the shorter edge). */
export interface TextSlot {
  minU: number;
  maxU: number;
}

export type SlotName = 'title' | 'date' | 'timeLocation' | 'body' | 'smallPrint';

export interface TemplateManifest {
  id: string;
  name: string;
  description: string;
  orientations: OrientationClass[];
  usesFields: (keyof EventData)[];
  slots: Record<SlotName, TextSlot>;
}

export interface TemplateProps {
  event: EventData;
  theme: Theme;
  format: FormatPreset;
}

export interface TemplateDefinition {
  manifest: TemplateManifest;
  Component: ComponentType<TemplateProps>;
}
