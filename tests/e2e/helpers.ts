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
