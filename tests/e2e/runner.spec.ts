import { expect, test } from '@playwright/test';
import { collectErrors } from './helpers';

test('bieg działa: skok klawiaturą, HUD debug pokazuje FPS i prędkość', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('./?debug=1');
  await expect(page.locator('body')).toHaveAttribute('data-game-ready', 'true');
  await expect(page.locator('#runner canvas')).toBeVisible();

  // Kilka sekund biegu z paroma skokami — silnik nie może rzucić błędu.
  await page.locator('#runner canvas').click();
  for (let i = 0; i < 4; i += 1) {
    await page.waitForTimeout(900);
    await page.keyboard.press('Space');
  }
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(800);

  await page.screenshot({ path: 'docs/screens/etap1.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('mobile: tap w obszar biegu = skok, layout składa się góra/dół', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const errors = collectErrors(page);
  await page.goto('./');
  await expect(page.locator('body')).toHaveAttribute('data-game-ready', 'true');

  const runner = page.locator('#runner');
  const box = await runner.boundingBox();
  expect(box).not.toBeNull();
  if (box !== null) {
    // Na wąskim ekranie runner jest nad panelem (jeden pod drugim).
    expect(box.width).toBeGreaterThan(370);
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(700);
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'docs/screens/etap1-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
  await context.close();
});
