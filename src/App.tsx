import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { ErrorSummary, summarizeErrors, type SummaryItem } from './components/ErrorSummary';
import { EventForm } from './components/EventForm';
import { PreviewGrid } from './components/PreviewGrid';
import { WarningsPanel } from './components/WarningsPanel';
import { contentIssues, fitIssues } from './lib/checks';
import type { FitReport } from './templates/TemplateRenderer';
import { PREVIEW_DEBOUNCE_MS } from './config/limits';
import { useDebouncedValues } from './lib/useDebouncedValues';
import { loadFormatIds, saveFormatIds } from './lib/storage';
import { sampleEvent } from './schema/defaults';
import { eventSchema, type EventData } from './schema/event';

export function App() {
  const methods = useForm<EventData>({
    defaultValues: sampleEvent(loadFormatIds() ?? undefined),
    resolver: zodResolver(eventSchema),
    mode: 'onChange',
    // Focus goes to the error summary instead, which links to each field.
    shouldFocusError: false,
  });
  const preview = useDebouncedValues(methods, PREVIEW_DEBOUNCE_MS);
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [checks, setChecks] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const summaryRef = useRef<HTMLDivElement>(null);
  const [fitReports, setFitReports] = useState<Record<string, FitReport>>({});

  const onFit = useCallback((report: FitReport) => {
    setFitReports((prev) =>
      JSON.stringify(prev[report.formatId]) === JSON.stringify(report) ? prev : { ...prev, [report.formatId]: report },
    );
  }, []);

  const issues = useMemo(() => {
    const ids = Array.isArray(preview.formatIds) ? preview.formatIds : [];
    const reports = ids.map((id) => fitReports[id]).filter((r): r is FitReport => Boolean(r));
    return [...fitIssues(reports), ...contentIssues(preview, ids)];
  }, [preview, fitReports]);

  useEffect(() => {
    if (Array.isArray(preview.formatIds) && preview.formatIds.length) saveFormatIds(preview.formatIds);
  }, [preview]);

  useEffect(() => {
    if (checks > 0) summaryRef.current?.focus();
  }, [checks]);

  const check = methods.handleSubmit(
    () => {
      setSummary([]);
      setAnnouncement('No problems found.');
    },
    (errors) => {
      const items = summarizeErrors(errors);
      setSummary(items);
      setAnnouncement(`${items.length} ${items.length === 1 ? 'problem' : 'problems'} to fix.`);
      setChecks((n) => n + 1);
    },
  );

  return (
    <FormProvider {...methods}>
      <a className="skip-link" href="#preview-heading">
        Skip to preview
      </a>
      <header className="app-header">
        <h1>Signage Builder</h1>
        <p>Fill in the event once; every format updates together.</p>
      </header>
      <main className="app-main">
        <form className="panel form-panel" noValidate onSubmit={check} aria-labelledby="form-heading">
          <h2 id="form-heading" className="visually-hidden">
            Event details
          </h2>
          <ErrorSummary ref={summaryRef} items={summary} />
          <EventForm />
          <div className="form-actions">
            <button type="submit" className="button-primary">
              Check for problems
            </button>
          </div>
        </form>
        <section className="panel preview-panel" aria-labelledby="preview-heading">
          <h2 id="preview-heading" tabIndex={-1}>
            Preview
          </h2>
          <WarningsPanel issues={issues} />
          <PreviewGrid event={preview} onFit={onFit} />
        </section>
      </main>
      <div className="visually-hidden" aria-live="polite" role="status">
        {announcement}
      </div>
    </FormProvider>
  );
}
