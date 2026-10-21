import type { FormatPreset } from '../config/formats';
import type { EventData } from '../schema/event';
import { formatDateInline, formatTimeRange } from './format';

/** "Banned Books Week, Thu, Nov 6, 4–5:30 p.m., ZSR Library, Room 204" */
export function eventSummary(event: EventData): string {
  const when = event.recurringNote.trim() || formatDateInline(event.date);
  return [event.title.trim(), when, formatTimeRange(event.startTime, event.endTime), event.location.trim()]
    .filter(Boolean)
    .join(', ');
}

export function previewAltText(event: EventData, format: FormatPreset): string {
  const summary = eventSummary(event);
  return `Signage preview, ${format.name}: ${summary || 'no event details yet'}.`;
}
