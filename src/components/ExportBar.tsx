import type { Problem } from '../lib/problems';
import { STATUS_BAR_ID, StatusBar } from './StatusBar';
import type { ExportState, RowStatus } from './useExporter';

const STATUS_TEXT: Record<RowStatus, string> = {
  queued: 'Waiting',
  rendering: 'Rendering…',
  done: 'Done',
  skipped: 'Skipped',
  failed: 'Failed',
};

interface Props {
  state: ExportState;
  screenType: 'png' | 'jpg';
  onScreenTypeChange: (type: 'png' | 'jpg') => void;
  onExportAll: () => void;
  problems: Problem[];
  formatCount: number;
}

/** The live status, then the zip download: disabled while anything blocks export. */
export function ExportBar({ state, screenType, onScreenTypeChange, onExportAll, problems, formatCount }: Props) {
  const blocked = problems.some((p) => p.severity === 'blocker');
  return (
    <section className="export-bar" aria-labelledby="export-heading">
      <h3 id="export-heading" className="visually-hidden">
        Export
      </h3>
      <StatusBar problems={problems} formatCount={formatCount} />
      <div className="export-controls">
        <fieldset className="export-type">
          <legend>Screen formats as</legend>
          {(['png', 'jpg'] as const).map((type) => (
            <label key={type}>
              <input
                type="radio"
                name="screen-type"
                value={type}
                checked={screenType === type}
                onChange={() => onScreenTypeChange(type)}
              />{' '}
              {type.toUpperCase()}
            </label>
          ))}
        </fieldset>
        <button
          type="button"
          className="button-primary"
          disabled={blocked || state.running}
          aria-describedby={STATUS_BAR_ID}
          onClick={onExportAll}
        >
          {blocked ? 'Download blocked' : state.running ? 'Downloading…' : 'Download all (.zip)'}
        </button>
      </div>
      <p className="hint">Print formats download as PDF. The zip also holds event.json and alt-text.txt.</p>
      {state.rows.length > 0 && (
        <ul className="export-rows">
          {state.rows.map((row) => (
            <li key={row.formatId} className={`is-${row.status}`}>
              <strong>{row.name}:</strong> {STATUS_TEXT[row.status]}
              {row.detail && ` · ${row.detail}`}
            </li>
          ))}
        </ul>
      )}
      {state.message && <p className="export-message">{state.message}</p>}
    </section>
  );
}
