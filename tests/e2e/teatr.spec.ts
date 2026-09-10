import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { loadCase } from '../../src/content/loader';
import { collectErrors, runThroughNarration } from './helpers';

/**
 * Pełne przejście pilota „Teatr jest nasz” przez FAKTYCZNE klikanie (nie API):
 * hub (zniszczony obraz) → wszystkie beaty → finał → hub (obraz odrestaurowany).
 */
const kejs = loadCase(
  JSON.parse(
    readFileSync(new URL('../../content/cases/teatr-jest-nasz.json', import.meta.url), 'utf8'),
  ),
);

const panel = (page: Page) => page.locator('#panel');
const GALLERY_COUNT = 12;

async function waitForBeat(page: Page, id: string): Promise<void> {
  await expect(panel(page)).toHaveAttribute('data-beat', id, { timeout: 30_000 });
}

async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `docs/screens/${name}.png`, fullPage: true });
}

async function solvePuzzle(page: Page): Promise<void> {
  const tiles = page.locator('.puzzle-tile');
  for (let step = 0; step < 12; step += 1) {
    const state = await tiles.evaluateAll((nodes) =>
      nodes.map((n) => ({
        pos: Number((n as HTMLElement).dataset.pos),
        target: Number((n as HTMLElement).dataset.target),
      })),
    );
    const wrong = state.findIndex((t) => t.pos !== t.target);
    if (wrong === -1) return;
    // Kafel stojący na miejscu docelowym kafla `wrong`.
    const occupant = state.findIndex((t) => t.pos === state[wrong]?.target);
    await tiles.nth(wrong).click();
    await tiles.nth(occupant).click();
  }
}

test('hub → pełny case „Teatr jest nasz” → odrestaurowany obraz, zero błędów w konsoli', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto('./?guest=1');
  await expect(page.locator('body')).toHaveAttribute('data-game-ready', 'true');
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'hub', { timeout: 15_000 });
  await expect(page.locator('body')).toHaveAttribute('data-painting', 'damaged');
  await expect(page.locator('body')).toHaveAttribute('data-floor', '0');
  await expect(page.locator('[data-testid="gallery"] .gallery-item')).toHaveCount(GALLERY_COUNT);
  await page.waitForTimeout(900);
  await shot(page, 'hotel-parter');

  // Gość idzie korytarzem (D) do pierwszego obrazu („Teatr jest nasz”) i wchodzi klawiszem E.
  await page.keyboard.down('KeyD');
  await expect(page.locator('body')).toHaveAttribute('data-near', 'teatr-jest-nasz', {
    timeout: 20_000,
  });
  await page.keyboard.up('KeyD');
  await page.waitForTimeout(500);
  await shot(page, 'hotel-przy-obrazie');
  await page.keyboard.press('KeyE');
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'runner', { timeout: 15_000 });
  await expect(page.locator('body')).toHaveAttribute('data-case-id', 'teatr-jest-nasz');
  // Tło biegu z trzech warstw z API (kafle obrazu dryfują w scenerii i składają się w finale).
  await expect(page.locator('body')).toHaveAttribute('data-bg', 'layers');
  await expect(page.locator('#panel-title')).toHaveText(kejs.title);

  const screenshots = new Set<string>();
  for (const beat of kejs.beats) {
    await waitForBeat(page, beat.id);
    switch (beat.type) {
      case 'narration': {
        if (!screenshots.has('narration')) {
          screenshots.add('narration');
          await page.keyboard.down('KeyD');
          await page.waitForTimeout(2200);
          await page.keyboard.up('KeyD');
          await shot(page, 'etap3-narration');
        }
        await runThroughNarration(page, beat.id);
        break;
      }
      case 'choice': {
        await expect(page.locator('[data-testid="option"]')).toHaveCount(beat.options.length);
        if (!screenshots.has('choice')) {
          screenshots.add('choice');
          await page.waitForTimeout(1500);
          await shot(page, 'etap3-choice');
        }
        await page
          .locator('[data-testid="option"]')
          .nth(beat.options.findIndex((o) => o.correct))
          .click();
        break;
      }
      case 'action': {
        // Zrzut w fazie „czekaj”, zanim otworzy się okno (zrzut całej strony trwa i pod obciążeniem
        // zjadał okno 800 ms). Na otwarcie czekamy obserwatorem DOM, nie odpytywaniem co sekundę.
        if (!screenshots.has('action')) {
          screenshots.add('action');
          await page.waitForTimeout(300);
          await shot(page, 'etap3-action');
        }
        await page.locator('[data-testid="qte"][data-open="true"]').waitFor({ timeout: 10_000 });
        await page.keyboard.press('Space');
        break;
      }
      case 'interaction': {
        if (beat.widget === 'button') {
          await page.locator('[data-testid="widget-button"]').click();
          await page.waitForTimeout(700);
          await shot(page, 'etap3-button');
          const next = page.locator('[data-testid="widget-continue"]');
          await expect(next).toBeEnabled({ timeout: 10_000 });
          await next.click();
        } else if (beat.widget === 'puzzle') {
          await expect(page.locator('[data-testid="puzzle"]')).toBeVisible();
          await shot(page, 'etap3-puzzle');
          await solvePuzzle(page);
          await expect(page.locator('[data-testid="puzzle"]')).toHaveAttribute(
            'data-complete',
            'true',
          );
        } else {
          await expect(page.locator('[data-testid="reveal"]')).toBeHidden({ timeout: 10_000 });
        }
        break;
      }
      case 'results': {
        await expect(page.locator('[data-testid="results"]')).toBeVisible();
        await expect(page.locator('.fragment-slot[data-collected="true"]')).toHaveCount(6);
        await page.waitForTimeout(1300);
        await shot(page, 'etap3-results');
        await page.locator('[data-testid="continue"]').click();
        break;
      }
      case 'finale': {
        await expect(page.locator('body')).toHaveAttribute('data-finale', 'assembled', {
          timeout: 30_000,
        });
        await expect(page.locator('[data-testid="finale-return"]')).toBeVisible({
          timeout: 30_000,
        });
        await expect(page.locator('[data-testid="finale-cta"]')).toHaveAttribute(
          'href',
          beat.cta.url,
        );
        await shot(page, 'etap3-finale');
        await page.locator('[data-testid="finale-return"]').click();
        break;
      }
    }
  }

  // Powrót do hubu: obraz odrestaurowany, panel proponuje ponowną grę.
  await expect(page.locator('body')).toHaveAttribute('data-painting', 'restored', {
    timeout: 15_000,
  });
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'hub', { timeout: 15_000 });
  await expect(page.locator('body')).toHaveAttribute('data-restored', /teatr-jest-nasz/);
  await expect(page.locator('.gallery-item.is-restored')).toHaveCount(1);
  // Piętro naprawia się falą po odrestaurowanym obrazie.
  await expect(page.locator('body')).toHaveAttribute('data-floor-restored', /partial|full/, {
    timeout: 15_000,
  });
  await page.waitForTimeout(600);
  await shot(page, 'hotel-parter-naprawiony');
  expect(errors).toEqual([]);
});

test('hub: przycisk w panelu wchodzi w wybraną historię (klawiatura/czytnik ekranu)', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto('./?layout=stack&guest=1');
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'hub', { timeout: 15_000 });
  await page.locator('[data-testid="hub-enter"][data-case="kultura-futura"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'runner', { timeout: 15_000 });
  await expect(page.locator('body')).toHaveAttribute('data-case-id', 'kultura-futura');
  await waitForBeat(page, 'b01');
  // Druga historia ma własny obraz i biegnie na tym samym silniku.
  await runThroughNarration(page, 'b01');
  await waitForBeat(page, 'b02');
  expect(errors).toEqual([]);
});
