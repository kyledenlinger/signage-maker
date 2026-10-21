import type { FormatPreset } from '../../config/formats';
import type { Theme } from '../../config/themes';
import { qrSizePx } from '../../lib/qr';
import { canvasUnit } from '../../config/formats';
import { Lockup } from './Lockup';
import { QrCode, qrTotalPx } from './QrCode';
import type { SignContent } from './content';
import './base.css';

/*
 * Building blocks shared by every template. Fit regions (data-fit-region) are boxes with a bounded
 * size that the text fitter checks for overflow (the canvas itself always is one); data-slot names the font-size slot; data-field names the form
 * field, so a problem can point back to it.
 */

export function Title({ content, className = '' }: { content: SignContent; className?: string }) {
  if (!content.title) return null;
  return (
    <div className={`t-title ${className}`} data-slot="title" data-field="title">
      {content.title}
    </div>
  );
}

export function DateBlock({ content, className = '' }: { content: SignContent; className?: string }) {
  const d = content.date;
  if (!d) return null;
  return (
    <div className={`t-date ${className}`} data-fit-region data-slot="date" data-field={d.field}>
      {d.kind === 'stacked' ? (
        <>
          <span className="t-date-day">{d.day}</span>
          <span className="t-date-month">{d.month}</span>
        </>
      ) : (
        <span>{d.text}</span>
      )}
    </div>
  );
}

/** Tagline, time and location, highlights, description, call to action and URL, in that order. */
export function Details({ content, className = '' }: { content: SignContent; className?: string }) {
  return (
    <div className={`t-details ${className}`} data-fit-region>
      {content.subtitle && (
        <div className="t-body" data-slot="body" data-field="subtitle">
          {content.subtitle}
        </div>
      )}
      {(content.time || content.location) && (
        <div className="t-emphasis" data-slot="timeLocation" data-field="location">
          {content.time && <div>{content.time}</div>}
          {content.location && <div>{content.location}</div>}
        </div>
      )}
      {content.highlights.length > 0 && (
        <ul className="t-body t-highlights" data-slot="body" data-field="highlights">
          {content.highlights.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      )}
      {content.description && (
        <div className="t-body" data-slot="body" data-field="description">
          {content.description}
        </div>
      )}
      {content.callToAction && (
        <div className="t-body t-cta" data-slot="body" data-field="callToAction">
          {content.callToAction}
        </div>
      )}
      {content.url && (
        <div className="t-body t-url" data-slot="body" data-field="url">
          {content.url}
        </div>
      )}
    </div>
  );
}

export function Footer({
  content,
  theme,
  format,
  logoHeightU,
  row = false,
  className = '',
}: {
  content: SignContent;
  theme: Theme;
  format: FormatPreset;
  logoHeightU: number;
  /** Logos and small print side by side, for short layouts. */
  row?: boolean;
  className?: string;
}) {
  const hasSmall = Boolean(content.credit || content.accommodations);
  const hasLogos = content.showLockup || content.logos.length > 0;
  if (!hasSmall && !hasLogos) return null;
  const logoHeight = logoHeightU * canvasUnit(format);
  return (
    <div className={`t-footer ${row ? 't-footer--row' : ''} ${className}`} data-fit-region>
      {hasSmall && (
        <div className="t-small">
          {content.credit && (
            <div data-slot="smallPrint" data-field="imageCredit">
              {content.credit}
            </div>
          )}
          {content.accommodations && (
            <div data-slot="smallPrint" data-field="accommodations">
              {content.accommodations}
            </div>
          )}
        </div>
      )}
      {hasLogos && (
        <div className="t-logos" style={{ height: logoHeight }}>
          {content.showLockup && (
            <Lockup height={logoHeight} color={theme.logoVariant === 'light' ? '#FFFFFF' : '#000000'} />
          )}
          {content.logos.map((logo, i) => (
            <img key={i} src={logo.dataUrl} alt="" />
          ))}
        </div>
      )}
    </div>
  );
}

export function QrTile({
  content,
  theme,
  format,
  qrU,
  className = '',
}: {
  content: SignContent;
  theme: Theme;
  format: FormatPreset;
  qrU: number;
  className?: string;
}) {
  if (!content.qrUrl) return null;
  const total = qrTotalPx(content.qrUrl, qrSizePx(format, qrU));
  return (
    <div className={`t-qr ${className}`}>
      <div className="t-qr-tile">
        <QrCode value={content.qrUrl} size={total} dark={theme.qrDark} light={theme.qrTile} />
      </div>
    </div>
  );
}

/** A photo cropped to fill its box, centered on the focal point. Never has text on top. */
export function Photo({ content, className = '' }: { content: SignContent; className?: string }) {
  if (!content.photo) return null;
  const { x, y } = content.focus;
  return (
    <div className={`t-photo ${className}`}>
      <img src={content.photo.dataUrl} alt="" style={{ objectPosition: `${x * 100}% ${y * 100}%` }} />
    </div>
  );
}

export function Illustration({ content, className = '' }: { content: SignContent; className?: string }) {
  if (!content.illustration) return null;
  return (
    <div className={`t-illustration ${className}`}>
      <img src={content.illustration.dataUrl} alt="" />
    </div>
  );
}
