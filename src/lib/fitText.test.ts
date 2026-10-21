import { describe, expect, it } from 'vitest';
import type { SlotName, TextSlot } from '../templates/types';
import { enforceHierarchy, fitText, type SlotSizes } from './fitText';

const slots: Record<SlotName, TextSlot> = {
  title: { minU: 7, maxU: 12 },
  date: { minU: 4, maxU: 8 },
  timeLocation: { minU: 4, maxU: 5 },
  body: { minU: 2.5, maxU: 4 },
  smallPrint: { minU: 2, maxU: 2.4 },
};

/** A fake layout: text "needs" a total size budget; anything above it overflows. */
function fakeLayout(budget: number, overflowSlots: SlotName[] = ['title', 'body']) {
  let applied: SlotSizes | null = null;
  return {
    apply: (s: SlotSizes) => {
      applied = { ...s };
    },
    overflowing: () => {
      const total = Object.values(applied!).reduce((a, b) => a + b, 0);
      return total > budget ? overflowSlots : [];
    },
    applied: () => applied!,
  };
}

describe('fitText', () => {
  it('keeps max sizes when everything fits', () => {
    const layout = fakeLayout(1000);
    const result = fitText({ slots, unit: 10, ...layout });
    expect(result.fits).toBe(true);
    expect(result.sizes.title).toBe(120);
    expect(result.sizes.body).toBe(40);
  });

  it('shrinks only the overflowing slots, and only as far as needed', () => {
    const layout = fakeLayout(290);
    const result = fitText({ slots, unit: 10, ...layout });
    expect(result.fits).toBe(true);
    expect(result.sizes.title).toBeLessThan(120);
    expect(result.sizes.title).toBeGreaterThan(90);
    expect(result.sizes.date).toBe(80);
  });

  it('never goes below the floor, and reports that it does not fit', () => {
    const layout = fakeLayout(10);
    const result = fitText({ slots, unit: 10, ...layout });
    expect(result.fits).toBe(false);
    expect(result.sizes).toEqual({ title: 70, date: 40, timeLocation: 40, body: 25, smallPrint: 20 });
  });

  it('shrinks other slots once the overflowing ones hit their floor', () => {
    const layout = fakeLayout(200, ['smallPrint']);
    const result = fitText({ slots, unit: 10, ...layout });
    expect(result.fits).toBe(true);
    expect(result.sizes.smallPrint).toBe(20);
    expect(result.sizes.title).toBeLessThan(120);
  });

  it('applies the final sizes to the layout', () => {
    const layout = fakeLayout(290);
    const result = fitText({ slots, unit: 10, ...layout });
    expect(layout.applied()).toEqual(result.sizes);
  });
});

describe('enforceHierarchy', () => {
  it('caps each slot at the one above', () => {
    expect(enforceHierarchy({ title: 70, date: 80, timeLocation: 90, body: 30, smallPrint: 40 })).toEqual({
      title: 70,
      date: 70,
      timeLocation: 70,
      body: 30,
      smallPrint: 30,
    });
  });
});
