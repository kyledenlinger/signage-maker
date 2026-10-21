import { forwardRef } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { FIELD_ORDER, type EventData } from '../schema/event';
import { errorAt, fieldId } from './fields';

const LABELS: Record<keyof EventData, string> = {
  title: 'Title',
  subtitle: 'Subtitle',
  date: 'Date',
  dateStyle: 'Date style',
  startTime: 'Start time',
  endTime: 'End time',
  recurringNote: 'Multi-day or recurring note',
  location: 'Location',
  description: 'Description',
  highlights: 'Highlights',
  callToAction: 'Call to action',
  url: 'Web address',
  displayUrl: 'Display URL',
  showQr: 'QR code',
  image: 'Photo',
  imageDescription: 'Photo description',
  imageCredit: 'Photo credit',
  illustration: 'Illustration',
  showLockup: 'Lockup',
  logos: 'Additional logos',
  showAccommodations: 'Accommodations',
  accommodations: 'Accommodations line',
  templateId: 'Template',
  themeId: 'Theme',
  formatIds: 'Formats',
};

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
