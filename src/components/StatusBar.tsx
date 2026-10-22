import type { Problem } from '../lib/problems';
import { focusField } from './problemsContext';

export const STATUS_BAR_ID = 'status-bar';

function ProblemLine({ problem }: { problem: Problem }) {
  return (
    <li>
      {problem.message}{' '}
      {problem.fieldId ? (
        <a
          href={`#${problem.fieldId}`}
          onClick={(e) => {
            e.preventDefault();
            focusField(problem.fieldId!);
          }}
        >
          {problem.actionLabel}
        </a>
      ) : (
        <span className="status-action">{problem.actionLabel}.</span>
      )}
    </li>
  );
}

/**
 * The one live status: what blocks export (each with a link to its field), or what the zip will
 * hold. Warnings follow, as advice.
 */
export function StatusBar({ problems, formatCount }: { problems: Problem[]; formatCount: number }) {
  const blockers = problems.filter((p) => p.severity === 'blocker');
  const warnings = problems.filter((p) => p.severity === 'warning');
  const blocked = blockers.length > 0;
  return (
    <section
      id={STATUS_BAR_ID}
      className={`status-bar ${blocked ? 'is-blocked' : 'is-ready'}`}
      role="status"
      aria-labelledby="status-heading"
    >
      <h3 id="status-heading">
        <span className="status-icon" aria-hidden="true">
          {blocked ? '✕' : '✓'}
        </span>
        {blocked
          ? `${blockers.length} ${blockers.length === 1 ? 'problem blocks' : 'problems block'} export`
          : 'Ready to export'}
      </h3>
      {blocked ? (
        <ul className="status-list">
          {blockers.map((p) => (
            <ProblemLine key={p.id} problem={p} />
          ))}
        </ul>
      ) : (
        <p className="status-summary">
          {formatCount} {formatCount === 1 ? 'format' : 'formats'}, plus alt text and the project file.
        </p>
      )}
      {warnings.length > 0 && (
        <div className="status-warnings">
          <p className="status-warnings-title">
            {warnings.length} {warnings.length === 1 ? 'suggestion' : 'suggestions'} (won’t block export)
          </p>
          <ul className="status-list">
            {warnings.map((p) => (
              <ProblemLine key={p.id} problem={p} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
