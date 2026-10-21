import { describe, expect, it } from 'vitest';
import { blankEvent, sampleEvent } from '../schema/defaults';
import { duplicateEvent, parseProject, parseProjectText, projectJson, toProjectFile } from './project';

const logo = { name: 'logo.png', dataUrl: 'data:image/png;base64,AAAA', width: 10, height: 5, originalLongEdge: 10 };

describe('project files', () => {
  it('round-trip an event exactly', () => {
    const event = { ...sampleEvent(), logos: [logo], imageFocus: { x: 0.25, y: 0.75 } };
    const parsed = parseProjectText(projectJson(event));
    expect(parsed).toEqual({ ok: true, event, customFormats: [] });
  });

  it('keep over-limit text instead of cutting it', () => {
    const title = 'x'.repeat(80);
    const parsed = parseProject(toProjectFile({ ...sampleEvent(), title }));
    expect(parsed.ok && parsed.event.title).toBe(title);
  });

  it('drop fields with the wrong type and fall back to blank values', () => {
    const file = JSON.parse(projectJson(sampleEvent()));
    file.event.title = 42;
    file.event.image = { dataUrl: 'javascript:alert(1)', width: 1, height: 1, name: 'x', originalLongEdge: 1 };
    file.event.highlights = ['not an object', { value: 'Pizza' }];
    file.event.imageFocus = { x: 3, y: 0 };
    file.event.dateStyle = 'sideways';
    const parsed = parseProject(file);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.event.title).toBe('');
    expect(parsed.event.image).toBeNull();
    expect(parsed.event.highlights).toEqual([{ value: 'Pizza' }]);
    expect(parsed.event.imageFocus).toEqual({ x: 0.5, y: 0.5 });
    expect(parsed.event.dateStyle).toBe('auto');
  });

  it('reject files that are not projects', () => {
    expect(parseProjectText('not json')).toMatchObject({ ok: false });
    expect(parseProject({ kind: 'something-else', event: {} })).toMatchObject({ ok: false });
    expect(parseProject({ ...toProjectFile(sampleEvent()), version: 99 })).toMatchObject({
      ok: false,
      error: expect.stringContaining('newer version'),
    });
  });
});

describe('duplicateEvent', () => {
  it('keeps the series setup and clears the event details', () => {
    const event = { ...sampleEvent(), templateId: 'band', themeId: 'light', logos: [logo], accommodations: 'Email us' };
    const copy = duplicateEvent(event);
    expect(copy).toMatchObject({ templateId: 'band', themeId: 'light', logos: [logo], accommodations: 'Email us' });
    expect(copy).toMatchObject({ title: '', date: '', location: '', highlights: [], image: null, url: '' });
    expect(copy.formatIds).toEqual(event.formatIds);
    expect(Object.keys(copy).sort()).toEqual(Object.keys(blankEvent()).sort());
  });
});
