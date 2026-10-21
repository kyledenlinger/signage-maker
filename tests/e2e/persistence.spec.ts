import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
});

const title = (page: Page) => page.getByLabel('Title (required)');
const projectFileInput = (page: Page) => page.locator('.project-bar input[type="file"]');

/** Waits past the autosave debounce. */
async function settle(page: Page) {
  await page.waitForTimeout(400);
}

async function addCustomSize(page: Page, name: string, width: number, height: number) {
  await page.getByText('Custom sizes').click();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel('Width (px)').fill(String(width));
  await page.getByLabel('Height (px)').fill(String(height));
  await page.getByRole('button', { name: 'Add size' }).click();
}

async function saveProject(page: Page) {
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save project' }).click()]);
  return download;
}

test('reload restores the last project', async ({ page }) => {
  await title(page).fill('Banned Books Week');
  await page.getByLabel('Template (required)').selectOption('band');
  await page.getByLabel('Theme (required)').selectOption('light');
  await page.getByLabel('Highlight 1', { exact: true }).fill('Read-out');
  await settle(page);
  await page.reload();
  await expect(title(page)).toHaveValue('Banned Books Week');
  await expect(page.getByLabel('Template (required)')).toHaveValue('band');
  await expect(page.getByLabel('Theme (required)')).toHaveValue('light');
  await expect(page.getByLabel('Highlight 1', { exact: true })).toHaveValue('Read-out');
  await expect(page.locator('[data-format="landscape-hd"] [data-slot="title"]')).toHaveText('Banned Books Week');
  await expect(page.getByText('Changes are saved in this browser automatically.')).toBeVisible();
});

test('start new event asks first, then clears the form and stays cleared', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Start new event' });
  await trigger.click();
  const confirm = page.getByRole('group', { name: 'Start new event' });
  await expect(confirm).toBeVisible();
  await expect(confirm.getByRole('button', { name: 'Start new event' })).toBeFocused();
  expect((await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations).toEqual([]);

  await confirm.getByRole('button', { name: 'Cancel' }).click();
  await expect(trigger).toBeFocused();
  await expect(title(page)).toHaveValue('Halloween Game Night');

  await trigger.click();
  await page.getByRole('group', { name: 'Start new event' }).getByRole('button', { name: 'Start new event' }).click();
  await expect(title(page)).toHaveValue('');
  await expect(title(page)).toBeFocused();
  await expect(page.getByLabel('Location (required)')).toHaveValue('');
  await settle(page);
  await page.reload();
  await expect(title(page)).toHaveValue('');
});

test('duplicate keeps template, theme, logos and accommodations; clears the event', async ({ page }) => {
  await page.getByLabel('Template (required)').selectOption('split');
  await page.getByLabel('Theme (required)').selectOption('high-contrast');
  await page.getByRole('textbox', { name: 'Accommodations line' }).fill('Accessibility requests: zsr@example.edu');
  const logo = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 400;
    c.height = 100;
    c.getContext('2d')!.fillRect(0, 0, 400, 100);
    return c.toDataURL('image/png').split(',')[1];
  });
  await page.getByLabel('Co-sponsor logos').setInputFiles({ name: 'cosponsor.png', mimeType: 'image/png', buffer: Buffer.from(logo, 'base64') });
  await expect(page.locator('.file-list')).toContainText('cosponsor.png');

  await page.getByRole('button', { name: 'Duplicate event' }).click();
  await page.getByRole('group', { name: 'Duplicate event' }).getByRole('button', { name: 'Duplicate event' }).click();

  await expect(title(page)).toHaveValue('');
  await expect(title(page)).toBeFocused();
  await expect(page.getByLabel('Date (required)')).toHaveValue('');
  await expect(page.getByLabel('Template (required)')).toHaveValue('split');
  await expect(page.getByLabel('Theme (required)')).toHaveValue('high-contrast');
  await expect(page.getByRole('textbox', { name: 'Accommodations line' })).toHaveValue('Accessibility requests: zsr@example.edu');
  await expect(page.locator('.file-list')).toContainText('cosponsor.png');
});

test('a saved project reopens identically, with its photo and custom size', async ({ page }, testInfo) => {
  await title(page).fill('Banned Books Week');
  await page.getByLabel('Template (required)').selectOption('frame');
  const photo = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 2400;
    c.height = 1600;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#336699';
    ctx.fillRect(0, 0, 2400, 1600);
    return c.toDataURL('image/png').split(',')[1];
  });
  await page.locator('#field-image').setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from(photo, 'base64') });
  await page.getByLabel('Image description').fill('A blue rectangle');
  await page.getByLabel(/Left to right/).fill('30');
  await addCustomSize(page, 'Lobby screen', 1366, 768);
  await settle(page);

  const first = await saveProject(page);
  expect(first.suggestedFilename()).toBe('banned-books-week.signage.json');
  const firstPath = testInfo.outputPath('first.signage.json');
  await first.saveAs(firstPath);

  // A fresh browser: no autosave, no custom sizes.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(title(page)).toHaveValue('Halloween Game Night');
  await expect(page.getByRole('checkbox', { name: /Lobby screen/ })).toHaveCount(0);

  await projectFileInput(page).setInputFiles(firstPath);
  await expect(page.locator('.project-status')).toContainText('Opened first.signage.json.');
  await expect(title(page)).toHaveValue('Banned Books Week');
  await expect(page.getByRole('checkbox', { name: /Lobby screen/ })).toBeChecked();
  await expect(page.locator('[data-format="custom-lobby-screen"]')).toBeVisible();
  await expect(page.locator('[data-format="landscape-hd"] .t-photo img')).toHaveAttribute('style', /object-position: 30% 50%/);

  await settle(page);
  const second = await saveProject(page);
  const strip = (text: string) => {
    const json = JSON.parse(text);
    delete json.savedAt;
    return json;
  };
  const [a, b] = await Promise.all([readFile(firstPath, 'utf8'), readFile((await second.path())!, 'utf8')]);
  expect(strip(b)).toEqual(strip(a));
});

test('opening a file that is not a project shows a message and changes nothing', async ({ page }, testInfo) => {
  const path = testInfo.outputPath('notes.json');
  await writeFile(path, '{"hello": "world"}');
  await projectFileInput(page).setInputFiles(path);
  await expect(page.locator('.project-status')).toContainText('This file isn’t a Signage Builder project.');
  await expect(page.getByRole('status').first()).toBeAttached();
  await expect(title(page)).toHaveValue('Halloween Game Night');
});

test('custom sizes: validated, previewed, exported at exact size, remembered, removable', async ({ page }) => {
  await page.getByText('Custom sizes').click();
  await page.getByRole('button', { name: 'Add size' }).click();
  await expect(page.locator('#custom-name-error')).toHaveText('Give the size a name.');
  await expect(page.locator('#custom-width-error')).toContainText('from 200 to 8000');
  expect((await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations).toEqual([]);

  await page.getByLabel('Name', { exact: true }).fill('Lobby screen');
  await page.getByLabel('Width (px)').fill('1366');
  await page.getByLabel('Height (px)').fill('768');
  await expect(page.getByLabel('Layout', { exact: true })).toHaveValue('landscape');
  await page.getByRole('button', { name: 'Add size' }).click();
  await expect(page.locator('.custom-status')).toHaveText('Added Lobby screen (1366 × 768) and selected it.');

  const card = page.locator('[data-format="custom-lobby-screen"]');
  await expect(card).toHaveAttribute('data-fits', 'true');
  const [file] = await Promise.all([page.waitForEvent('download'), card.getByRole('button', { name: 'Download PNG of Lobby screen' }).click()]);
  expect(file.suggestedFilename()).toBe('halloween-game-night_lobby-screen_1366x768.png');
  const png = await readFile((await file.path())!);
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1366, 768]);

  await settle(page);
  await page.reload();
  await expect(page.getByRole('checkbox', { name: /Lobby screen/ })).toBeChecked();

  await page.getByText('Custom sizes').click();
  await page.getByRole('button', { name: 'Remove Lobby screen' }).click();
  await expect(page.getByRole('checkbox', { name: /Lobby screen/ })).toHaveCount(0);
  await expect(card).toHaveCount(0);
});
