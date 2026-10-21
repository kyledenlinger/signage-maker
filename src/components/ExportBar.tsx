import type { Issue } from '../lib/checks';
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
  issues: Issue[];
}

export function ExportBar({ state, screenType, onScreenTypeChange, onExportAll, issues }: Props) {
  const blocking = issues.filter((i) => i.severity === 'blocking').length;
  const warnings = issues.length - blocking;
  return (
    <section className="export-bar" aria-labelledby="export-heading">
      <h3 id="export-heading">Export</h3>
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
          aria-disabled={state.running || undefined}
          onClick={() => {
            if (!state.running) onExportAll();
          }}
        >
          Download all selected (.zip)
        </button>
      </div>
      <p className="hint">Print formats download as PDF. The zip also holds event.json and alt-text.txt.</p>
      <p className={`export-readability ${blocking ? 'is-blocking' : ''}`}>
        {issues.length === 0 ? (
          'Readability check: no problems found.'
        ) : (
          <>
            Readability check: {blocking} {blocking === 1 ? 'problem blocks' : 'problems block'} export, {warnings}{' '}
            {warnings === 1 ? 'warning' : 'warnings'}. <a href="#warnings-heading">See details</a>
          </>
        )}
      </p>
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
