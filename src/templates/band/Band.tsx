import { LAYOUT } from '../../config/layout';
import { signContent } from '../shared/content';
import { DateBlock, Details, Footer, Photo, QrTile, Title } from '../shared/parts';
import { templateVars } from '../shared/vars';
import type { TemplateProps } from '../types';
import { BAND_LAYOUT as L, bandManifest } from './manifest';
import './band.css';

export function Band({ event, theme, format }: TemplateProps) {
  const c = signContent(event, format, bandManifest);
  const o = format.orientation;
  const classes = ['tpl', 'bd', o === 'landscape' ? 'bd--wide' : 'bd--tall', c.photo ? 'bd--photo' : 'bd--plain'].join(' ');

  return (
    <div className={classes} style={templateVars(theme, format, { '--bd-band': c.photo ? L.bandHeight[o] : '100%' })}>
      <Photo content={c} className="bd-photo" />
      <div className="bd-band" data-fit-region>
        <div className="bd-head" data-fit-region>
          <Title content={c} />
          <DateBlock content={c} />
        </div>
        <Details content={c} className="bd-details" />
        <QrTile content={c} theme={theme} format={format} qrU={L.qrU} className="bd-qr" />
        <Footer content={c} theme={theme} format={format} logoHeightU={LAYOUT.logoHeightU} row={o !== 'portrait'} className="bd-footer" />
      </div>
    </div>
  );
}
