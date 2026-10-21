import { IMAGE_PX } from '../config/limits';
import type { ImageAsset } from '../schema/event';

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('This file could not be read as an image.'));
    img.src = src;
  });
}

/**
 * Reads an uploaded image into a data URL. Raster images over the long-edge limit are
 * downscaled, keeping the aspect ratio. SVGs are kept as-is.
 */
export async function readImageFile(file: File): Promise<ImageAsset> {
  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const width = img.naturalWidth || 1;
  const height = img.naturalHeight || 1;
  const longEdge = Math.max(width, height);
  const isSvg = file.type === 'image/svg+xml';

  if (isSvg || longEdge <= IMAGE_PX.downscaleAbove) {
    return { name: file.name, dataUrl, width, height, originalLongEdge: longEdge };
  }

  const scale = IMAGE_PX.downscaleAbove / longEdge;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not resize this image.');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const keepAlpha = file.type === 'image/png' || file.type === 'image/webp';
  const resized = keepAlpha ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.92);
  return {
    name: file.name,
    dataUrl: resized,
    width: canvas.width,
    height: canvas.height,
    originalLongEdge: longEdge,
  };
}
