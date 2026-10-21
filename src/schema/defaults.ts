import { DEFAULT_FORMAT_IDS } from '../config/formats';
import { DEFAULT_ACCOMMODATIONS } from '../config/limits';
import { DEFAULT_THEME_ID } from '../config/themes';
import { DEFAULT_TEMPLATE_ID } from '../templates/registry';
import type { EventData } from './event';

export function blankEvent(formatIds: string[] = DEFAULT_FORMAT_IDS): EventData {
  return {
    title: '',
    subtitle: '',
    date: '',
    dateStyle: 'auto',
    startTime: '',
    endTime: '',
    recurringNote: '',
    location: '',
    description: '',
    highlights: [],
    callToAction: '',
    url: '',
    displayUrl: '',
    showQr: true,
    image: null,
    imageFocus: { x: 0.5, y: 0.5 },
    imageDescription: '',
    imageCredit: '',
    illustration: null,
    showLockup: true,
    logos: [],
    showAccommodations: true,
    accommodations: DEFAULT_ACCOMMODATIONS,
    templateId: DEFAULT_TEMPLATE_ID,
    themeId: DEFAULT_THEME_ID,
    formatIds,
  };
}

/** Sample event modeled on the Halloween Game Night set. Also the test fixture. */
export function sampleEvent(formatIds: string[] = DEFAULT_FORMAT_IDS): EventData {
  return {
    ...blankEvent(formatIds),
    title: 'Halloween Game Night',
    subtitle: 'A spooky night in the stacks',
    date: '2026-10-23',
    startTime: '19:00',
    endTime: '22:00',
    location: 'ZSR Library Atrium',
    description: 'Board games, card games and a costume contest. Come for an hour or stay all night.',
    highlights: ['Games', 'Pizza', 'Candy', 'Tarot Reading', 'Prizes & More!'].map((value) => ({ value })),
    callToAction: 'Free and open to all',
    url: 'https://zsr.wfu.edu/events',
  };
}
