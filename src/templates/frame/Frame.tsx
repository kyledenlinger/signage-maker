import { canvasUnit } from '../../config/formats';
import { LAYOUT } from '../../config/layout';
import { signContent } from '../shared/content';
import { Details, Footer, Photo, QrTile, Title, WhenWhere } from '../shared/parts';
import { templateVars } from '../shared/vars';
import type { TemplateProps } from '../types';
import { FRAME_LAYOUT as L, frameManifest } from './manifest';
import './frame.css';

export function Frame({ event, theme, format }: TemplateProps) {
  const c = signContent(event, format, frameManifest);
  const o = format.orientation;
  const vars = templateVars(theme, format, {
    '--fr-border': `${L.borderU * canvasUnit(format)}px`,
    '--fr-photo': L.photoShare[o],
  });
  return (
    <div className={`tpl fr ${o === 'landscape' ? 'fr--side' : 'fr--top'}`} style={vars}>
      <div className="fr-frame">
        <Photo content={c} className="fr-photo" />
      </div>
      <div className="fr-text" data-fit-region>
        <Title content={c} className="fr-title" />
        <WhenWhere content={c} className="fr-when" />
        <Details content={c} className="fr-details" />
        <QrTile content={c} theme={theme} format={format} qrU={L.qrU} className="fr-qr" />
        <Footer content={c} theme={theme} format={format} logoHeightU={LAYOUT.logoHeightU} row={o === 'square'} className="fr-footer" />
      </div>
    </div>
  );
}
