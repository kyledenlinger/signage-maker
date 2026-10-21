import { useMemo } from 'react';
import { QR_RULES } from '../../config/limits';
import { qrMatrix } from '../../lib/qr';

interface Props {
  value: string;
  /** Size of the code including its quiet zone, in px. */
  size: number;
  dark: string;
  light: string;
}

/** QR code as SVG, always dark-on-light with a 4-module quiet zone. */
export function QrCode({ value, size, dark, light }: Props) {
  const matrix = useMemo(() => qrMatrix(value), [value]);
  if (!matrix) return null;
  const quiet = QR_RULES.quietZoneModules;
  const total = matrix.size + quiet * 2;
  let path = '';
  for (let r = 0; r < matrix.size; r++) {
    for (let c = 0; c < matrix.size; c++) {
      if (matrix.isDark(r, c)) path += `M${c + quiet} ${r + quiet}h1v1h-1z`;
    }
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${total} ${total}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <rect width={total} height={total} fill={light} />
      <path d={path} fill={dark} />
    </svg>
  );
}

/** Size including the quiet zone for a code whose modules span `codePx`. */
export function qrTotalPx(value: string, codePx: number): number {
  const matrix = qrMatrix(value);
  if (!matrix) return codePx;
  return (codePx * (matrix.size + QR_RULES.quietZoneModules * 2)) / matrix.size;
}
