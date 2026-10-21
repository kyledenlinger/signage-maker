import { MIN_FONT_U } from '../../config/limits';
import type { OrientationClass } from '../../config/formats';
import type { TemplateManifest } from '../types';

export const showcaseManifest: TemplateManifest = {
  id: 'showcase',
  name: 'Showcase',
  description:
    'Modeled on current ZSR signage: big title, large date block, QR tile, details column, logo bottom-left, optional illustration.',
  orientations: ['landscape', 'portrait', 'square'],
  usesFields: [
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
    'imageCredit',
    'illustration',
    'showLockup',
    'logos',
    'showAccommodations',
    'accommodations',
  ],
  slots: {
    title: { minU: MIN_FONT_U.title, maxU: 11 },
    date: { minU: MIN_FONT_U.primary, maxU: 9 },
    timeLocation: { minU: MIN_FONT_U.primary, maxU: 5 },
    body: { minU: MIN_FONT_U.body, maxU: 3.5 },
    smallPrint: { minU: MIN_FONT_U.smallPrint, maxU: 2.2 },
  },
};

/** Layout proportions, all in canvas units or grid fractions. */
export const SHOWCASE_LAYOUT = {
  gapU: 3,
  qrU: 16,
  logoHeightU: 6,
  /** Month under the stacked day number, relative to the date size. */
  stackedMonthScale: 0.6,
  tile: { radiusU: 1.5, paddingU: 0.8, borderU: 0.4 },
  /** Landscape: title spans the first two columns (~60% width). */
  landscapeColumns: '3fr 3fr 4fr',
  portraitColumns: '35fr 35fr 30fr',
  showDescription: { landscape: false, portrait: true, square: false } satisfies Record<OrientationClass, boolean>,
  /** Date style used when the form says "auto". */
  autoDateStyle: { landscape: 'inline', portrait: 'stacked', square: 'inline' } satisfies Record<
    OrientationClass,
    'inline' | 'stacked'
  >,
};
