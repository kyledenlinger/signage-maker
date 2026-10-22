import { useEffect, useRef, useState } from 'react';
import type { FormatPreset } from '../config/formats';
import { blockersFor, type Problem } from '../lib/problems';
import { DownloadDialog, type DownloadRequest } from './DownloadDialog';
import { STATUS_BAR_ID, StatusBar } from './StatusBar';
import type { ExportState } from './useExporter';

interface Props {
  state: ExportState;
  screenType: 'png' | 'jpg';
  onScreenTypeChange: (type: 'png' | 'jpg') => void;
  onDownload: (request: DownloadRequest) => void;
  problems: Problem[];
  /** The formats the event is made in. */
  formats: FormatPreset[];
}

/**
 * The live status and one Download button, which opens the download dialog. The button is
 * disabled while nothing can be downloaded; a blocker on one format only takes that format out.
 */
export function ExportBar({ state, screenType, onScreenTypeChange, onDownload, problems, formats }: Props) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const anyReady = formats.some((f) => blockersFor(problems, f.id).length === 0);
  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => button.current?.focus());
  };

  // Once a download finishes with every format done, the dialog has nothing left to say: close it.
  // (The result is announced either way.) Skipped or failed formats keep it open, with the reasons.
  const wasRunning = useRef(false);
  useEffect(() => {
    const finished = wasRunning.current && !state.running;
    wasRunning.current = state.running;
    if (finished && open && state.rows.length > 0 && state.rows.every((r) => r.status === 'done')) close();
  }, [state.running]);

  return (
    <section className="export-bar" aria-labelledby="export-heading">
      <h3 id="export-heading" className="visually-hidden">
        Export
      </h3>
      <StatusBar problems={problems} formatCount={formats.length} />
      <button
        ref={button}
        type="button"
        className="button-primary download-button"
        aria-haspopup="dialog"
        disabled={!anyReady}
        aria-describedby={anyReady ? undefined : STATUS_BAR_ID}
        onClick={() => setOpen(true)}
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18">
          <path d="M10 3v9m0 0-4-4m4 4 4-4M4 15h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {anyReady ? 'Download' : 'Download blocked'}
      </button>
      <DownloadDialog
        open={open}
        onClose={close}
        formats={formats}
        problems={problems}
        state={state}
        screenType={screenType}
        onScreenTypeChange={onScreenTypeChange}
        onDownload={onDownload}
      />
    </section>
  );
}
