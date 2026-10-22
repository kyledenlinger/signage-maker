import { useState, type ReactNode } from 'react';
import { useFormContext, useWatch, type Path } from 'react-hook-form';
import type { CharLimit } from '../config/limits';
import { IMAGE_PX } from '../config/limits';
import { isVector, readImageFile } from '../lib/image';
import { DropZone } from './DropZone';
import { useFieldBlocker } from './problemsContext';
import type { EventData, ImageAsset } from '../schema/event';

export type FieldName = Path<EventData>;

export function fieldId(name: string): string {
  return `field-${name.replace(/\./g, '-')}`;
}

/** The blocker message for a field, if it has one (from the shared problems list). */
export function useFieldError(name: string): string | undefined {
  return useFieldBlocker(fieldId(name))?.message;
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
  const { register, control } = useFormContext<EventData>();
  const value = useWatch({ control, name });
  const id = fieldId(name);
  const error = useFieldError(name);
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
  const { register } = useFormContext<EventData>();
  const id = fieldId(name);
  const error = useFieldError(name);
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
  name: 'image' | 'background';
  label: string;
  accept: string;
  hint?: string;
  /** Warn when the long edge is under the screen-resolution threshold. */
  checkResolution?: boolean;
  /** Called after a new file is read in. */
  onLoaded?: (asset: ImageAsset) => void;
}

export function ImageField({ name, label, accept, hint, checkResolution, onLoaded }: ImageFieldProps) {
  const { control, setValue } = useFormContext<EventData>();
  const asset = useWatch({ control, name }) as ImageAsset | null;
  const [readError, setReadError] = useState<string>();
  const problem = useFieldError(name);
  const lowRes = checkResolution && asset && !isVector(asset) && asset.originalLongEdge < IMAGE_PX.warnBelow;

  async function onFiles([file]: File[]) {
    setReadError(undefined);
    try {
      const loaded = await readImageFile(file);
      setValue(name, loaded, { shouldDirty: true, shouldValidate: true });
      onLoaded?.(loaded);
    } catch (e) {
      setReadError(e instanceof Error ? e.message : 'This file could not be read.');
    }
  }

  return (
    <DropZone
      id={fieldId(name)}
      label={label}
      hint={hint}
      accept={accept}
      files={asset ? [asset] : []}
      error={readError ?? problem}
      note={
        lowRes
          ? `This image is under ${IMAGE_PX.warnBelow} px on its long edge and may look soft on large screens.`
          : undefined
      }
      onFiles={(files) => void onFiles(files)}
      onRemove={() => setValue(name, null, { shouldDirty: true, shouldValidate: true })}
    />
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
