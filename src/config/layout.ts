/** Layout tokens shared by all templates, in canvas units (u = 1% of the shorter edge). */
export const LAYOUT = {
  gapU: 3,
  logoHeightU: 6,
  qrTile: { radiusU: 1.5, paddingU: 0.8, borderU: 0.4 },
  accentBarU: 2,
  /**
   * Solid panels behind text over a background image. The panels already separate the blocks, so
   * the gap between them tightens.
   */
  panel: { paddingU: 1.5, radiusU: 1, gapU: 2 },
  /**
   * Photos give way before text shrinks: a template's photo share is its maximum, and the photo
   * shrinks toward this share of the canvas when the text needs room.
   */
  photoMinShare: '28%',
  /** Month under a stacked day number, relative to the date size. */
  dateMonthScale: 0.6,
};
