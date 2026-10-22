import AxeBuilder from '@axe-core/playwright';
import { fillAccommodations, revealBackground, statusBar } from './helpers';
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
  await revealBackground(page);
  await page.locator('#field-background').setInputFiles({
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
  await expect(statusBar(page)).toContainText(
    "Split doesn't show background images",
  );
  await page.getByLabel('Template (required)').selectOption('type-only');
  await expect(card(page, 'portrait-hd').locator('.tpl--backdrop')).toBeVisible();
});

test('Match my images: light, dark and high contrast, unlocked by an image, alongside the WFU themes', async ({ page }) => {
  const wfu = themeSelect(page).locator('optgroup[label="WFU themes"] option');
  await expect(wfu).toHaveText(['Black and gold', 'Athletics Gold', 'Light', 'High contrast']);
  const matches = themeSelect(page).locator('optgroup option');
  const light = themeSelect(page).locator('option[value="images-light"]');
  await expect(light).toBeDisabled();
  await expect(themeSelect(page).locator('optgroup').nth(1)).toHaveAttribute('label', 'Match my images (add an image first)');

  await uploadBackground(page);
  await expect(light).toBeEnabled();
  await expect(matches).toHaveCount(7);

  const root = card(page, 'landscape-hd').locator('.tpl');
  const colorsOf = async (id: string) => {
    await themeSelect(page).selectOption(id);
    await expect(page.getByRole('list', { name: /Match my images: .* colors/ })).toBeVisible();
    await expect(root).toHaveAttribute('class', /tpl/);
    await page.waitForTimeout(300);
    for (const format of ['landscape-hd', 'portrait-hd', 'letter-poster']) {
      await expect(card(page, format)).toHaveAttribute('data-fits', 'true');
    }
    await expect(statusBar(page)).not.toContainText('Theme');
    return root.evaluate((el) => getComputedStyle(el).backgroundColor);
  };
  const lightBg = await colorsOf('images-light');
  const darkBg = await colorsOf('images-dark');
  const contrastBg = await colorsOf('images-contrast');
  expect(new Set([lightBg, darkBg, contrastBg]).size).toBe(3);
  expect(contrastBg).toBe('rgb(0, 0, 0)');
  expect(darkBg).not.toBe('rgb(0, 0, 0)');
  expect((await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations).toEqual([]);

  await page.getByRole('button', { name: 'Remove background image' }).click();
  await expect(themeSelect(page)).toHaveValue('black-gold');
  await expect(light).toBeDisabled();
});

test('background and image colors survive a reload', async ({ page }) => {
  await uploadBackground(page);
  await themeSelect(page).selectOption('images-dark');
  await expect(page.getByRole('list', { name: 'Match my images: Dark colors' })).toBeVisible();
  await expect(card(page, 'landscape-hd').locator('.tpl')).not.toHaveCSS('background-color', 'rgb(0, 0, 0)');
  const before = await card(page, 'landscape-hd').locator('.tpl').evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.waitForTimeout(400);
  await page.reload();
  await expect(themeSelect(page)).toHaveValue('images-dark');
  await expect(card(page, 'landscape-hd').locator('.t-backdrop img')).toBeVisible();
  await expect(card(page, 'landscape-hd').locator('.tpl')).toHaveCSS('background-color', before);
});

test('highlights stand out: bold and color by default, or either alone', async ({ page }) => {
  const list = card(page, 'landscape-hd').locator('.t-highlights');
  const tagline = card(page, 'landscape-hd').locator('[data-field="subtitle"]');
  const style = (loc: typeof list) =>
    loc.evaluate((el) => ({ weight: getComputedStyle(el).fontWeight, color: getComputedStyle(el).color }));

  // Black and gold: highlights in Athletics Gold, bold; the tagline stays white, regular.
  expect(await style(list)).toEqual({ weight: '700', color: 'rgb(206, 184, 136)' });
  expect(await style(tagline)).toEqual({ weight: '400', color: 'rgb(255, 255, 255)' });

  await page.getByLabel('Highlights style').selectOption('bold');
  await expect(list).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(list).toHaveCSS('font-weight', '700');

  await page.getByLabel('Highlights style').selectOption('color');
  await expect(list).toHaveCSS('color', 'rgb(206, 184, 136)');
  await expect(list).toHaveCSS('font-weight', '400');

  for (const id of ['landscape-hd', 'portrait-hd', 'letter-poster']) {
    await expect(card(page, id)).toHaveAttribute('data-fits', 'true');
  }
  expect((await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations).toEqual([]);
});

test('title and body fonts can be chosen separately, and are remembered', async ({ page }) => {
  await page.getByLabel('Title font').selectOption('source-serif');
  await page.getByLabel('Body font').selectOption('lexend');
  const sign = card(page, 'landscape-hd');
  await expect(sign.locator('[data-slot="title"]')).toHaveCSS('font-family', /Source Serif 4/);
  await expect(sign.locator('[data-field="subtitle"]')).toHaveCSS('font-family', /Lexend/);
  for (const id of ['landscape-hd', 'portrait-hd', 'letter-poster']) {
    await expect(card(page, id)).toHaveAttribute('data-fits', 'true');
  }
  expect((await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations).toEqual([]);

  await page.waitForTimeout(400);
  await page.reload();
  await expect(page.getByLabel('Title font')).toHaveValue('source-serif');
  await expect(card(page, 'landscape-hd').locator('[data-slot="title"]')).toHaveCSS('font-family', /Source Serif 4/);
});

async function uploadFeatured(page: Page, transparent: boolean) {
  const b64 = await page.evaluate((clear) => {
    const c = document.createElement('canvas');
    c.width = 1200;
    c.height = 900;
    const ctx = c.getContext('2d')!;
    if (!clear) {
      ctx.fillStyle = '#336699';
      ctx.fillRect(0, 0, 1200, 900);
    }
    ctx.fillStyle = '#E8741C';
    ctx.beginPath();
    ctx.ellipse(600, 500, 450, 340, 0, 0, Math.PI * 2);
    ctx.fill();
    return c.toDataURL('image/png').split(',')[1];
  }, transparent);
  await page.locator('#field-image').setInputFiles({
    name: transparent ? 'pumpkin.png' : 'photo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(b64, 'base64'),
  });
}

test('one "Photo or illustration" field: transparent images are illustrations, shown whole', async ({ page }) => {
  await expect(page.getByRole('group', { name: /^2\. Image/ })).toBeVisible();
  await expect(page.locator('#field-image-label')).toHaveText('Photo or illustration');
  await expect(page.getByLabel('Illustration', { exact: true })).toHaveCount(0);

  await uploadFeatured(page, true);
  const asIllustration = page.getByRole('radio', { name: 'Illustration' });
  await expect(asIllustration).toBeChecked();
  await expect(page.getByRole('group', { name: 'Photo focal point' })).toHaveCount(0);
  await expect(page.getByLabel('Image description')).toBeVisible();

  await page.getByLabel('Template (required)').selectOption('split');
  const img = card(page, 'landscape-hd').locator('.t-photo img');
  await expect(img).toHaveCSS('object-fit', 'contain');
  // No description needed for a decorative illustration.
  await fillAccommodations(page);
  await expect(statusBar(page)).toContainText('Ready to export');
  expect((await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations).toEqual([]);

  await page.getByRole('radio', { name: 'Photo' }).check();
  await expect(img).toHaveCSS('object-fit', 'cover');
  await expect(page.getByRole('group', { name: 'Photo focal point' })).toBeVisible();
  await expect(statusBar(page)).toContainText('The photo needs a description for alt text.');
  await expect(page.getByLabel('Image description')).toHaveAttribute('aria-invalid', 'true');

  await page.getByLabel('Template (required)').selectOption('type-only');
  await expect(statusBar(page)).toContainText(
    "Type only doesn't show a photo or illustration",
  );
});

test('an opaque image is treated as a photo', async ({ page }) => {
  await uploadFeatured(page, false);
  await expect(page.getByRole('radio', { name: 'Photo' })).toBeChecked();
  await expect(page.getByRole('group', { name: 'Photo focal point' })).toBeVisible();
});

test('ZSR Library logo: Semiformal horizontal by default, colorway matched to the theme', async ({ page }) => {
  const logo = card(page, 'landscape-hd').locator('.t-zsr-logo');
  await expect(page.getByLabel('Logo version')).toHaveValue('semiformal-zsr-library');
  await expect(page.getByLabel('Logo layout')).toHaveValue('horizontal');
  await expect(page.getByLabel('Logo color')).toHaveValue('auto');
  await expect(logo).toHaveAttribute('src', /logos\/semiformal-zsr-library\/horizontal-reverse\.png$/);
  await expect(logo).toHaveJSProperty('complete', true);
  expect(await logo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

  for (const [theme, colorway] of [
    ['athletics-gold', 'black'],
    ['light', 'color'],
    ['high-contrast', 'reverse'],
  ]) {
    await themeSelect(page).selectOption(theme);
    await expect(logo).toHaveAttribute('data-colorway', colorway);
  }

  // A manual pick that's hard to see gets a warning, not a block.
  await themeSelect(page).selectOption('athletics-gold');
  await page.getByLabel('Logo color').selectOption('gold');
  await expect(statusBar(page)).toContainText(
    'Logo color: the gold logo is hard to see on this theme. Use Automatic (black)',
  );

  await page.getByLabel('Logo color').selectOption('auto');
  await page.getByLabel('Logo version').selectOption('formal');
  await page.getByLabel('Logo layout').selectOption('vertical');
  await expect(logo).toHaveAttribute('src', /logos\/formal\/vertical-black\.png$/);
  for (const id of ['landscape-hd', 'portrait-hd', 'letter-poster']) {
    await expect(card(page, id)).toHaveAttribute('data-fits', 'true');
  }
  expect((await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations).toEqual([]);
});

test('design options sit in one panel below the preview; it can collapse', async ({ page }) => {
  const design = page.locator('details.design');
  for (const label of ['Template (required)', 'Theme (required)', 'Title font', 'Date style', 'Weekday', 'Highlights style', 'Logo version']) {
    await expect(design.getByLabel(label)).toBeVisible();
  }
  await expect(design.getByRole('group', { name: /Formats/ })).toBeVisible();
  await expect(design.getByRole('button', { name: 'Choose a file: Co-sponsor logos' })).toBeVisible();
  // None of them are left in the event form.
  await expect(page.locator('form.form-panel select, form.form-panel input[type="file"][multiple]')).toHaveCount(0);

  // The panel follows the preview.
  const previewBottom = await page.locator('#preview').evaluate((el) => el.getBoundingClientRect().bottom);
  const designTop = await design.evaluate((el) => el.getBoundingClientRect().top);
  expect(designTop).toBeGreaterThanOrEqual(previewBottom);

  await design.locator('> summary').click();
  await expect(design.getByLabel('Template (required)')).toBeHidden();
  // The toggle event that saves the state fires just after the click.
  await expect.poll(() => page.evaluate(() => localStorage.getItem('signage.designOpen'))).toBe('false');
  await page.reload();
  await expect(page.locator('details.design')).not.toHaveAttribute('open', '');
  expect((await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations).toEqual([]);
});
