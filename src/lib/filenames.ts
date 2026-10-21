import type { FileType, FormatPreset } from '../config/formats';
import type { EventData } from '../schema/event';
import { slugify } from './format';

/** `{event-slug}_{preset-slug}_{W}x{H}.{ext}`, e.g. banned-books-week_landscape-hd_1920x1080.png */
export function exportFileName(
  event: Pick<EventData, 'title'>,
  format: Pick<FormatPreset, 'name' | 'width' | 'height'>,
  type: FileType,
): string {
  return `${slugify(event.title)}_${slugify(format.name)}_${format.width}x${format.height}.${type}`;
}

export function zipFileName(event: Pick<EventData, 'title'>): string {
  return `${slugify(event.title)}_signage.zip`;
}
