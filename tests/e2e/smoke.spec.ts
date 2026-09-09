import { expect, test } from '@playwright/test';

test('strona się ładuje, widać tytuł i scenę gry', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('./');

  await expect(page).toHaveTitle('Portfolio Runner');
  await expect(page.locator('#panel-title')).toHaveText('Portfolio Runner');
  await expect(page.locator('#runner canvas')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-game-ready', 'true');

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/screens/etap0.png', fullPage: true });

  expect(consoleErrors).toEqual([]);
});
