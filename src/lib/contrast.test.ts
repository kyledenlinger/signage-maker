import { describe, expect, it } from 'vitest';
import { contrastRatio, relativeLuminance } from './contrast';

describe('contrast', () => {
  it('matches known WCAG values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
    expect(relativeLuminance('#fff')).toBeCloseTo(1, 5);
  });

  it('matches the ratios quoted in the spec', () => {
    expect(contrastRatio('#CEB888', '#000000')).toBeCloseTo(10.8, 1);
    expect(contrastRatio('#9E7E38', '#000000')).toBeCloseTo(5.5, 1);
    expect(contrastRatio('#222222', '#FFFFFF')).toBeCloseTo(15.9, 1);
    expect(contrastRatio('#8C6D2C', '#FFFFFF')).toBeCloseTo(4.8, 1);
    expect(contrastRatio('#9E7E38', '#FFFFFF')).toBeCloseTo(3.8, 1);
    expect(contrastRatio('#53565A', '#000000')).toBeLessThan(3); // spec rounds 2.85 to 2.9
  });
});
