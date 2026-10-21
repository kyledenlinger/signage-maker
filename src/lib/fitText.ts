import { SLOT_HIERARCHY, type SlotName, type TextSlot } from '../templates/types';

export type SlotSizes = Record<SlotName, number>;

export interface FitInput {
  slots: Record<SlotName, TextSlot>;
  /** Canvas unit in px. */
  unit: number;
  /** Apply sizes (px) to the rendered output. */
  apply: (sizes: SlotSizes) => void;
  /** After apply: the slots sitting in regions that overflow. Empty when everything fits. */
  overflowing: () => SlotName[];
  /** Fraction to shrink per step. */
  step?: number;
  maxSteps?: number;
}

export interface FitResult {
  sizes: SlotSizes;
  fits: boolean;
}

/** Caps each slot at the size of the slot above it, so the size hierarchy always holds. */
export function enforceHierarchy(sizes: SlotSizes): SlotSizes {
  const out = { ...sizes };
  for (let i = 1; i < SLOT_HIERARCHY.length; i++) {
    const above = SLOT_HIERARCHY[i - 1];
    const slot = SLOT_HIERARCHY[i];
    out[slot] = Math.min(out[slot], out[above]);
  }
  return out;
}

/**
 * Starts every slot at its max size and shrinks the slots in overflowing regions step by step,
 * never below each slot's minimum. When the overflowing slots are all at their floor, the other
 * slots shrink too (a big title can crowd out the details). Never clips or truncates: if text
 * still doesn't fit at the floor, the result says so and the caller blocks export.
 */
export function fitText({ slots, unit, apply, overflowing, step = 0.06, maxSteps = 60 }: FitInput): FitResult {
  const min = {} as SlotSizes;
  let sizes = {} as SlotSizes;
  for (const name of SLOT_HIERARCHY) {
    min[name] = slots[name].minU * unit;
    sizes[name] = slots[name].maxU * unit;
  }
  sizes = enforceHierarchy(sizes);
  apply(sizes);

  const shrink = (names: SlotName[]) => {
    let changed = false;
    for (const name of names) {
      const next = Math.max(min[name], sizes[name] * (1 - step));
      if (next < sizes[name] - 0.01) {
        sizes[name] = next;
        changed = true;
      }
    }
    return changed;
  };

  for (let i = 0; i < maxSteps; i++) {
    const over = overflowing();
    if (over.length === 0) break;
    if (!shrink(over) && !shrink([...SLOT_HIERARCHY])) break;
    sizes = enforceHierarchy(sizes);
    apply(sizes);
  }

  return { sizes, fits: overflowing().length === 0 };
}
