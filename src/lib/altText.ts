import type { FormatPreset } from '../config/formats';
import type { EventData } from '../schema/event';
import { cleanUrl, formatDateInline, formatTimeRange } from './format';

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

/** Ends a fragment with a period unless it already ends a sentence. */
function sentence(text: string): string {
  const t = text.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/** Alt text for an exported sign, for reuse on the web or social media. */
export function exportAltText(event: EventData): string {
  const parts = [
    `Event sign: ${sentence(eventSummary(event) || 'untitled event')}`,
    event.subtitle.trim() && sentence(event.subtitle),
    event.callToAction.trim() && sentence(event.callToAction),
    event.url.trim() && sentence(`More at ${event.displayUrl.trim() || cleanUrl(event.url)}`),
    event.image && event.imageDescription.trim() && sentence(`Photo: ${event.imageDescription}`),
  ];
  return parts.filter(Boolean).join(' ');
}
