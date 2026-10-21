import { describe, expect, it } from 'vitest';
import { cleanUrl, formatDateInline, formatDateStacked, formatTimeRange, normalizeUrl, slugify } from './format';

describe('dates', () => {
  it('formats inline and stacked, with the weekday short by default', () => {
    expect(formatDateInline('2025-11-06')).toBe('Thu, Nov 6');
    expect(formatDateInline('2025-11-06', 'long')).toBe('Thursday, Nov 6');
    expect(formatDateInline('2025-11-06', 'none')).toBe('Nov 6');
    expect(formatDateStacked('2026-10-23')).toEqual({ weekday: 'Fri', day: '23', month: 'Oct' });
    expect(formatDateStacked('2026-10-23', 'long')).toEqual({ weekday: 'Friday', day: '23', month: 'Oct' });
    expect(formatDateStacked('2026-10-23', 'none')).toEqual({ weekday: '', day: '23', month: 'Oct' });
    expect(formatDateInline('')).toBe('');
  });
});

describe('AP-style times', () => {
  it.each([
    ['16:00', '17:30', '4–5:30 p.m.'],
    ['11:00', '13:00', '11 a.m.–1 p.m.'],
    ['10:00', '12:00', '10 a.m.–noon'],
    ['12:00', '14:00', 'noon–2 p.m.'],
    ['19:00', '', '7 p.m.'],
    ['09:30', '10:15', '9:30–10:15 a.m.'],
  ])('%s to %s', (start, end, expected) => {
    expect(formatTimeRange(start, end)).toBe(expected);
  });
});

describe('urls', () => {
  it('normalizes and cleans', () => {
    expect(normalizeUrl('zsr.wfu.edu/events')).toBe('https://zsr.wfu.edu/events');
    expect(normalizeUrl('not a url')).toBeNull();
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(cleanUrl('https://zsr.wfu.edu/events/')).toBe('zsr.wfu.edu/events');
  });
});

describe('slugify', () => {
  it('makes filename-safe slugs', () => {
    expect(slugify('Banned Books Week')).toBe('banned-books-week');
    expect(slugify('Café & Crêpes!')).toBe('cafe-and-crepes');
    expect(slugify('!!!')).toBe('event');
  });
});
