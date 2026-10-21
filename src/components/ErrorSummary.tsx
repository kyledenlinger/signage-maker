import { forwardRef } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { FIELD_ORDER, type EventData } from '../schema/event';
import { FIELD_LABELS as LABELS } from '../schema/labels';
import { errorAt, fieldId } from './fields';

export interface SummaryItem {
  id: string;
  label: string;
  message: string;
}

export function summarizeErrors(errors: FieldErrors<EventData>): SummaryItem[] {
  const items: SummaryItem[] = [];
  for (const key of FIELD_ORDER) {
    if (key === 'highlights') {
      const list = errors.highlights;
      if (Array.isArray(list)) {
        list.forEach((_, i) => {
          const name = `highlights.${i}.value`;
          const message = errorAt(errors, name);
          if (message) items.push({ id: fieldId(name), label: `Highlight ${i + 1}`, message });
        });
      }
      continue;
    }
    const message = errorAt(errors, key);
    if (message) items.push({ id: fieldId(key), label: LABELS[key], message });
  }
  return items;
}

export const ErrorSummary = forwardRef<HTMLDivElement, { items: SummaryItem[] }>(function ErrorSummary(
  { items },
  ref,
) {
  if (items.length === 0) return null;
  return (
    <div className="error-summary" ref={ref} tabIndex={-1} aria-labelledby="error-summary-title">
      <h2 id="error-summary-title">
        {items.length === 1 ? 'There is 1 problem to fix' : `There are ${items.length} problems to fix`}
      </h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.id)?.focus();
              }}
            >
              {item.label}: {item.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
});
