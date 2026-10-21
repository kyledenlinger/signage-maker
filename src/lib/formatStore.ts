import { useSyncExternalStore } from 'react';
import { CUSTOM_SIZE_PX, FORMAT_PRESETS, type FormatPreset, type OrientationClass } from '../config/formats';
import { loadCustomFormats, saveCustomFormats } from './storage';

/*
 * Built-in presets plus the user's custom presets. Custom presets persist in localStorage and
 * travel in project files.
 */

const ORIENTATIONS: OrientationClass[] = ['landscape', 'portrait', 'square'];

/** Checks a stored or imported custom preset; returns null if it isn't one. */
export function parseCustomFormat(raw: unknown): FormatPreset | null {
  if (!raw || typeof raw !== 'object') return null;
  const f = raw as Partial<FormatPreset>;
  const sizeOk = (n: unknown) =>
    typeof n === 'number' && Number.isInteger(n) && n >= CUSTOM_SIZE_PX.min && n <= CUSTOM_SIZE_PX.max;
  if (
    typeof f.id !== 'string' ||
    !f.id.startsWith('custom-') ||
    typeof f.name !== 'string' ||
    !f.name.trim() ||
    !sizeOk(f.width) ||
    !sizeOk(f.height) ||
    !ORIENTATIONS.includes(f.orientation as OrientationClass) ||
    !f.safeZone ||
    typeof f.safeZone.x !== 'number' ||
    typeof f.safeZone.y !== 'number'
  ) {
    return null;
  }
  return {
    id: f.id,
    name: f.name,
    width: f.width!,
    height: f.height!,
    orientation: f.orientation!,
    safeZone: { x: f.safeZone.x, y: f.safeZone.y },
    fileTypes: ['png', 'jpg'],
    custom: true,
  };
}

let custom: FormatPreset[] = (loadCustomFormats() ?? []).map(parseCustomFormat).filter((f): f is FormatPreset => f !== null);
let snapshot: FormatPreset[] = [...FORMAT_PRESETS, ...custom];
const listeners = new Set<() => void>();

export function allFormats(): FormatPreset[] {
  return snapshot;
}

export function findAnyFormat(id: string): FormatPreset | undefined {
  return snapshot.find((f) => f.id === id);
}

export function customFormats(): FormatPreset[] {
  return custom;
}

export function setCustomFormats(next: FormatPreset[]) {
  custom = next;
  snapshot = [...FORMAT_PRESETS, ...custom];
  saveCustomFormats(custom);
  listeners.forEach((l) => l());
}

/** Adds presets that aren't already known (by id), e.g. from an opened project file. */
export function mergeCustomFormats(incoming: unknown[]): FormatPreset[] {
  const parsed = incoming.map(parseCustomFormat).filter((f): f is FormatPreset => f !== null);
  const added = parsed.filter((f, i) => !findAnyFormat(f.id) && parsed.findIndex((g) => g.id === f.id) === i);
  if (added.length) setCustomFormats([...custom, ...added]);
  return parsed;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useFormats(): FormatPreset[] {
  return useSyncExternalStore(subscribe, allFormats);
}
