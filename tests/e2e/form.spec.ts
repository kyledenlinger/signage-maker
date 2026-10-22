import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { fillAccommodations, openDetails, statusBar } from './helpers';

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
});

const section = (page: import('@playwright/test').Page, n: number) =>
  page.getByRole('group', { name: new RegExp(`^${n}\\. `) });

test('six numbered sections, in order, with text status chips', async ({ page }) => {
  const names = await page.locator('form .form-card > legend').allInnerTexts();
  expect(names).toEqual([
    '1. The event (Done)',
    '2. Image (Optional)',
    '3. When and where (Done)',
    '4. Details (Done)',
    '5. Link and QR code (Done)',
    '6. Accommodations line (Needs a fix)',
  ]);
  await expect(section(page, 6)).toHaveClass(/is-blocked/);
  await expect(section(page, 6).locator('.chip')).toHaveText(/Needs a fix/);

  await fillAccommodations(page);
  await expect(section(page, 6).locator('.chip')).toHaveText(/Done/);
  await page.getByLabel('Title (required)').fill('');
  await expect(section(page, 1).locator('.chip')).toHaveText(/Needs a fix/);
  expect((await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations).toEqual([]);
});

test('optional fields hide behind links until wanted, and show when they have a value', async ({ page }) => {
  await expect(page.getByLabel('Multi-day or recurring note')).toHaveCount(0);
  await page.getByRole('button', { name: '+ Multi-day or recurring note' }).click();
  await page.getByLabel('Multi-day or recurring note').fill('Every Tuesday in March');
  await expect(page.getByLabel('Display URL')).toHaveCount(0);
  await page.getByRole('button', { name: '+ Add a short display URL' }).click();
  await page.getByLabel('Display URL').fill('go.wfu.edu/games');
  await expect(page.getByLabel('Background image', { exact: false })).toHaveCount(0);

  await page.waitForTimeout(400);
  await page.reload();
  await expect(page.getByLabel('Multi-day or recurring note')).toHaveValue('Every Tuesday in March');
  await expect(page.getByLabel('Display URL')).toHaveValue('go.wfu.edu/games');
});

test('Details is collapsed, with a summary; a problem inside opens it and focuses the field', async ({ page }) => {
  const details = page.locator('details.form-details');
  await expect(details).not.toHaveAttribute('open', '');
  await expect(details.locator('> summary')).toHaveText('5 highlights, description, call to action.');

  await openDetails(page);
  await page.getByRole('button', { name: 'Remove highlight 5' }).click();
  await expect(details.locator('> summary')).toHaveText('4 highlights, description, call to action.');
  await page.getByLabel('Highlight 2', { exact: true }).fill('A very long pizza party for everyone');
  await details.locator('> summary').click(); // close it again
  await statusBar(page).getByRole('link', { name: 'Shorten it' }).click();
  await expect(details).toHaveAttribute('open', '');
  await expect(page.getByLabel('Highlight 2', { exact: true })).toBeFocused();
  await expect(page.getByLabel('Highlight 2', { exact: true })).toHaveAttribute('aria-invalid', 'true');
});

test('uploads use a drop zone with a Choose button, thumbnail and Remove', async ({ page }) => {
  // No native file pickers on show: every file input is visually hidden behind a drop zone.
  for (const input of await page.locator('input[type="file"]').all()) await expect(input).toHaveClass(/visually-hidden/);
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 2400;
    c.height = 1600;
    c.getContext('2d')!.fillRect(0, 0, 2400, 1600);
    return c.toDataURL('image/png').split(',')[1];
  });
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Choose a file: Photo or illustration' }).click(),
  ]);
  await chooser.setFiles({ name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') });
  const zone = page.locator('.drop-zone').filter({ has: page.locator('#field-image-button') });
  await expect(zone.locator('.drop-thumb')).toBeVisible();
  await expect(zone).toContainText('photo.png');
  await expect(zone).toContainText('2400 × 1600 px');
  await expect(page.getByRole('button', { name: 'Replace: Photo or illustration' })).toBeVisible();
  await expect(section(page, 2).locator('.chip')).toHaveText(/Needs a fix/); // the photo needs a description
  await page.getByRole('button', { name: 'Remove photo or illustration: photo.png' }).click();
  await expect(zone.locator('.drop-thumb')).toHaveCount(0);
  await expect(section(page, 2).locator('.chip')).toHaveText(/Optional/);
});
