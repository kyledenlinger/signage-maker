import { expect, test, type Page } from '@playwright/test';

const THEMES = ['black-gold', 'athletics-gold', 'light', 'high-contrast'];
const TEMPLATES = ['showcase', 'split', 'band', 'type-only', 'frame'];
const PRESETS = [
  'landscape-hd',
  'landscape-4k',
  'portrait-hd',
  'square',
  'social-portrait',
  'letter-poster',
  'tabloid-poster',
];

async function openMatrix(page: Page, theme: string, fixture: string, extra = '') {
  await page.goto(`/gallery.html?matrix=1&theme=${theme}&fixture=${fixture}&scale=0.12${extra}`);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('[data-cell][data-fits="pending"]')).toHaveCount(0);
  // 5 templates × 3 orientation classes × image on/off × QR on/off
  await expect(page.locator('[data-cell]')).toHaveCount(60);
}

/** Geometry problems: text, QR or logos outside the safe zone; text on top of a photo. */
async function layoutProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const problems: string[] = [];
    const TOL = 1.5;
    const inside = (r: DOMRect, box: { left: number; top: number; right: number; bottom: number }) =>
      r.left >= box.left - TOL && r.top >= box.top - TOL && r.right <= box.right + TOL && r.bottom <= box.bottom + TOL;
    const overlaps = (a: DOMRect, b: DOMRect) =>
      a.left < b.right - TOL && a.right > b.left + TOL && a.top < b.bottom - TOL && a.bottom > b.top + TOL;
    const textRect = (el: Element) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return range.getBoundingClientRect();
    };

    for (const cell of Array.from(document.querySelectorAll('[data-cell]'))) {
      const id = cell.getAttribute('data-cell');
      const root = cell.querySelector('.tpl') as HTMLElement;
      const rect = root.getBoundingClientRect();
      const scale = rect.width / root.offsetWidth;
      const style = getComputedStyle(root);
      const sx = parseFloat(style.getPropertyValue('--safe-x')) * scale;
      const sy = parseFloat(style.getPropertyValue('--safe-y')) * scale;
      const safe = { left: rect.left + sx, top: rect.top + sy, right: rect.right - sx, bottom: rect.bottom - sy };

      const texts = Array.from(root.querySelectorAll('[data-slot]'));
      for (const el of texts) {
        if (!inside(textRect(el), safe)) problems.push(`${id}: ${el.getAttribute('data-field')} outside safe zone`);
      }
      for (const el of Array.from(root.querySelectorAll('.t-qr-tile, .t-logos'))) {
        if (!inside(el.getBoundingClientRect(), safe)) problems.push(`${id}: ${el.className} outside safe zone`);
      }

      const band = root.querySelector('.bd-band');
      for (const photo of Array.from(root.querySelectorAll('.t-photo'))) {
        for (const el of texts) {
          const r = textRect(el);
          if (band) {
            if (!inside(r, band.getBoundingClientRect())) problems.push(`${id}: ${el.getAttribute('data-field')} off the band`);
          } else if (overlaps(r, photo.getBoundingClientRect())) {
            problems.push(`${id}: ${el.getAttribute('data-field')} on the photo`);
          }
        }
      }
    }
    return problems;
  });
}

for (const theme of THEMES) {
  test(`every template × orientation fits and stays in bounds (${theme}, short event)`, async ({ page }) => {
    await openMatrix(page, theme, 'short');
    const notFitting = await page.locator('[data-cell][data-fits="false"]').evaluateAll((els) =>
      els.map((e) => e.getAttribute('data-cell')),
    );
    expect(notFitting).toEqual([]);
    expect(await layoutProblems(page)).toEqual([]);
  });
}

for (const theme of THEMES) {
  test(`every template × orientation fits the full sample event (${theme})`, async ({ page }) => {
    await openMatrix(page, theme, 'sample');
    const notFitting = await page.locator('[data-cell][data-fits="false"]').evaluateAll((els) =>
      els.map((e) => e.getAttribute('data-cell')),
    );
    expect(notFitting).toEqual([]);
    expect(await layoutProblems(page)).toEqual([]);
  });
}

/** Text in backdrop mode must sit on an opaque panel, never directly on the background image. */
async function textOffPanels(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const problems: string[] = [];
    for (const root of Array.from(document.querySelectorAll('.tpl--backdrop'))) {
      const id = root.closest('[data-cell]')!.getAttribute('data-cell');
      for (const el of Array.from(root.querySelectorAll('[data-slot]'))) {
        let node: Element | null = el;
        let onPanel = false;
        while (node && node !== root) {
          const bg = getComputedStyle(node).backgroundColor;
          const alpha = bg.startsWith('rgba') ? parseFloat(bg.split(',')[3]) : bg === 'transparent' ? 0 : 1;
          if (alpha === 1) {
            onPanel = true;
            break;
          }
          if (alpha > 0) break; // see-through panels don't count
          node = node.parentElement;
        }
        if (!onPanel) problems.push(`${id}: ${el.getAttribute('data-field')} not on a solid panel`);
      }
    }
    return problems;
  });
}

/**
 * Square Showcase with a photo, a background and the full 40-word sample is over budget (and over the
 * 35-word glance limit): the app blocks it and says what to cut. A typical event fits everywhere.
 */
const OVER_BUDGET = /^showcase__square__.*__img1__qr1__bg1$/;

for (const theme of ['black-gold', 'light', 'from-images']) {
  test(`background image: text sits on solid panels and fits (${theme})`, async ({ page }) => {
    for (const fixture of ['short', 'sample']) {
      await openMatrix(page, theme, fixture, '&bg=1');
      // Showcase and Type only (and Frame without a photo, which becomes Type only) use the background.
      expect(await page.locator('.tpl--backdrop').count()).toBe(30);
      const notFitting = await page.locator('[data-cell][data-fits="false"]').evaluateAll((els) =>
        els.map((e) => e.getAttribute('data-cell')!),
      );
      if (fixture === 'short') expect(notFitting).toEqual([]);
      else for (const id of notFitting) expect(id).toMatch(OVER_BUDGET);
      const problems = (await layoutProblems(page)).filter((p) => !notFitting.some((id) => p.startsWith(id)));
      expect(problems).toEqual([]);
      expect(await textOffPanels(page)).toEqual([]);
    }
  });
}

test('the Match my images theme renders every template and fits', async ({ page }) => {
  await openMatrix(page, 'from-images', 'sample');
  const notFitting = await page.locator('[data-cell][data-fits="false"]').evaluateAll((els) =>
    els.map((e) => e.getAttribute('data-cell')),
  );
  expect(notFitting).toEqual([]);
  expect(await layoutProblems(page)).toEqual([]);
  // The theme really comes from the images: not the default black background.
  const bg = await page.locator('[data-cell] .tpl').first().evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe('rgb(0, 0, 0)');
});

test('rendered sizes keep the hierarchy and the floors', async ({ page }) => {
  await openMatrix(page, 'light', 'sample');
  const sizes = await page
    .locator('[data-cell]')
    .evaluateAll((els) => els.map((e) => JSON.parse(e.getAttribute('data-sizes')!) as Record<string, number>));
  for (const s of sizes) {
    expect(s.title).toBeGreaterThanOrEqual(7);
    expect(s.date).toBeGreaterThanOrEqual(4);
    expect(s.timeLocation).toBeGreaterThanOrEqual(4);
    expect(s.body).toBeGreaterThanOrEqual(2.5);
    expect(s.smallPrint).toBeGreaterThanOrEqual(2);
    expect(s.title).toBeGreaterThanOrEqual(s.date);
    expect(s.date).toBeGreaterThanOrEqual(s.timeLocation);
    expect(s.timeLocation).toBeGreaterThanOrEqual(s.body);
    expect(s.body).toBeGreaterThanOrEqual(s.smallPrint);
  }
});

test.describe('visual snapshots', () => {
  for (const template of TEMPLATES) {
    for (const preset of PRESETS) {
      test(`${template} · ${preset}`, async ({ page }) => {
        await page.goto(`/gallery.html?template=${template}&format=${preset}&image=1&qr=1&fixture=sample&scale=auto`);
        await page.evaluate(() => document.fonts.ready);
        const cell = page.locator('[data-cell]');
        await expect(cell).toHaveAttribute('data-fits', 'true');
        await expect(cell.locator('> div')).toHaveScreenshot(`${template}-${preset}.png`, { maxDiffPixelRatio: 0.01 });
      });
    }
  }

  // Background images (Showcase and Type only) and the Match my images theme.
  for (const [template, theme] of [
    ['showcase', 'black-gold'],
    ['type-only', 'light'],
    ['showcase', 'from-images'],
  ]) {
    for (const preset of ['landscape-hd', 'portrait-hd', 'square']) {
      test(`${template} · ${preset} · background · ${theme}`, async ({ page }) => {
        await page.goto(
          `/gallery.html?template=${template}&format=${preset}&theme=${theme}&image=0&qr=1&bg=1&fixture=sample&scale=auto`,
        );
        await page.evaluate(() => document.fonts.ready);
        const cell = page.locator('[data-cell]');
        await expect(cell).toHaveAttribute('data-fits', 'true');
        await expect(cell.locator('> div')).toHaveScreenshot(`${template}-${preset}-bg-${theme}.png`, {
          maxDiffPixelRatio: 0.01,
        });
      });
    }
  }
});
