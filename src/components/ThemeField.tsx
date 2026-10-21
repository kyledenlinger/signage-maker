import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { DEFAULT_THEME_ID, IMAGE_THEME_ID, IMAGE_THEME_NAME, THEMES, type ThemeColors } from '../config/themes';
import { themeFromImages } from '../lib/palette';
import type { EventData, ImageAsset } from '../schema/event';
import { fieldId } from './fields';

/**
 * Theme picker, plus "Match my images": whenever the background, photo or illustration changes,
 * colors are drawn from them (contrast-safe) and stored with the event.
 */
export function ThemeField() {
  const { control, register, setValue, getValues } = useFormContext<EventData>();
  const [background, image, illustration, imageTheme] = useWatch({
    control,
    name: ['background', 'image', 'illustration', 'imageTheme'],
  });
  const id = fieldId('themeId');

  // useWatch hands back fresh copies of the images on every form change, so key the extraction on
  // their content. Otherwise saving the colors would re-run it, endlessly.
  const sources = [background, image, illustration].filter((i): i is ImageAsset => i !== null);
  const sourceKey = sources.map((i) => i.dataUrl).join('|');

  useEffect(() => {
    let cancelled = false;
    void themeFromImages(getImages()).then((colors) => {
      if (cancelled) return;
      if (JSON.stringify(colors) !== JSON.stringify(getValues('imageTheme'))) setValue('imageTheme', colors);
      if (!colors && getValues('themeId') === IMAGE_THEME_ID) setValue('themeId', DEFAULT_THEME_ID);
    });
    return () => {
      cancelled = true;
    };

    function getImages() {
      return [getValues('background'), getValues('image'), getValues('illustration')].filter(
        (i): i is ImageAsset => i !== null,
      );
    }
  }, [sourceKey, setValue, getValues]);

  return (
    <div className="field">
      <label htmlFor={id}>
        Theme<span className="req"> (required)</span>
      </label>
      <select id={id} {...register('themeId')} aria-describedby={`${id}-hint`}>
        {THEMES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
        <option value={IMAGE_THEME_ID} disabled={!imageTheme}>
          {imageTheme ? IMAGE_THEME_NAME : `${IMAGE_THEME_NAME} (add an image first)`}
        </option>
      </select>
      <p className="hint" id={`${id}-hint`}>
        {imageTheme
          ? `${IMAGE_THEME_NAME} uses colors from your background, photo and illustration, adjusted to pass the contrast rules.`
          : `Add a background, photo or illustration to unlock ${IMAGE_THEME_NAME}.`}
      </p>
      {imageTheme && <Swatches colors={imageTheme} />}
    </div>
  );
}

function Swatches({ colors }: { colors: ThemeColors }) {
  const items: [string, string][] = [
    ['Background', colors.background],
    ['Title', colors.title],
    ['Time and location', colors.emphasis],
    ['Text', colors.text],
  ];
  return (
    <ul className="swatches" aria-label={`${IMAGE_THEME_NAME} colors`}>
      {items.map(([label, hex]) => (
        <li key={label}>
          <span className="swatch" style={{ background: hex }} aria-hidden="true" />
          {label} <span className="muted">{hex}</span>
        </li>
      ))}
    </ul>
  );
}
