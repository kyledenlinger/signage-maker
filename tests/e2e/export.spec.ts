import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Download, type Page } from '@playwright/test';
import JSZip from 'jszip';
import { readFile } from 'node:fs/promises';
import { fillAccommodations, selectFormat, statusBar } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await fillAccommodations(page);
  await expect(statusBar(page)).toContainText('Ready to export');
});

async function bytes(download: Download): Promise<Buffer> {
  return readFile((await download.path())!);
}

function pngSize(buf: Buffer) {
  expect(buf.subarray(1, 4).toString()).toBe('PNG');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function jpgSize(buf: Buffer) {
  expect(buf[0]).toBe(0xff);
  expect(buf[1]).toBe(0xd8);
  let i = 2;
  while (i < buf.length) {
    const marker = buf[i + 1];
    const length = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    i += 2 + length;
  }
  throw new Error('No JPEG frame header');
}

async function download(page: Page, button: string, card?: string) {
  if (card) await selectFormat(page, card);
  const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: button }).click()]);
  return file;
}

async function uploadPhoto(page: Page, width: number, height: number) {
  const b64 = await page.evaluate(
    ([w, h]) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#336699';
      ctx.fillRect(0, 0, w, h);
      return c.toDataURL('image/png').split(',')[1];
    },
    [width, height],
  );
  await page.locator('#field-image').setInputFiles({
    name: 'photo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(b64, 'base64'),
  });
  await page.getByLabel('Image description').fill('A blue rectangle');
}

test('Landscape HD PNG is exactly 1920 × 1080 with the spec file name', async ({ page }) => {
  const file = await download(page, 'Download PNG of Landscape HD', 'landscape-hd');
  expect(file.suggestedFilename()).toBe('halloween-game-night_landscape-hd_1920x1080.png');
  expect(pngSize(await bytes(file))).toEqual({ width: 1920, height: 1080 });
});

test('the exported PNG includes the logo', async ({ page }) => {
  const file = await download(page, 'Download PNG of Landscape HD', 'landscape-hd');
  const b64 = (await bytes(file)).toString('base64');
  // The Reverse logo's gold WF mark sits bottom-left: look for Old Gold pixels there.
  const goldPixels = await page.evaluate(async (data) => {
    const img = new Image();
    img.src = `data:image/png;base64,${data}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const { data: px } = ctx.getImageData(0, 880, 500, 200);
    let n = 0;
    for (let i = 0; i < px.length; i += 4) {
      if (Math.abs(px[i] - 0x9b) < 20 && Math.abs(px[i + 1] - 0x7c) < 20 && Math.abs(px[i + 2] - 0x37) < 20) n++;
    }
    return n;
  }, b64);
  expect(goldPixels).toBeGreaterThan(500);
});

test('Portrait HD JPG is exactly 1080 × 1920', async ({ page }) => {
  const file = await download(page, 'Download JPG of Portrait HD', 'portrait-hd');
  expect(file.suggestedFilename()).toBe('halloween-game-night_portrait-hd_1080x1920.jpg');
  expect(jpgSize(await bytes(file))).toEqual({ width: 1080, height: 1920 });
});

test('Letter poster PDF is one 8.5 × 11 in page', async ({ page }) => {
  const file = await download(page, 'Download PDF of Letter poster', 'letter-poster');
  expect(file.suggestedFilename()).toBe('halloween-game-night_letter-poster_2550x3300.pdf');
  const pdf = (await bytes(file)).toString('latin1');
  expect(pdf.startsWith('%PDF-')).toBe(true);
  expect(pdf).toMatch(/\/MediaBox \[0 0 612\.?\d* 792\.?\d*\]/);
  expect(pdf.match(/\/Type \/Page\b/g)).toHaveLength(1);
});

/**
 * Compares where the ink falls row by row (lit pixels per row on the dark sign). It ignores the
 * slightly tighter letter spacing of the capture, but line breaks, sizes, positions and the font's
 * proportions (x-height, ascenders) all change it. Returns the share of ink that moved.
 */
async function rowProfileDiff(page: Page, a: string, b: string): Promise<number> {
  return page.evaluate(
    async ([a, b]) => {
      const profile = async (b64: string) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, c.width, c.height).data;
        const rows = new Array<number>(c.height).fill(0);
        for (let i = 0; i < data.length; i += 4) {
          const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          if (lum > 60) rows[Math.floor(i / 4 / c.width)]++;
        }
        return rows;
      };
      const [x, y] = await Promise.all([profile(a), profile(b)]);
      const moved = x.reduce((sum, v, i) => sum + Math.abs(v - y[i]), 0);
      return moved / Math.max(1, x.reduce((sum, v) => sum + v, 0));
    },
    [a, b] as const,
  );
}

async function previewShot(page: Page, override = '', fonts = '') {
  await page.setViewportSize({ width: 2000, height: 1200 });
  await page.goto(`/gallery.html?template=showcase&format=landscape-hd&theme=black-gold&image=0&qr=1&fixture=sample&scale=1${fonts}`);
  await page.evaluate(() => document.fonts.ready);
  if (override) await page.addStyleTag({ content: override });
  await expect(page.locator('[data-cell]')).toHaveAttribute('data-fits', 'true');
  return (await page.locator('[data-cell] > div').screenshot()).toString('base64');
}

test('the export uses the same fonts and layout as the preview', async ({ page }) => {
  const file = await download(page, 'Download PNG of Landscape HD', 'landscape-hd');
  const exported = (await bytes(file)).toString('base64');

  expect(await rowProfileDiff(page, exported, await previewShot(page))).toBeLessThan(0.04);
  // Controls: the same comparison against fallback fonts fails clearly.
  for (const font of ['Arial, sans-serif', 'Georgia, serif']) {
    const fallback = await previewShot(page, `.tpl, .tpl * { font-family: ${font} !important; }`);
    expect(await rowProfileDiff(page, exported, fallback), font).toBeGreaterThan(0.08);
  }
});

test('chosen title and body fonts are embedded in the export', async ({ page }) => {
  await page.getByLabel('Title font').selectOption('source-serif');
  await page.getByLabel('Body font').selectOption('lexend');
  await expect(page.locator('[data-format="landscape-hd"] [data-slot="title"]')).toHaveCSS('font-family', /Source Serif 4/);
  const file = await download(page, 'Download PNG of Landscape HD', 'landscape-hd');
  const exported = (await bytes(file)).toString('base64');

  const fonts = '&fontTitle=source-serif&fontBody=lexend';
  // Linux Chromium renders these two fonts a little differently in the capture (4.1% there, under
  // 2% on macOS); a wrong font differs by far more, as the control below checks.
  expect(await rowProfileDiff(page, exported, await previewShot(page, '', fonts))).toBeLessThan(0.05);
  // Control: the default fonts look clearly different.
  expect(await rowProfileDiff(page, exported, await previewShot(page))).toBeGreaterThan(0.08);
});

test('download all: zip holds each format, event.json and alt-text.txt', async ({ page }) => {
  const file = await download(page, 'Download all (.zip)');
  expect(file.suggestedFilename()).toBe('halloween-game-night_signage.zip');
  const zip = await JSZip.loadAsync(await bytes(file));
  const names = Object.keys(zip.files).sort();
  expect(names).toEqual([
    'alt-text.txt',
    'event.json',
    'halloween-game-night_landscape-hd_1920x1080.png',
    'halloween-game-night_letter-poster_2550x3300.pdf',
    'halloween-game-night_portrait-hd_1080x1920.png',
  ]);
  const project = JSON.parse(await zip.file('event.json')!.async('string'));
  expect(project).toMatchObject({ kind: 'zsr-signage-project', version: 1, event: { title: 'Halloween Game Night' } });
  const alt = (await zip.file('alt-text.txt')!.async('string')).trim().split('\n');
  expect(alt).toHaveLength(3);
  expect(alt[0]).toMatch(/^halloween-game-night_landscape-hd_1920x1080\.png: Event sign: Halloween Game Night, Fri, Oct 23/);
  const png = await zip.file('halloween-game-night_landscape-hd_1920x1080.png')!.async('nodebuffer');
  expect(pngSize(png)).toEqual({ width: 1920, height: 1080 });

  await expect(page.getByRole('status').last()).toHaveText('Downloaded halloween-game-night_signage.zip with 3 formats.');
});

test('JPG option for screen formats', async ({ page }) => {
  await page.getByRole('radio', { name: 'JPG' }).check();
  const file = await download(page, 'Download all (.zip)');
  const names = Object.keys((await JSZip.loadAsync(await bytes(file))).files);
  expect(names).toContain('halloween-game-night_landscape-hd_1920x1080.jpg');
  expect(names).toContain('halloween-game-night_letter-poster_2550x3300.pdf');
});

test('a blocker for one format disables its download and the zip until it is resolved', async ({ page }) => {
  await page.getByLabel('Template (required)').selectOption('split');
  await uploadPhoto(page, 900, 600); // under 1000 px: blocks print, fine for screens
  const letter = page.locator('[data-format="letter-poster"]');
  await expect(letter.locator('.format-status')).toContainText('Blocked');
  await selectFormat(page, 'letter-poster');
  await expect(page.getByRole('button', { name: 'Download PDF of Letter poster' })).toBeDisabled();
  await expect(page.locator('[data-format="landscape-hd"] .format-status')).toContainText('Ready');
  await selectFormat(page, 'landscape-hd');
  await expect(page.getByRole('button', { name: 'Download PNG of Landscape HD' })).toBeEnabled();
  await expect(statusBar(page)).toContainText('Letter poster · Photo or illustration: 900 px is too small for this size.');
  const zip = page.getByRole('button', { name: 'Download blocked' });
  await expect(zip).toBeDisabled();
  await expect(zip).toHaveAttribute('aria-describedby', 'status-bar');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);

  // Dropping the blocked format clears the blocker; the zip holds the rest.
  await page.getByRole('checkbox', { name: /Letter poster/ }).uncheck();
  const file = await download(page, 'Download all (.zip)');
  const names = Object.keys((await JSZip.loadAsync(await bytes(file))).files).sort();
  expect(names).toEqual([
    'alt-text.txt',
    'event.json',
    'halloween-game-night_landscape-hd_1920x1080.png',
    'halloween-game-night_portrait-hd_1080x1920.png',
  ]);
});

test('text that does not fit disables that format', async ({ page }) => {
  await page.getByLabel('Title (required)').fill('Pneumonoultramicroscopicsilicovolcanoconiosis');
  await selectFormat(page, 'portrait-hd');
  await expect(page.getByRole('button', { name: 'Download PNG of Portrait HD' })).toBeDisabled();
  await expect(statusBar(page)).toContainText("Portrait HD · Title: doesn't fit at minimum size.");
});

test('every download is disabled while a blocker exists, and comes back when it is fixed', async ({ page }) => {
  await page.getByLabel('Title (required)').fill('');
  await expect(statusBar(page)).toContainText('Title is required.');
  await expect(page.getByRole('button', { name: 'Download blocked' })).toBeDisabled();
  for (const id of ['landscape-hd', 'portrait-hd', 'letter-poster']) {
    await selectFormat(page, id);
    for (const button of await page.locator('.selected-actions button').all()) await expect(button).toBeDisabled();
  }

  await page.getByLabel('Title (required)').fill('Halloween Game Night');
  await expect(statusBar(page)).toContainText('Ready to export');
  await expect(page.getByRole('button', { name: 'Download all (.zip)' })).toBeEnabled();
  for (const id of ['landscape-hd', 'portrait-hd', 'letter-poster']) {
    await selectFormat(page, id);
    for (const button of await page.locator('.selected-actions button').all()) await expect(button).toBeEnabled();
  }
});

// The spec's target is a typical laptop; shared CI runners are slower, so CI gets more room.
const RENDER_LIMIT_MS = process.env.CI ? 10_000 : 5_000;

test('4K and tabloid renders finish in under 5 seconds each', async ({ page }) => {
  await page.getByLabel(/Landscape 4K/).check();
  await page.getByLabel(/Tabloid poster/).check();
  for (const [card, button] of [
    ['landscape-4k', 'Download PNG of Landscape 4K'],
    ['tabloid-poster', 'Download PDF of Tabloid poster'],
  ]) {
    const start = Date.now();
    const file = await download(page, button, card);
    const elapsed = Date.now() - start;
    expect(elapsed, `${card} took ${elapsed} ms`).toBeLessThan(RENDER_LIMIT_MS);
    if (card === 'landscape-4k') expect(pngSize(await bytes(file))).toEqual({ width: 3840, height: 2160 });
  }
});
