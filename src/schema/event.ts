import { z } from 'zod';
import { FIELD_LIMITS, MAX_HIGHLIGHTS, MAX_LOGOS, type CharLimit } from '../config/limits';
import { THEME_COLOR_KEYS } from '../config/themes';
import { normalizeUrl } from '../lib/format';

function text(limit: CharLimit) {
  return z
    .string()
    .max(limit.max, `Keep this to ${limit.max} characters or fewer (export is blocked until it fits).`);
}

function required(limit: CharLimit, label: string) {
  return text(limit).refine((v) => v.trim().length > 0, `${label} is required.`);
}

export const imageAssetSchema = z.object({
  name: z.string(),
  dataUrl: z.string(),
  width: z.number(),
  height: z.number(),
  /** Long edge of the file as uploaded, before any downscaling. */
  originalLongEdge: z.number(),
});
export type ImageAsset = z.infer<typeof imageAssetSchema>;

const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
export const themeColorsSchema = z.object({
  ...(Object.fromEntries(THEME_COLOR_KEYS.map((k) => [k, hex])) as Record<(typeof THEME_COLOR_KEYS)[number], typeof hex>),
  logoVariant: z.enum(['light', 'dark']),
});

export const imagePalettesSchema = z.object({
  light: themeColorsSchema,
  dark: themeColorsSchema,
  contrast: themeColorsSchema,
});

const focusSchema = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) });

export const eventSchema = z
  .object({
    title: required(FIELD_LIMITS.title, 'Title'),
    subtitle: text(FIELD_LIMITS.subtitle),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date is required.'),
    dateStyle: z.enum(['auto', 'inline', 'stacked']),
    weekdayStyle: z.enum(['short', 'long', 'none']),
    startTime: z.string().regex(/^\d{2}:\d{2}/, 'Start time is required.'),
    endTime: z.string(),
    recurringNote: text(FIELD_LIMITS.recurringNote),
    location: required(FIELD_LIMITS.location, 'Location'),
    description: text(FIELD_LIMITS.description),
    highlights: z
      .array(z.object({ value: text(FIELD_LIMITS.highlight) }))
      .max(MAX_HIGHLIGHTS, `Use up to ${MAX_HIGHLIGHTS} highlights.`),
    /** How highlights stand out from the other details. */
    highlightStyle: z.enum(['bold-color', 'bold', 'color']),
    callToAction: text(FIELD_LIMITS.callToAction),
    url: z
      .string()
      .refine(
        (v) => v.trim() === '' || normalizeUrl(v) !== null,
        'Enter a web address like zsr.wfu.edu/events.',
      ),
    displayUrl: text(FIELD_LIMITS.displayUrl),
    showQr: z.boolean(),
    /** The featured image: a photo or an illustration. */
    image: imageAssetSchema.nullable(),
    /** A photo fills its space, cropped around imageFocus; an illustration is shown whole. */
    imageKind: z.enum(['photo', 'illustration']),
    /** Point to keep in view when the photo is cropped, 0–1 from the left and top. */
    imageFocus: focusSchema,
    imageDescription: text(FIELD_LIMITS.imageDescription),
    imageCredit: text(FIELD_LIMITS.imageCredit),
    /** Fills the canvas behind the text panels. Decorative. */
    background: imageAssetSchema.nullable(),
    backgroundFocus: focusSchema,
    showLockup: z.boolean(),
    logos: z.array(imageAssetSchema).max(MAX_LOGOS, `Use up to ${MAX_LOGOS} logos.`),
    showAccommodations: z.boolean(),
    accommodations: text(FIELD_LIMITS.accommodations),
    templateId: z.string().min(1, 'Choose a template.'),
    themeId: z.string().min(1, 'Choose a theme.'),
    /** Font ids from config/fonts.ts. */
    fontTitle: z.string(),
    fontBody: z.string(),
    /** Light, dark and high-contrast colors for the "Match my images" themes, built from the images. */
    imagePalettes: imagePalettesSchema.nullable(),
    formatIds: z.array(z.string()).min(1, 'Choose at least one format.'),
  })
  .superRefine((e, ctx) => {
    if (e.endTime && e.startTime && e.endTime <= e.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'End time must be after the start time.',
      });
    }
    if (e.image && e.imageKind === 'photo' && e.imageDescription.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['imageDescription'],
        message: 'Describe the photo (used for alt text).',
      });
    }
    if (e.showAccommodations && e.accommodations.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['accommodations'],
        message: 'Enter the accommodations line, or turn it off.',
      });
    }
  });

export type EventData = z.infer<typeof eventSchema>;

/** The on-screen order of fields, used for the error summary. */
export const FIELD_ORDER: (keyof EventData)[] = [
  'title',
  'subtitle',
  'date',
  'dateStyle',
  'weekdayStyle',
  'startTime',
  'endTime',
  'recurringNote',
  'location',
  'description',
  'highlights',
  'highlightStyle',
  'callToAction',
  'url',
  'displayUrl',
  'showQr',
  'image',
  'imageKind',
  'imageFocus',
  'imageDescription',
  'imageCredit',
  'background',
  'backgroundFocus',
  'showLockup',
  'logos',
  'showAccommodations',
  'accommodations',
  'templateId',
  'themeId',
  'fontTitle',
  'fontBody',
  'imagePalettes',
  'formatIds',
];
