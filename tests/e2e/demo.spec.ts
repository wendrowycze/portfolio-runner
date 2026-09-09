import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { loadCase } from '../../src/content/loader';
import { collectErrors, runThroughNarration } from './helpers';

const demo = loadCase(
  JSON.parse(readFileSync(new URL('../../content/cases/_demo.json', import.meta.url), 'utf8')),
);

const panel = (page: Page) => page.locator('#panel');

async function waitForBeat(page: Page, id: string): Promise<void> {
  await expect(panel(page)).toHaveAttribute('data-beat', id, { timeout: 30_000 });
}

/** Z hubu (zniszczony obraz) do sceny biegu — przyciskiem w panelu. */
async function enterFromHub(page: Page): Promise<void> {
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'hub', { timeout: 15_000 });
  await page.locator('[data-testid="hub-enter"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'runner', { timeout: 15_000 });
}

/** Klika poprawną opcję aktualnego beatu choice na podstawie treści JSON. */
async function answerChoice(page: Page, beatId: string): Promise<void> {
  const beat = demo.beats.find((b) => b.id === beatId);
  if (beat?.type !== 'choice') throw new Error(`${beatId} nie jest choice`);
  const index = beat.options.findIndex((o) => o.correct);
  await page.locator('[data-testid="option"]').nth(index).click();
}

test('pełne przejście _demo.json w layoucie side: wybory, QTE, fragmenty, finał', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto('./?layout=side&case=_demo');
  await expect(page.locator('body')).toHaveAttribute('data-game-ready', 'true');
  await expect(page.locator('#game')).toHaveAttribute('data-layout', 'side');
  await enterFromHub(page);

  // b01: narracja odsłania się, gdy trzymasz D; A cofa bieg i tekst.
  await waitForBeat(page, 'b01');
  const paragraph = page.locator('[data-narration="b01"]');
  await expect(paragraph).toHaveText('');
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(1500);
  await page.keyboard.up('KeyD');
  const afterRun = (await paragraph.textContent())?.length ?? 0;
  expect(afterRun).toBeGreaterThan(20);
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(900);
  await page.keyboard.up('KeyA');
  const afterRewind = (await paragraph.textContent())?.length ?? 0;
  expect(afterRewind).toBeLessThan(afterRun);
  await runThroughNarration(page, 'b01');

  // b02: druga narracja tego samego odcinka — dalej trzymamy D.
  await waitForBeat(page, 'b02');
  await runThroughNarration(page, 'b02');

  // b03: wybór — czas zwolniony, opcje widoczne, pasek czasu.
  await expect(page.locator('[data-testid="option"]')).toHaveCount(3);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'docs/screens/etap2-side.png', fullPage: true });
  await answerChoice(page, 'b03');
  await expect(page.locator('.fragment-slot[data-collected="true"]')).toHaveCount(1);

  // b04: QTE — czekamy aż pierścień otworzy okno, wtedy spacja.
  await waitForBeat(page, 'b04');
  await expect(page.locator('[data-testid="qte"]')).toHaveAttribute('data-open', 'true', {
    timeout: 10_000,
  });
  await page.keyboard.press('Space');
  await expect(page.locator('.fragment-slot[data-collected="true"]')).toHaveCount(2);

  // b05: wyniki.
  await waitForBeat(page, 'b05');
  await expect(page.locator('[data-testid="results"]')).toBeVisible();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'docs/screens/etap2-results.png', fullPage: true });
  await page.locator('[data-testid="continue"]').click();

  // b06: finał — tło składa się w obraz w scenie, potem CTA i powrót w panelu.
  await waitForBeat(page, 'b06');
  await expect(page.locator('body')).toHaveAttribute('data-finale', 'assembled', {
    timeout: 20_000,
  });
  await expect(page.locator('[data-testid="finale-return"]')).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'docs/screens/etap2-finale.png', fullPage: true });
  await page.locator('[data-testid="finale-return"]').click();

  // Po finale: powrót do hubu z odrestaurowanym obrazem.
  await expect(page.locator('body')).toHaveAttribute('data-painting', 'restored', {
    timeout: 15_000,
  });
  expect(errors).toEqual([]);
});

test('layout stack: panel pod biegiem, zły wybór zatrzymuje bieg i wraca do tego samego beatu', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto('./?layout=stack&case=_demo');
  await expect(page.locator('body')).toHaveAttribute('data-game-ready', 'true');
  await expect(page.locator('#game')).toHaveAttribute('data-layout', 'stack');
  await enterFromHub(page);

  const runnerBox = await page.locator('#runner').boundingBox();
  const panelBox = await page.locator('#panel').boundingBox();
  expect(runnerBox).not.toBeNull();
  expect(panelBox).not.toBeNull();
  if (runnerBox !== null && panelBox !== null) expect(panelBox.y).toBeGreaterThan(runnerBox.y);

  await waitForBeat(page, 'b01');
  await runThroughNarration(page, 'b01'); // strzałka w prawo też działa
  await waitForBeat(page, 'b02');
  await page.keyboard.down('ArrowRight');
  await expect(panel(page)).toHaveAttribute('data-beat', 'b03', { timeout: 60_000 });
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'docs/screens/etap2-stack.png', fullPage: true });

  // Zły wybór klawiszem: feedback, potem ten sam beat wraca.
  const beat = demo.beats.find((b) => b.id === 'b03');
  const wrongIndex = beat?.type === 'choice' ? beat.options.findIndex((o) => !o.correct) : 0;
  await page.keyboard.press(`Digit${String(wrongIndex + 1)}`);
  await expect(panel(page)).toHaveAttribute('data-phase', 'feedback');
  await expect(page.locator('.entry-feedback.is-wrong')).toBeVisible();
  await expect(panel(page)).toHaveAttribute('data-phase', 'choice', { timeout: 10_000 });
  await expect(page.locator('.fragment-slot[data-collected="true"]')).toHaveCount(0);
  await answerChoice(page, 'b03');
  await expect(page.locator('.fragment-slot[data-collected="true"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});
