import { expect, type Page } from '@playwright/test';

const EXTERNAL_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

/**
 * Zbiera błędy z konsoli i wyjątki strony. Pomija wyłącznie błędy ładowania zasobów z zewnętrznych
 * hostów (Google Fonts) — w środowisku bez sieci fonty mają fallback systemowy i nie są błędem gry.
 */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const url = message.location().url;
    if (EXTERNAL_HOSTS.some((host) => url.includes(host))) return;
    errors.push(`${message.text()} (${url})`);
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

/**
 * Narracja odsłania się biegiem: trzymamy D, aż bieżący beat się zmieni
 * (kolejna narracja tego samego odcinka albo następny beat innego typu).
 */
export async function runThroughNarration(page: Page, beatId: string): Promise<void> {
  await page.keyboard.down('KeyD');
  try {
    await expect(page.locator('#panel')).not.toHaveAttribute('data-beat', beatId, {
      timeout: 60_000,
    });
  } finally {
    await page.keyboard.up('KeyD');
  }
}
