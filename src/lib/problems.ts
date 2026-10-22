import type { ZodIssue } from 'zod';
import { eventSchema, FIELD_ORDER, type EventData } from '../schema/event';
import { FIELD_LABELS } from '../schema/labels';
import type { FitReport } from '../templates/TemplateRenderer';
import { contentIssues, fitIssues, type Issue } from './checks';

/**
 * The one place that decides what's wrong with a sign. The status bar, field errors, section chips
 * and export gating all read from this.
 */
export interface Problem {
  id: string;
  severity: 'blocker' | 'warning';
  /** DOM id of the field to jump to. */
  fieldId?: string;
  /** Formats affected; omitted means every format. */
  formatIds?: string[];
  /** Plain language, e.g. "Title is required." */
  message: string;
  /** What to do about it, e.g. "Add a title". */
  actionLabel: string;
}

/** DOM id of a form field, from its dotted path ("highlights.0.value" -> "field-highlights-0-value"). */
export function fieldDomId(path: string): string {
  return `field-${path.replace(/\./g, '-')}`;
}

function label(path: string): string {
  const highlight = /^highlights\.(\d+)/.exec(path);
  if (highlight) return `Highlight ${Number(highlight[1]) + 1}`;
  return FIELD_LABELS[path as keyof EventData] ?? path;
}

const REQUIRED_ACTION: Partial<Record<keyof EventData, string>> = {
  title: 'Add a title',
  date: 'Pick a date',
  startTime: 'Add a start time',
  location: 'Add a location',
  formatIds: 'Choose a format',
};

/** Rules from the schema: required fields, character limits, times, URL, alt text. */
function schemaProblems(event: EventData): Problem[] {
  const parsed = eventSchema.safeParse(event);
  if (parsed.success) return [];
  return parsed.error.issues.map((issue: ZodIssue): Problem => {
    const path = issue.path.join('.');
    const field = issue.path[0] as keyof EventData;
    const base = { id: `schema:${path}:${issue.code}`, severity: 'blocker' as const, fieldId: fieldDomId(path) };
    const name = label(path);

    if (issue.code === 'too_big' && issue.type === 'string') {
      const length = String(path.split('.').reduce<unknown>((v, k) => (v as Record<string, unknown>)?.[k], event) ?? '').length;
      return { ...base, message: `${name} is ${length} characters; the limit is ${issue.maximum}.`, actionLabel: 'Shorten it' };
    }
    if (issue.code === 'too_big' && field === 'highlights') {
      return { ...base, message: `There are more than ${issue.maximum} highlights.`, actionLabel: 'Remove one' };
    }
    if (field === 'formatIds') {
      return { ...base, message: 'No formats are selected.', actionLabel: 'Choose a format' };
    }
    if (REQUIRED_ACTION[field]) {
      return { ...base, message: `${name} is required.`, actionLabel: REQUIRED_ACTION[field]! };
    }
    if (field === 'endTime') return { ...base, message: 'The end time is before the start time.', actionLabel: 'Fix the time' };
    if (field === 'url') return { ...base, message: "The web address isn't valid.", actionLabel: 'Fix the address' };
    if (field === 'imageDescription') {
      return { ...base, message: 'The photo needs a description for alt text.', actionLabel: 'Describe it' };
    }
    if (field === 'accommodations') {
      return { ...base, message: 'The accommodations line is empty.', actionLabel: 'Add it or turn it off' };
    }
    return { ...base, message: `${name}: ${issue.message}`, actionLabel: 'Fix it' };
  });
}

/** Text fields that print on the sign (or go into alt text), as dotted paths with their values. */
function textValues(event: EventData): [string, string][] {
  const fields: (keyof EventData)[] = [
    'title',
    'subtitle',
    'recurringNote',
    'location',
    'description',
    'callToAction',
    'displayUrl',
    'imageDescription',
    'imageCredit',
  ];
  const out: [string, string][] = fields.map((f) => [f, String(event[f] ?? '')]);
  event.highlights.forEach((h, i) => out.push([`highlights.${i}.value`, h.value]));
  if (event.showAccommodations) out.push(['accommodations', event.accommodations]);
  return out;
}

const PLACEHOLDER = /\[[^\]\n]{1,40}\]/;

/** "[email]"-style placeholders left in any text: the default accommodations line ships with one. */
function placeholderProblems(event: EventData): Problem[] {
  return textValues(event).flatMap(([path, value]) => {
    const match = PLACEHOLDER.exec(value);
    if (!match) return [];
    return [
      {
        id: `placeholder:${path}`,
        severity: 'blocker' as const,
        fieldId: fieldDomId(path),
        message: `The ${label(path).toLowerCase()} still says ${match[0]}.`,
        actionLabel: 'Replace it',
      },
    ];
  });
}

function sentence(text: string): string {
  const t = text.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Readability and fit checks (lib/checks.ts), in the same shape: "Portrait HD · Title: doesn't fit…". */
function fromIssue(issue: Issue): Problem {
  const where = [issue.formatId ? issue.formatName : '', issue.field ? label(issue.field) : ''].filter(Boolean).join(' · ');
  return {
    id: issue.id,
    severity: issue.severity === 'blocking' ? 'blocker' : 'warning',
    fieldId: issue.field ? fieldDomId(issue.field) : undefined,
    formatIds: issue.formatId ? [issue.formatId] : undefined,
    message: sentence(where ? `${where}: ${issue.problem}` : capitalize(issue.problem)),
    actionLabel: capitalize(issue.fix),
  };
}

/** Where a problem's field sits in the form, so the list reads top to bottom. */
function order(problem: Problem): number {
  const path = problem.fieldId?.replace(/^field-/, '').split('-')[0] ?? '';
  const i = FIELD_ORDER.indexOf(path as keyof EventData);
  return i === -1 ? FIELD_ORDER.length : i;
}

export function getProblems(event: EventData, fitReports: FitReport[] = []): Problem[] {
  const formatIds = Array.isArray(event.formatIds) ? event.formatIds : [];
  const all = [
    ...schemaProblems(event),
    ...placeholderProblems(event),
    ...contentIssues(event, formatIds).map(fromIssue),
    ...fitIssues(fitReports.filter((r) => formatIds.includes(r.formatId))).map(fromIssue),
  ];
  const blockers = all.filter((p) => p.severity === 'blocker').sort((a, b) => order(a) - order(b));
  const warnings = all.filter((p) => p.severity === 'warning').sort((a, b) => order(a) - order(b));
  return [...blockers, ...warnings];
}

/** Blockers that stop a given format from exporting (those for every format, plus its own). */
export function blockersFor(problems: Problem[], formatId: string): Problem[] {
  return problems.filter((p) => p.severity === 'blocker' && (!p.formatIds || p.formatIds.includes(formatId)));
}
