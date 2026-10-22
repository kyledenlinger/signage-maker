import AxeBuilder from '@axe-core/playwright';
import { chooseTemplate, chooseTheme, fillAccommodations, openMoreOptions, revealBackground, statusBar } from './helpers';
import { expect, test, type Page } from '@playwright/test';

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
});

const card = (page: Page, id: string) => page.locator(`[data-format="${id}"]`);

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
  await openMoreOptions(page);
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

  await chooseTemplate(page, 'split');
  await expect(statusBar(page)).toContainText(
    "Split doesn't show background images",
  );
  await chooseTemplate(page, 'type-only');
  await expect(card(page, 'portrait-hd').locator('.tpl--backdrop')).toBeVisible();
});

test('Match my images: light, dark and high contrast, unlocked by an image, alongside the WFU themes', async ({ page }) => {
  const pills = page.locator('.pills .pill');
  await expect(pills).toHaveText(['Black and gold', 'Athletics Gold', 'Light', 'High contrast', 'Match my image · add an image first']);
  await expect(page.locator('.pill[data-theme="images"]')).toBeDisabled();

  await uploadBackground(page);
  await expect(pills).toHaveText([
    'Black and gold',
    'Athletics Gold',
    'Light',
    'High contrast',
    'Match my image: Light',
    'Match my image: Dark',
    'Match my image: High contrast',
  ]);
  const light = page.locator('.pill[data-theme="images-light"]');
  await expect(light).toBeEnabled();

  const root = card(page, 'landscape-hd').locator('.tpl');
  const colorsOf = async (id: string) => {
    await chooseTheme(page, id);
    await expect(page.getByRole('list', { name: /Match my image: .* colors/ })).toBeVisible();
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
  await expect(page.locator('.pill[data-theme="black-gold"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.pill[data-theme="images"]')).toBeDisabled();
});

test('background and image colors survive a reload', async ({ page }) => {
  await uploadBackground(page);
  await chooseTheme(page, 'images-dark');
  await expect(page.getByRole('list', { name: 'Match my image: Dark colors' })).toBeVisible();
  await expect(card(page, 'landscape-hd').locator('.tpl')).not.toHaveCSS('background-color', 'rgb(0, 0, 0)');
  const before = await card(page, 'landscape-hd').locator('.tpl').evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.waitForTimeout(400);
  await page.reload();
  await expect(page.locator('.pill[data-theme=\"images-dark\"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(card(page, 'landscape-hd').locator('.t-backdrop img')).toBeVisible();
  await expect(card(page, 'landscape-hd').locator('.tpl')).toHaveCSS('background-color', before);
});

test('highlights stand out: bold and color by default, or either alone', async ({ page }) => {
  await openMoreOptions(page);
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
  await openMoreOptions(page);
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

  await chooseTemplate(page, 'split');
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

  await chooseTemplate(page, 'type-only');
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
  await openMoreOptions(page);
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
    await chooseTheme(page, theme);
    await expect(logo).toHaveAttribute('data-colorway', colorway);
  }

  // A manual pick that's hard to see gets a warning, not a block.
  await chooseTheme(page, 'athletics-gold');
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

test('the Look card: template cards and color pills up front, the rest under More design options', async ({ page }) => {
  const look = page.getByRole('region', { name: 'Look' });
  const cards = look.locator('.option-card');
  await expect(cards).toHaveCount(5);
  await expect(look.locator('.option-card[data-template="split"]')).toContainText('Photo beside the text · needs a photo');
  await expect(look.locator('.option-card[data-template="showcase"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(look.locator('.option-card[data-template="showcase"] .option-check')).toBeVisible();

  const more = look.locator('details.more-options');
  await expect(more).not.toHaveAttribute('open', '');
  await openMoreOptions(page);
  for (const label of ['Title font', 'Body font', 'Date style', 'Weekday', 'Highlights style', 'Logo version', 'Logo layout', 'Logo color']) {
    await expect(more.getByLabel(label)).toBeVisible();
  }
  await expect(more.getByRole('button', { name: 'Choose a file: Co-sponsor logos' })).toBeVisible();
  // The Look card follows the preview.
  const previewBottom = await page.locator('#preview').evaluate((el) => el.getBoundingClientRect().bottom);
  const lookTop = await look.evaluate((el) => el.getBoundingClientRect().top);
  expect(lookTop).toBeGreaterThanOrEqual(previewBottom);
  expect((await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations).toEqual([]);
});

test('a photo template with no photo shows a labeled placeholder and blocks export', async ({ page }) => {
  await chooseTemplate(page, 'band');
  await expect(page.locator('.stage .t-photo img')).toHaveAttribute('src', /Photo%20or%20illustration%20goes%20here/);
  await expect(statusBar(page)).toContainText('Band needs a photo or illustration.');
  await chooseTemplate(page, 'type-only');
  await expect(statusBar(page)).not.toContainText('needs a photo');
});
