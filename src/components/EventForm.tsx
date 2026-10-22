import { useContext, useState, type ReactNode } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { FIELD_LIMITS, MAX_HIGHLIGHTS } from '../config/limits';
import { guessImageKind } from '../lib/image';
import type { EventData } from '../schema/event';
import { FocalPointPicker } from './FocalPointPicker';
import { CheckboxField, fieldId, ImageField, TextField } from './fields';
import { ProblemsContext } from './problemsContext';

type SectionStatus = 'done' | 'optional' | 'fix';

/** Which fields each numbered section holds, for its status chip. */
const SECTION_FIELDS: Record<string, (keyof EventData)[]> = {
  event: ['title', 'subtitle'],
  image: ['image', 'imageKind', 'imageFocus', 'imageDescription', 'imageCredit', 'background', 'backgroundFocus'],
  when: ['date', 'startTime', 'endTime', 'location', 'recurringNote'],
  details: ['highlights', 'description', 'callToAction'],
  link: ['url', 'displayUrl', 'showQr'],
  access: ['showAccommodations', 'accommodations'],
};

/** Does any blocker point at a field in this section? */
function useSectionBlocked(section: keyof typeof SECTION_FIELDS): boolean {
  const problems = useContext(ProblemsContext);
  return problems.some(
    (p) =>
      p.severity === 'blocker' &&
      p.fieldId !== undefined &&
      SECTION_FIELDS[section].includes(p.fieldId.replace(/^field-/, '').split('-')[0] as keyof EventData),
  );
}

const STATUS_TEXT: Record<SectionStatus, string> = { done: 'Done', optional: 'Optional', fix: 'Needs a fix' };
const STATUS_ICON: Record<SectionStatus, string> = { done: '✓', optional: '○', fix: '!' };

/** A numbered card: number badge, name and status chip, with the fields inside a fieldset. */
function FormCard({
  number,
  title,
  status,
  children,
}: {
  number: number;
  title: string;
  status: SectionStatus;
  children: ReactNode;
}) {
  return (
    <fieldset className={`form-card ${status === 'fix' ? 'is-blocked' : ''}`}>
      <legend className="visually-hidden">
        {number}. {title} ({STATUS_TEXT[status]})
      </legend>
      <div className="form-card-header" aria-hidden="true">
        <span className="step-badge">{number}</span>
        <span className="form-card-title">{title}</span>
        <span className={`chip chip--${status}`}>
          <span className="chip-icon">{STATUS_ICON[status]}</span> {STATUS_TEXT[status]}
        </span>
      </div>
      {children}
    </fieldset>
  );
}

/** A link-style button that reveals an optional field; the field shows on its own once it has a value. */
function Reveal({ label, open, children }: { label: string; open: boolean; children: ReactNode }) {
  const [shown, setShown] = useState(false);
  if (open || shown) return <>{children}</>;
  return (
    <button type="button" className="reveal-link" onClick={() => setShown(true)}>
      {label}
    </button>
  );
}

export function EventForm() {
  const { control } = useFormContext<EventData>();
  const values = useWatch({ control }) as EventData;
  const blocked = {
    event: useSectionBlocked('event'),
    image: useSectionBlocked('image'),
    when: useSectionBlocked('when'),
    details: useSectionBlocked('details'),
    link: useSectionBlocked('link'),
    access: useSectionBlocked('access'),
  };
  const status = (section: keyof typeof blocked, filled: boolean, optional: boolean): SectionStatus =>
    blocked[section] ? 'fix' : filled || !optional ? 'done' : 'optional';

  const highlights = (values.highlights ?? []).filter((h) => h.value?.trim());
  const detailParts = [
    highlights.length ? `${highlights.length} ${highlights.length === 1 ? 'highlight' : 'highlights'}` : '',
    values.description?.trim() ? 'description' : '',
    values.callToAction?.trim() ? 'call to action' : '',
  ].filter(Boolean);
  const detailsSummary = detailParts.length
    ? `${detailParts.join(', ').replace(/^./, (c) => c.toUpperCase())}.`
    : 'Add highlights, a description or a call to action.';

  return (
    <div className="event-form">
      <FormCard number={1} title="The event" status={status('event', true, false)}>
        <TextField name="title" label="Title" required limit={FIELD_LIMITS.title} hint="The largest text on every format." />
        <TextField
          name="subtitle"
          label="Subtitle"
          limit={FIELD_LIMITS.subtitle}
          hint="Speaker, series or tagline. Sits right under the title."
        />
      </FormCard>

      <FormCard number={2} title="Image" status={status('image', Boolean(values.image || values.background), true)}>
        <FeaturedImage />
        <Reveal label="Use a full background image instead" open={Boolean(values.background)}>
          <ImageField
            name="background"
            label="Background image"
            accept="image/jpeg,image/png,image/webp"
            hint="Fills the whole sign behind solid text panels, in Showcase and Type only. Decorative."
            checkResolution
          />
          <Focus image="background" name="backgroundFocus" what="background image" />
        </Reveal>
      </FormCard>

      <FormCard number={3} title="When and where" status={status('when', true, false)}>
        <TextField name="date" label="Date" type="date" required />
        <div className="field-row">
          <TextField name="startTime" label="Start time" type="time" required />
          <TextField name="endTime" label="End time" type="time" />
        </div>
        <TextField name="location" label="Location" required limit={FIELD_LIMITS.location} />
        <Reveal label="+ Multi-day or recurring note" open={Boolean(values.recurringNote)}>
          <TextField
            name="recurringNote"
            label="Multi-day or recurring note"
            limit={FIELD_LIMITS.recurringNote}
            hint="For example “Every Tuesday in March”. Replaces the date when filled."
          />
        </Reveal>
      </FormCard>

      <FormCard number={4} title="Details" status={status('details', detailParts.length > 0, true)}>
        <details className="form-details">
          <summary>{detailsSummary}</summary>
          <HighlightsField />
          <TextField
            name="description"
            label="Description"
            multiline
            limit={FIELD_LIMITS.description}
            hint="Shown on portrait and print formats."
          />
          <TextField
            name="callToAction"
            label="Call to action"
            limit={FIELD_LIMITS.callToAction}
            hint="For example “Register now” or “Free and open to all”."
          />
        </details>
      </FormCard>

      <FormCard number={5} title="Link and QR code" status={status('link', Boolean(values.url?.trim()), true)}>
        <TextField name="url" label="Web address (URL)" type="url" autoComplete="url" />
        <CheckboxField name="showQr" label="Show a QR code for the web address" />
        <Reveal label="+ Add a short display URL" open={Boolean(values.displayUrl)}>
          <TextField
            name="displayUrl"
            label="Display URL"
            limit={FIELD_LIMITS.displayUrl}
            hint="A short link to print instead of the full address."
          />
        </Reveal>
      </FormCard>

      <FormCard number={6} title="Accommodations line" status={status('access', true, false)}>
        <CheckboxField name="showAccommodations" label="Show the accommodations line" />
        <TextField name="accommodations" label="Accommodations line" limit={FIELD_LIMITS.accommodations} />
      </FormCard>
    </div>
  );
}

function HighlightsField() {
  const { control, register } = useFormContext<EventData>();
  const problems = useContext(ProblemsContext);
  const { fields, append, remove } = useFieldArray({ control, name: 'highlights' });
  const values = useWatch({ control, name: 'highlights' });
  const id = fieldId('highlights');
  return (
    <fieldset className="field fieldset" aria-describedby={`${id}-hint`}>
      <legend>Highlights</legend>
      <p className="hint" id={`${id}-hint`}>
        Up to {MAX_HIGHLIGHTS} short items, {FIELD_LIMITS.highlight.max} characters each, e.g. “Pizza”.
      </p>
      <ul className="chips" aria-label="Highlights">
        {fields.map((f, i) => {
          const name = `highlights.${i}.value` as const;
          const itemId = fieldId(name);
          const error = problems.find((p) => p.severity === 'blocker' && p.fieldId === itemId)?.message;
          const length = values?.[i]?.value?.length ?? 0;
          return (
            <li className={`chip-edit ${error ? 'is-invalid' : ''}`} key={f.id}>
              <label htmlFor={itemId} className="visually-hidden">
                Highlight {i + 1}
              </label>
              <input
                id={itemId}
                type="text"
                autoComplete="off"
                size={Math.max(6, length + 1)}
                {...register(name)}
                aria-invalid={error ? true : undefined}
                aria-describedby={[`${itemId}-count`, error && `${itemId}-error`].filter(Boolean).join(' ')}
              />
              <span
                className={`chip-count ${length > FIELD_LIMITS.highlight.max ? 'is-over' : ''}`}
                id={`${itemId}-count`}
              >
                {length}/{FIELD_LIMITS.highlight.max}
                <span className="visually-hidden"> characters</span>
              </span>
              <button type="button" className="chip-remove" onClick={() => remove(i)} aria-label={`Remove highlight ${i + 1}`}>
                <span aria-hidden="true">✕</span>
              </button>
              {error && (
                <span className="field-error chip-error" id={`${itemId}-error`}>
                  {error}
                </span>
              )}
            </li>
          );
        })}
      </ul>
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
        hint="JPG, PNG, WebP or SVG, at least 1920 px wide. Unlocks Split, Band and Frame, and colors matched to your image."
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
