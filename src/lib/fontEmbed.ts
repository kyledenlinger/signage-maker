import { FONT_FACES } from '../config/fonts';

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

let cached: Promise<string> | null = null;

/** @font-face rules with the font files inlined, for embedding in an export capture. */
export function fontEmbedCss(): Promise<string> {
  cached ??= Promise.all(
    FONT_FACES.map(async (face) => {
      const response = await fetch(`${import.meta.env.BASE_URL}fonts/${face.file}`);
      if (!response.ok) throw new Error(`Could not load the font file ${face.file}.`);
      const url = await toDataUrl(await response.blob());
      return `@font-face { font-family: '${face.family}'; src: url(${url}) format('woff2'); font-weight: ${face.weight}; font-style: ${face.style}; }`;
    }),
  )
    .then((rules) => rules.join('\n'))
    .catch((e) => {
      cached = null;
      throw e;
    });
  return cached;
}
