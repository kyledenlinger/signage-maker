import type { OrientationClass } from './formats';

export interface CharLimit {
  /** Over this count shows a readability warning. */
  recommended?: number;
  /** Hard cap: over this blocks export. */
  max: number;
}

export const FIELD_LIMITS = {
  title: { recommended: 40, max: 60 },
  subtitle: { recommended: 60, max: 90 },
  recurringNote: { recommended: 30, max: 40 },
  location: { recommended: 40, max: 60 },
  description: { recommended: 120, max: 180 },
  callToAction: { recommended: 25, max: 35 },
  displayUrl: { max: 40 },
  imageDescription: { max: 150 },
  imageCredit: { max: 60 },
  accommodations: { max: 120 },
  highlight: { max: 25 },
} satisfies Record<string, CharLimit>;

export const MAX_HIGHLIGHTS = 6;
export const MAX_LOGOS = 3;

/** Minimum rendered text size in canvas units (u = 1% of the shorter edge). */
export const MIN_FONT_U = {
  title: 7,
  primary: 4, // date, time, location
  body: 2.5,
  smallPrint: 2, // credit, accommodations
};

export const LINE_HEIGHT = {
  display: 1.15,
  body: 1.35,
};

export const TITLE_MAX_CHARS_PER_LINE: Record<OrientationClass, number> = {
  landscape: 40,
  portrait: 25,
  square: 25,
};

export const CONTRAST_MIN = {
  text: 4.5,
  smallPrint: 7,
};

export const IMAGE_PX = {
  warnBelow: 1920,
  blockBelowForHiRes: 1000,
  downscaleAbove: 4000,
  /** Formats with a long edge at least this big count as high-res, like print presets. */
  hiResFormatEdge: 3840,
};

export const QR_RULES = {
  errorCorrectionLevel: 'M' as const,
  quietZoneModules: 4,
  minScreenFraction: 0.12, // of the shorter edge
  minPrintInches: 1.25,
};

/** "Too much to read in a 10-second slot" on landscape and square. */
export const GLANCE_WORD_LIMIT = 35;

export const PREVIEW_DEBOUNCE_MS = 150;

export const DEFAULT_ACCOMMODATIONS = 'Accessibility requests: [email]';
