import { useEffect, useRef, useState } from 'react';
import type { FormatPreset } from '../config/formats';
import { blockersFor, type Problem } from '../lib/problems';
import type { ExportState, RowStatus } from './useExporter';

const STATUS_TEXT: Record<RowStatus, string> = {
  queued: 'Waiting',
  rendering: 'Rendering…',
  done: 'Done',
  skipped: 'Skipped',
  failed: 'Failed',
};

export interface DownloadRequest {
  formatIds: string[];
  zip: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** The formats the event is made in. */
  formats: FormatPreset[];
  problems: Problem[];
  state: ExportState;
  screenType: 'png' | 'jpg';
  onScreenTypeChange: (type: 'png' | 'jpg') => void;
  onDownload: (request: DownloadRequest) => void;
}

/**
 * Everything about a download in one place: which formats (blocked ones say why and can't be
 * picked), PNG or JPG for screens, and whether to zip them with the alt text and project file.
 * A native modal <dialog>: focus stays inside, Esc closes it, focus returns to the opener.
 */
export function DownloadDialog({ open, onClose, formats, problems, state, screenType, onScreenTypeChange, onDownload }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const ready = formats.filter((f) => blockersFor(problems, f.id).length === 0);
  // What the user unticked. Everything else that's ready is picked, including a format that
  // becomes ready while the dialog is open.
  const [unticked, setUnticked] = useState<string[]>([]);
  const [zip, setZip] = useState(true);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      // Each time it opens, every ready format is picked.
      setUnticked([]);
      el.showModal();
    }
    if (!open && el.open) el.close();
  }, [open]);

  const picked = ready.filter((f) => !unticked.includes(f.id));
  const hasScreen = picked.some((f) => !f.dpi) || (picked.length === 0 && ready.some((f) => !f.dpi));
  const files = picked.length;
  const label = state.running
    ? 'Downloading…'
    : files === 0
      ? 'Pick a format'
      : zip
        ? `Download ${files} ${files === 1 ? 'format' : 'formats'} (.zip)`
        : `Download ${files} ${files === 1 ? 'file' : 'files'}`;

  return (
    <dialog
      ref={dialog}
      className="download-dialog"
      aria-labelledby="download-title"
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop (outside the panel) closes it.
        if (e.target === e.currentTarget && !state.running) onClose();
      }}
    >
      <div className="download-panel">
        <header className="download-header">
          <h2 id="download-title">Download</h2>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        <fieldset className="download-formats">
          <legend>Formats</legend>
          <ul>
            {formats.map((f) => {
              const blockers = blockersFor(problems, f.id);
              const blocked = blockers.length > 0;
              const id = `download-${f.id}`;
              return (
                <li key={f.id} className={blocked ? 'is-blocked' : ''}>
                  <input
                    id={id}
                    type="checkbox"
                    checked={!blocked && !unticked.includes(f.id)}
                    disabled={blocked || state.running}
                    aria-describedby={`${id}-status`}
                    onChange={(e) =>
                      setUnticked((prev) => (e.target.checked ? prev.filter((x) => x !== f.id) : [...prev, f.id]))
                    }
                  />
                  <label htmlFor={id}>
                    <span className="download-name">{f.name}</span>
                    <span className="muted">
                      {f.width} × {f.height} · {f.dpi ? 'PDF' : screenType.toUpperCase()}
                    </span>
                  </label>
                  <span id={`${id}-status`} className={`format-status ${blocked ? 'is-blocked' : 'is-ready'}`}>
                    <span aria-hidden="true">{blocked ? '✕' : '✓'}</span> {blocked ? blockers[0].message : 'Ready'}
                  </span>
                </li>
              );
            })}
          </ul>
        </fieldset>

        {hasScreen && (
          <fieldset className="download-type">
            <legend>Screen formats as</legend>
            <div className="segmented-radio">
              {(
                [
                  ['png', 'PNG', 'Sharpest'],
                  ['jpg', 'JPG', 'Smaller file'],
                ] as const
              ).map(([type, name, note]) => (
                <label key={type}>
                  <input
                    type="radio"
                    name="screen-type"
                    value={type}
                    checked={screenType === type}
                    disabled={state.running}
                    onChange={() => onScreenTypeChange(type)}
                  />
                  <span>
                    <strong>{name}</strong> <span className="muted">{note}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="hint">Print formats always download as PDF.</p>
          </fieldset>
        )}

        <div className="field--check download-zip">
          <input
            id="download-zip"
            type="checkbox"
            checked={zip}
            disabled={state.running}
            aria-describedby="download-zip-hint"
            onChange={(e) => setZip(e.target.checked)}
          />
          <label htmlFor="download-zip">One .zip, with alt text and the project file</label>
          <p className="hint" id="download-zip-hint">
            alt-text.txt describes each sign for web posts; event.json reopens this event later.
          </p>
        </div>

        {state.rows.length > 0 && (
          <ul className="export-rows" aria-label="Progress">
            {state.rows.map((row) => (
              <li key={row.formatId} className={`is-${row.status}`}>
                <strong>{row.name}:</strong> {STATUS_TEXT[row.status]}
                {row.detail && ` · ${row.detail}`}
              </li>
            ))}
          </ul>
        )}
        {state.message && <p className="export-message">{state.message}</p>}

        <footer className="download-footer">
          <button type="button" className="button-secondary" onClick={onClose}>
            {state.message ? 'Close' : 'Cancel'}
          </button>
          <button
            type="button"
            className="button-primary"
            disabled={files === 0 || state.running}
            onClick={() => onDownload({ formatIds: picked.map((f) => f.id), zip })}
          >
            {label}
          </button>
        </footer>
      </div>
    </dialog>
  );
}
