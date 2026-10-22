import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
});

test('the three default previews render', async ({ page }) => {
  for (const id of ['landscape-hd', 'portrait-hd', 'letter-poster']) {
    await expect(page.locator(`[data-format="${id}"] .sc-title`)).toHaveText('Halloween Game Night');
  }
});

test('typing in the form updates all three formats and the large preview', async ({ page }) => {
  await page.getByLabel('Title (required)').fill('Banned Books Week');
  for (const id of ['landscape-hd', 'portrait-hd', 'letter-poster']) {
    await expect(page.locator(`[data-format="${id}"] .sc-title`)).toHaveText('Banned Books Week');
    await page.locator(`.format-button[data-format="${id}"]`).click();
    await expect(page.locator('.stage [role="img"]')).toHaveAttribute('aria-label', /Banned Books Week/);
  }
});

test('form has no axe violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('the status bar lists blockers live and links to their fields; axe passes', async ({ page }) => {
  await page.getByLabel('Title (required)').fill('');
  const location = 'In the main reading room of the ZSR Library, on the second floor';
  await page.getByLabel('Location (required)').fill(location.slice(0, 61));
  const status = page.locator('#status-bar');
  await expect(status).toHaveAttribute('role', 'status');
  await expect(status).toContainText('3 problems block export');
  await expect(status).toContainText('Title is required.');
  await expect(status).toContainText('Location is 61 characters; the limit is 60.');
  await expect(status).toContainText('The accommodations line still says [email].');
  await status.getByRole('link', { name: 'Add a title' }).click();
  await expect(page.getByLabel('Title (required)')).toBeFocused();
  await expect(page.getByLabel('Title (required)')).toHaveAttribute('aria-invalid', 'true');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('dark color scheme and narrow width have no axe violations', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 320, height: 800 });
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(320);
});
