import { describe, expect, it } from 'vitest';
import { MIN_FONT_U } from '../config/limits';
import { TEMPLATES } from './registry';
import { SLOT_HIERARCHY } from './types';

const FLOOR = {
  title: MIN_FONT_U.title,
  date: MIN_FONT_U.primary,
  timeLocation: MIN_FONT_U.primary,
  body: MIN_FONT_U.body,
  smallPrint: MIN_FONT_U.smallPrint,
};

describe.each(TEMPLATES.map((t) => t.manifest))('template $name', (manifest) => {
  it('supports all three orientation classes', () => {
    expect(manifest.orientations.sort()).toEqual(['landscape', 'portrait', 'square']);
  });

  it('never sets a slot minimum below the readability floor', () => {
    for (const name of SLOT_HIERARCHY) {
      expect(manifest.slots[name].minU, name).toBeGreaterThanOrEqual(FLOOR[name]);
      expect(manifest.slots[name].maxU, name).toBeGreaterThanOrEqual(manifest.slots[name].minU);
    }
  });

  it('keeps the size hierarchy at max size', () => {
    for (let i = 1; i < SLOT_HIERARCHY.length; i++) {
      expect(manifest.slots[SLOT_HIERARCHY[i]].maxU).toBeLessThanOrEqual(manifest.slots[SLOT_HIERARCHY[i - 1]].maxU);
    }
  });
});
