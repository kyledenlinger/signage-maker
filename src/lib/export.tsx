import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { FileType, FormatPreset } from '../config/formats';
import { findTheme } from '../config/themes';
import type { EventData } from '../schema/event';
import { fontEmbedCss } from './fontEmbed';

export function prefetchFonts() {
  void fontEmbedCss().catch(() => undefined);
}
import { TemplateRenderer, type FitReport } from '../templates/TemplateRenderer';

export const JPG_QUALITY = 0.92;
/** Print PDFs embed a high-quality JPEG: embedding a 300 dpi PNG in jsPDF is several times slower. */
const PDF_IMAGE_QUALITY = 0.95;

export interface RenderedFormat {
  canvas: HTMLCanvasElement;
  report: FitReport;
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Renders one format off-screen at its true pixel size, through the same TemplateRenderer the
 * preview uses, and rasterizes it. Waits for fonts and images first so the capture matches the
 * preview exactly.
 */
export async function renderFormat(event: EventData, format: FormatPreset): Promise<RenderedFormat> {
  const stage = document.createElement('div');
  Object.assign(stage.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: `${format.width}px`,
    height: `${format.height}px`,
    pointerEvents: 'none',
  });
  stage.setAttribute('aria-hidden', 'true');
  document.body.append(stage);
  const root = createRoot(stage);
  let report: FitReport | null = null;
  const theme = findTheme(event.themeId);

  try {
    flushSync(() =>
      root.render(
        <TemplateRenderer
          event={event}
          theme={theme}
          format={format}
          onFit={(r) => {
            report = r;
          }}
        />,
      ),
    );
    await document.fonts.ready;
    await Promise.all(Array.from(stage.querySelectorAll('img')).map((img) => img.decode().catch(() => undefined)));
    await nextFrame();
    await nextFrame();

    const node = stage.firstElementChild as HTMLElement;
    const canvas = await toCanvas(node, {
      width: format.width,
      height: format.height,
      canvasWidth: format.width,
      canvasHeight: format.height,
      pixelRatio: 1,
      skipAutoScale: true,
      backgroundColor: theme.background,
      fontEmbedCSS: await fontEmbedCss(),
    });
    if (!report) throw new Error('The sign did not finish laying out.');
    return { canvas, report };
  } finally {
    root.unmount();
    stage.remove();
  }
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the image.'))), type, quality),
  );
}

/** Encodes a rendered sign. Canvas output is sRGB. */
export async function encode(canvas: HTMLCanvasElement, type: FileType, format: FormatPreset): Promise<Blob> {
  if (type === 'png') return canvasBlob(canvas, 'image/png');
  if (type === 'jpg') return canvasBlob(canvas, 'image/jpeg', JPG_QUALITY);

  const dpi = format.dpi ?? 300;
  const width = format.width / dpi;
  const height = format.height / dpi;
  const pdf = new jsPDF({
    unit: 'in',
    format: [width, height],
    orientation: width > height ? 'landscape' : 'portrait',
    compress: true,
  });
  pdf.addImage(canvas.toDataURL('image/jpeg', PDF_IMAGE_QUALITY), 'JPEG', 0, 0, width, height);
  return pdf.output('blob');
}

export async function zipFiles(files: { name: string; data: Blob | string }[]): Promise<Blob> {
  const zip = new JSZip();
  for (const file of files) zip.file(file.name, file.data);
  return zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
