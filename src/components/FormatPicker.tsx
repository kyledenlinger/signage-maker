import { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useFormats } from '../lib/formatStore';
import type { EventData } from '../schema/event';
import { CustomSizes } from './CustomSizes';
import { fieldId, useFieldError } from './fields';

/**
 * "Add a format": a button at the end of the format strip that opens the list of sizes to produce
 * (and the custom-size form). It's a <details> underneath, so jumping to a formats problem opens it.
 */
export function FormatPicker() {
  const details = useRef<HTMLDetailsElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = details.current;
    if (!el) return;
    const onToggle = () => setOpen(el.open);
    el.addEventListener('toggle', onToggle);
    return () => el.removeEventListener('toggle', onToggle);
  }, []);

  const close = () => {
    if (details.current) details.current.open = false;
    button.current?.focus();
  };

  return (
    <>
      <li>
        <button
          ref={button}
          type="button"
          className="format-add"
          aria-expanded={open}
          aria-controls="format-picker"
          onClick={() => {
            if (details.current) details.current.open = !details.current.open;
          }}
        >
          <span aria-hidden="true">+</span> Add a format
        </button>
      </li>
      <li className="format-picker-row">
        <details
          ref={details}
          id="format-picker"
          className="format-picker"
          onKeyDown={(e) => {
            if (e.key === 'Escape') close();
          }}
        >
          <summary className="visually-hidden" tabIndex={-1}>
            Formats
          </summary>
          <FormatsField />
          <button type="button" className="button-secondary" onClick={close}>
            Done
          </button>
        </details>
      </li>
    </>
  );
}

function FormatsField() {
  const { register } = useFormContext<EventData>();
  const id = fieldId('formatIds');
  const error = useFieldError('formatIds');
  const formats = useFormats();
  return (
    <>
      <fieldset
        className="field fieldset"
        id={id}
        tabIndex={-1}
        aria-describedby={[`${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ')}
      >
        <legend>
          Formats<span className="req"> (required)</span>
        </legend>
        <p className="hint" id={`${id}-hint`}>
          Your choice is remembered next time.
        </p>
        <div className="check-grid">
          {formats.map((f) => (
            <div className="field--check" key={f.id}>
              <input id={`${id}-${f.id}`} type="checkbox" value={f.id} {...register('formatIds')} />
              <label htmlFor={`${id}-${f.id}`}>
                {f.name} <span className="muted">{f.width} × {f.height}</span>
              </label>
            </div>
          ))}
        </div>
        {error && (
          <p className="field-error" id={`${id}-error`}>
            {error}
          </p>
        )}
      </fieldset>
      <CustomSizes />
    </>
  );
}
