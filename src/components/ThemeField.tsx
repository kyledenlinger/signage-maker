import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { DEFAULT_THEME_ID, findImageTheme, IMAGE_THEMES, THEMES, type ThemeColors } from '../config/themes';
import { palettesFromImages } from '../lib/palette';
import type { EventData, ImageAsset } from '../schema/event';
import { fieldId } from './fields';

/**
 * Color picker: pills for the WFU themes, plus three "Match my image" themes (light, dark, high
 * contrast) once there's an image.
 * Whenever the background image or the photo or illustration changes, their colors are drawn into all three
 * (contrast-safe) and stored with the event.
 */
export function ThemeField() {
  const { control, setValue, getValues } = useFormContext<EventData>();
  const [background, image, palettes, themeId] = useWatch({
    control,
    name: ['background', 'image', 'imagePalettes', 'themeId'],
  });
  const id = fieldId('themeId');

  // useWatch hands back fresh copies of the images on every form change, so key the extraction on
  // their content. Otherwise saving the colors would re-run it, endlessly.
  const sourceKey = [background, image]
    .filter((i): i is ImageAsset => i !== null)
    .map((i) => i.dataUrl)
    .join('|');

  useEffect(() => {
    let cancelled = false;
    const images = [getValues('background'), getValues('image')].filter(
      (i): i is ImageAsset => i !== null,
    );
    void palettesFromImages(images).then((next) => {
      if (cancelled) return;
      if (JSON.stringify(next) !== JSON.stringify(getValues('imagePalettes'))) setValue('imagePalettes', next);
      if (!next && findImageTheme(getValues('themeId'))) setValue('themeId', DEFAULT_THEME_ID);
    });
    return () => {
      cancelled = true;
    };
  }, [sourceKey, setValue, getValues]);

  const selectedImageTheme = findImageTheme(themeId);
  const choose = (next: string) => setValue('themeId', next, { shouldDirty: true });
  return (
    <div className="field" id={id} tabIndex={-1} role="group" aria-labelledby="colors-heading">
      <h4 id="colors-heading" className="look-heading">
        Colors
      </h4>
      <ul className="pills">
        {THEMES.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className="pill"
              data-theme={t.id}
              aria-pressed={themeId === t.id}
              onClick={() => choose(t.id)}
            >
              <span className="pill-swatch" aria-hidden="true">
                <span style={{ background: t.background }} />
                <span style={{ background: t.title }} />
              </span>
              {t.name}
            </button>
          </li>
        ))}
        {palettes ? (
          IMAGE_THEMES.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="pill"
                data-theme={t.id}
                aria-pressed={themeId === t.id}
                onClick={() => choose(t.id)}
              >
                <span className="pill-swatch" aria-hidden="true">
                  <span style={{ background: palettes[t.mode].background }} />
                  <span style={{ background: palettes[t.mode].title }} />
                </span>
                {t.name}
              </button>
            </li>
          ))
        ) : (
          <li>
            <button type="button" className="pill" data-theme="images" disabled>
              <span className="pill-swatch is-empty" aria-hidden="true">
                <span />
                <span />
              </span>
              Match my image · add an image first
            </button>
          </li>
        )}
      </ul>
      <p className="hint">
        {palettes
          ? 'Match my image uses colors from your image, adjusted to pass the contrast rules.'
          : 'Add a photo, illustration or background image in step 2 to match its colors.'}
      </p>
      {palettes && selectedImageTheme && (
        <Swatches name={selectedImageTheme.name} colors={palettes[selectedImageTheme.mode]} />
      )}
    </div>
  );
}

function Swatches({ name, colors }: { name: string; colors: ThemeColors }) {
  const items: [string, string][] = [
    ['Background', colors.background],
    ['Title', colors.title],
    ['Time and location', colors.emphasis],
    ['Text', colors.text],
  ];
  return (
    <ul className="swatches" aria-label={`${name} colors`}>
      {items.map(([label, hex]) => (
        <li key={label}>
          <span className="swatch" style={{ background: hex }} aria-hidden="true" />
          {label} <span className="muted">{hex}</span>
        </li>
      ))}
    </ul>
  );
}
