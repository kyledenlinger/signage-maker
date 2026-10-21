import { sampleEvent } from '../schema/defaults';
import type { EventData, ImageAsset } from '../schema/event';

/** A deterministic background: dark teal with soft orange shapes. */
export function fixtureBackground(): ImageAsset {
  const canvas = document.createElement('canvas');
  canvas.width = 2400;
  canvas.height = 2400;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#12343B';
  ctx.fillRect(0, 0, 2400, 2400);
  ctx.fillStyle = '#E8833A';
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.arc((i * 523) % 2400, (i * 811) % 2400, 120 + (i % 4) * 60, 0, Math.PI * 2);
    ctx.fill();
  }
  return { name: 'background.png', dataUrl: canvas.toDataURL('image/png'), width: 2400, height: 2400, originalLongEdge: 2400 };
}

/** A deterministic test photo drawn on a canvas. */
export function fixturePhoto(): ImageAsset {
  const canvas = document.createElement('canvas');
  canvas.width = 2400;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createLinearGradient(0, 0, 2400, 1600);
  gradient.addColorStop(0, '#2b4c7e');
  gradient.addColorStop(1, '#c8553d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2400, 1600);
  ctx.fillStyle = '#f2d0a4';
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(300 + i * 360, 800 + (i % 2) * 250, 140, 0, Math.PI * 2);
    ctx.fill();
  }
  return { name: 'fixture.png', dataUrl: canvas.toDataURL('image/png'), width: 2400, height: 1600, originalLongEdge: 2400 };
}

export type FixtureName = 'sample' | 'short' | 'long';

export function fixtureEvent(
  name: FixtureName,
  opts: {
    image: boolean;
    qr: boolean;
    templateId: string;
    themeId: string;
    background?: boolean;
    fontTitle?: string;
    fontBody?: string;
  },
): EventData {
  const base = sampleEvent();
  const event: EventData = {
    ...base,
    templateId: opts.templateId,
    themeId: opts.themeId,
    showQr: opts.qr,
    image: opts.image ? fixturePhoto() : null,
    imageDescription: opts.image ? 'Abstract shapes on a blue-to-orange gradient' : '',
    imageCredit: opts.image ? 'Photo: ZSR Library' : '',
    background: opts.background ? fixtureBackground() : null,
    fontTitle: opts.fontTitle ?? base.fontTitle,
    fontBody: opts.fontBody ?? base.fontBody,
  };
  if (name === 'short') {
    event.subtitle = '';
    event.description = '';
    event.highlights = event.highlights.slice(0, 3);
  }
  if (name === 'long') {
    event.title = 'An Extraordinarily Long Title for an Evening Lecture Series';
    event.subtitle = 'With a subtitle that goes on for quite a while, longer than recommended';
  }
  return event;
}
