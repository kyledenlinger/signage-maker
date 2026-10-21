import { useFormContext, useWatch } from 'react-hook-form';
import type { EventData, ImageAsset } from '../schema/event';
import { fieldId } from './fields';

/**
 * Click the thumbnail to set the point to keep in view when the photo is cropped. The two sliders
 * do the same from the keyboard (arrow keys move the point).
 */
export function FocalPointPicker({ image }: { image: ImageAsset }) {
  const { control, setValue } = useFormContext<EventData>();
  const focus = useWatch({ control, name: 'imageFocus' });
  const id = fieldId('imageFocus');
  const set = (next: { x: number; y: number }) =>
    setValue('imageFocus', { x: clamp(next.x), y: clamp(next.y) }, { shouldDirty: true });

  return (
    <fieldset className="field fieldset focal" id={id} tabIndex={-1}>
      <legend>Photo focal point</legend>
      <p className="hint" id={`${id}-hint`}>
        Click the part of the photo that must stay visible, or use the sliders. Each format crops around this point.
      </p>
      <div
        className="focal-thumb"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          set({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
        }}
      >
        <img src={image.dataUrl} alt="" />
        <span className="focal-marker" style={{ left: `${focus.x * 100}%`, top: `${focus.y * 100}%` }} aria-hidden="true" />
      </div>
      <div className="focal-sliders">
        <Slider id={`${id}-x`} label="Left to right" value={focus.x} onChange={(x) => set({ ...focus, x })} />
        <Slider id={`${id}-y`} label="Top to bottom" value={focus.y} onChange={(y) => set({ ...focus, y })} />
      </div>
    </fieldset>
  );
}

function Slider({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (v: number) => void }) {
  const percent = Math.round(value * 100);
  return (
    <div className="focal-slider">
      <label htmlFor={id}>
        {label} <span className="muted">{percent}%</span>
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
