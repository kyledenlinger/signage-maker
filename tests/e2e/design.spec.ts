import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
});

const card = (page: Page, id: string) => page.locator(`[data-format="${id}"]`);
const themeSelect = (page: Page) => page.getByLabel('Theme (required)');

async function uploadBackground(page: Page) {
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 2400;
    c.height = 1600;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#12343B';
    ctx.fillRect(0, 0, 2400, 1600);
    ctx.fillStyle = '#E8833A';
    ctx.fillRect(1600, 200, 600, 600);
    return c.toDataURL('image/png').split(',')[1];
  });
  await page.getByLabel('Background image', { exact: true }).setInputFiles({
    name: 'backdrop.png',
    mimeType: 'image/png',
    buffer: Buffer.from(b64, 'base64'),
  });
}

test('date, time and location render together, with a short weekday by default', async ({ page }) => {
  const when = card(page, 'landscape-hd').locator('.t-when');
  await expect(when.locator('[data-slot="date"]')).toHaveText('Fri, Oct 23');
  await expect(when.locator('[data-slot="timeLocation"]')).toContainText('7–10 p.m.');
  await expect(when.locator('[data-slot="timeLocation"]')).toContainText('ZSR Library Atrium');
  // Portrait stacks the date as a badge: weekday, day, month.
  await expect(card(page, 'portrait-hd').locator('.t-when [data-slot="date"]')).toHaveText('Fri23Oct');

  await page.getByLabel('Weekday').selectOption('long');
  await expect(when.locator('[data-slot="date"]')).toHaveText('Friday, Oct 23');
  await page.getByLabel('Weekday').selectOption('none');
  await expect(when.locator('[data-slot="date"]')).toHaveText('Oct 23');
  await expect(card(page, 'portrait-hd').locator('.t-when [data-slot="date"]')).toHaveText('23Oct');
});

test('a background image puts text on solid panels; other templates say they skip it', async ({ page }) => {
  await uploadBackground(page);
  await expect(card(page, 'landscape-hd').locator('.tpl--backdrop .t-backdrop img')).toBeVisible();
  await expect(card(page, 'landscape-hd')).toHaveAttribute('data-fits', 'true');
  const panel = await card(page, 'landscape-hd')
    .locator('.t-title')
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(panel).toBe('rgb(0, 0, 0)');
  await expect(page.getByRole('group', { name: 'Background image focal point' })).toBeVisible();

  await page.getByLabel('Template (required)').selectOption('split');
  await expect(page.getByRole('region', { name: 'Readability check' })).toContainText(
    "Split doesn't show background images",
  );
  await page.getByLabel('Template (required)').selectOption('type-only');
  await expect(card(page, 'portrait-hd').locator('.tpl--backdrop')).toBeVisible();
});

test('Match my images: unlocked by an image, contrast-safe, and reset when images go', async ({ page }) => {
  const option = themeSelect(page).locator('option[value="from-images"]');
  await expect(option).toBeDisabled();
  await expect(option).toHaveText('Match my images (add an image first)');

  await uploadBackground(page);
  await expect(option).toBeEnabled();
  await themeSelect(page).selectOption('from-images');
  await expect(page.getByRole('list', { name: 'Match my images colors' })).toBeVisible();

  const root = card(page, 'landscape-hd').locator('.tpl');
  await expect(root).not.toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await expect(page.getByRole('region', { name: 'Readability check' })).not.toContainText('Theme');
  for (const id of ['landscape-hd', 'portrait-hd', 'letter-poster']) {
    await expect(card(page, id)).toHaveAttribute('data-fits', 'true');
  }
  expect((await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations).toEqual([]);

  await page.getByRole('button', { name: 'Remove background image' }).click();
  await expect(themeSelect(page)).toHaveValue('black-gold');
  await expect(option).toBeDisabled();
});

test('background and image colors survive a reload', async ({ page }) => {
  await uploadBackground(page);
  await themeSelect(page).selectOption('from-images');
  await expect(page.getByRole('list', { name: 'Match my images colors' })).toBeVisible();
  await expect(card(page, 'landscape-hd').locator('.tpl')).not.toHaveCSS('background-color', 'rgb(0, 0, 0)');
  const before = await card(page, 'landscape-hd').locator('.tpl').evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.waitForTimeout(400);
  await page.reload();
  await expect(themeSelect(page)).toHaveValue('from-images');
  await expect(card(page, 'landscape-hd').locator('.t-backdrop img')).toBeVisible();
  await expect(card(page, 'landscape-hd').locator('.tpl')).toHaveCSS('background-color', before);
});
