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

test('typing in the form updates all three previews', async ({ page }) => {
  await page.getByLabel('Title (required)').fill('Banned Books Week');
  for (const id of ['landscape-hd', 'portrait-hd', 'letter-poster']) {
    const card = page.locator(`[data-format="${id}"]`);
    await expect(card.locator('.sc-title')).toHaveText('Banned Books Week');
    await expect(card.getByRole('img')).toHaveAttribute('aria-label', /Banned Books Week/);
  }
});

test('form has no axe violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('error summary state has no axe violations and links to fields', async ({ page }) => {
  await page.getByLabel('Title (required)').fill('');
  await page.getByLabel('Location (required)').fill('x'.repeat(61));
  await page.getByRole('button', { name: 'Check for problems' }).click();
  const summary = page.locator('.error-summary');
  await expect(summary).toBeFocused();
  await expect(summary.getByRole('link')).toHaveCount(2);
  await summary.getByRole('link', { name: /Title/ }).click();
  await expect(page.getByLabel('Title (required)')).toBeFocused();
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
