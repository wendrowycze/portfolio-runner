import Phaser from 'phaser';
import { createGameConfig } from './config/gameConfig';
import { resolveLayout, urlFlag } from './config/layout';
import { TUNING } from './config/tuning';
import type { RunnerSceneData } from './scenes/RunnerScene';

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Brak elementu #${id} w index.html`);
  }
  return element;
}

async function start(): Promise<void> {
  const gameRoot = requireElement('game');
  const runnerContainer = requireElement('runner');

  // Layout stack/side przełączany w runtime parametrem URL (docs/02_ARCHITEKTURA.md sekcja 10).
  const layout = resolveLayout(window.location.search, import.meta.env.VITE_LAYOUT);
  gameRoot.dataset.layout = layout;

  // Czekamy na fonty, żeby tekst w canvasie nie renderował się fontem zastępczym.
  await document.fonts.ready;

  const game = new Phaser.Game(createGameConfig(runnerContainer));
  const runnerData: RunnerSceneData = { debug: urlFlag(window.location.search, 'debug') };
  game.registry.set('runnerData', runnerData);

  // Phaser nie zawsze wykrywa zmianę rozmiaru kontenera (CLAUDE.md, „Pułapki”) — debounce.
  let resizeTimer: number | undefined;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      game.scale.refresh();
    }, TUNING.RESIZE_DEBOUNCE_MS);
  });

  document.body.dataset.gameReady = 'true';
}

void start();
