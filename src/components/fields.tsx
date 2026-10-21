import { useState, type ReactNode } from 'react';
import { useFormContext, useWatch, type FieldErrors, type Path } from 'react-hook-form';
import type { CharLimit } from '../config/limits';
import { IMAGE_PX } from '../config/limits';
import { readImageFile } from '../lib/image';
import type { EventData, ImageAsset } from '../schema/event';

export type FieldName = Path<EventData>;

export function fieldId(name: string): string {
  return `field-${name.replace(/\./g, '-')}`;
}

export function errorAt(errors: FieldErrors<EventData>, name: string): string | undefined {
  let node: unknown = errors;
  for (const key of name.split('.')) {
    if (node == null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  const message = (node as { message?: unknown } | undefined)?.message;
  return typeof message === 'string' ? message : undefined;
}

function describedBy(...ids: (string | false | null | undefined)[]) {
  return ids.filter(Boolean).join(' ') || undefined;
}

function Label({ id, label, required }: { id: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={id}>
      {label}
      {required && <span className="req"> (required)</span>}
    </label>
  );
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p className="field-error" id={id}>
      {message}
    </p>
  );
}

function Counter({ id, length, limit }: { id: string; length: number; limit: CharLimit }) {
  const over = length > limit.max;
  const long = !over && limit.recommended !== undefined && length > limit.recommended;
  return (
    <p className={`counter ${over ? 'is-over' : long ? 'is-long' : ''}`} id={id}>
      {length} / {limit.max} characters
      {long && ` · over the recommended ${limit.recommended}; harder to read at a glance`}
    </p>
  );
}

interface TextFieldProps {
  name: FieldName;
  label: string;
  required?: boolean;
  hint?: string;
  limit?: CharLimit;
  type?: 'text' | 'date' | 'time' | 'url';
  multiline?: boolean;
  autoComplete?: string;
}

export function TextField({ name, label, required, hint, limit, type = 'text', multiline, autoComplete }: TextFieldProps) {
  const { register, control, formState } = useFormContext<EventData>();
  const value = useWatch({ control, name });
  const id = fieldId(name);
  const error = errorAt(formState.errors, name);
  const length = typeof value === 'string' ? value.length : 0;
  const aria = {
    'aria-invalid': error ? true : undefined,
    'aria-required': required || undefined,
    'aria-describedby': describedBy(hint && `${id}-hint`, limit && `${id}-count`, error && `${id}-error`),
  };
  return (
    <div className="field">
      <Label id={id} label={label} required={required} />
      {hint && (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {multiline ? (
        <textarea id={id} rows={3} {...register(name)} {...aria} />
      ) : (
        <input id={id} type={type} autoComplete={autoComplete ?? 'off'} {...register(name)} {...aria} />
      )}
      {limit && <Counter id={`${id}-count`} length={length} limit={limit} />}
      <ErrorText id={`${id}-error`} message={error} />
    </div>
  );
}

export function CheckboxField({ name, label, hint }: { name: FieldName; label: string; hint?: string }) {
  const { register } = useFormContext<EventData>();
  const id = fieldId(name);
  return (
    <div className="field field--check">
      <input id={id} type="checkbox" {...register(name)} aria-describedby={hint ? `${id}-hint` : undefined} />
      <label htmlFor={id}>{label}</label>
      {hint && (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}

interface SelectFieldProps {
  name: FieldName;
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
  hint?: string;
}

export function SelectField({ name, label, required, options, hint }: SelectFieldProps) {
  const { register, formState } = useFormContext<EventData>();
  const id = fieldId(name);
  const error = errorAt(formState.errors, name);
  return (
    <div className="field">
      <Label id={id} label={label} required={required} />
      {hint && (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <select
        id={id}
        {...register(name)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint && `${id}-hint`, error && `${id}-error`)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ErrorText id={`${id}-error`} message={error} />
    </div>
  );
}

interface ImageFieldProps {
  name: 'image' | 'illustration' | 'background';
  label: string;
  accept: string;
  hint?: string;
  /** Warn when the long edge is under the screen-resolution threshold. */
  checkResolution?: boolean;
}

export function ImageField({ name, label, accept, hint, checkResolution }: ImageFieldProps) {
  const { control, setValue } = useFormContext<EventData>();
  const asset = useWatch({ control, name }) as ImageAsset | null;
  const [readError, setReadError] = useState<string>();
  const id = fieldId(name);
  const lowRes = checkResolution && asset && asset.originalLongEdge < IMAGE_PX.warnBelow;

  async function onChange(file: File | undefined) {
    setReadError(undefined);
    if (!file) return;
    try {
      setValue(name, await readImageFile(file), { shouldDirty: true, shouldValidate: true });
    } catch (e) {
      setReadError(e instanceof Error ? e.message : 'This file could not be read.');
    }
  }

  return (
    <div className="field">
      <Label id={id} label={label} />
      {hint && (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <input
        id={id}
        type="file"
        accept={accept}
        aria-describedby={describedBy(hint && `${id}-hint`, asset && `${id}-status`, readError && `${id}-error`)}
        onChange={(e) => {
          void onChange(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {asset && (
        <div className="file-status" id={`${id}-status`}>
          <span>
            {asset.name} ({asset.width} × {asset.height} px)
          </span>
          <button
            type="button"
            className="link-button"
            onClick={() => setValue(name, null, { shouldDirty: true, shouldValidate: true })}
          >
            Remove<span className="visually-hidden"> {label.toLowerCase()}</span>
          </button>
          {lowRes && (
            <p className="field-warning">
              This image is under {IMAGE_PX.warnBelow} px on its long edge and may look soft on large screens.
            </p>
          )}
        </div>
      )}
      <ErrorText id={`${id}-error`} message={readError} />
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <section className="form-section" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}
