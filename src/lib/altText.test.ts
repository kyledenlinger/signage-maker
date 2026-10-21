import { describe, expect, it } from 'vitest';
import { sampleEvent } from '../schema/defaults';
import { exportAltText } from './altText';

describe('exportAltText', () => {
  it('reads as sentences built from the event fields', () => {
    expect(exportAltText(sampleEvent())).toBe(
      'Event sign: Halloween Game Night, Fri, Oct 23, 7–10 p.m., ZSR Library Atrium. A spooky night in the stacks. Free and open to all. More at zsr.wfu.edu/events.',
    );
  });

  it('adds the photo description when there is a photo', () => {
    const image = { name: 'a.png', dataUrl: 'data:', width: 1, height: 1, originalLongEdge: 1 };
    const alt = exportAltText({ ...sampleEvent(), image, imageDescription: 'Students playing chess', callToAction: 'Register now!' });
    expect(alt).toContain('Register now! More at');
    expect(alt.endsWith('Photo: Students playing chess.')).toBe(true);
  });

  it('calls an illustration an illustration', () => {
    const image = { name: 'a.svg', dataUrl: 'data:image/svg+xml,', width: 1, height: 1, originalLongEdge: 1 };
    const alt = exportAltText({ ...sampleEvent(), image, imageKind: 'illustration', imageDescription: 'A pumpkin' });
    expect(alt.endsWith('Illustration: A pumpkin.')).toBe(true);
  });
});
