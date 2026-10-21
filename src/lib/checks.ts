import type { FormatPreset } from '../config/formats';
import { CONTRAST_MIN, FIELD_LIMITS, GLANCE_WORD_LIMIT, IMAGE_PX, type CharLimit } from '../config/limits';
import { resolveTheme, type Theme } from '../config/themes';
import type { EventData } from '../schema/event';
import { FIELD_LABELS } from '../schema/labels';
import { signContent, visibleWords } from '../templates/shared/content';
import { findTemplate, resolveTemplate } from '../templates/registry';
import type { FitReport } from '../templates/TemplateRenderer';
import { COLORWAYS, colorwayReadable, pickColorway } from '../config/logos';
import { contrastRatio } from './contrast';
import { isVector } from './image';
import { allFormats, findAnyFormat } from './formatStore';

export type Severity = 'blocking' | 'warning';

export interface Issue {
  id: string;
  severity: Severity;
  /** null = applies to every format. */
  formatId: string | null;
  formatName: string;
  /** Form field to focus, as a dotted path (e.g. "highlights.0.value"). */
  field: string | null;
  fieldLabel: string;
  problem: string;
  fix: string;
}

const ALL_FORMATS = 'All formats';

const TEXT_FIELDS: { field: keyof EventData; limit: CharLimit }[] = [
  { field: 'title', limit: FIELD_LIMITS.title },
  { field: 'subtitle', limit: FIELD_LIMITS.subtitle },
  { field: 'recurringNote', limit: FIELD_LIMITS.recurringNote },
  { field: 'location', limit: FIELD_LIMITS.location },
  { field: 'description', limit: FIELD_LIMITS.description },
  { field: 'callToAction', limit: FIELD_LIMITS.callToAction },
  { field: 'displayUrl', limit: FIELD_LIMITS.displayUrl },
  { field: 'imageDescription', limit: FIELD_LIMITS.imageDescription },
  { field: 'imageCredit', limit: FIELD_LIMITS.imageCredit },
  { field: 'accommodations', limit: FIELD_LIMITS.accommodations },
];

function label(field: string): string {
  const highlight = /^highlights\.(\d+)/.exec(field);
  if (highlight) return `Highlight ${Number(highlight[1]) + 1}`;
  return FIELD_LABELS[field as keyof EventData] ?? field;
}

function issue(
  severity: Severity,
  format: FormatPreset | null,
  field: string | null,
  problem: string,
  fix: string,
): Issue {
  return {
    id: `${severity}:${format?.id ?? 'all'}:${field ?? '-'}:${problem}`,
    severity,
    formatId: format?.id ?? null,
    formatName: format?.name ?? ALL_FORMATS,
    field,
    fieldLabel: field ? label(field) : 'All text',
    problem,
    fix,
  };
}

/** Theme pairs that carry text. Themes are also checked at build time (themes.test.ts). */
export function themeContrastIssues(theme: Theme): Issue[] {
  const out: Issue[] = [];
  const surfaces = [theme.background, theme.panel];
  const pairs: [string, number][] = [
    [theme.title, CONTRAST_MIN.text],
    [theme.text, CONTRAST_MIN.text],
    [theme.emphasis, CONTRAST_MIN.text],
    [theme.highlight, CONTRAST_MIN.text],
    [theme.textMuted, CONTRAST_MIN.smallPrint],
  ];
  for (const [color, min] of pairs) {
    for (const surface of surfaces) {
      const ratio = contrastRatio(color, surface);
      if (ratio < min) {
        out.push(
          issue('blocking', null, 'themeId', `${color} on ${surface} is ${ratio.toFixed(1)}:1, below ${min}:1`, 'choose another theme'),
        );
      }
    }
  }
  return out;
}

/** Checks that don't need the rendered output. */
export function contentIssues(event: EventData, formatIds: string[]): Issue[] {
  const out: Issue[] = [];
  const formats = allFormats().filter((f) => formatIds.includes(f.id));
  const chosen = findTemplate(event.templateId);

  for (const { field, limit } of TEXT_FIELDS) {
    const length = String(event[field] ?? '').length;
    if (length > limit.max) {
      out.push(issue('blocking', null, field, `${length} characters, over the ${limit.max} limit`, `shorten by ${length - limit.max} characters`));
    } else if (limit.recommended && length > limit.recommended) {
      out.push(
        issue('warning', null, field, `${length} characters, over the recommended ${limit.recommended}`, `shorten by ${length - limit.recommended} characters to read at a glance`),
      );
    }
  }
  event.highlights.forEach((h, i) => {
    if (h.value.length > FIELD_LIMITS.highlight.max) {
      out.push(issue('blocking', null, `highlights.${i}.value`, `over the ${FIELD_LIMITS.highlight.max}-character limit`, `shorten by ${h.value.length - FIELD_LIMITS.highlight.max} characters`));
    }
  });

  const letters = event.title.replace(/[^\p{L}]/gu, '');
  if (letters.length > 3 && letters === letters.toUpperCase()) {
    out.push(issue('warning', null, 'title', 'written in all caps', 'use title case; all caps is slower to read'));
  }

  if (event.showQr && !event.url.trim()) {
    out.push(issue('warning', null, 'url', 'QR code is on, but there is no web address', 'add a web address or turn the QR code off'));
  }

  if (event.image && !chosen.manifest.usesFields.includes('image')) {
    out.push(issue('warning', null, 'image', `${chosen.manifest.name} doesn't show a photo or illustration`, 'choose Showcase, Split, Band or Frame to use it'));
  }

  const { manifest } = resolveTemplate(event.templateId, event);
  if (event.background && !manifest.usesFields.includes('background')) {
    out.push(issue('warning', null, 'templateId', `${manifest.name} doesn't show background images`, 'choose Showcase or Type only to use the background'));
  }

  // Resolution of the raster images the sign actually shows (SVGs scale cleanly).
  const shown = (['image', 'background'] as const).filter(
    (field) => event[field] && !isVector(event[field]!) && manifest.usesFields.includes(field),
  );
  for (const field of shown) {
    const edge = event[field]!.originalLongEdge;
    if (edge < IMAGE_PX.warnBelow) {
      out.push(issue('warning', null, field, `${edge} px on the long edge`, `use an image at least ${IMAGE_PX.warnBelow} px wide for sharp results`));
    }
  }

  for (const format of formats) {
    const hiRes = format.dpi !== undefined || Math.max(format.width, format.height) >= IMAGE_PX.hiResFormatEdge;
    for (const field of shown) {
      const edge = event[field]!.originalLongEdge;
      if (hiRes && edge < IMAGE_PX.blockBelowForHiRes) {
        out.push(issue('blocking', format, field, `${edge} px is too small for this size`, `use an image at least ${IMAGE_PX.blockBelowForHiRes} px wide, or skip this format`));
      }
    }
    if (format.orientation !== 'portrait') {
      const words = visibleWords(signContent(event, format, manifest));
      if (words > GLANCE_WORD_LIMIT) {
        out.push(issue('warning', format, null, `${words} words, too much to read in a 10-second slot`, `cut to ${GLANCE_WORD_LIMIT} words or fewer`));
      }
    }
  }

  const theme = resolveTheme(event);
  if (event.showLockup && event.lockupColorway !== 'auto' && !colorwayReadable(event.lockupColorway, theme.panel)) {
    out.push(
      issue('warning', null, 'lockupColorway', `the ${COLORWAYS[event.lockupColorway].name.toLowerCase()} logo is hard to see on this theme`, `use Automatic (${COLORWAYS[pickColorway(theme.panel)].name.toLowerCase()})`),
    );
  }

  out.push(...themeContrastIssues(theme));
  return out;
}

/** Text that doesn't fit at minimum size, from the rendered output. */
export function fitIssues(reports: FitReport[]): Issue[] {
  return reports.flatMap((report) => {
    const format = findAnyFormat(report.formatId);
    if (!format || report.fits) return [];
    if (report.problems.length === 0) {
      return [issue('blocking', format, null, "text doesn't fit at minimum size", 'shorten the longest fields')];
    }
    return report.problems.map((p) =>
      issue('blocking', format, p.field === 'highlights' ? 'highlights.0.value' : p.field, "doesn't fit at minimum size", `shorten by ~${p.shortenBy} characters`),
    );
  });
}
