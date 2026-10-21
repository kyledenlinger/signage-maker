import type { CSSProperties } from 'react';
import { canvasUnit } from '../../config/formats';
import { cleanUrl, formatDateInline, formatDateStacked, formatTimeRange, normalizeUrl } from '../../lib/format';
import { qrSizePx } from '../../lib/qr';
import { Lockup } from '../shared/Lockup';
import { QrCode, qrTotalPx } from '../shared/QrCode';
import { templateVars } from '../shared/vars';
import type { TemplateProps } from '../types';
import { SHOWCASE_LAYOUT as L, showcaseManifest } from './manifest';
import './showcase.css';

export function Showcase({ event, theme, format }: TemplateProps) {
  const u = canvasUnit(format);
  const orientation = format.orientation;
  const layout = orientation === 'landscape' ? 'landscape' : 'portrait';

  const qrUrl = event.showQr ? normalizeUrl(event.url) : null;
  const shownUrl = event.displayUrl.trim() || (event.url.trim() ? cleanUrl(event.url) : '');
  const art = event.illustration ?? event.image;
  const artIsPhoto = !event.illustration && !!event.image;

  const dateStyle = event.dateStyle === 'auto' ? L.autoDateStyle[orientation] : event.dateStyle;
  const stacked = !event.recurringNote.trim() && dateStyle === 'stacked' ? formatDateStacked(event.date) : null;
  const dateText = event.recurringNote.trim() || formatDateInline(event.date);
  const time = formatTimeRange(event.startTime, event.endTime);
  const highlights = event.highlights.map((h) => h.value.trim()).filter(Boolean);
  const showDescription = L.showDescription[orientation] && event.description.trim();

  const qrCode = qrUrl ? qrSizePx(format, L.qrU) : 0;
  const qrTotal = qrUrl ? qrTotalPx(qrUrl, qrCode) : 0;
  const logoHeight = L.logoHeightU * u;

  const style = {
    ...templateVars(showcaseManifest, theme, format),
    '--sc-gap': `${L.gapU * u}px`,
    '--sc-cols': layout === 'landscape' ? L.landscapeColumns : L.portraitColumns,
    '--sc-month-scale': String(L.stackedMonthScale),
    '--sc-tile-radius': `${L.tile.radiusU * u}px`,
    '--sc-tile-pad': `${L.tile.paddingU * u}px`,
    '--sc-tile-border': `${L.tile.borderU * u}px`,
    '--sc-logo-h': `${logoHeight}px`,
  } as CSSProperties;

  const classes = ['sc', `sc--${layout}`, art ? 'sc--art' : '', qrUrl ? 'sc--qr' : ''].filter(Boolean).join(' ');

  return (
    <div className={classes} style={style}>
      <div className="sc-title">{event.title}</div>

      <div className="sc-date">
        {stacked ? (
          <>
            <span className="sc-date-day">{stacked.day}</span>
            <span className="sc-date-month">{stacked.month}</span>
          </>
        ) : (
          <span>{dateText}</span>
        )}
      </div>

      {art && (
        <div className={`sc-art ${artIsPhoto ? 'sc-art--photo' : ''}`}>
          <img src={art.dataUrl} alt="" />
        </div>
      )}

      {qrUrl && (
        <div className="sc-qr">
          <div className="sc-qr-tile">
            <QrCode value={qrUrl} size={qrTotal} dark={theme.qrDark} light={theme.qrTile} />
          </div>
        </div>
      )}

      <div className="sc-details">
        {event.subtitle.trim() && <div className="sc-body sc-tagline">{event.subtitle}</div>}
        {(time || event.location.trim()) && (
          <div className="sc-emphasis">
            {time && <div>{time}</div>}
            {event.location.trim() && <div>{event.location}</div>}
          </div>
        )}
        {highlights.length > 0 && (
          <ul className="sc-body sc-highlights">
            {highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        )}
        {showDescription && <div className="sc-body">{event.description}</div>}
        {event.callToAction.trim() && <div className="sc-body sc-cta">{event.callToAction}</div>}
        {shownUrl && <div className="sc-body">{shownUrl}</div>}
      </div>

      <div className="sc-footer">
        {(event.imageCredit.trim() || (event.showAccommodations && event.accommodations.trim())) && (
          <div className="sc-small">
            {event.imageCredit.trim() && art && artIsPhoto && <div>{event.imageCredit}</div>}
            {event.showAccommodations && event.accommodations.trim() && <div>{event.accommodations}</div>}
          </div>
        )}
        {(event.showLockup || event.logos.length > 0) && (
          <div className="sc-logos">
            {event.showLockup && (
              <Lockup height={logoHeight} color={theme.logoVariant === 'light' ? '#FFFFFF' : '#000000'} />
            )}
            {event.logos.map((logo, i) => (
              <img key={i} src={logo.dataUrl} alt="" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
