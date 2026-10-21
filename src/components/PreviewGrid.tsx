import { useEffect, useRef, useState } from 'react';
import { FORMAT_PRESETS, type FormatPreset } from '../config/formats';
import { findTheme } from '../config/themes';
import { previewAltText } from '../lib/altText';
import type { EventData } from '../schema/event';
import { TemplateRenderer, type FitReport } from '../templates/TemplateRenderer';

interface Props {
  event: EventData;
  onFit: (report: FitReport) => void;
}

export function PreviewGrid({ event, onFit }: Props) {
  const formats = FORMAT_PRESETS.filter((f) => event.formatIds.includes(f.id));
  if (formats.length === 0) {
    return <p className="preview-empty">Choose at least one format to see a preview.</p>;
  }
  return (
    <ul className="preview-grid">
      {formats.map((f) => (
        <li key={f.id}>
          <PreviewCard event={event} format={f} onFit={onFit} />
        </li>
      ))}
    </ul>
  );
}

function PreviewCard({ event, format, onFit }: { event: EventData; format: FormatPreset; onFit: Props['onFit'] }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [fits, setFits] = useState(true);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = width / format.width;
  return (
    <figure className="preview-card" data-format={format.id} data-fits={fits}>
      <figcaption>
        <strong>{format.name}</strong>{' '}
        <span className="muted">
          {format.width} × {format.height}
        </span>
        {!fits && <span className="preview-flag"> · text doesn’t fit</span>}
      </figcaption>
      <div
        ref={frameRef}
        className="preview-frame"
        role="img"
        aria-label={previewAltText(event, format)}
        style={{ aspectRatio: `${format.width} / ${format.height}` }}
      >
        <div className="preview-canvas" style={{ transform: `scale(${scale})` }} aria-hidden="true">
          <TemplateRenderer
            event={event}
            theme={findTheme(event.themeId)}
            format={format}
            onFit={(report) => {
              setFits(report.fits);
              onFit(report);
            }}
          />
        </div>
      </div>
    </figure>
  );
}
