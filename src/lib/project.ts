import type { FormatPreset } from '../config/formats';
import { blankEvent } from '../schema/defaults';
import { imageAssetSchema, type EventData, type ImageAsset } from '../schema/event';
import { slugify } from './format';

export const PROJECT_KIND = 'zsr-signage-project';
export const PROJECT_VERSION = 1;

/** The saved project: everything needed to reopen the event, with images embedded as data URLs. */
export interface ProjectFile {
  kind: typeof PROJECT_KIND;
  version: number;
  savedAt: string;
  event: EventData;
  /** The user's custom presets, so formats they selected still exist when the file is opened elsewhere. */
  customFormats: FormatPreset[];
}

export function toProjectFile(event: EventData, customFormats: FormatPreset[] = [], now = new Date()): ProjectFile {
  return { kind: PROJECT_KIND, version: PROJECT_VERSION, savedAt: now.toISOString(), event, customFormats };
}

export function projectJson(event: EventData, customFormats: FormatPreset[] = []): string {
  return JSON.stringify(toProjectFile(event, customFormats), null, 2);
}

export function projectFileName(event: Pick<EventData, 'title'>): string {
  return `${slugify(event.title)}.signage.json`;
}

export type ParsedProject = { ok: true; event: EventData; customFormats: unknown[] } | { ok: false; error: string };

function image(value: unknown): ImageAsset | null {
  const parsed = imageAssetSchema.safeParse(value);
  return parsed.success && parsed.data.dataUrl.startsWith('data:image/') ? parsed.data : null;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Rebuilds an event from untrusted JSON (an opened file or autosave). Each field is taken only if
 * it has the right type; anything else falls back to the blank value. Text over its limit is kept
 * as-is, so the form can flag it rather than silently cutting it.
 */
export function coerceEvent(raw: Record<string, unknown>): EventData {
  const blank = blankEvent();
  const out = { ...blank } as Record<string, unknown>;
  for (const [key, fallback] of Object.entries(blank)) {
    const value = raw[key];
    if (typeof fallback === 'string' || typeof fallback === 'boolean') {
      if (typeof value === typeof fallback) out[key] = value;
    }
  }
  if (!['auto', 'inline', 'stacked'].includes(out.dateStyle as string)) out.dateStyle = blank.dateStyle;
  out.image = image(raw.image);
  out.illustration = image(raw.illustration);
  out.logos = Array.isArray(raw.logos) ? raw.logos.map(image).filter((l): l is ImageAsset => l !== null) : [];
  out.highlights = Array.isArray(raw.highlights)
    ? raw.highlights.filter((h) => isRecord(h) && typeof h.value === 'string').map((h) => ({ value: (h as { value: string }).value }))
    : [];
  const focus = raw.imageFocus;
  const unit = (n: unknown) => typeof n === 'number' && n >= 0 && n <= 1;
  out.imageFocus = isRecord(focus) && unit(focus.x) && unit(focus.y) ? { x: focus.x, y: focus.y } : blank.imageFocus;
  out.formatIds = Array.isArray(raw.formatIds) ? raw.formatIds.filter((id) => typeof id === 'string') : blank.formatIds;
  return out as unknown as EventData;
}

/** Reads a project file's JSON. Returns a message suitable for the user when it isn't one. */
export function parseProject(raw: unknown): ParsedProject {
  if (!isRecord(raw) || raw.kind !== PROJECT_KIND || !isRecord(raw.event)) {
    return { ok: false, error: 'This file isn’t a Signage Builder project.' };
  }
  if (typeof raw.version !== 'number' || raw.version > PROJECT_VERSION) {
    return { ok: false, error: 'This project was saved by a newer version of Signage Builder.' };
  }
  return {
    ok: true,
    event: coerceEvent(raw.event),
    customFormats: Array.isArray(raw.customFormats) ? raw.customFormats : [],
  };
}

export function parseProjectText(text: string): ParsedProject {
  try {
    return parseProject(JSON.parse(text));
  } catch {
    return { ok: false, error: 'This file isn’t a Signage Builder project.' };
  }
}

/** A new event from this one: keeps template, theme, logos, accommodations line and formats. */
export function duplicateEvent(event: EventData): EventData {
  return {
    ...blankEvent(event.formatIds),
    templateId: event.templateId,
    themeId: event.themeId,
    showLockup: event.showLockup,
    logos: event.logos,
    showAccommodations: event.showAccommodations,
    accommodations: event.accommodations,
    dateStyle: event.dateStyle,
    showQr: event.showQr,
  };
}
