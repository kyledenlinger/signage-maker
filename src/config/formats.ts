export type OrientationClass = 'landscape' | 'portrait' | 'square';
export type FileType = 'png' | 'jpg' | 'pdf';

export interface FormatPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  orientation: OrientationClass;
  /** Inset in px from each edge. Text, QR codes and logos stay inside it. */
  safeZone: { x: number; y: number };
  fileTypes: FileType[];
  /** Set for print presets; used for physical minimums (QR size, safe zone). */
  dpi?: number;
  custom?: boolean;
}

const SCREEN_SAFE_FRACTION = 0.05;
const PRINT_DPI = 300;
const PRINT_SAFE_INCHES = 0.5;

function screen(
  id: string,
  name: string,
  width: number,
  height: number,
  orientation: OrientationClass,
): FormatPreset {
  return {
    id,
    name,
    width,
    height,
    orientation,
    safeZone: {
      x: Math.round(width * SCREEN_SAFE_FRACTION),
      y: Math.round(height * SCREEN_SAFE_FRACTION),
    },
    fileTypes: ['png', 'jpg'],
  };
}

function print(id: string, name: string, widthIn: number, heightIn: number): FormatPreset {
  const inset = PRINT_SAFE_INCHES * PRINT_DPI;
  return {
    id,
    name,
    width: widthIn * PRINT_DPI,
    height: heightIn * PRINT_DPI,
    orientation: widthIn === heightIn ? 'square' : widthIn > heightIn ? 'landscape' : 'portrait',
    safeZone: { x: inset, y: inset },
    fileTypes: ['pdf', 'png'],
    dpi: PRINT_DPI,
  };
}

export const FORMAT_PRESETS: FormatPreset[] = [
  screen('landscape-hd', 'Landscape HD', 1920, 1080, 'landscape'),
  screen('landscape-4k', 'Landscape 4K', 3840, 2160, 'landscape'),
  screen('portrait-hd', 'Portrait HD', 1080, 1920, 'portrait'),
  screen('square', 'Square', 1080, 1080, 'square'),
  screen('social-portrait', 'Social portrait', 1080, 1350, 'portrait'),
  print('letter-poster', 'Letter poster', 8.5, 11),
  print('tabloid-poster', 'Tabloid poster', 11, 17),
];

/** The three formats ZSR already produces. */
export const DEFAULT_FORMAT_IDS = ['landscape-hd', 'portrait-hd', 'letter-poster'];

export function findFormat(id: string): FormatPreset | undefined {
  return FORMAT_PRESETS.find((f) => f.id === id);
}

/** Size limits for custom presets, in px. */
export const CUSTOM_SIZE_PX = { min: 200, max: 8000 };

export interface CustomFormatInput {
  name: string;
  width: number;
  height: number;
  orientation: OrientationClass;
}

/** The orientation class a size most likely belongs to. */
export function suggestOrientation(width: number, height: number): OrientationClass {
  if (width === height) return 'square';
  return width > height ? 'landscape' : 'portrait';
}

/** A custom screen preset: 5% safe zone, PNG and JPG, like the built-in screen presets. */
export function customFormat(input: CustomFormatInput, idSlug: string): FormatPreset {
  return {
    ...screen(`custom-${idSlug}`, input.name.trim(), input.width, input.height, input.orientation),
    custom: true,
  };
}

/** Canvas unit: 1% of the shorter edge, in px. */
export function canvasUnit(format: Pick<FormatPreset, 'width' | 'height'>): number {
  return Math.min(format.width, format.height) / 100;
}
