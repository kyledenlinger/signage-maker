import { useFormContext, useWatch } from 'react-hook-form';
import type { EventData } from '../schema/event';
import { TEMPLATES } from '../templates/registry';
import { fieldId } from './fields';

/** One line each, so people can choose without trying every template. */
const BLURBS: Record<string, string> = {
  showcase: 'Text panel over a background image',
  split: 'Photo beside the text · needs a photo',
  band: 'Photo above a text band · needs a photo',
  'type-only': 'Big type, no image needed',
  frame: 'Photo inside a gold frame · needs a photo',
};

const TEXT = 'var(--sketch-text)';
const PHOTO = 'var(--sketch-photo)';
const QR = 'var(--sketch-qr)';

/** A small 16:9 sketch of each layout: photo, title, text lines and QR as blocks. */
function Sketch({ id }: { id: string }) {
  const lines = (x: number, y: number, widths: number[]) =>
    widths.map((w, i) => <rect key={i} x={x} y={y + i * 7} width={w} height={3.5} rx={1.5} fill={TEXT} opacity={0.75} />);
  const title = (x: number, y: number, w: number) => <rect x={x} y={y} width={w} height={8} rx={2} fill={TEXT} />;
  const qr = (x: number, y: number) => <rect x={x} y={y} width={16} height={16} rx={2} fill={QR} />;
  const shapes: Record<string, JSX.Element> = {
    showcase: (
      <>
        {title(10, 10, 70)}
        {qr(134, 8)}
        <rect x={10} y={28} width={58} height={34} rx={3} fill={PHOTO} />
        {lines(84, 40, [56, 48, 52])}
        {lines(10, 70, [40, 28])}
      </>
    ),
    split: (
      <>
        <rect x={0} y={0} width={80} height={90} fill={PHOTO} />
        {title(90, 12, 56)}
        {lines(90, 30, [60, 50, 54, 40])}
        {qr(134, 66)}
      </>
    ),
    band: (
      <>
        <rect x={0} y={0} width={160} height={46} fill={PHOTO} />
        {title(10, 54, 64)}
        {lines(10, 68, [50, 40])}
        {lines(86, 56, [40, 44, 36])}
        {qr(134, 66)}
      </>
    ),
    'type-only': (
      <>
        {title(10, 12, 96)}
        {title(10, 24, 74)}
        {lines(10, 42, [60, 70, 52])}
        {qr(134, 66)}
      </>
    ),
    frame: (
      <>
        <rect x={8} y={10} width={66} height={70} rx={2} fill="none" stroke="var(--sketch-frame)" strokeWidth={3} />
        <rect x={11} y={13} width={60} height={64} fill={PHOTO} />
        {title(84, 14, 60)}
        {lines(84, 32, [62, 50, 56])}
        {qr(134, 66)}
      </>
    ),
  };
  return (
    <svg className="template-sketch" viewBox="0 0 160 90" aria-hidden="true">
      <rect width={160} height={90} rx={4} fill="var(--sketch-bg)" />
      {shapes[id]}
    </svg>
  );
}

/** Template choice as selectable cards (aria-pressed), each with a sketch and a one-line description. */
export function TemplateCards() {
  const { control, setValue } = useFormContext<EventData>();
  const templateId = useWatch({ control, name: 'templateId' });
  return (
    <div className="field" id={fieldId('templateId')} tabIndex={-1} role="group" aria-labelledby="template-heading">
      <h4 id="template-heading" className="look-heading">
        Template
      </h4>
      <ul className="option-grid template-grid">
        {TEMPLATES.map(({ manifest }) => {
          const selected = manifest.id === templateId;
          return (
            <li key={manifest.id}>
              <button
                type="button"
                className="option-card"
                data-template={manifest.id}
                aria-pressed={selected}
                aria-describedby={`template-blurb-${manifest.id}`}
                onClick={() => setValue('templateId', manifest.id, { shouldDirty: true })}
              >
                <Sketch id={manifest.id} />
                <span className="option-name">{manifest.name}</span>
                <span className="option-blurb" id={`template-blurb-${manifest.id}`}>
                  {BLURBS[manifest.id]}
                </span>
                {selected && (
                  <span className="option-check" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
