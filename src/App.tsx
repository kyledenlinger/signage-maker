import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { ErrorSummary, summarizeErrors, type SummaryItem } from './components/ErrorSummary';
import { ExportBar } from './components/ExportBar';
import { useExporter } from './components/useExporter';
import { EventForm } from './components/EventForm';
import { PreviewGrid } from './components/PreviewGrid';
import { WarningsPanel } from './components/WarningsPanel';
import { contentIssues, fitIssues } from './lib/checks';
import type { FitReport } from './templates/TemplateRenderer';
import { FORMAT_PRESETS, type FileType, type FormatPreset } from './config/formats';
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
  const [screenType, setScreenType] = useState<'png' | 'jpg'>('png');
  const exporter = useExporter(setAnnouncement);

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

  const blockedIds = useMemo(() => {
    const blocking = issues.filter((i) => i.severity === 'blocking');
    if (blocking.some((i) => i.formatId === null)) return new Set(preview.formatIds);
    return new Set(blocking.map((i) => i.formatId!));
  }, [issues, preview.formatIds]);

  const onInvalid = (errors: FieldErrors<EventData>) => {
    const items = summarizeErrors(errors);
    setSummary(items);
    setAnnouncement(`${items.length} ${items.length === 1 ? 'problem' : 'problems'} to fix.`);
    setChecks((n) => n + 1);
  };

  /** Validates the form, then acts on the valid data; otherwise shows the error summary. */
  const withValidData = (action: (data: EventData) => void | Promise<void>) =>
    methods.handleSubmit(async (data) => {
      setSummary([]);
      await action(data);
    }, onInvalid)();

  const check = methods.handleSubmit(() => {
    setSummary([]);
    setAnnouncement('No problems found.');
  }, onInvalid);

  const exportAll = () =>
    withValidData((data) =>
      exporter.run(
        data,
        FORMAT_PRESETS.filter((f) => data.formatIds.includes(f.id)).map((format) => ({
          format,
          types: [format.dpi ? 'pdf' : screenType],
        })),
        'zip',
      ),
    );

  const exportOne = (format: FormatPreset, type: FileType) =>
    withValidData((data) => exporter.run(data, [{ format, types: [type] }], 'files'));

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
          <ExportBar
            state={exporter.state}
            screenType={screenType}
            onScreenTypeChange={setScreenType}
            onExportAll={() => void exportAll()}
          />
          <WarningsPanel issues={issues} />
          <PreviewGrid
            event={preview}
            onFit={onFit}
            blockedIds={blockedIds}
            exporting={exporter.state.running}
            onDownload={(format, type) => void exportOne(format, type)}
          />
        </section>
      </main>
      <div className="visually-hidden" aria-live="polite" role="status">
        {announcement}
      </div>
    </FormProvider>
  );
}
