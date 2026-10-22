import { signContent } from '../shared/content';
import { Backdrop, Details, Footer, Photo, QrTile, Subtitle, Title, WhenWhere } from '../shared/parts';
import { templateVars } from '../shared/vars';
import type { TemplateProps } from '../types';
import { SHOWCASE_LAYOUT as L, showcaseManifest } from './manifest';
import './showcase.css';

export function Showcase({ event, theme, format }: TemplateProps) {
  const c = signContent(event, format, showcaseManifest);
  const o = format.orientation;
  const layout = o === 'landscape' ? 'landscape' : 'portrait';
  const hasArt = Boolean(c.image);
  const columns = o === 'landscape' ? L.landscapeColumns : o === 'square' ? L.squareColumns : L.portraitColumns;
  const classes = ['tpl', 'sc', `sc--${layout}`, hasArt && 'sc--art', c.qrUrl && 'sc--qr', c.background && 'tpl--backdrop']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={templateVars(theme, format, { '--sc-cols': columns }, { backdrop: Boolean(c.background) })}>
      <Backdrop content={c} />
      <Title content={c} className="sc-title" />
      {layout === 'portrait' && <Subtitle content={c} className="sc-subtitle" />}
      <WhenWhere content={c} className="sc-when" />
      <Photo content={c} className="sc-art" />
      <QrTile content={c} theme={theme} format={format} qrU={L.qrU} className="sc-qr" />
      <Details content={c} className="sc-details" subtitle={layout === 'landscape'} />
      <Footer content={c} theme={theme} format={format} row={o === 'square'} className="sc-footer" />
    </div>
  );
}
