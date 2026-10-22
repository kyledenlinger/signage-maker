import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { fillAccommodations, openDetails } from './helpers';
import { chooseTemplate, chooseTheme, openFormats, openMoreOptions } from './helpers';

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await openFormats(page);
  await page.evaluate(() => document.fonts.ready);
  await openMoreOptions(page);
  await openFormats(page);
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
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save project file' }).click()]);
  return download;
}

test('reload restores the last project', async ({ page }) => {
  await title(page).fill('Banned Books Week');
  await chooseTemplate(page, 'band');
  await chooseTheme(page, 'light');
  await openDetails(page);
  await page.getByLabel('Highlight 1', { exact: true }).fill('Read-out');
  await settle(page);
  await page.reload();
  await openFormats(page);
  await expect(title(page)).toHaveValue('Banned Books Week');
  await expect(page.locator('.option-card[data-template=\"band\"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.pill[data-theme=\"light\"]')).toHaveAttribute('aria-pressed', 'true');
  await openDetails(page);
  await expect(page.getByLabel('Highlight 1', { exact: true })).toHaveValue('Read-out');
  await expect(page.locator('[data-format="landscape-hd"] [data-slot="title"]')).toHaveText('Banned Books Week');
  const saved = page.locator('.project-status');
  await expect(saved).toContainText('Saved in this browser');
  await expect(saved).toHaveAttribute('title', 'Only in this browser. Use Save project file to keep a copy or move to another computer.');
  await expect(page.getByRole('button', { name: 'Save project file' })).toHaveAccessibleDescription('Downloads a .json file you can reopen later.');
});

test('New event asks first, then clears the form and stays cleared', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'New event' });
  await trigger.click();
  const confirm = page.getByRole('group', { name: 'New event' });
  await expect(confirm).toBeVisible();
  await expect(confirm.getByRole('button', { name: 'New event' })).toBeFocused();
  expect((await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations).toEqual([]);

  await confirm.getByRole('button', { name: 'Cancel' }).click();
  await expect(trigger).toBeFocused();
  await expect(title(page)).toHaveValue('Halloween Game Night');

  await trigger.click();
  await page.getByRole('group', { name: 'New event' }).getByRole('button', { name: 'New event' }).click();
  await expect(title(page)).toHaveValue('');
  await expect(title(page)).toBeFocused();
  await expect(page.getByLabel('Location (required)')).toHaveValue('');
  await settle(page);
  await page.reload();
  await openFormats(page);
  await expect(title(page)).toHaveValue('');
});

test('Next in this series keeps template, theme, logos and accommodations; clears the event', async ({ page }) => {
  await chooseTemplate(page, 'split');
  await chooseTheme(page, 'high-contrast');
  await page.getByRole('textbox', { name: 'Accommodations line' }).fill('Accessibility requests: zsr@example.edu');
  const logo = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 400;
    c.height = 100;
    c.getContext('2d')!.fillRect(0, 0, 400, 100);
    return c.toDataURL('image/png').split(',')[1];
  });
  await page.locator('#field-logos').setInputFiles({ name: 'cosponsor.png', mimeType: 'image/png', buffer: Buffer.from(logo, 'base64') });
  await expect(page.locator('.drop-files')).toContainText('cosponsor.png');

  await page.getByRole('button', { name: 'Next in this series' }).click();
  await page.getByRole('group', { name: 'Next in this series' }).getByRole('button', { name: 'Next in this series' }).click();

  await expect(title(page)).toHaveValue('');
  await expect(title(page)).toBeFocused();
  await expect(page.getByLabel('Date (required)')).toHaveValue('');
  await expect(page.locator('.option-card[data-template=\"split\"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.pill[data-theme=\"high-contrast\"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('textbox', { name: 'Accommodations line' })).toHaveValue('Accessibility requests: zsr@example.edu');
  await expect(page.locator('.drop-files')).toContainText('cosponsor.png');
});

test('a saved project reopens identically, with its photo and custom size', async ({ page }, testInfo) => {
  await title(page).fill('Banned Books Week');
  await chooseTemplate(page, 'frame');
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
  await openFormats(page);
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

  await fillAccommodations(page);
  const card = page.locator('[data-format="custom-lobby-screen"]');
  await expect(card).toHaveAttribute('data-fits', 'true');
  await card.click();
  const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PNG of Lobby screen' }).click()]);
  expect(file.suggestedFilename()).toBe('halloween-game-night_lobby-screen_1366x768.png');
  const png = await readFile((await file.path())!);
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1366, 768]);

  await settle(page);
  await page.reload();
  await openFormats(page);
  await expect(page.getByRole('checkbox', { name: /Lobby screen/ })).toBeChecked();

  await page.getByText('Custom sizes').click();
  await page.getByRole('button', { name: 'Remove Lobby screen' }).click();
  await expect(page.getByRole('checkbox', { name: /Lobby screen/ })).toHaveCount(0);
  await expect(card).toHaveCount(0);
});
