import { MIN_FONT_U } from '../../config/limits';
import { COMMON_FIELDS } from '../shared/fields';
import type { TemplateManifest } from '../types';

export const typeOnlyManifest: TemplateManifest = {
  id: 'type-only',
  name: 'Type only',
  description: 'No image. A large title on solid color with the details in a column.',
  orientations: ['landscape', 'portrait', 'square'],
  usesFields: COMMON_FIELDS,
  slots: {
    title: { minU: MIN_FONT_U.title, maxU: 15 },
    date: { minU: MIN_FONT_U.primary, maxU: 10 },
    timeLocation: { minU: MIN_FONT_U.primary, maxU: 6.5 },
    body: { minU: MIN_FONT_U.body, maxU: 4.5 },
    smallPrint: { minU: MIN_FONT_U.smallPrint, maxU: 2.6 },
  },
  showsDescription: { landscape: false, portrait: true, square: false },
  autoDateStyle: { landscape: 'inline', portrait: 'inline', square: 'inline' },
};

export const TYPE_ONLY_LAYOUT = {
  qrU: 16,
};
