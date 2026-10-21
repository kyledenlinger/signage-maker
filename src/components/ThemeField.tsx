import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { DEFAULT_THEME_ID, findImageTheme, IMAGE_THEMES, THEMES, type ThemeColors } from '../config/themes';
import { palettesFromImages } from '../lib/palette';
import type { EventData, ImageAsset } from '../schema/event';
import { fieldId } from './fields';

/**
 * Theme picker: the WFU themes, plus three "Match my images" themes (light, dark, high contrast).
 * Whenever the background image or the photo or illustration changes, their colors are drawn into all three
 * (contrast-safe) and stored with the event.
 */
export function ThemeField() {
  const { control, register, setValue, getValues } = useFormContext<EventData>();
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
  return (
    <div className="field">
      <label htmlFor={id}>
        Theme<span className="req"> (required)</span>
      </label>
      <select id={id} {...register('themeId')} aria-describedby={`${id}-hint`}>
        <optgroup label="WFU themes">
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </optgroup>
        <optgroup label={palettes ? 'Match my images' : 'Match my images (add an image first)'}>
          {IMAGE_THEMES.map((t) => (
            <option key={t.id} value={t.id} disabled={!palettes}>
              {t.name}
            </option>
          ))}
        </optgroup>
      </select>
      <p className="hint" id={`${id}-hint`}>
        {palettes
          ? 'Match my images uses colors from your background image and your photo or illustration, adjusted to pass the contrast rules. Light, dark and high contrast versions are available.'
          : 'Add a photo, illustration or background image to unlock Match my images (light, dark and high contrast).'}
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
