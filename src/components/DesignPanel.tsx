import { useState, type ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';
import { useFormats } from '../lib/formatStore';
import type { EventData } from '../schema/event';
import { TEMPLATES } from '../templates/registry';
import { CustomSizes } from './CustomSizes';
import { errorAt, fieldId, SelectField } from './fields';
import { FontFields } from './FontFields';
import { CoSponsorLogos, LogoFields } from './LogoFields';
import { ThemeField } from './ThemeField';

/**
 * Everything about how the signs look, kept beside the previews so changes show up right away. The
 * event's content stays in the form on the left.
 */
export function DesignPanel() {
  const [open, setOpen] = useState(loadOpen);
  return (
    <details
      className="design"
      open={open}
      onToggle={(e) => {
        const next = e.currentTarget.open;
        setOpen(next);
        saveOpen(next);
      }}
    >
      <summary>
        <h3 id="design-heading">Design</h3>
        <span className="muted"> template, colors, fonts, formats, logos</span>
      </summary>
      <div className="design-groups">
        <Group title="Template and formats">
          <SelectField
            name="templateId"
            label="Template"
            required
            options={TEMPLATES.map((t) => ({ value: t.manifest.id, label: t.manifest.name }))}
          />
          <FormatsField />
        </Group>
        <Group title="Colors and fonts">
          <ThemeField />
          <FontFields />
        </Group>
        <Group title="Text style">
          <SelectField
            name="dateStyle"
            label="Date style"
            options={[
              { value: 'auto', label: 'Automatic (stacked on portrait formats)' },
              { value: 'inline', label: 'Inline (Fri, Oct 23)' },
              { value: 'stacked', label: 'Stacked (Fri / 23 / Oct)' },
            ]}
          />
          <SelectField
            name="weekdayStyle"
            label="Weekday"
            options={[
              { value: 'short', label: 'Short (Fri)' },
              { value: 'long', label: 'Full (Friday)' },
              { value: 'none', label: 'None' },
            ]}
          />
          <SelectField
            name="highlightStyle"
            label="Highlights style"
            hint="How highlights stand out from the other details."
            options={[
              { value: 'bold-color', label: 'Bold and color' },
              { value: 'bold', label: 'Bold' },
              { value: 'color', label: 'Color' },
            ]}
          />
        </Group>
        <Group title="Logos">
          <LogoFields />
          <CoSponsorLogos />
        </Group>
      </div>
    </details>
  );
}

const OPEN_KEY = 'signage.designOpen';

function loadOpen(): boolean {
  try {
    return localStorage.getItem(OPEN_KEY) !== 'false';
  } catch {
    return true;
  }
}

function saveOpen(open: boolean) {
  try {
    localStorage.setItem(OPEN_KEY, String(open));
  } catch {
    // Not remembered; it opens by default next time.
  }
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  const id = `design-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <section className="design-group" aria-labelledby={id}>
      <h4 id={id}>{title}</h4>
      {children}
    </section>
  );
}

function FormatsField() {
  const { register, formState } = useFormContext<EventData>();
  const id = fieldId('formatIds');
  const error = errorAt(formState.errors, 'formatIds');
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
