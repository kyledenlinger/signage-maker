import { MIN_FONT_U } from '../../config/limits';
import { COMMON_FIELDS, PHOTO_FIELDS } from '../shared/fields';
import type { TemplateManifest } from '../types';

export const showcaseManifest: TemplateManifest = {
  id: 'showcase',
  name: 'Showcase',
  description:
    'Modeled on current ZSR signage: big title, large date block, QR tile, details column, logo bottom-left, optional illustration or photo.',
  orientations: ['landscape', 'portrait', 'square'],
  usesFields: [...COMMON_FIELDS, ...PHOTO_FIELDS, 'illustration', 'background', 'backgroundFocus'],
  slots: {
    title: { minU: MIN_FONT_U.title, maxU: 13 },
    date: { minU: MIN_FONT_U.primary, maxU: 10 },
    timeLocation: { minU: MIN_FONT_U.primary, maxU: 6 },
    body: { minU: MIN_FONT_U.body, maxU: 4.2 },
    smallPrint: { minU: MIN_FONT_U.smallPrint, maxU: 2.4 },
  },
  showsDescription: { landscape: false, portrait: true, square: false },
  autoDateStyle: { landscape: 'inline', portrait: 'stacked', square: 'stacked' },
};

/** Layout proportions, in canvas units or grid fractions. */
export const SHOWCASE_LAYOUT = {
  qrU: 16,
  /** Landscape: title spans the first two columns (~60% width). */
  landscapeColumns: '3fr 3fr 4fr',
  portraitColumns: '35fr 35fr 30fr',
  squareColumns: '30fr 40fr 30fr',
};
