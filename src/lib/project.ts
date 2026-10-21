import type { EventData } from '../schema/event';
import { slugify } from './format';

export const PROJECT_KIND = 'zsr-signage-project';
export const PROJECT_VERSION = 1;

/** The saved project: everything needed to reopen the event, with images embedded as data URLs. */
export interface ProjectFile {
  kind: typeof PROJECT_KIND;
  version: number;
  savedAt: string;
  event: EventData;
}

export function toProjectFile(event: EventData, now = new Date()): ProjectFile {
  return { kind: PROJECT_KIND, version: PROJECT_VERSION, savedAt: now.toISOString(), event };
}

export function projectJson(event: EventData): string {
  return JSON.stringify(toProjectFile(event), null, 2);
}

export function projectFileName(event: Pick<EventData, 'title'>): string {
  return `${slugify(event.title)}.signage.json`;
}
