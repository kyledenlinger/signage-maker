import type { EventData } from '../../schema/event';

/** Optional fields that every template shows. */
export const COMMON_FIELDS: (keyof EventData)[] = [
  'subtitle',
  'recurringNote',
  'dateStyle',
  'weekdayStyle',
  'endTime',
  'description',
  'highlights',
  'highlightStyle',
  'callToAction',
  'url',
  'displayUrl',
  'showQr',
  'showLockup',
  'logos',
  'showAccommodations',
  'accommodations',
];

export const PHOTO_FIELDS: (keyof EventData)[] = ['image', 'imageFocus', 'imageDescription', 'imageCredit'];
