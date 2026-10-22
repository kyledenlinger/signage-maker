import { MIN_FONT_U } from '../../config/limits';
import type { OrientationClass } from '../../config/formats';
import { COMMON_FIELDS, PHOTO_FIELDS } from '../shared/fields';
import type { TemplateManifest } from '../types';

export const splitManifest: TemplateManifest = {
  id: 'split',
  name: 'Split',
  description: 'Photo on one side, solid text panel on the other. Without a photo, the panel fills with an accent bar.',
  orientations: ['landscape', 'portrait', 'square'],
  usesFields: [...COMMON_FIELDS, ...PHOTO_FIELDS],
  needsImage: true,
  slots: {
    title: { minU: MIN_FONT_U.title, maxU: 12 },
    date: { minU: MIN_FONT_U.primary, maxU: 8 },
    timeLocation: { minU: MIN_FONT_U.primary, maxU: 5.5 },
    body: { minU: MIN_FONT_U.body, maxU: 4 },
    smallPrint: { minU: MIN_FONT_U.smallPrint, maxU: 2.4 },
  },
  showsDescription: { landscape: false, portrait: true, square: false },
  autoDateStyle: { landscape: 'inline', portrait: 'inline', square: 'inline' },
};

export const SPLIT_LAYOUT = {
  qrU: 14,
  /** Share of the canvas the photo takes: width on landscape, at most this height otherwise. */
  photoShare: { landscape: '50%', portrait: '45%', square: '50%' } satisfies Record<OrientationClass, string>,
};
