import Phaser from 'phaser';
import { createGameConfig } from './config/gameConfig';

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Brak elementu #${id} w index.html`);
  }
  return element;
}

async function start(): Promise<void> {
  const runnerContainer = requireElement('runner');

  // Czekamy na fonty, żeby tytuł w canvasie nie renderował się fontem zastępczym.
  // Przy braku sieci (np. CI) document.fonts.ready i tak się rozwiązuje — z fallbackiem.
  await document.fonts.ready;

  const game = new Phaser.Game(createGameConfig(runnerContainer));

  // Phaser nie zawsze wykrywa zmianę rozmiaru kontenera (patrz CLAUDE.md, "Pułapki").
  window.addEventListener('resize', () => {
    game.scale.refresh();
  });

  // Znacznik dla testów e2e: gra wystartowała.
  document.body.dataset.gameReady = 'true';
}

void start();
