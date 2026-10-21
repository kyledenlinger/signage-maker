import { MIN_FONT_U } from '../../config/limits';
import type { OrientationClass } from '../../config/formats';
import { COMMON_FIELDS, PHOTO_FIELDS } from '../shared/fields';
import type { TemplateManifest } from '../types';

export const bandManifest: TemplateManifest = {
  id: 'band',
  name: 'Band',
  description: 'Full-bleed photo with a solid text band across the bottom. Without a photo, the band is the whole layout.',
  orientations: ['landscape', 'portrait', 'square'],
  usesFields: [...COMMON_FIELDS, ...PHOTO_FIELDS],
  slots: {
    title: { minU: MIN_FONT_U.title, maxU: 11 },
    date: { minU: MIN_FONT_U.primary, maxU: 7 },
    timeLocation: { minU: MIN_FONT_U.primary, maxU: 5 },
    body: { minU: MIN_FONT_U.body, maxU: 3.6 },
    smallPrint: { minU: MIN_FONT_U.smallPrint, maxU: 2.3 },
  },
  showsDescription: { landscape: false, portrait: true, square: false },
  autoDateStyle: { landscape: 'inline', portrait: 'inline', square: 'inline' },
};

export const BAND_LAYOUT = {
  qrU: 13,
  /** Minimum height of the text band when there is a photo. It grows into the photo when the text needs room. */
  bandHeight: { landscape: '40%', portrait: '55%', square: '50%' } satisfies Record<OrientationClass, string>,
};
