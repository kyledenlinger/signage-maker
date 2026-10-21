import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { MAX_LOGOS } from '../config/limits';
import { readImageFile } from '../lib/image';
import { COLORWAYS, colorwayReadable, LOCKUPS, logoUrl, pickColorway, type Colorway } from '../config/logos';
import { resolveTheme } from '../config/themes';
import type { EventData } from '../schema/event';
import { CheckboxField, fieldId, SelectField } from './fields';

/** The approved ZSR Library logo: which version, its layout, and its colorway (automatic by default). */
export function LogoFields() {
  const { control } = useFormContext<EventData>();
  const [show, lockupId, orientation, colorway, themeId, imagePalettes] = useWatch({
    control,
    name: ['showLockup', 'lockupId', 'lockupOrientation', 'lockupColorway', 'themeId', 'imagePalettes'],
  });
  const panel = resolveTheme({ themeId, imagePalettes }).panel;
  const auto = pickColorway(panel);
  const shown: Colorway = colorway === 'auto' ? auto : colorway;
  const readable = colorwayReadable(shown, panel);

  return (
    <>
      <CheckboxField name="showLockup" label="Show the ZSR Library logo" />
      {show && (
        <div className="logo-fields">
          <SelectField
            name="lockupId"
            label="Logo version"
            options={LOCKUPS.map((l) => ({ value: l.id, label: l.name }))}
          />
          <div className="field-row">
            <SelectField
              name="lockupOrientation"
              label="Logo layout"
              options={[
                { value: 'horizontal', label: 'Horizontal' },
                { value: 'vertical', label: 'Vertical' },
              ]}
            />
            <SelectField
              name="lockupColorway"
              label="Logo color"
              options={[
                { value: 'auto', label: `Automatic (${COLORWAYS[auto].name.split(' (')[0]})` },
                ...(Object.keys(COLORWAYS) as Colorway[]).map((c) => ({ value: c, label: COLORWAYS[c].name })),
              ]}
            />
          </div>
          <div className="logo-preview" style={{ background: panel }}>
            <img src={logoUrl(lockupId, orientation, shown)} alt={`Logo preview: ${COLORWAYS[shown].name}`} />
          </div>
          {!readable && (
            <p className="field-warning">
              {COLORWAYS[shown].name} is hard to see on this theme. Automatic picks {COLORWAYS[auto].name.toLowerCase()}.
            </p>
          )}
        </div>
      )}
    </>
  );
}

/** Up to three co-sponsor logos, shown beside the ZSR Library logo. */
export function CoSponsorLogos() {
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
      <label htmlFor={id}>Co-sponsor logos</label>
      <p className="hint" id={`${id}-hint`}>
        Up to {MAX_LOGOS}, SVG or PNG with a transparent background. Shown beside the ZSR Library logo.
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
