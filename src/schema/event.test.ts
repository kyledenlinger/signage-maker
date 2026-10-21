import { describe, expect, it } from 'vitest';
import { FIELD_LIMITS } from '../config/limits';
import { blankEvent, sampleEvent } from './defaults';
import { eventSchema } from './event';

function issuesFor(data: unknown) {
  const result = eventSchema.safeParse(data);
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'));
}

describe('event schema', () => {
  it('accepts the sample event', () => {
    expect(issuesFor(sampleEvent())).toEqual([]);
  });

  it('requires title, date, start time and location', () => {
    expect(issuesFor(blankEvent())).toEqual(expect.arrayContaining(['title', 'date', 'startTime', 'location']));
  });

  it('enforces hard caps at the configured max', () => {
    const atMax = { ...sampleEvent(), title: 'x'.repeat(FIELD_LIMITS.title.max) };
    const over = { ...sampleEvent(), title: 'x'.repeat(FIELD_LIMITS.title.max + 1) };
    expect(issuesFor(atMax)).toEqual([]);
    expect(issuesFor(over)).toEqual(['title']);
  });

  it('caps highlights at 6 items of 25 characters', () => {
    const many = { ...sampleEvent(), highlights: Array.from({ length: 7 }, () => ({ value: 'a' })) };
    expect(issuesFor(many)).toEqual(['highlights']);
    const long = { ...sampleEvent(), highlights: [{ value: 'x'.repeat(26) }] };
    expect(issuesFor(long)).toEqual(['highlights.0.value']);
  });

  it('requires a description for a photo, not for an illustration', () => {
    const image = { name: 'a.jpg', dataUrl: 'data:', width: 10, height: 10, originalLongEdge: 10 };
    expect(issuesFor({ ...sampleEvent(), image })).toEqual(['imageDescription']);
    expect(issuesFor({ ...sampleEvent(), image, imageKind: 'illustration' })).toEqual([]);
  });

  it('rejects an end time before the start time and a bad URL', () => {
    expect(issuesFor({ ...sampleEvent(), endTime: '18:00' })).toEqual(['endTime']);
    expect(issuesFor({ ...sampleEvent(), url: 'nope' })).toEqual(['url']);
  });

  it('requires at least one format', () => {
    expect(issuesFor({ ...sampleEvent(), formatIds: [] })).toEqual(['formatIds']);
  });
});
