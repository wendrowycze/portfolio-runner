import { expect, test } from '@playwright/test';
import { collectErrors } from './helpers';

/**
 * Ekran startowy z pochodniami i hotel z trzema piętrami: formularz zapala pochodnie,
 * brama wpuszcza do środka, winda wozi między piętrami, posąg reaguje na klik.
 */
test('start: pochodnie zapalają się od pól formularza, „Wejdź” otwiera bramę do hotelu', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto('./');
  await expect(page.locator('body')).toHaveAttribute('data-game-ready', 'true');
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'start', { timeout: 15_000 });
  await expect(page.locator('#panel')).toHaveAttribute('data-phase', 'start');
  const enter = page.locator('[data-testid="start-enter"]');
  await expect(enter).toBeDisabled();

  // Pochodnia prowadzona kursorem po fasadzie.
  const canvas = page.locator('#runner canvas');
  const box = await canvas.boundingBox();
  if (box !== null) {
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.7);
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4, { steps: 12 });
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/screens/start-ciemnosc.png', fullPage: true });

  await page.locator('[data-testid="start-name"]').fill('Ola');
  await expect(page.locator('body')).toHaveAttribute('data-torches', '1');
  await page.locator('[data-testid="start-email"]').fill('ola@przyklad.pl');
  await expect(page.locator('body')).toHaveAttribute('data-torches', '2');
  await expect(enter).toBeDisabled();
  await page.locator('label.lever').click();
  await expect(page.locator('body')).toHaveAttribute('data-torches', '3');
  await expect(enter).toBeEnabled();
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'docs/screens/start-pochodnie.png', fullPage: true });

  await enter.click();
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'hub', { timeout: 20_000 });
  await expect(page.locator('#panel')).toHaveAttribute('data-phase', 'hub');
  await expect(page.locator('#panel')).toContainText('Witaj, Ola');
  expect(errors).toEqual([]);
});

test('hotel: winda jeździ między trzema piętrami, gość może iść i wejść w obraz z listy', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto('./?guest=1');
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'hub', { timeout: 15_000 });
  await expect(page.locator('body')).toHaveAttribute('data-floor', '0');
  await expect(page.locator('[data-testid="floor"]')).toHaveCount(3);

  // Przycisk piętra: gość dochodzi do windy i jedzie na 2. piętro (Biznes).
  await page.locator('[data-testid="floor"][data-floor="2"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-floor', '2', { timeout: 20_000 });
  await expect(page.locator('body')).toHaveAttribute('data-world', 'biznes');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'docs/screens/hotel-biznes.png', fullPage: true });

  // Klawiszem S w dół na 1. piętro (Edukacja).
  await page.locator('#runner canvas').click({ position: { x: 20, y: 20 } });
  await page.keyboard.press('KeyS');
  await expect(page.locator('body')).toHaveAttribute('data-floor', '1', { timeout: 20_000 });
  await expect(page.locator('body')).toHaveAttribute('data-world', 'edukacja');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'docs/screens/hotel-edukacja.png', fullPage: true });

  // Wejście w historię z tego piętra przez listę w panelu.
  await page.locator('[data-testid="hub-enter"][data-case="narzedziownik-biz"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'runner', { timeout: 15_000 });
  await expect(page.locator('body')).toHaveAttribute('data-case-id', 'narzedziownik-biz');
  expect(errors).toEqual([]);
});

test('hotel: dźwięk da się wyciszyć klawiszem M i przyciskiem', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('./?guest=1');
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'hub', { timeout: 15_000 });
  const toggle = page.locator('[data-testid="audio-toggle"]');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('KeyM');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});
