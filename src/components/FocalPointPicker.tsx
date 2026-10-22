import type { PointerEvent } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { EventData, ImageAsset } from '../schema/event';
import { fieldId } from './fields';

interface Props {
  image: ImageAsset;
  name: 'imageFocus' | 'backgroundFocus';
  /** What the image is, in lower case: "photo" or "background image". */
  what: string;
}

/**
 * Click or drag on the thumbnail to set the point to keep in view when the image is cropped. The two sliders
 * do the same from the keyboard (arrow keys move the point).
 */
export function FocalPointPicker({ image, name, what }: Props) {
  const { control, setValue } = useFormContext<EventData>();
  const focus = useWatch({ control, name });
  const id = fieldId(name);
  const set = (next: { x: number; y: number }) => setValue(name, { x: clamp(next.x), y: clamp(next.y) }, { shouldDirty: true });
  const setFromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    set({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
  };

  return (
    <fieldset className="field fieldset focal" id={id} tabIndex={-1}>
      <legend>{what[0].toUpperCase() + what.slice(1)} focal point</legend>
      <p className="hint" id={`${id}-hint`}>
        Click or drag to the part of the {what} that must stay visible, or use the sliders. Each format crops around this point.
      </p>
      <div
        className="focal-thumb"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          setFromPointer(e);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) setFromPointer(e);
        }}
      >
        <img src={image.dataUrl} alt="" draggable={false} />
        <span className="focal-marker" style={{ left: `${focus.x * 100}%`, top: `${focus.y * 100}%` }} aria-hidden="true" />
      </div>
      <div className="focal-sliders">
        <Slider id={`${id}-x`} label="Left to right" what={what} value={focus.x} onChange={(x) => set({ ...focus, x })} />
        <Slider id={`${id}-y`} label="Top to bottom" what={what} value={focus.y} onChange={(y) => set({ ...focus, y })} />
      </div>
    </fieldset>
  );
}

interface SliderProps {
  id: string;
  label: string;
  what: string;
  value: number;
  onChange: (v: number) => void;
}

function Slider({ id, label, what, value, onChange }: SliderProps) {
  const percent = Math.round(value * 100);
  return (
    <div className="focal-slider">
      <label htmlFor={id}>
        {label}
        <span className="visually-hidden"> on the {what}</span> <span className="muted">{percent}%</span>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={percent}
        aria-valuetext={`${percent}%`}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
    </div>
  );
}

function clamp(v: number) {
  return Math.min(1, Math.max(0, Math.round(v * 100) / 100));
}
