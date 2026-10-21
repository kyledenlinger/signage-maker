import { contrastRatio } from '../lib/contrast';

/**
 * Approved WF | ZSR Library logos (public/logos, from the library's brand files). Each lockup comes
 * horizontal or vertical, in five colorways. Sizes are the bundled PNGs, trimmed to the artwork.
 */
export type LockupOrientation = 'horizontal' | 'vertical';
export type Colorway = 'color' | 'reverse' | 'gold' | 'black' | 'white';
export type ColorwayChoice = Colorway | 'auto';

export interface Lockup {
  id: string;
  name: string;
  size: Record<LockupOrientation, [number, number]>;
}

export const LOCKUPS: Lockup[] = [
  {
    id: 'semiformal-zsr-library',
    name: 'Semiformal: Wake Forest ZSR Library',
    size: { horizontal: [2664, 400], vertical: [1409, 720] },
  },
  { id: 'semiformal-zsr', name: 'Semiformal: Wake Forest ZSR', size: { horizontal: [2035, 400], vertical: [933, 720] } },
  {
    id: 'formal',
    name: 'Formal: Wake Forest University Z. Smith Reynolds Library',
    size: { horizontal: [2286, 400], vertical: [1340, 720] },
  },
  { id: 'informal-zsr-library', name: 'Informal: ZSR Library', size: { horizontal: [2654, 400], vertical: [1675, 720] } },
  { id: 'informal-zsr', name: 'Informal: ZSR', size: { horizontal: [1276, 400], vertical: [712, 720] } },
];

export const DEFAULT_LOCKUP_ID = 'semiformal-zsr-library';

/** The logo's two inks: the WF mark and the wordmark. Old Gold is sampled from the artwork. */
const OLD_GOLD = '#9B7C37';
export const COLORWAYS: Record<Colorway, { name: string; mark: string; word: string }> = {
  color: { name: 'Color (gold and black)', mark: OLD_GOLD, word: '#000000' },
  reverse: { name: 'Reverse (gold and white)', mark: OLD_GOLD, word: '#FFFFFF' },
  gold: { name: 'Gold', mark: OLD_GOLD, word: OLD_GOLD },
  black: { name: 'Black', mark: '#000000', word: '#000000' },
  white: { name: 'White', mark: '#FFFFFF', word: '#FFFFFF' },
};

/** Contrast the logo needs against what's behind it: the WF mark as a graphic, the wordmark as text. */
export const LOGO_CONTRAST = { mark: 3, word: 4.5 };

export function findLockup(id: string): Lockup {
  return LOCKUPS.find((l) => l.id === id) ?? LOCKUPS[0];
}

export function colorwayReadable(colorway: Colorway, background: string): boolean {
  const { mark, word } = COLORWAYS[colorway];
  return contrastRatio(mark, background) >= LOGO_CONTRAST.mark && contrastRatio(word, background) >= LOGO_CONTRAST.word;
}

/**
 * The colorway for a background: the full-color logo when it reads (Reverse on dark, Color on
 * light), otherwise the one-color version with the most contrast.
 */
export function pickColorway(background: string): Colorway {
  const dark = contrastRatio('#FFFFFF', background) >= contrastRatio('#000000', background);
  const preferred: Colorway[] = dark ? ['reverse', 'white'] : ['color', 'black'];
  return preferred.find((c) => colorwayReadable(c, background)) ?? (dark ? 'white' : 'black');
}

export function logoUrl(lockupId: string, orientation: LockupOrientation, colorway: Colorway): string {
  return `${import.meta.env.BASE_URL}logos/${findLockup(lockupId).id}/${orientation}-${colorway}.png`;
}
