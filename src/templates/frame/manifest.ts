import { MIN_FONT_U } from '../../config/limits';
import type { OrientationClass } from '../../config/formats';
import { COMMON_FIELDS, PHOTO_FIELDS } from '../shared/fields';
import type { TemplateManifest } from '../types';

export const frameManifest: TemplateManifest = {
  id: 'frame',
  name: 'Frame',
  description: 'Photo inset with a theme-colored border, text beside or below it. Without a photo, uses Type only.',
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
  fallbackWithoutImage: 'type-only',
};

export const FRAME_LAYOUT = {
  qrU: 13,
  borderU: 1.2,
  /** Photo share: width on landscape, at most this height otherwise. */
  photoShare: { landscape: '45%', portrait: '40%', square: '40%' } satisfies Record<OrientationClass, string>,
};
