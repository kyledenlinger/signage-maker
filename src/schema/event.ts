import { z } from 'zod';
import { FIELD_LIMITS, MAX_HIGHLIGHTS, MAX_LOGOS, type CharLimit } from '../config/limits';
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

export const eventSchema = z
  .object({
    title: required(FIELD_LIMITS.title, 'Title'),
    subtitle: text(FIELD_LIMITS.subtitle),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date is required.'),
    dateStyle: z.enum(['auto', 'inline', 'stacked']),
    startTime: z.string().regex(/^\d{2}:\d{2}/, 'Start time is required.'),
    endTime: z.string(),
    recurringNote: text(FIELD_LIMITS.recurringNote),
    location: required(FIELD_LIMITS.location, 'Location'),
    description: text(FIELD_LIMITS.description),
    highlights: z
      .array(z.object({ value: text(FIELD_LIMITS.highlight) }))
      .max(MAX_HIGHLIGHTS, `Use up to ${MAX_HIGHLIGHTS} highlights.`),
    callToAction: text(FIELD_LIMITS.callToAction),
    url: z
      .string()
      .refine(
        (v) => v.trim() === '' || normalizeUrl(v) !== null,
        'Enter a web address like zsr.wfu.edu/events.',
      ),
    displayUrl: text(FIELD_LIMITS.displayUrl),
    showQr: z.boolean(),
    image: imageAssetSchema.nullable(),
    /** Point to keep in view when the photo is cropped, 0–1 from the left and top. */
    imageFocus: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }),
    imageDescription: text(FIELD_LIMITS.imageDescription),
    imageCredit: text(FIELD_LIMITS.imageCredit),
    illustration: imageAssetSchema.nullable(),
    showLockup: z.boolean(),
    logos: z.array(imageAssetSchema).max(MAX_LOGOS, `Use up to ${MAX_LOGOS} logos.`),
    showAccommodations: z.boolean(),
    accommodations: text(FIELD_LIMITS.accommodations),
    templateId: z.string().min(1, 'Choose a template.'),
    themeId: z.string().min(1, 'Choose a theme.'),
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
    if (e.image && e.imageDescription.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['imageDescription'],
        message: 'Describe the image (used for alt text).',
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
  'startTime',
  'endTime',
  'recurringNote',
  'location',
  'description',
  'highlights',
  'callToAction',
  'url',
  'displayUrl',
  'showQr',
  'image',
  'imageFocus',
  'imageDescription',
  'imageCredit',
  'illustration',
  'showLockup',
  'logos',
  'showAccommodations',
  'accommodations',
  'templateId',
  'themeId',
  'formatIds',
];
