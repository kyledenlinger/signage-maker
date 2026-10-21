import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { FIELD_LIMITS, MAX_HIGHLIGHTS } from '../config/limits';
import { guessImageKind } from '../lib/image';
import type { EventData } from '../schema/event';
import { FocalPointPicker } from './FocalPointPicker';
import { CheckboxField, errorAt, fieldId, ImageField, Section, TextField } from './fields';

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

      <Section title="Photo or illustration">
        <FeaturedImage />
      </Section>

      <Section title="Background image">
        <ImageField
          name="background"
          label="Background image"
          accept="image/jpeg,image/png,image/webp"
          hint="Fills the whole sign behind solid text panels, in Showcase and Type only. Decorative."
          checkResolution
        />
        <Focus image="background" name="backgroundFocus" what="background image" />
      </Section>

      <Section title="Accessibility line">
        <CheckboxField name="showAccommodations" label="Show the accommodations line" />
        <TextField name="accommodations" label="Accommodations line" limit={FIELD_LIMITS.accommodations} />
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

function Focus({ image, name, what }: { image: 'image' | 'background'; name: 'imageFocus' | 'backgroundFocus'; what: string }) {
  const { control } = useFormContext<EventData>();
  const asset = useWatch({ control, name: image });
  return asset ? <FocalPointPicker image={asset} name={name} what={what} /> : null;
}

/** One featured image, shown as a photo (cropped to fill) or an illustration (shown whole). */
function FeaturedImage() {
  const { control, register, setValue } = useFormContext<EventData>();
  const [image, kind] = useWatch({ control, name: ['image', 'imageKind'] });
  const id = fieldId('imageKind');
  const kinds = [
    { value: 'photo', label: 'Photo', hint: 'Fills its space, cropped around a focal point you choose.' },
    { value: 'illustration', label: 'Illustration', hint: 'Shown whole, never cropped. Good for transparent PNGs and SVGs.' },
  ];
  return (
    <>
      <ImageField
        name="image"
        label="Photo or illustration"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        hint="One image per sign, beside or above the text (never under it). Used by every template except Type only. JPG, PNG, WebP or SVG; photos look best at 1920 px or more."
        checkResolution
        onLoaded={(asset) => {
          void guessImageKind(asset).then((guess) =>
            setValue('imageKind', guess, { shouldDirty: true, shouldValidate: true }),
          );
        }}
      />
      {image && (
        <fieldset className="field fieldset" id={id} tabIndex={-1}>
          <legend>Show it as</legend>
          {kinds.map((k) => (
            <div className="field--check" key={k.value}>
              <input
                id={`${id}-${k.value}`}
                type="radio"
                value={k.value}
                {...register('imageKind')}
                aria-describedby={`${id}-${k.value}-hint`}
              />
              <label htmlFor={`${id}-${k.value}`}>{k.label}</label>
              <p className="hint" id={`${id}-${k.value}-hint`}>
                {k.hint}
              </p>
            </div>
          ))}
        </fieldset>
      )}
      {kind === 'photo' && <Focus image="image" name="imageFocus" what="photo" />}
      {image && (
        <>
          <TextField
            name="imageDescription"
            label="Image description"
            limit={FIELD_LIMITS.imageDescription}
            hint={
              kind === 'photo'
                ? 'Required for photos. Used for alt text; not printed on the sign.'
                : 'Optional for illustrations, which are decorative. Used for alt text if given.'
            }
          />
          <TextField
            name="imageCredit"
            label="Image credit"
            limit={FIELD_LIMITS.imageCredit}
            hint="Printed small on the sign."
          />
        </>
      )}
    </>
  );
}
