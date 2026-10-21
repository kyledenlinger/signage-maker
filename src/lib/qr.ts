import QRCode from 'qrcode';
import { canvasUnit, type FormatPreset } from '../config/formats';
import { QR_RULES } from '../config/limits';

export interface QrMatrix {
  size: number;
  isDark: (row: number, col: number) => boolean;
}

export function qrMatrix(text: string): QrMatrix | null {
  if (!text) return null;
  try {
    const qr = QRCode.create(text, { errorCorrectionLevel: QR_RULES.errorCorrectionLevel });
    return { size: qr.modules.size, isDark: (r, c) => Boolean(qr.modules.get(r, c)) };
  } catch {
    return null;
  }
}

/** Minimum size of the code itself (excluding quiet zone), in px. */
export function minQrPx(format: FormatPreset): number {
  if (format.dpi) return QR_RULES.minPrintInches * format.dpi;
  return QR_RULES.minScreenFraction * Math.min(format.width, format.height);
}

/** The template's preferred size, raised to the minimum when needed. */
export function qrSizePx(format: FormatPreset, preferredU: number): number {
  return Math.max(preferredU * canvasUnit(format), minQrPx(format));
}
