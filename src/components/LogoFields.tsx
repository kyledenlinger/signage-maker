import { useFormContext, useWatch } from 'react-hook-form';
import { COLORWAYS, colorwayReadable, LOCKUPS, logoUrl, pickColorway, type Colorway } from '../config/logos';
import { resolveTheme } from '../config/themes';
import type { EventData } from '../schema/event';
import { CheckboxField, SelectField } from './fields';

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
