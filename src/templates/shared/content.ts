import type { FormatPreset } from '../../config/formats';
import { cleanUrl, formatDateInline, formatDateStacked, formatTimeRange, normalizeUrl } from '../../lib/format';
import type { EventData, ImageAsset } from '../../schema/event';
import type { TemplateManifest } from '../types';

export type DateContent =
  | { kind: 'inline'; text: string; field: 'date' | 'recurringNote' }
  | { kind: 'stacked'; weekday: string; day: string; month: string; field: 'date' };

/** Everything a template shows for one event on one format. Also used to count visible words. */
export interface SignContent {
  title: string;
  subtitle: string;
  date: DateContent | null;
  time: string;
  location: string;
  highlights: string[];
  highlightStyle: EventData['highlightStyle'];
  description: string;
  callToAction: string;
  url: string;
  qrUrl: string | null;
  photo: ImageAsset | null;
  focus: { x: number; y: number };
  illustration: ImageAsset | null;
  background: ImageAsset | null;
  backgroundFocus: { x: number; y: number };
  credit: string;
  accommodations: string;
  showLockup: boolean;
  logos: ImageAsset[];
}

export function signContent(event: EventData, format: FormatPreset, manifest: TemplateManifest): SignContent {
  const uses = (field: keyof EventData) => manifest.usesFields.includes(field);
  const orientation = format.orientation;
  const note = event.recurringNote.trim();
  const style = event.dateStyle === 'auto' ? manifest.autoDateStyle[orientation] : event.dateStyle;

  let date: DateContent | null = null;
  if (note) {
    date = { kind: 'inline', text: note, field: 'recurringNote' };
  } else if (style === 'stacked') {
    const stacked = formatDateStacked(event.date, event.weekdayStyle);
    if (stacked) date = { kind: 'stacked', ...stacked, field: 'date' };
  } else {
    const text = formatDateInline(event.date, event.weekdayStyle);
    if (text) date = { kind: 'inline', text, field: 'date' };
  }

  const photo = uses('image') ? event.image : null;
  const qrUrl = uses('showQr') && event.showQr ? normalizeUrl(event.url) : null;
  return {
    title: event.title.trim(),
    subtitle: uses('subtitle') ? event.subtitle.trim() : '',
    date,
    time: formatTimeRange(event.startTime, event.endTime),
    location: event.location.trim(),
    highlights: uses('highlights') ? event.highlights.map((h) => h.value.trim()).filter(Boolean) : [],
    highlightStyle: event.highlightStyle,
    description: uses('description') && manifest.showsDescription[orientation] ? event.description.trim() : '',
    callToAction: uses('callToAction') ? event.callToAction.trim() : '',
    url: uses('url') ? event.displayUrl.trim() || (event.url.trim() ? cleanUrl(event.url) : '') : '',
    qrUrl,
    photo,
    focus: event.imageFocus,
    illustration: uses('illustration') ? event.illustration : null,
    background: uses('background') ? event.background : null,
    backgroundFocus: event.backgroundFocus,
    credit: photo && uses('imageCredit') ? event.imageCredit.trim() : '',
    accommodations: event.showAccommodations ? event.accommodations.trim() : '',
    showLockup: event.showLockup,
    logos: uses('logos') ? event.logos : [],
  };
}

export function visibleWords(content: SignContent): number {
  const d = content.date;
  const date = d ? (d.kind === 'inline' ? d.text : `${d.weekday} ${d.day} ${d.month}`) : '';
  const text = [
    content.title,
    content.subtitle,
    date,
    content.time,
    content.location,
    ...content.highlights,
    content.description,
    content.callToAction,
    content.url,
    content.credit,
    content.accommodations,
  ].join(' ');
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}
