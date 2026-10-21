import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { findFormat, FORMAT_PRESETS } from '../config/formats';
import { findImageTheme, resolveTheme, THEMES } from '../config/themes';
import { palettesFromImages } from '../lib/palette';
import type { EventData, ImageAsset } from '../schema/event';
import { TEMPLATES } from '../templates/registry';
import { TemplateRenderer, type FitReport } from '../templates/TemplateRenderer';
import { fixtureEvent, type FixtureName } from './fixtures';
import '../styles/fonts.css';

/*
 * Development-only page used by the Playwright tests and for eyeballing layouts.
 *   ?template=split&format=landscape-hd&theme=black-gold&image=1&qr=1&fixture=sample&scale=0.4 (or scale=auto)
 *   ?matrix=1&theme=light   (every template × orientation × image × QR)
 *   Add bg=1 for a background image; theme=images-light|images-dark|images-contrast builds the theme from the images;
 *   fontTitle=lexend&fontBody=inter picks fonts (ids from config/fonts.ts); ill=1 makes the image an
 *   illustration (shown whole) instead of a photo.
 */

const params = new URLSearchParams(location.search);
const flag = (name: string, fallback: boolean) => (params.has(name) ? params.get(name) === '1' : fallback);

function Cell({ templateId, formatId, themeId, image, qr, fixture, scale, background = false }: {
  background?: boolean;
  templateId: string;
  formatId: string;
  themeId: string;
  image: boolean;
  qr: boolean;
  fixture: FixtureName;
  /** 'auto' fits the long edge to 480 px. */
  scale: number | 'auto';
}) {
  const format = findFormat(formatId)!;
  const factor = scale === 'auto' ? 480 / Math.max(format.width, format.height) : scale;
  const base = useMemo(
    () =>
      fixtureEvent(fixture, {
        image,
        qr,
        templateId,
        themeId,
        background,
        illustration: flag('ill', false),
        fontTitle: params.get('fontTitle') ?? undefined,
        fontBody: params.get('fontBody') ?? undefined,
      }),
    [fixture, image, qr, templateId, themeId, background],
  );
  const [event, setEvent] = useState<EventData | null>(findImageTheme(themeId) ? null : base);
  useEffect(() => {
    if (!findImageTheme(themeId)) return setEvent(base);
    const images = [base.background, base.image].filter((i): i is ImageAsset => i !== null);
    void palettesFromImages(images).then((imagePalettes) => setEvent({ ...base, imagePalettes }));
  }, [base, themeId]);
  const [report, setReport] = useState<FitReport>();
  const id = `${templateId}__${formatId}__${themeId}__img${Number(image)}__qr${Number(qr)}${background ? '__bg1' : ''}${flag('ill', false) ? '__ill' : ''}`;
  return (
    <figure
      className="cell"
      data-cell={id}
      data-fits={report ? String(report.fits) : 'pending'}
      data-sizes={report ? JSON.stringify(report.sizesU) : ''}
      style={{ margin: 0, font: '12px sans-serif' }}
    >
      <figcaption>{id}</figcaption>
      <div style={{ width: format.width * factor, height: format.height * factor, overflow: 'hidden', outline: '1px solid #999' }}>
        <div style={{ transform: `scale(${factor})`, transformOrigin: 'top left' }}>
          {event && <TemplateRenderer event={event} theme={resolveTheme(event)} format={format} onFit={setReport} />}
        </div>
      </div>
    </figure>
  );
}

function Gallery() {
  const fixture = (params.get('fixture') as FixtureName) ?? 'sample';
  if (params.get('matrix') === '1') {
    const themeIds = params.get('theme') ? [params.get('theme')!] : THEMES.map((t) => t.id);
    const bg = flag('bg', false);
    const formatIds = (params.get('formats') ?? 'landscape-hd,portrait-hd,square').split(',');
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 12 }}>
        {themeIds.flatMap((themeId) =>
          TEMPLATES.flatMap((t) =>
            formatIds.flatMap((formatId) =>
              [true, false].flatMap((image) =>
                [true, false].map((qr) => (
                  <Cell
                    key={`${themeId}${t.manifest.id}${formatId}${image}${qr}`}
                    templateId={t.manifest.id}
                    formatId={formatId}
                    themeId={themeId}
                    image={image}
                    qr={qr}
                    fixture={fixture}
                    background={bg}
                    scale={Number(params.get('scale') ?? 0.15)}
                  />
                )),
              ),
            ),
          ),
        )}
      </div>
    );
  }
  return (
    <Cell
      templateId={params.get('template') ?? 'showcase'}
      formatId={params.get('format') ?? FORMAT_PRESETS[0].id}
      themeId={params.get('theme') ?? THEMES[0].id}
      image={flag('image', true)}
      qr={flag('qr', true)}
      fixture={fixture}
      background={flag('bg', false)}
      scale={params.get('scale') === 'auto' ? 'auto' : Number(params.get('scale') ?? 1)}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Gallery />
  </StrictMode>,
);
