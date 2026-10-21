import { useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { FIELD_LIMITS, MAX_HIGHLIGHTS, MAX_LOGOS } from '../config/limits';
import { useFormats } from '../lib/formatStore';
import { readImageFile } from '../lib/image';
import { CustomSizes } from './CustomSizes';
import type { EventData } from '../schema/event';
import { TEMPLATES } from '../templates/registry';
import { FocalPointPicker } from './FocalPointPicker';
import { ThemeField } from './ThemeField';
import { CheckboxField, errorAt, fieldId, ImageField, Section, SelectField, TextField } from './fields';

export function EventForm() {
  return (
    <div className="event-form">
      <Section title="Event">
        <TextField name="title" label="Title" required limit={FIELD_LIMITS.title} hint="The largest text on every format." />
        <TextField
          name="subtitle"
          label="Subtitle"
          limit={FIELD_LIMITS.subtitle}
          hint="Speaker, series name or tagline."
        />
      </Section>

      <Section title="Date and time">
        <TextField name="date" label="Date" type="date" required />
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
        <div className="field-row">
          <TextField name="startTime" label="Start time" type="time" required />
          <TextField name="endTime" label="End time" type="time" />
        </div>
        <TextField
          name="recurringNote"
          label="Multi-day or recurring note"
          limit={FIELD_LIMITS.recurringNote}
          hint="For example “Every Tuesday in March”. Replaces the date when filled."
        />
      </Section>

      <Section title="Place and details">
        <TextField name="location" label="Location" required limit={FIELD_LIMITS.location} />
        <TextField
          name="description"
          label="Description"
          multiline
          limit={FIELD_LIMITS.description}
          hint="Shown on portrait and print formats."
        />
        <HighlightsField />
        <TextField
          name="callToAction"
          label="Call to action"
          limit={FIELD_LIMITS.callToAction}
          hint="For example “Register now” or “Free and open to all”."
        />
      </Section>

      <Section title="Link and QR code">
        <TextField name="url" label="Web address (URL)" type="url" autoComplete="url" />
        <TextField
          name="displayUrl"
          label="Display URL"
          limit={FIELD_LIMITS.displayUrl}
          hint="Optional short link to print instead of the full address."
        />
        <CheckboxField name="showQr" label="Show a QR code for the web address" />
      </Section>

      <Section title="Images">
        <ImageField
          name="image"
          label="Photo"
          accept="image/jpeg,image/png,image/webp"
          hint="JPG, PNG or WebP. At least 1920 px on the long edge is best."
          checkResolution
        />
        <Focus image="image" name="imageFocus" what="photo" />
        <TextField
          name="imageDescription"
          label="Photo description"
          limit={FIELD_LIMITS.imageDescription}
          hint="Required with a photo. Used for alt text; not printed on the sign."
        />
        <TextField name="imageCredit" label="Photo credit" limit={FIELD_LIMITS.imageCredit} />
        <ImageField
          name="illustration"
          label="Illustration"
          accept="image/png,image/svg+xml"
          hint="Transparent PNG or SVG. Placed only where it never touches text; treated as decorative."
        />
        <ImageField
          name="background"
          label="Background image"
          accept="image/jpeg,image/png,image/webp"
          hint="Fills the sign behind solid text panels, in Showcase and Type only. Treated as decorative."
          checkResolution
        />
        <Focus image="background" name="backgroundFocus" what="background image" />
      </Section>

      <Section title="Logos and accessibility line">
        <CheckboxField name="showLockup" label="Show the WF | Wake Forest ZSR lockup" />
        <LogosField />
        <CheckboxField name="showAccommodations" label="Show the accommodations line" />
        <TextField name="accommodations" label="Accommodations line" limit={FIELD_LIMITS.accommodations} />
      </Section>

      <Section title="Design">
        <SelectField
          name="templateId"
          label="Template"
          required
          options={TEMPLATES.map((t) => ({ value: t.manifest.id, label: t.manifest.name }))}
        />
        <ThemeField />
        <FormatsField />
      </Section>
    </div>
  );
}

function HighlightsField() {
  const { control, register, formState } = useFormContext<EventData>();
  const { fields, append, remove } = useFieldArray({ control, name: 'highlights' });
  const values = useWatch({ control, name: 'highlights' });
  const id = fieldId('highlights');
  return (
    <fieldset className="field fieldset" aria-describedby={`${id}-hint`}>
      <legend>Highlights</legend>
      <p className="hint" id={`${id}-hint`}>
        Up to {MAX_HIGHLIGHTS} short items, {FIELD_LIMITS.highlight.max} characters each, e.g. “Pizza”.
      </p>
      {fields.map((f, i) => {
        const name = `highlights.${i}.value` as const;
        const itemId = fieldId(name);
        const error = errorAt(formState.errors, name);
        const length = values?.[i]?.value?.length ?? 0;
        return (
          <div className="highlight-row" key={f.id}>
            <label htmlFor={itemId}>Highlight {i + 1}</label>
            <input
              id={itemId}
              type="text"
              autoComplete="off"
              {...register(name)}
              aria-invalid={error ? true : undefined}
              aria-describedby={[`${itemId}-count`, error && `${itemId}-error`].filter(Boolean).join(' ')}
            />
            <button type="button" className="link-button" onClick={() => remove(i)}>
              Remove<span className="visually-hidden"> highlight {i + 1}</span>
            </button>
            <p className={`counter ${length > FIELD_LIMITS.highlight.max ? 'is-over' : ''}`} id={`${itemId}-count`}>
              {length} / {FIELD_LIMITS.highlight.max} characters
            </p>
            {error && (
              <p className="field-error" id={`${itemId}-error`}>
                {error}
              </p>
            )}
          </div>
        );
      })}
      {fields.length < MAX_HIGHLIGHTS && (
        <button type="button" className="button-secondary" onClick={() => append({ value: '' })}>
          Add a highlight
        </button>
      )}
    </fieldset>
  );
}

function LogosField() {
  const { control, setValue } = useFormContext<EventData>();
  const logos = useWatch({ control, name: 'logos' });
  const [readError, setReadError] = useState<string>();
  const id = fieldId('logos');

  async function onFiles(files: FileList | null) {
    setReadError(undefined);
    if (!files?.length) return;
    try {
      const room = MAX_LOGOS - logos.length;
      const added = await Promise.all(Array.from(files).slice(0, room).map(readImageFile));
      setValue('logos', [...logos, ...added], { shouldDirty: true, shouldValidate: true });
      if (files.length > room) setReadError(`Only ${MAX_LOGOS} extra logos fit; the rest were not added.`);
    } catch (e) {
      setReadError(e instanceof Error ? e.message : 'This file could not be read.');
    }
  }

  return (
    <div className="field">
      <label htmlFor={id}>Additional logos</label>
      <p className="hint" id={`${id}-hint`}>
        Up to {MAX_LOGOS}, SVG or PNG with a transparent background. Shown in the footer row.
      </p>
      <input
        id={id}
        type="file"
        accept="image/svg+xml,image/png"
        multiple
        disabled={logos.length >= MAX_LOGOS}
        aria-describedby={[`${id}-hint`, readError && `${id}-error`].filter(Boolean).join(' ')}
        onChange={(e) => {
          void onFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {logos.length > 0 && (
        <ul className="file-list">
          {logos.map((logo, i) => (
            <li key={i}>
              {logo.name}
              <button
                type="button"
                className="link-button"
                onClick={() =>
                  setValue(
                    'logos',
                    logos.filter((_, j) => j !== i),
                    { shouldDirty: true, shouldValidate: true },
                  )
                }
              >
                Remove<span className="visually-hidden"> {logo.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {readError && (
        <p className="field-error" id={`${id}-error`}>
          {readError}
        </p>
      )}
    </div>
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

function Focus({ image, name, what }: { image: 'image' | 'background'; name: 'imageFocus' | 'backgroundFocus'; what: string }) {
  const { control } = useFormContext<EventData>();
  const asset = useWatch({ control, name: image });
  return asset ? <FocalPointPicker image={asset} name={name} what={what} /> : null;
}
