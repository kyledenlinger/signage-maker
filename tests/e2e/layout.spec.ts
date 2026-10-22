import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { selectFormat } from './helpers';

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready.then(() => true));
});

const stageSign = (page: import('@playwright/test').Page) => page.locator('.stage .scaled-sign');

test('one large preview of the selected format, switched from the format strip', async ({ page }) => {
  // Landscape HD, one large preview.
  const box = await stageSign(page).boundingBox();
  const stage = await page.locator('.stage').boundingBox();
  expect(box!.width).toBeGreaterThan(500);
  // As large as the stage allows: it fills the stage's width or its height (less padding).
  expect(Math.max(box!.width - (stage!.width - 60), box!.height - (stage!.height - 60))).toBeGreaterThan(0);
  await expect(stageSign(page)).toHaveAttribute('aria-label', /Signage preview, Landscape HD: Halloween Game Night/);
  await expect(page.locator('.format-button[data-format="landscape-hd"]')).toHaveAttribute('aria-pressed', 'true');

  await selectFormat(page, 'portrait-hd');
  await expect(page.locator('.format-button[data-format="portrait-hd"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.format-button[data-format="landscape-hd"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#preview-heading')).toContainText('Portrait HD · 1080 × 1920');
  const portrait = await stageSign(page).boundingBox();
  expect(portrait!.height).toBeGreaterThan(portrait!.width);

  // Typing updates the large preview without scrolling.
  await page.getByLabel('Title (required)').fill('Banned Books Week');
  await expect(page.locator('.stage [data-slot="title"]')).toHaveText('Banned Books Week');
  expect(await stageSign(page).evaluate((el) => el.getBoundingClientRect().top < window.innerHeight)).toBe(true);
});

test('"From across the room" shows the same sign at a fraction of its size, with a caption', async ({ page }) => {
  const fit = (await stageSign(page).boundingBox())!.width;
  await page.getByRole('button', { name: 'From across the room' }).click();
  await expect(page.getByRole('button', { name: 'From across the room' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Roughly how this reads from 20–25 feet away.')).toBeVisible();
  const room = (await stageSign(page).boundingBox())!.width;
  expect(room / fit).toBeGreaterThan(0.25);
  expect(room / fit).toBeLessThan(0.31);
});

test('full screen opens the current format, traps focus, and Esc returns focus', async ({ page }) => {
  const open = page.getByRole('button', { name: 'Show full screen' });
  await open.click();
  const dialog = page.getByRole('dialog', { name: 'Landscape HD, full screen' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: /Close/ })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: /Close/ })).toBeFocused();
  expect((await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
});

test('below 1024px: status, preview, form, then the design options; no sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const top = async (selector: string) => (await page.locator(selector).first().boundingBox())!.y;
  const order = [await top('#status-bar'), await top('#preview'), await top('form.form-panel'), await top('.look')];
  expect([...order].sort((a, b) => a - b)).toEqual(order);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  expect((await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations).toEqual([]);
});

test('the skip link jumps to the preview', async ({ page }) => {
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to design and preview' });
  await expect(skip).toBeFocused();
  await expect(skip).toHaveAttribute('href', '#preview');
  await expect(page.locator('#preview')).toHaveCount(1);
});

test('at 1440 × 900, the design column scrolls as one: preview, formats and the whole Look card', async ({ page }) => {
  const column = page.locator('.workspace');
  // The page itself doesn't scroll: the form and the design side scroll on their own.
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(900);
  // Nothing in it is pinned: the preview scrolls away with the rest.
  expect(await page.locator('.workspace-top').evaluate((el) => getComputedStyle(el).position)).toBe('static');
  // The sign and the format strip fit on screen at first.
  const strip = (await page.locator('.format-strip').boundingBox())!;
  expect(strip.y + strip.height).toBeLessThanOrEqual(900);
  // Scrolled to the end, the Look card shows whole.
  await column.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  const look = (await page.locator('.look').boundingBox())!;
  expect(look.height).toBeLessThan(900);
  expect(look.y).toBeGreaterThanOrEqual(0);
  expect(look.y + look.height).toBeLessThanOrEqual(900);
  await page.locator('.option-card[data-template="type-only"]').click();
  await expect(page.locator('.stage .tpl.to')).toHaveCount(1);
});
