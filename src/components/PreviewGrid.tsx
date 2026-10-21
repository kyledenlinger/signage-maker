import { useEffect, useRef, useState } from 'react';
import type { FileType, FormatPreset } from '../config/formats';
import { resolveTheme } from '../config/themes';
import { previewAltText } from '../lib/altText';
import { useFormats } from '../lib/formatStore';
import type { EventData } from '../schema/event';
import { TemplateRenderer, type FitReport } from '../templates/TemplateRenderer';

interface Props {
  event: EventData;
  onFit: (report: FitReport) => void;
  /** Formats with a blocking issue. */
  blockedIds: Set<string>;
  exporting: boolean;
  onDownload: (format: FormatPreset, type: FileType) => void;
}

export function PreviewGrid({ event, onFit, blockedIds, exporting, onDownload }: Props) {
  const formats = useFormats().filter((f) => event.formatIds.includes(f.id));
  if (formats.length === 0) {
    return <p className="preview-empty">Choose at least one format to see a preview.</p>;
  }
  return (
    <ul className="preview-grid">
      {formats.map((f) => (
        <li key={f.id}>
          <PreviewCard
            event={event}
            format={f}
            onFit={onFit}
            blocked={blockedIds.has(f.id)}
            exporting={exporting}
            onDownload={onDownload}
          />
        </li>
      ))}
    </ul>
  );
}

interface CardProps extends Pick<Props, 'event' | 'onFit' | 'exporting' | 'onDownload'> {
  format: FormatPreset;
  blocked: boolean;
}

function PreviewCard({ event, format, onFit, blocked, exporting, onDownload }: CardProps) {
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
        {!fits ? (
          <span className="preview-flag"> · text doesn’t fit</span>
        ) : (
          blocked && <span className="preview-flag"> · blocked</span>
        )}
      </figcaption>
      <div
        ref={frameRef}
        className="preview-frame"
        role="img"
        aria-label={previewAltText(event, format)}
        style={{ aspectRatio: `${format.width} / ${format.height}` }}
      >
        {width > 0 && (
          <div className="preview-canvas" style={{ transform: `scale(${scale})` }} aria-hidden="true">
            <TemplateRenderer
              event={event}
              theme={resolveTheme(event)}
              format={format}
              onFit={(report) => {
                setFits(report.fits);
                onFit(report);
              }}
            />
          </div>
        )}
      </div>
      <div className="card-actions">
        <span className="card-actions-label" aria-hidden="true">
          Download:
        </span>
        {format.fileTypes.map((type) => (
          <button
            key={type}
            type="button"
            className="button-secondary button-small"
            aria-label={`Download ${type.toUpperCase()} of ${format.name}`}
            aria-disabled={exporting || undefined}
            onClick={() => {
              if (!exporting) onDownload(format, type);
            }}
          >
            {type.toUpperCase()}
          </button>
        ))}
      </div>
    </figure>
  );
}
