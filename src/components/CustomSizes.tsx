import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { CUSTOM_SIZE_PX, customFormat, suggestOrientation, type OrientationClass } from '../config/formats';
import { customFormats, findAnyFormat, setCustomFormats, useFormats } from '../lib/formatStore';
import { slugify } from '../lib/format';
import type { EventData } from '../schema/event';

const ORIENTATION_LABELS: Record<OrientationClass, string> = {
  landscape: 'Landscape',
  portrait: 'Portrait',
  square: 'Square',
};

interface Errors {
  name?: string;
  width?: string;
  height?: string;
}

function parseSize(value: string): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= CUSTOM_SIZE_PX.min && n <= CUSTOM_SIZE_PX.max ? n : null;
}

/**
 * Settings panel for custom sizes. They work like the built-in screen presets (5% safe zone, PNG
 * or JPG), persist in this browser, and are saved in project files.
 */
export function CustomSizes() {
  const { getValues, setValue } = useFormContext<EventData>();
  const all = useFormats();
  const list = all.filter((f) => f.custom);
  const [name, setName] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [orientation, setOrientation] = useState<OrientationClass | ''>('');
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState('');

  const w = parseSize(width);
  const h = parseSize(height);
  const suggested = w && h ? suggestOrientation(w, h) : 'landscape';
  const sizeError = `Enter a whole number of pixels from ${CUSTOM_SIZE_PX.min} to ${CUSTOM_SIZE_PX.max}.`;

  function add() {
    const slug = slugify(name);
    const next: Errors = {};
    if (!name.trim()) next.name = 'Give the size a name.';
    else if (findAnyFormat(`custom-${slug}`) || all.some((f) => f.name.toLowerCase() === name.trim().toLowerCase())) {
      next.name = 'A size with this name already exists.';
    }
    if (!w) next.width = sizeError;
    if (!h) next.height = sizeError;
    setErrors(next);
    if (next.name || next.width || next.height) {
      setStatus('');
      return;
    }
    const format = customFormat({ name, width: w!, height: h!, orientation: orientation || suggested }, slug);
    setCustomFormats([...customFormats(), format]);
    setValue('formatIds', [...getValues('formatIds'), format.id], { shouldDirty: true, shouldValidate: true });
    setName('');
    setWidth('');
    setHeight('');
    setOrientation('');
    setStatus(`Added ${format.name} (${format.width} × ${format.height}) and selected it.`);
  }

  function remove(id: string) {
    const format = findAnyFormat(id);
    setCustomFormats(customFormats().filter((f) => f.id !== id));
    setValue(
      'formatIds',
      getValues('formatIds').filter((x) => x !== id),
      { shouldDirty: true, shouldValidate: true },
    );
    setStatus(`Removed ${format?.name ?? 'the size'}.`);
  }

  const described = (field: keyof Errors) => (errors[field] ? `custom-${field}-error` : undefined);

  return (
    <details className="custom-sizes">
      <summary>Custom sizes</summary>
      <p className="hint">
        Add a screen size that isn’t listed. Templates lay it out by orientation, with a 5% safe zone.
      </p>
      {list.length > 0 && (
        <ul className="custom-list">
          {list.map((f) => (
            <li key={f.id}>
              {f.name}{' '}
              <span className="muted">
                {f.width} × {f.height}, {ORIENTATION_LABELS[f.orientation].toLowerCase()}
              </span>
              <button type="button" className="link-button" onClick={() => remove(f.id)}>
                Remove<span className="visually-hidden"> {f.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="custom-form">
        <div className="field">
          <label htmlFor="custom-name">Name</label>
          <input
            id="custom-name"
            type="text"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={described('name')}
          />
          {errors.name && (
            <p className="field-error" id="custom-name-error">
              {errors.name}
            </p>
          )}
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="custom-width">Width (px)</label>
            <input
              id="custom-width"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={width}
              onChange={(e) => setWidth(e.target.value.trim())}
              aria-invalid={errors.width ? true : undefined}
              aria-describedby={described('width')}
            />
            {errors.width && (
              <p className="field-error" id="custom-width-error">
                {errors.width}
              </p>
            )}
          </div>
          <div className="field">
            <label htmlFor="custom-height">Height (px)</label>
            <input
              id="custom-height"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={height}
              onChange={(e) => setHeight(e.target.value.trim())}
              aria-invalid={errors.height ? true : undefined}
              aria-describedby={described('height')}
            />
            {errors.height && (
              <p className="field-error" id="custom-height-error">
                {errors.height}
              </p>
            )}
          </div>
        </div>
        <div className="field">
          <label htmlFor="custom-orientation">Layout</label>
          <select
            id="custom-orientation"
            value={orientation || suggested}
            onChange={(e) => setOrientation(e.target.value as OrientationClass)}
          >
            {(Object.keys(ORIENTATION_LABELS) as OrientationClass[]).map((o) => (
              <option key={o} value={o}>
                {ORIENTATION_LABELS[o]}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="button-secondary" onClick={add}>
          Add size
        </button>
        <p className="custom-status" role="status">
          {status}
        </p>
      </div>
    </details>
  );
}
