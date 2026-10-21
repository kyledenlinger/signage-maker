import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
const DEFAULT_FORMATS = ['landscape-hd', 'portrait-hd', 'letter-poster'];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
});

const panel = (page: Page) => page.getByRole('region', { name: 'Readability check' });

/** True when the title's text lies entirely inside the sign. */
async function titleInsideCanvas(page: Page, formatId: string) {
  return page.locator(`[data-format="${formatId}"] .tpl`).evaluate((root) => {
    const title = root.querySelector('[data-slot="title"]')!;
    const range = document.createRange();
    range.selectNodeContents(title);
    const t = range.getBoundingClientRect();
    const r = root.getBoundingClientRect();
    return t.left >= r.left && t.top >= r.top && t.right <= r.right && t.bottom <= r.bottom;
  });
}

test('sample event has no blocking problems', async ({ page }) => {
  await expect(panel(page)).toContainText('No problems found.');
  for (const id of DEFAULT_FORMATS) await expect(page.locator(`[data-format="${id}"]`)).toHaveAttribute('data-fits', 'true');
});

test('a long title warns, shrinks to fit and is never clipped', async ({ page }) => {
  const title = 'The Extraordinarily Long-Winded Annual Lecture on Everything';
  expect(title.length).toBeLessThanOrEqual(60);
  await page.getByLabel('Title (required)').fill(title);
  await expect(panel(page)).toContainText(`All formats · Title · ${title.length} characters, over the recommended 40`);
  for (const id of DEFAULT_FORMATS) {
    const card = page.locator(`[data-format="${id}"]`);
    await expect(card.locator('[data-slot="title"]')).toHaveText(title);
    expect(await titleInsideCanvas(page, id)).toBe(true);
  }
});

test('an over-limit title blocks export and is shown in full, not truncated', async ({ page }) => {
  const title = 'A Title That Runs Well Past The Sixty Character Hard Limit For Signs';
  await page.getByLabel('Title (required)').fill(title);
  await expect(panel(page)).toContainText('Blocks export: All formats · Title');
  await expect(page.locator('[data-format="landscape-hd"] [data-slot="title"]')).toHaveText(title);
});

test('text that cannot fit is flagged per format with a fix, never broken mid-word', async ({ page }) => {
  const word = 'Pneumonoultramicroscopicsilicovolcanoconiosis';
  await page.getByLabel('Title (required)').fill(word);
  await expect(panel(page)).toContainText("Title · doesn't fit at minimum size · shorten by ~");
  // Every fit problem points at the title, the field that is actually too wide.
  const fitItems = panel(page).getByRole('button', { name: /doesn't fit/ });
  for (const item of await fitItems.all()) await expect(item).toContainText('· Title ·');
  await expect(page.locator('[data-fits="false"] figcaption').first()).toContainText('text doesn’t fit');
  // Still one line: the word is never split.
  const lines = await page
    .locator('[data-format="portrait-hd"] [data-slot="title"]')
    .evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return new Set(Array.from(range.getClientRects()).map((r) => Math.round(r.top))).size;
    });
  expect(lines).toBe(1);
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations).toEqual([]);
});

test('clicking a warning focuses its field', async ({ page }) => {
  await page.getByLabel('Title (required)').fill('HALLOWEEN GAME NIGHT');
  const item = panel(page).getByRole('button', { name: /Title · written in all caps/ });
  await item.click();
  await expect(page.getByLabel('Title (required)')).toBeFocused();
});

test('every template and theme renders the default formats', async ({ page }) => {
  for (const template of ['showcase', 'split', 'band', 'type-only', 'frame']) {
    await page.getByLabel('Template (required)').selectOption(template);
    for (const theme of ['black-gold', 'athletics-gold', 'light', 'high-contrast']) {
      await page.getByLabel('Theme (required)').selectOption(theme);
      for (const id of DEFAULT_FORMATS) {
        await expect(page.locator(`[data-format="${id}"] .tpl`)).toBeVisible();
        await expect(page.locator(`[data-format="${id}"]`)).toHaveAttribute('data-fits', 'true');
      }
    }
  }
});

test('focal point moves with the keyboard and crops the photo', async ({ page }) => {
  const png = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 2400;
    c.height = 1600;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#336699';
    ctx.fillRect(0, 0, 2400, 1600);
    return c.toDataURL('image/png').split(',')[1];
  });
  await page.locator('#field-image').setInputFiles({
    name: 'photo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(png, 'base64'),
  });
  await page.getByLabel('Image description').fill('A blue square');
  await page.getByLabel('Template (required)').selectOption('split');

  const slider = page.getByLabel(/Left to right/);
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('52');
  await expect(page.locator('[data-format="portrait-hd"] .t-photo img')).toHaveAttribute('style', /object-position: 52% 50%/);

  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations).toEqual([]);
});
