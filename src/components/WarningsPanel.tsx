import type { Issue } from '../lib/checks';
import { fieldId } from './fields';

/** Lists each issue as "format · field · problem · fix". Clicking an item focuses the field. */
export function WarningsPanel({ issues }: { issues: Issue[] }) {
  const blocking = issues.filter((i) => i.severity === 'blocking');
  const warnings = issues.filter((i) => i.severity === 'warning');
  return (
    <section className="warnings" aria-labelledby="warnings-heading">
      <h3 id="warnings-heading">Readability check</h3>
      {issues.length === 0 ? (
        <p className="warnings-ok">No problems found.</p>
      ) : (
        <>
          <p className="warnings-count">
            {blocking.length} {blocking.length === 1 ? 'problem blocks' : 'problems block'} export ·{' '}
            {warnings.length} {warnings.length === 1 ? 'warning' : 'warnings'}
          </p>
          <ul>
            {[...blocking, ...warnings].map((item) => (
              <li key={item.id} className={`warning-item is-${item.severity}`}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.field) document.getElementById(fieldId(item.field))?.focus();
                  }}
                >
                  <span className="warning-severity">{item.severity === 'blocking' ? 'Blocks export' : 'Warning'}:</span>{' '}
                  {item.formatName} · {item.fieldLabel} · {item.problem} · {item.fix}.
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
