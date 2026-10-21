import { readFileSync } from 'node:fs';

/** Width and height of a PNG file, read from its header (tests only). */
export function imageSize(path: string): [number, number] {
  const buf = readFileSync(path);
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}
