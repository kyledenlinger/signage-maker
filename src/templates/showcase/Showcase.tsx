import { LAYOUT } from '../../config/layout';
import { signContent } from '../shared/content';
import { DateBlock, Details, Footer, Illustration, Photo, QrTile, Title } from '../shared/parts';
import { templateVars } from '../shared/vars';
import type { TemplateProps } from '../types';
import { SHOWCASE_LAYOUT as L, showcaseManifest } from './manifest';
import './showcase.css';

export function Showcase({ event, theme, format }: TemplateProps) {
  const c = signContent(event, format, showcaseManifest);
  const o = format.orientation;
  const layout = o === 'landscape' ? 'landscape' : 'portrait';
  const hasArt = Boolean(c.illustration || c.photo);
  const columns = o === 'landscape' ? L.landscapeColumns : o === 'square' ? L.squareColumns : L.portraitColumns;
  const classes = ['tpl', 'sc', `sc--${layout}`, hasArt && 'sc--art', c.qrUrl && 'sc--qr'].filter(Boolean).join(' ');

  return (
    <div className={classes} style={templateVars(theme, format, { '--sc-cols': columns })}>
      <Title content={c} className="sc-title" />
      <DateBlock content={c} className="sc-date" />
      {c.illustration ? (
        <Illustration content={c} className="sc-art" />
      ) : (
        <Photo content={c} className="sc-art" />
      )}
      <QrTile content={c} theme={theme} format={format} qrU={L.qrU} className="sc-qr" />
      <Details content={c} className="sc-details" />
      <Footer content={c} theme={theme} format={format} logoHeightU={LAYOUT.logoHeightU} className="sc-footer" />
    </div>
  );
}
