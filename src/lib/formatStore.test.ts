import { describe, expect, it } from 'vitest';
import { customFormat } from '../config/formats';
import { allFormats, mergeCustomFormats, parseCustomFormat, setCustomFormats } from './formatStore';

describe('custom presets', () => {
  const lobby = customFormat({ name: 'Lobby screen', width: 1366, height: 768, orientation: 'landscape' }, 'lobby-screen');

  it('work like screen presets with a 5% safe zone', () => {
    expect(lobby).toMatchObject({ id: 'custom-lobby-screen', safeZone: { x: 68, y: 38 }, fileTypes: ['png', 'jpg'], custom: true });
  });

  it('are validated when read back', () => {
    expect(parseCustomFormat(JSON.parse(JSON.stringify(lobby)))).toEqual(lobby);
    expect(parseCustomFormat({ ...lobby, width: 50 })).toBeNull();
    expect(parseCustomFormat({ ...lobby, id: 'landscape-hd' })).toBeNull();
    expect(parseCustomFormat({ ...lobby, orientation: 'diagonal' })).toBeNull();
  });

  it('merge from a project without duplicating', () => {
    setCustomFormats([]);
    mergeCustomFormats([lobby, lobby, { junk: true }]);
    expect(allFormats().filter((f) => f.custom)).toEqual([lobby]);
    setCustomFormats([]);
  });
});
