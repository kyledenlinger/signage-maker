import { signContent } from '../shared/content';
import { Details, Footer, Photo, QrTile, Title, WhenWhere } from '../shared/parts';
import { templateVars } from '../shared/vars';
import type { TemplateProps } from '../types';
import { SPLIT_LAYOUT as L, splitManifest } from './manifest';
import './split.css';

export function Split({ event, theme, format }: TemplateProps) {
  const c = signContent(event, format, splitManifest);
  const o = format.orientation;
  const classes = ['tpl', 'sp', o === 'landscape' ? 'sp--side' : 'sp--top', c.image ? 'sp--photo' : 'sp--plain']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={templateVars(theme, format, { '--sp-photo': L.photoShare[o] })}>
      {c.image ? <Photo content={c} className="sp-photo" /> : <div className="t-accent-bar" />}
      <div className="sp-panel" data-fit-region>
        <Title content={c} className="sp-title" />
        <WhenWhere content={c} className="sp-when" />
        <Details content={c} className="sp-details" />
        <QrTile content={c} theme={theme} format={format} qrU={L.qrU} className="sp-qr" />
        <Footer content={c} theme={theme} format={format} row={o === 'square'} className="sp-footer" />
      </div>
    </div>
  );
}
