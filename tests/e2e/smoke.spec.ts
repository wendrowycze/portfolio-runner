import { expect, test } from '@playwright/test';
import { collectErrors } from './helpers';

test('strona się ładuje, widać tytuł i scenę gry', async ({ page }) => {
  const consoleErrors = collectErrors(page);

  await page.goto('./');

  await expect(page).toHaveTitle('Portfolio Runner');
  await expect(page.locator('#panel-title')).toHaveText('Portfolio Runner');
  await expect(page.locator('#runner canvas')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-game-ready', 'true');

  expect(consoleErrors).toEqual([]);
});
