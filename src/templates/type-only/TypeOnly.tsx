import { LAYOUT } from '../../config/layout';
import { signContent } from '../shared/content';
import { Backdrop, Details, Footer, QrTile, Title, WhenWhere } from '../shared/parts';
import { templateVars } from '../shared/vars';
import type { TemplateProps } from '../types';
import { TYPE_ONLY_LAYOUT as L, typeOnlyManifest } from './manifest';
import './type-only.css';

export function TypeOnly({ event, theme, format }: TemplateProps) {
  const c = signContent(event, format, typeOnlyManifest);
  return (
    <div
      className={`tpl to to--${format.orientation} ${c.background ? 'tpl--backdrop' : ''}`}
      style={templateVars(theme, format, {}, { backdrop: Boolean(c.background) })}
    >
      <Backdrop content={c} />
      <Title content={c} className="to-title" />
      <WhenWhere content={c} className="to-when" />
      <Details content={c} className="to-details" />
      <QrTile content={c} theme={theme} format={format} qrU={L.qrU} className="to-qr" />
      <Footer content={c} theme={theme} format={format} logoHeightU={LAYOUT.logoHeightU} className="to-footer" />
    </div>
  );
}
