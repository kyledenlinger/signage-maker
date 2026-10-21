import { useFormContext, useWatch } from 'react-hook-form';
import { FONT_FAMILIES, fontStack } from '../config/fonts';
import type { EventData } from '../schema/event';
import { fieldId } from './fields';

/** Title and body font pickers, each with a sample in the chosen font. */
export function FontFields() {
  return (
    <>
      <FontSelect name="fontTitle" label="Title font" sample="Halloween Game Night" weight={700} />
      <FontSelect name="fontBody" label="Body font" sample="Games · Pizza · Free and open to all" weight={400} />
    </>
  );
}

function FontSelect({
  name,
  label,
  sample,
  weight,
}: {
  name: 'fontTitle' | 'fontBody';
  label: string;
  sample: string;
  weight: number;
}) {
  const { register, control } = useFormContext<EventData>();
  const value = useWatch({ control, name });
  const id = fieldId(name);
  const note = FONT_FAMILIES.find((f) => f.id === value)?.note;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} {...register(name)} aria-describedby={`${id}-hint`}>
        {FONT_FAMILIES.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
      <p className="font-sample" style={{ fontFamily: fontStack(value), fontWeight: weight }} aria-hidden="true">
        {sample}
      </p>
      <p className="hint" id={`${id}-hint`}>
        {note}
      </p>
    </div>
  );
}
