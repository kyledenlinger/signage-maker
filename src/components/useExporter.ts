import { useCallback, useEffect, useRef, useState } from 'react';
import type { FileType, FormatPreset } from '../config/formats';
import { exportAltText } from '../lib/altText';
import { contentIssues, fitIssues, type Issue } from '../lib/checks';
import { exportFileName, zipFileName } from '../lib/filenames';
import { projectJson } from '../lib/project';
import type { EventData } from '../schema/event';

export type RowStatus = 'queued' | 'rendering' | 'done' | 'skipped' | 'failed';

export interface ExportRow {
  formatId: string;
  name: string;
  status: RowStatus;
  detail?: string;
}

export interface ExportJob {
  format: FormatPreset;
  types: FileType[];
}

export interface ExportState {
  running: boolean;
  rows: ExportRow[];
  message: string;
}

/**
 * jsPDF, JSZip and the rasterizer are most of the app's weight, so they load separately, right
 * after the page is idle. Once loaded (with the fonts), exporting needs no network at all.
 */
const loadExport = () => import('../lib/export');

function prefetchExport() {
  void loadExport().then(({ prefetchFonts }) => prefetchFonts());
}

function reason(issue: Issue): string {
  return `${issue.fieldLabel}: ${issue.problem}`;
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

/**
 * Exports formats one at a time. A format with a blocking issue is skipped and reported; the rest
 * still export. With `zip`, everything goes in one archive with event.json and alt-text.txt.
 */
export function useExporter(announce: (message: string) => void) {
  const [state, setState] = useState<ExportState>({ running: false, rows: [], message: '' });
  const busy = useRef(false);

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(prefetchExport);
      return () => cancelIdleCallback(id);
    }
    const timer = setTimeout(prefetchExport, 1000);
    return () => clearTimeout(timer);
  }, []);

  const setRow = (formatId: string, patch: Partial<ExportRow>) =>
    setState((s) => ({ ...s, rows: s.rows.map((r) => (r.formatId === formatId ? { ...r, ...patch } : r)) }));

  const run = useCallback(
    async (event: EventData, jobs: ExportJob[], packaging: 'zip' | 'files') => {
      if (busy.current || jobs.length === 0) return;
      busy.current = true;
      setState({
        running: true,
        message: '',
        rows: jobs.map((j) => ({ formatId: j.format.id, name: j.format.name, status: 'queued' })),
      });
      announce(`Exporting ${plural(jobs.length, 'format')}…`);

      const { downloadBlob, encode, renderFormat, zipFiles } = await loadExport();
      const issues = contentIssues(
        event,
        jobs.map((j) => j.format.id),
      );
      const files: { name: string; data: Blob }[] = [];
      const skipped: string[] = [];
      const failed: string[] = [];

      for (const { format, types } of jobs) {
        const blockers = issues.filter(
          (i) => i.severity === 'blocking' && (i.formatId === null || i.formatId === format.id),
        );
        if (blockers.length) {
          setRow(format.id, { status: 'skipped', detail: reason(blockers[0]) });
          skipped.push(`${format.name} (${reason(blockers[0])})`);
          continue;
        }
        setRow(format.id, { status: 'rendering' });
        try {
          const { canvas, report } = await renderFormat(event, format);
          if (!report.fits) {
            const [problem] = fitIssues([report]);
            const detail = problem ? `${problem.fieldLabel}: ${problem.problem}, ${problem.fix}` : 'text doesn’t fit';
            setRow(format.id, { status: 'skipped', detail });
            skipped.push(`${format.name} (${detail})`);
            continue;
          }
          for (const type of types) {
            files.push({ name: exportFileName(event, format, type), data: await encode(canvas, type, format) });
          }
          setRow(format.id, { status: 'done' });
        } catch (e) {
          const detail = e instanceof Error ? e.message : 'export failed';
          setRow(format.id, { status: 'failed', detail });
          failed.push(`${format.name} (${detail})`);
        }
      }

      if (files.length > 0) {
        if (packaging === 'zip') {
          const alt = exportAltText(event);
          const zip = await zipFiles([
            ...files,
            { name: 'event.json', data: new Blob([projectJson(event)], { type: 'application/json' }) },
            { name: 'alt-text.txt', data: new Blob([files.map((f) => `${f.name}: ${alt}`).join('\n') + '\n']) },
          ]);
          downloadBlob(zip, zipFileName(event));
        } else {
          for (const file of files) downloadBlob(file.data, file.name);
        }
      }

      const done = jobs.length - skipped.length - failed.length;
      const parts = [
        done > 0
          ? packaging === 'zip'
            ? `Downloaded ${zipFileName(event)} with ${plural(done, 'format')}.`
            : `Downloaded ${plural(files.length, 'file')}.`
          : 'Nothing was exported.',
        skipped.length > 0 && `Skipped ${skipped.join('; ')}.`,
        failed.length > 0 && `Failed: ${failed.join('; ')}.`,
      ];
      const message = parts.filter(Boolean).join(' ');
      setState((s) => ({ ...s, running: false, message }));
      announce(message);
      busy.current = false;
    },
    [announce],
  );

  return { state, run };
}
