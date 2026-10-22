import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { selectFormat } from './helpers';

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
});

const stageSign = (page: import('@playwright/test').Page) => page.locator('.stage .scaled-sign');

test('one large preview of the selected format, switched from the format strip', async ({ page }) => {
  // Landscape HD, as large as the stage allows: it fills the stage's height (less its padding).
  const box = await stageSign(page).boundingBox();
  const stage = await page.locator('.stage').boundingBox();
  expect(box!.width).toBeGreaterThan(500);
  expect(box!.height).toBeGreaterThan(stage!.height - 60);
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

test('at 1440 × 900, choosing a template or colors updates the preview while it stays in view', async ({ page }) => {
  const inView = () =>
    stageSign(page).evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= window.innerHeight;
    });
  await expect(page.locator('.workspace')).toHaveClass(/is-pinned/);
  await page.locator('.option-card[data-template="type-only"]').click();
  await expect(page.locator('.stage .tpl.to')).toBeVisible();
  expect(await inView()).toBe(true);
  await page.locator('.pill[data-theme="light"]').click();
  await expect(page.locator('.stage .tpl')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  expect(await inView()).toBe(true);
  // The control that was used is not hidden under the pinned preview.
  const pill = await page.locator('.pill[data-theme="light"]').boundingBox();
  const pinnedBottom = await page.locator('.workspace-top').evaluate((el) => el.getBoundingClientRect().bottom);
  expect(pill!.y).toBeGreaterThanOrEqual(pinnedBottom - 1);
});
