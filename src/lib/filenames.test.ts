import { describe, expect, it } from 'vitest';
import { findFormat } from '../config/formats';
import { exportFileName, zipFileName } from './filenames';
import { projectFileName, toProjectFile } from './project';
import { sampleEvent } from '../schema/defaults';

describe('file names', () => {
  it('follow the spec convention', () => {
    expect(exportFileName({ title: 'Banned Books Week' }, findFormat('landscape-hd')!, 'png')).toBe(
      'banned-books-week_landscape-hd_1920x1080.png',
    );
    expect(exportFileName({ title: 'Banned Books Week' }, findFormat('letter-poster')!, 'pdf')).toBe(
      'banned-books-week_letter-poster_2550x3300.pdf',
    );
    expect(zipFileName({ title: 'Banned Books Week' })).toBe('banned-books-week_signage.zip');
    expect(projectFileName({ title: 'Banned Books Week' })).toBe('banned-books-week.signage.json');
  });

  it('fall back to "event" when there is no title', () => {
    expect(exportFileName({ title: '' }, findFormat('square')!, 'jpg')).toBe('event_square_1080x1080.jpg');
  });
});

describe('project file', () => {
  it('wraps the event with a kind and version', () => {
    const file = toProjectFile(sampleEvent(), [], new Date('2026-10-21T12:00:00Z'));
    expect(file).toMatchObject({ kind: 'zsr-signage-project', version: 1, savedAt: '2026-10-21T12:00:00.000Z' });
    expect(file.event.title).toBe('Halloween Game Night');
  });
});
