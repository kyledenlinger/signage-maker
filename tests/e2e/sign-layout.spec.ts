import { expect, test, type Page } from '@playwright/test';
import { fillAccommodations, openDetails, selectFormat } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready.then(() => true));
});

const stage = (page: Page) => page.locator('.stage .tpl');

test('highlight separators lead the next item, so no line ends in a dot', async ({ page }) => {
  await selectFormat(page, 'portrait-hd');
  const list = stage(page).locator('.t-highlights');
  await expect(list).not.toHaveClass(/t-highlights--stacked/);
  const lines = await list.evaluate((ul) =>
    Array.from(ul.children).map((li) => ({
      before: getComputedStyle(li, '::before').content,
      after: getComputedStyle(li, '::after').content,
      top: Math.round(li.getBoundingClientRect().top),
    })),
  );
  expect(lines[0].before).toBe('none');
  for (const line of lines.slice(1)) expect(line.before).toBe('"· "');
  for (const line of lines) expect(line.after).toBe('none');
  // The sample wraps onto a second line, which starts with a leading dot.
  expect(new Set(lines.map((l) => l.top)).size).toBe(2);
});

test('highlights that run to three or more lines stack as a list', async ({ page }) => {
  // Landscape HD's details column is narrow: the sample's five highlights stack.
  const list = stage(page).locator('.t-highlights');
  await expect(list).toHaveClass(/t-highlights--stacked/);
  const before = await list.locator('li').nth(1).evaluate((li) => getComputedStyle(li, '::before').content);
  expect(before).toBe('none');

  // Fewer highlights fit on one line: back to a run with separators.
  await openDetails(page);
  for (let i = 5; i >= 3; i--) await page.getByRole('button', { name: `Remove highlight ${i}` }).click();
  await expect(list).not.toHaveClass(/t-highlights--stacked/);
});

test('portrait Showcase: the subtitle sits right under the title; spare space is above the footer', async ({ page }) => {
  for (const id of ['portrait-hd', 'letter-poster']) {
    await selectFormat(page, id);
    const gaps = await stage(page).evaluate((root) => {
      const rect = (sel: string) => root.querySelector(sel)!.getBoundingClientRect();
      const title = rect('[data-slot="title"]');
      const subtitle = rect('[data-field="subtitle"]');
      const details = rect('.sc-details .t-details-body');
      const footer = rect('.sc-footer .t-footer-body');
      const scale = root.getBoundingClientRect().width / (root as HTMLElement).offsetWidth;
      return { underTitle: (subtitle.top - title.bottom) / scale, aboveFooter: (footer.top - details.bottom) / scale };
    });
    expect(gaps.underTitle).toBeLessThan(80);
    expect(gaps.aboveFooter).toBeGreaterThan(gaps.underTitle);
  }
});

test('the accommodations line is at least as large as the URL line', async ({ page }) => {
  for (const id of ['landscape-hd', 'portrait-hd', 'letter-poster']) {
    await selectFormat(page, id);
    const [access, url] = await Promise.all(
      ['[data-field="accommodations"]', '[data-field="url"]'].map((sel) =>
        stage(page).locator(sel).evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
      ),
    );
    expect(access).toBeGreaterThanOrEqual(url);
  }
});

test('in the preview, a field still holding [...] is outlined and tagged until it is replaced', async ({ page }) => {
  const access = stage(page).locator('[data-field="accommodations"]');
  await expect(access).toHaveAttribute('data-placeholder', '');
  expect(await access.evaluate((el) => getComputedStyle(el, '::after').content)).toBe('"Preview only: placeholder"');
  expect(await access.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('dashed');
  await expect(stage(page).locator('[data-placeholder]')).toHaveCount(1);

  await fillAccommodations(page);
  await expect(access).not.toHaveAttribute('data-placeholder');
  expect(await access.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none');
});

test('the QR code is always in a corner; at the bottom, it is level with the logos', async ({ page }) => {
  for (const template of ['showcase', 'split', 'band', 'type-only', 'frame']) {
    for (const format of ['landscape-hd', 'portrait-hd', 'square', 'letter-poster']) {
      await page.goto(`/gallery.html?template=${template}&format=${format}&image=1&qr=1&fixture=sample&scale=auto`);
      await page.evaluate(() => document.fonts.ready.then(() => true));
      await expect(page.locator('[data-cell]')).toHaveAttribute('data-fits', 'true');
      const r = await page.locator('[data-cell] .tpl').evaluate((root) => {
        const rect = (el: Element) => el.getBoundingClientRect();
        const scale = rect(root).width / (root as HTMLElement).offsetWidth;
        const qr = rect(root.querySelector('.t-qr-tile')!);
        const logos = rect(root.querySelector('.t-logos')!);
        const others = Array.from(root.querySelectorAll('[data-slot], .t-logos')).map(rect);
        const px = (v: number) => v / scale;
        return {
          rightmost: px(Math.max(...others.map((o) => o.right)) - qr.right),
          topmost: px(qr.top - Math.min(...others.map((o) => o.top))),
          bottommost: px(Math.max(...others.map((o) => o.bottom)) - qr.bottom),
          logoBottom: px(Math.abs(logos.bottom - qr.bottom)),
        };
      });
      const where = `${template} · ${format}`;
      expect(r.rightmost, where).toBeLessThanOrEqual(2);
      if (r.topmost <= 2) continue; // top-right corner
      expect(r.bottommost, where).toBeLessThanOrEqual(2);
      expect(r.logoBottom, where).toBeLessThanOrEqual(2);
    }
  }
});
