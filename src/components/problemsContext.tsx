import { createContext, useContext } from 'react';
import type { Problem } from '../lib/problems';

/** The current problems (lib/problems.ts), shared with every field and the status bar. */
export const ProblemsContext = createContext<Problem[]>([]);

/** The first blocker for a field, by its DOM id. */
export function useFieldBlocker(fieldId: string): Problem | undefined {
  return useContext(ProblemsContext).find((p) => p.severity === 'blocker' && p.fieldId === fieldId);
}

/**
 * Opens any collapsed sections around a field, then focuses it and scrolls it into view. A hidden
 * file input hands focus to its visible button (data-focus-target).
 */
export function focusField(fieldId: string) {
  const found = document.getElementById(fieldId);
  const el = (found?.dataset.focusTarget && document.getElementById(found.dataset.focusTarget)) || found;
  if (!el) return;
  for (let node: Element | null = el; node; node = node.parentElement) {
    if (node instanceof HTMLDetailsElement) node.open = true;
  }
  el.focus();
  el.scrollIntoView({ block: 'center' });
}
