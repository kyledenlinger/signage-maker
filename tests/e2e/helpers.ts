import type { Page } from '@playwright/test';

/** The live status bar (lib/problems.ts). */
export const statusBar = (page: Page) => page.locator('#status-bar');

/**
 * The sample event ships with the "Accessibility requests: [email]" placeholder, which blocks
 * export. Replace it so the sample is ready to download.
 */
export async function fillAccommodations(page: Page) {
  await page.getByRole('textbox', { name: 'Accommodations line' }).fill('Accessibility requests: zsr@example.edu');
}

/** Shows a format in the large preview (its download buttons appear under it). */
export async function selectFormat(page: Page, formatId: string) {
  await page.locator(`.format-button[data-format="${formatId}"]`).click();
}

/** Opens step 4, Details (collapsed by default). */
export async function openDetails(page: Page) {
  const details = page.locator('details.form-details');
  if (!(await details.evaluate((d: HTMLDetailsElement) => d.open))) await details.locator('> summary').click();
}

/** Shows the background image upload (behind "Use a full background image instead"). */
export async function revealBackground(page: Page) {
  const link = page.getByRole('button', { name: 'Use a full background image instead' });
  if (await link.count()) await link.click();
}
