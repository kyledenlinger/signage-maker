import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { FileType, FormatPreset } from '../config/formats';
import { resolveTheme } from '../config/themes';
import { previewAltText } from '../lib/altText';
import { useFormats } from '../lib/formatStore';
import { blockersFor, type Problem } from '../lib/problems';
import type { EventData } from '../schema/event';
import { TemplateRenderer, type FitReport } from '../templates/TemplateRenderer';

interface Props {
  event: EventData;
  problems: Problem[];
  onFit: (report: FitReport) => void;
  exporting: boolean;
  onDownload: (format: FormatPreset, type: FileType) => void;
}

/** Largest landscape preview, and the share of the fit size the "across the room" view uses. */
const STAGE_MAX_WIDTH = 840;
const ROOM_SCALE = 0.28;

/** Element size, kept up to date. */
function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

/** A sign rendered at full size through TemplateRenderer (as the export is), scaled down with CSS. */
function ScaledSign({
  event,
  format,
  scale,
  onFit,
  label,
}: {
  event: EventData;
  format: FormatPreset;
  scale: number;
  onFit?: (report: FitReport) => void;
  label?: string;
}) {
  return (
    <div
      className="scaled-sign"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ width: format.width * scale, height: format.height * scale }}
    >
      {scale > 0 && (
        <div className="scaled-sign-canvas" style={{ transform: `scale(${scale})` }} aria-hidden="true">
          <TemplateRenderer event={event} theme={resolveTheme(event)} format={format} onFit={onFit} />
        </div>
      )}
    </div>
  );
}

function StatusTag({ blocked, id }: { blocked: boolean; id?: string }) {
  return (
    <span id={id} className={`format-status ${blocked ? 'is-blocked' : 'is-ready'}`}>
      <span aria-hidden="true">{blocked ? '✕' : '✓'}</span> {blocked ? 'Blocked' : 'Ready'}
    </span>
  );
}

/**
 * One large preview of the selected format, a strip to switch formats, an "across the room" view
 * and full screen. Every sign renders through the same TemplateRenderer the export uses.
 */
export function PreviewCard({ event, problems, onFit, exporting, onDownload, children }: Props & { children?: ReactNode }) {
  const formats = useFormats().filter((f) => event.formatIds.includes(f.id));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'fit' | 'room'>('fit');
  const [fullscreen, setFullscreen] = useState(false);
  // Whether each format's text fits, from its thumbnail's own render.
  const [fits, setFits] = useState<Record<string, boolean>>({});
  const fullscreenButton = useRef<HTMLButtonElement>(null);
  const [stageRef, stage] = useSize<HTMLDivElement>();

  const selected = formats.find((f) => f.id === selectedId) ?? formats[0];
  const blockers = selected ? blockersFor(problems, selected.id) : [];
  const statusId = selected ? `format-status-${selected.id}` : undefined;

  const pad = 24;
  const fit = selected
    ? Math.min(
        (Math.min(stage.width, STAGE_MAX_WIDTH) - pad * 2) / selected.width,
        (stage.height - pad * 2) / selected.height,
      )
    : 0;
  const scale = Math.max(0, mode === 'room' ? fit * ROOM_SCALE : fit);

  return (
    <section className="card preview-card-main" id="preview" aria-labelledby="preview-heading" tabIndex={-1}>
      <header className="preview-header">
        <h2 id="preview-heading">
          Preview
          {selected && (
            <span className="preview-format">
              {' '}
              · {selected.name} · {selected.width} × {selected.height}
            </span>
          )}
        </h2>
        <div className="preview-tools">
          <div className="segmented" role="group" aria-label="Preview size">
            <button type="button" aria-pressed={mode === 'fit'} onClick={() => setMode('fit')}>
              Fit to screen
            </button>
            <button type="button" aria-pressed={mode === 'room'} onClick={() => setMode('room')}>
              From across the room
            </button>
          </div>
          <button
            ref={fullscreenButton}
            type="button"
            className="icon-button"
            aria-label="Show full screen"
            disabled={!selected}
            onClick={() => setFullscreen(true)}
          >
            <span aria-hidden="true">⤢</span>
          </button>
        </div>
      </header>

      <div className="stage" ref={stageRef}>
        {selected ? (
          <ScaledSign event={event} format={selected} scale={scale} onFit={onFit} label={previewAltText(event, selected)} />
        ) : (
          <p className="stage-empty">Choose at least one format to see a preview.</p>
        )}
      </div>
      {mode === 'room' && (
        <p className="room-caption">
          Roughly how this reads from 20–25 feet away. If you can’t read the date and place here, neither can someone
          walking past.
        </p>
      )}

      {selected && (
        <div className="selected-actions">
          <StatusTag blocked={blockers.length > 0} id={statusId} />
          <span className="card-actions-label" aria-hidden="true">
            Download:
          </span>
          {selected.fileTypes.map((type) => (
            <button
              key={type}
              type="button"
              className="button-secondary button-small"
              aria-label={`Download ${type.toUpperCase()} of ${selected.name}`}
              disabled={blockers.length > 0 || exporting}
              aria-describedby={blockers.length > 0 ? statusId : undefined}
              onClick={() => onDownload(selected, type)}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      <ul className="format-strip" aria-label="Formats">
        {formats.map((f) => {
          const blocked = blockersFor(problems, f.id).length > 0;
          const thumb = Math.min(96 / f.width, 64 / f.height);
          return (
            <li key={f.id}>
              <button
                type="button"
                className="format-button"
                data-format={f.id}
                data-fits={fits[f.id] === undefined ? 'pending' : String(fits[f.id])}
                aria-pressed={f.id === selected?.id}
                onClick={() => setSelectedId(f.id)}
              >
                <span className="format-thumb">
                  <ScaledSign
                    event={event}
                    format={f}
                    scale={thumb}
                    onFit={(report) => {
                      setFits((prev) => (prev[f.id] === report.fits ? prev : { ...prev, [f.id]: report.fits }));
                      onFit(report);
                    }}
                  />
                </span>
                <span className="format-text">
                  <span className="format-name">{f.name}</span>
                  <span className="format-size">
                    {f.width} × {f.height}
                  </span>
                  <StatusTag blocked={blocked} />
                </span>
              </button>
            </li>
          );
        })}
        {children}
      </ul>

      {fullscreen && selected && (
        <FullscreenSign
          event={event}
          format={selected}
          onClose={() => {
            setFullscreen(false);
            requestAnimationFrame(() => fullscreenButton.current?.focus());
          }}
        />
      )}
    </section>
  );
}

/** The current format, as large as the window allows. Esc or the button closes it; focus stays inside. */
function FullscreenSign({ event, format, onClose }: { event: EventData; format: FormatPreset; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [view, setView] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // The close button is the only focusable control: keep focus on it.
      if (e.key === 'Tab') {
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    const onResize = () => setView({ width: window.innerWidth, height: window.innerHeight });
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [onClose]);

  const margin = 64;
  const scale = Math.min((view.width - margin * 2) / format.width, (view.height - margin * 2) / format.height);
  return (
    <div className="fullscreen" role="dialog" aria-modal="true" aria-label={`${format.name}, full screen`}>
      <button ref={closeRef} type="button" className="fullscreen-close" onClick={onClose}>
        Close <span aria-hidden="true">✕</span>
        <span className="visually-hidden"> (Esc)</span>
      </button>
      <ScaledSign event={event} format={format} scale={scale} label={previewAltText(event, format)} />
    </div>
  );
}
