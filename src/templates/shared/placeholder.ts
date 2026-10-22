import type { ImageAsset } from '../../schema/event';

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
<rect width="1600" height="1000" fill="#5b5f68"/>
<rect x="24" y="24" width="1552" height="952" fill="none" stroke="#ffffff" stroke-width="12" stroke-dasharray="48 28"/>
<g fill="#ffffff" font-family="Arial, Helvetica, sans-serif" text-anchor="middle">
<text x="800" y="470" font-size="96" font-weight="700">Photo or illustration goes here</text>
<text x="800" y="590" font-size="64">Preview only: add one in step 2, Image</text>
</g></svg>`;

/** Stands in for a missing photo in photo templates, in the preview only. Never exported. */
export const PLACEHOLDER_IMAGE: ImageAsset = {
  name: 'placeholder.svg',
  dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG)}`,
  width: 1600,
  height: 1000,
  originalLongEdge: 1600,
};
