import { describe, expect, it } from 'vitest';
import { blankEvent, sampleEvent } from '../schema/defaults';
import type { EventData } from '../schema/event';
import { blockersFor, getProblems } from './problems';
import { parseProject, projectJson } from './project';

/** The sample event with the default accommodations placeholder filled in. */
const ready = (extra: Partial<EventData> = {}): EventData => ({
  ...sampleEvent(),
  accommodations: 'Accessibility requests: zsr@example.edu',
  ...extra,
});

const blockers = (event: EventData) => getProblems(event).filter((p) => p.severity === 'blocker');

describe('getProblems', () => {
  it('finds nothing blocking in a complete event', () => {
    expect(blockers(ready())).toEqual([]);
  });

  it('blocks on the [email] placeholder the default accommodations line ships with', () => {
    expect(blockers(sampleEvent())).toEqual([
      expect.objectContaining({
        fieldId: 'field-accommodations',
        message: 'The accommodations line still says [email].',
        actionLabel: 'Replace it',
      }),
    ]);
    // Turned off, it doesn't print, so it doesn't block.
    expect(blockers({ ...sampleEvent(), showAccommodations: false })).toEqual([]);
  });

  it('blocks on placeholders in any text, including highlights', () => {
    const found = blockers(ready({ location: 'Room [TBD]', highlights: [{ value: '[prize]' }] }));
    expect(found.map((p) => p.message)).toEqual(['The location still says [TBD].', 'The highlight 1 still says [prize].']);
  });

  it('lists every required field, with an action and the field to jump to', () => {
    const found = blockers({ ...blankEvent(), accommodations: 'Email us', formatIds: [] });
    expect(found.map((p) => [p.fieldId, p.message, p.actionLabel])).toEqual([
      ['field-title', 'Title is required.', 'Add a title'],
      ['field-date', 'Date is required.', 'Pick a date'],
      ['field-startTime', 'Start time is required.', 'Add a start time'],
      ['field-location', 'Location is required.', 'Add a location'],
      ['field-formatIds', 'No formats are selected.', 'Choose a format'],
    ]);
  });

  it('enforces every character limit', () => {
    const over = (n: number) => 'x'.repeat(n + 1);
    const event = ready({
      title: over(60),
      subtitle: over(90),
      recurringNote: over(40),
      location: over(60),
      description: over(180),
      callToAction: over(35),
      displayUrl: over(40),
      accommodations: over(120),
      highlights: [{ value: over(25) }],
    });
    const messages = blockers(event).map((p) => p.message);
    for (const [name, max] of [
      ['Title', 60],
      ['Subtitle', 90],
      ['Multi-day or recurring note', 40],
      ['Location', 60],
      ['Description', 180],
      ['Highlight 1', 25],
      ['Call to action', 35],
      ['Display URL', 40],
      ['Accommodations line', 120],
    ] as const) {
      expect(messages).toContain(`${name} is ${max + 1} characters; the limit is ${max}.`);
    }
    expect(blockers(ready({ highlights: Array.from({ length: 7 }, () => ({ value: 'a' })) })).map((p) => p.message)).toContain(
      'There are more than 6 highlights.',
    );
  });

  it('keeps readability advice as warnings, after the blockers', () => {
    const problems = getProblems({ ...sampleEvent(), title: 'HALLOWEEN GAME NIGHT' });
    expect(problems[0].severity).toBe('blocker');
    expect(problems.find((p) => p.message === 'Title: written in all caps.')).toMatchObject({ severity: 'warning' });
  });

  it('scopes format-specific blockers to their format', () => {
    const image = { name: 'a.png', dataUrl: 'data:image/png;base64,', width: 900, height: 600, originalLongEdge: 900 };
    const problems = getProblems(ready({ templateId: 'split', image, imageDescription: 'A photo' }));
    expect(blockersFor(problems, 'landscape-hd')).toEqual([]);
    expect(blockersFor(problems, 'letter-poster').map((p) => p.message)).toEqual([
      'Letter poster · Photo or illustration: 900 px is too small for this size.',
    ]);
  });

  it('flags a project saved with the placeholder when it is opened', () => {
    const parsed = parseProject(JSON.parse(projectJson(sampleEvent())));
    expect(parsed.ok && blockers(parsed.event).map((p) => p.id)).toEqual(['placeholder:accommodations']);
  });
});
