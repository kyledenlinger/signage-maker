import type { ComponentType } from 'react';
import type { FormatPreset, OrientationClass } from '../config/formats';
import type { Theme } from '../config/themes';
import type { EventData } from '../schema/event';

/** Font size range for a text slot, in canvas units (u = 1% of the shorter edge). */
export interface TextSlot {
  minU: number;
  maxU: number;
}

/** Text slots from largest to smallest. A lower slot never renders larger than a higher one. */
export const SLOT_HIERARCHY = ['title', 'date', 'timeLocation', 'body', 'smallPrint'] as const;
export type SlotName = (typeof SLOT_HIERARCHY)[number];

export interface TemplateManifest {
  id: string;
  name: string;
  description: string;
  orientations: OrientationClass[];
  /** Optional fields this template shows. Required fields are always shown. */
  usesFields: (keyof EventData)[];
  slots: Record<SlotName, TextSlot>;
  /** Whether the description is shown, per orientation class. */
  showsDescription: Record<OrientationClass, boolean>;
  /** Date style used when the form says "auto". */
  autoDateStyle: Record<OrientationClass, 'inline' | 'stacked'>;
  /** Template rendered instead when no photo is uploaded. */
  fallbackWithoutImage?: string;
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
