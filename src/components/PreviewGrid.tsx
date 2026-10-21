import { useEffect, useRef, useState } from 'react';
import { FORMAT_PRESETS, type FormatPreset } from '../config/formats';
import { findTheme } from '../config/themes';
import { previewAltText } from '../lib/altText';
import type { EventData } from '../schema/event';
import { findTemplate } from '../templates/registry';

export function PreviewGrid({ event }: { event: EventData }) {
  const formats = FORMAT_PRESETS.filter((f) => event.formatIds.includes(f.id));
  if (formats.length === 0) {
    return <p className="preview-empty">Choose at least one format to see a preview.</p>;
  }
  return (
    <ul className="preview-grid">
      {formats.map((f) => (
        <li key={f.id}>
          <PreviewCard event={event} format={f} />
        </li>
      ))}
    </ul>
  );
}

function PreviewCard({ event, format }: { event: EventData; format: FormatPreset }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const { Component } = findTemplate(event.templateId);
  const theme = findTheme(event.themeId);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = width / format.width;
  return (
    <figure className="preview-card" data-format={format.id}>
      <figcaption>
        <strong>{format.name}</strong>{' '}
        <span className="muted">
          {format.width} × {format.height}
        </span>
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
            <Component event={event} theme={theme} format={format} />
          </div>
        )}
      </div>
    </figure>
  );
}
