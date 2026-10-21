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
  'lockupId',
  'lockupOrientation',
  'lockupColorway',
  'logos',
  'showAccommodations',
  'accommodations',
];

/** The featured image (photo or illustration) and its details. */
export const PHOTO_FIELDS: (keyof EventData)[] = ['image', 'imageKind', 'imageFocus', 'imageDescription', 'imageCredit'];
