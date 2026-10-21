/** Display formatting for event fields. Locale-independent so every browser renders the same text. */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "Thu, Nov 6" */
export function formatDateInline(iso: string): string {
  const d = parseDate(iso);
  if (!d) return '';
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** { day: "23", month: "Oct" } */
export function formatDateStacked(iso: string): { day: string; month: string } | null {
  const d = parseDate(iso);
  if (!d) return null;
  return { day: String(d.getDate()), month: MONTHS[d.getMonth()] };
}

interface ParsedTime {
  h: number;
  m: number;
}

function parseTime(t: string): ParsedTime | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return null;
  return { h: Number(m[1]), m: Number(m[2]) };
}

function meridiem(t: ParsedTime): 'a.m.' | 'p.m.' {
  return t.h < 12 ? 'a.m.' : 'p.m.';
}

function clock(t: ParsedTime): string {
  const h12 = t.h % 12 === 0 ? 12 : t.h % 12;
  return t.m === 0 ? String(h12) : `${h12}:${String(t.m).padStart(2, '0')}`;
}

function isNoon(t: ParsedTime) {
  return t.h === 12 && t.m === 0;
}
function isMidnight(t: ParsedTime) {
  return t.h === 0 && t.m === 0;
}

/** AP style: "4 p.m.", "5:30 p.m.", "noon", "midnight". */
export function formatTime(value: string): string {
  const t = parseTime(value);
  if (!t) return '';
  if (isNoon(t)) return 'noon';
  if (isMidnight(t)) return 'midnight';
  return `${clock(t)} ${meridiem(t)}`;
}

/** AP style range: "4–5:30 p.m.", "11 a.m.–1 p.m.", "10 a.m.–noon". */
export function formatTimeRange(start: string, end: string): string {
  const s = parseTime(start);
  if (!s) return '';
  const e = parseTime(end);
  if (!e) return formatTime(start);
  const named = (t: ParsedTime) => isNoon(t) || isMidnight(t);
  if (!named(s) && !named(e) && meridiem(s) === meridiem(e)) {
    return `${clock(s)}–${clock(e)} ${meridiem(e)}`;
  }
  return `${formatTime(start)}–${formatTime(end)}`;
}

/** Accepts URLs with or without a scheme. Returns a full https URL, or null if invalid. */
export function normalizeUrl(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.')) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** "https://zsr.wfu.edu/events/" -> "zsr.wfu.edu/events" */
export function cleanUrl(value: string): string {
  return value
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .replace(/\/+$/, '');
}

export function slugify(value: string): string {
  return (
    value
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'event'
  );
}
