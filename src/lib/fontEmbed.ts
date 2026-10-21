import { FONT_FACES, findFont } from '../config/fonts';

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

const cache = new Map<string, Promise<string>>();

/** One @font-face rule with the font file inlined. */
function faceRule(face: (typeof FONT_FACES)[number]): Promise<string> {
  let rule = cache.get(face.file);
  if (!rule) {
    rule = fetch(`${import.meta.env.BASE_URL}fonts/${face.file}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load the font file ${face.file}.`);
        return response.blob();
      })
      .then(toDataUrl)
      .then(
        (url) =>
          `@font-face { font-family: '${face.family}'; src: url(${url}) format('woff2'); font-weight: ${face.weight}; font-style: ${face.style}; }`,
      )
      .catch((e) => {
        cache.delete(face.file);
        throw e;
      });
    cache.set(face.file, rule);
  }
  return rule;
}

/** @font-face rules, with files inlined, for the given font ids: what an export capture embeds. */
export async function fontEmbedCss(fontIds: string[]): Promise<string> {
  const families = new Set(fontIds.map((id) => findFont(id).family));
  const faces = FONT_FACES.filter((f) => families.has(f.family) && f.style === 'normal');
  return (await Promise.all(faces.map(faceRule))).join('\n');
}

/** Makes sure the browser has a font's regular and bold faces before anything measures text. */
export async function loadFonts(fontIds: string[]): Promise<void> {
  const families = [...new Set(fontIds.map((id) => findFont(id).family))];
  await Promise.all(families.flatMap((family) => [400, 700].map((w) => document.fonts.load(`${w} 40px "${family}"`))));
}
