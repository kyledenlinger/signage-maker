import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { FormatPreset } from '../config/formats';
import { canvasUnit } from '../config/formats';
import type { Theme } from '../config/themes';
import { fitText, type SlotSizes } from '../lib/fitText';
import type { EventData } from '../schema/event';
import { resolveTemplate } from './registry';
import { SLOT_HIERARCHY, type SlotName } from './types';

export interface FitProblem {
  /** Form field the problem points to. */
  field: string;
  /** Rough number of characters to cut. */
  shortenBy: number;
}

export interface FitReport {
  formatId: string;
  fits: boolean;
  /** Rendered sizes in canvas units. */
  sizesU: SlotSizes;
  problems: FitProblem[];
}

interface Props {
  event: EventData;
  theme: Theme;
  format: FormatPreset;
  onFit?: (report: FitReport) => void;
}

const CONTENT = '[data-slot], .t-qr-tile, .t-logos';

/** The box text actually occupies (a block's own box can be wider than its text). */
function contentRect(el: Element): DOMRect {
  if (!el.hasAttribute('data-slot')) return el.getBoundingClientRect();
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect();
}

interface Overflow {
  region: HTMLElement;
  /** How far content escapes, in layout px. */
  px: number;
  /** The text element that escapes furthest, when one does. */
  culprit: Element | null;
  /** Share of the culprit (or region) that is out of bounds, 0–1. */
  ratio: number;
}

/**
 * How far content escapes a region: scrolled overflow, or any text, QR tile or logo row sticking
 * out of the region's box in any direction (end-aligned content overflows upward, which scroll
 * sizes miss). On the canvas itself the box is the safe zone.
 */
function measure(region: HTMLElement, root: HTMLElement, safe: FormatPreset['safeZone']): Overflow {
  const box = region.getBoundingClientRect();
  const scale = box.width / region.offsetWidth || 1;
  const inset = region === root ? { x: safe.x * scale, y: safe.y * scale } : { x: 0, y: 0 };
  // An element that sticks out names the culprit; otherwise fall back to scrolled overflow.
  let escape: Omit<Overflow, 'region'> | null = null;
  for (const el of Array.from(region.querySelectorAll(CONTENT))) {
    const r = contentRect(el);
    const x = Math.max(box.left + inset.x - r.left, r.right - (box.right - inset.x)) / scale;
    const y = Math.max(box.top + inset.y - r.top, r.bottom - (box.bottom - inset.y)) / scale;
    const px = Math.max(x, y);
    if (px > 0 && (!escape || px > escape.px)) {
      const extent = (x >= y ? r.width : r.height) / scale;
      escape = { px, culprit: el.hasAttribute('data-field') ? el : null, ratio: Math.min(1, px / Math.max(extent, 1)) };
    }
  }
  const scrolled = Math.max(region.scrollHeight - region.clientHeight, region.scrollWidth - region.clientWidth);
  if (escape) return { region, ...escape, px: Math.max(escape.px, scrolled) };
  return { region, px: scrolled, culprit: null, ratio: Math.min(1, scrolled / Math.max(region.scrollHeight, 1)) };
}

function slotsIn(el: Element): SlotName[] {
  const found = new Set<SlotName>();
  const own = el.getAttribute('data-slot');
  if (own) found.add(own as SlotName);
  el.querySelectorAll('[data-slot]').forEach((n) => found.add(n.getAttribute('data-slot') as SlotName));
  return [...found];
}

/** Regions whose content escapes by more than `slack` px (glyphs can poke past their line box). */
function overflowingRegions(root: HTMLElement, safe: FormatPreset['safeZone'], slack: number): Overflow[] {
  const regions = [root, ...Array.from(root.querySelectorAll<HTMLElement>('[data-fit-region]'))];
  return regions.map((region) => measure(region, root, safe)).filter((o) => o.px > slack);
}

/**
 * Points an overflow at the field that escapes (or the region's longest field), with a rough
 * number of characters to cut.
 */
function describe({ region, culprit, ratio }: Overflow): FitProblem | null {
  const length = (el: Element) => el.textContent?.length ?? 0;
  let target = culprit;
  let chars = culprit ? length(culprit) : 0;
  if (!target) {
    const fields = Array.from(region.querySelectorAll('[data-field]'));
    if (region.hasAttribute('data-field')) fields.unshift(region);
    if (fields.length === 0) return null;
    target = fields.reduce((a, b) => (length(b) > length(a) ? b : a));
    chars = fields.reduce((n, f) => n + length(f), 0);
  }
  const shortenBy = Math.max(5, Math.ceil((ratio * chars) / 5) * 5);
  return { field: target.getAttribute('data-field')!, shortenBy };
}

/**
 * Renders a template at its true pixel size and fits its text. The preview scales this down with a
 * CSS transform; export captures it at 1:1. Both go through this component.
 */
export function TemplateRenderer({ event, theme, format, onFit }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { manifest, Component } = resolveTemplate(event.templateId, event);
  const onFitRef = useRef(onFit);
  onFitRef.current = onFit;

  const run = useCallback(() => {
    const host = hostRef.current;
    const root = host?.firstElementChild as HTMLElement | null;
    // Geometry is read on screen; a preview scaled to nothing (not yet laid out) can't be measured.
    if (!host || !root || root.getBoundingClientRect().width === 0) return;
    const unit = canvasUnit(format);
    const slack = Math.max(2, unit);
    const overflowing = () => overflowingRegions(root, format.safeZone, slack);
    const result = fitText({
      slots: manifest.slots,
      unit,
      apply: (sizes) => {
        for (const name of SLOT_HIERARCHY) host.style.setProperty(`--fs-${name}`, `${sizes[name]}px`);
      },
      overflowing: () => [...new Set(overflowing().flatMap((o) => slotsIn(o.region)))],
    });

    const regions = overflowing();
    // Report the innermost regions; the root only when nothing inside it overflows.
    const specific = regions.filter((o) => o.region !== root);
    const problems = (specific.length ? specific : regions)
      .map(describe)
      .filter((p): p is FitProblem => p !== null);
    const sizesU = Object.fromEntries(
      SLOT_HIERARCHY.map((name) => [name, Math.round((result.sizes[name] / unit) * 100) / 100]),
    ) as SlotSizes;
    onFitRef.current?.({ formatId: format.id, fits: result.fits, sizesU, problems });
  }, [manifest, format]);

  useLayoutEffect(run, [run, event, theme]);

  // Fonts and images can change layout after the first pass.
  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) run();
    });
    return () => {
      cancelled = true;
    };
  }, [run]);

  return (
    <div
      ref={hostRef}
      className="tpl-host"
      data-template={manifest.id}
      style={{ width: format.width, height: format.height }}
      onLoadCapture={run}
    >
      <Component event={event} theme={theme} format={format} />
    </div>
  );
}
