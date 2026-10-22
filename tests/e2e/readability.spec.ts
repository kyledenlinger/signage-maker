import AxeBuilder from '@axe-core/playwright';
import { chooseTemplate, chooseTheme, fillAccommodations, statusBar } from './helpers';
import { expect, test, type Page } from '@playwright/test';

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
const DEFAULT_FORMATS = ['landscape-hd', 'portrait-hd', 'letter-poster'];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
});

const panel = (page: Page) => statusBar(page);

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

test('the sample event is ready once the placeholder is replaced', async ({ page }) => {
  await expect(panel(page)).toContainText('1 problem blocks export');
  await expect(panel(page)).toContainText('The accommodations line still says [email].');
  await fillAccommodations(page);
  await expect(panel(page)).toContainText('Ready to export');
  await expect(panel(page)).toContainText('3 formats, plus alt text and the project file.');
  for (const id of DEFAULT_FORMATS) await expect(page.locator(`[data-format="${id}"]`)).toHaveAttribute('data-fits', 'true');
});

test('a long title warns, shrinks to fit and is never clipped', async ({ page }) => {
  const title = 'The Extraordinarily Long-Winded Annual Lecture on Everything';
  expect(title.length).toBeLessThanOrEqual(60);
  await page.getByLabel('Title (required)').fill(title);
  await expect(panel(page)).toContainText(`Title: ${title.length} characters, over the recommended 40.`);
  for (const id of DEFAULT_FORMATS) {
    const card = page.locator(`[data-format="${id}"]`);
    await expect(card.locator('[data-slot="title"]')).toHaveText(title);
    expect(await titleInsideCanvas(page, id)).toBe(true);
  }
});

test('an over-limit title blocks export and is shown in full, not truncated', async ({ page }) => {
  const title = 'A Title That Runs Well Past The Sixty Character Hard Limit For Signs';
  await page.getByLabel('Title (required)').fill(title);
  await expect(panel(page)).toContainText(`Title is ${title.length} characters; the limit is 60.`);
  await expect(page.getByRole('button', { name: 'Download blocked' })).toBeDisabled();
  await expect(page.locator('[data-format="landscape-hd"] [data-slot="title"]')).toHaveText(title);
});

test('text that cannot fit is flagged per format with a fix, never broken mid-word', async ({ page }) => {
  const word = 'Pneumonoultramicroscopicsilicovolcanoconiosis';
  await page.getByLabel('Title (required)').fill(word);
  await expect(panel(page)).toContainText("Portrait HD · Title: doesn't fit at minimum size.");
  // Every fit problem points at the title, the field that is actually too wide.
  const fitItems = panel(page).locator('li', { hasText: "doesn't fit" });
  for (const item of await fitItems.all()) await expect(item).toContainText('· Title:');
  await expect(page.locator('[data-fits="false"] .format-status').first()).toContainText('Blocked');
  await fillAccommodations(page);
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Download' }).getByRole('checkbox', { name: /Portrait HD/ })).toBeDisabled();
  await page.keyboard.press('Escape');
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
  const item = panel(page).getByRole('link', { name: /Use title case/ });
  await item.click();
  await expect(page.getByLabel('Title (required)')).toBeFocused();
});

test('every template and theme renders the default formats', async ({ page }) => {
  for (const template of ['showcase', 'split', 'band', 'type-only', 'frame']) {
    await chooseTemplate(page, template);
    for (const theme of ['black-gold', 'athletics-gold', 'light', 'high-contrast']) {
      await chooseTheme(page, theme);
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
  await chooseTemplate(page, 'split');

  const slider = page.getByLabel(/Left to right/);
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('52');
  await expect(page.locator('[data-format="portrait-hd"] .t-photo img')).toHaveAttribute('style', /object-position: 52% 50%/);

  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations).toEqual([]);
});

test('dragging the focal point marker moves it', async ({ page }) => {
  const png = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 2400;
    c.height = 1600;
    c.getContext('2d')!.fillRect(0, 0, 2400, 1600);
    return c.toDataURL('image/png').split(',')[1];
  });
  await page.locator('#field-image').setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  const thumb = page.locator('.focal-thumb').first();
  await thumb.scrollIntoViewIfNeeded();
  const box = (await thumb.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.4, { steps: 4 });
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.25, { steps: 4 });
  await page.mouse.up();
  await expect(page.getByLabel(/Left to right/)).toHaveValue('80');
  await expect(page.getByLabel(/Top to bottom/)).toHaveValue('25');
});
