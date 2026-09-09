import Phaser from 'phaser';
import { createGameConfig } from './config/gameConfig';
import { resolveLayout, urlFlag } from './config/layout';
import { TUNING } from './config/tuning';
import { DEFAULT_CASE_ID, fetchCase, isKnownCase } from './content/cases';
import { loadUiStrings, type UiStrings } from './content/uiStrings';
import type { RunnerSceneData } from './scenes/RunnerScene';
import { ScriptRunner } from './script/ScriptRunner';
import { createGameState, resetGameState } from './state/GameState';
import { bus } from './events/bus';
import { DialoguePanel } from './ui/DialoguePanel';
import { clear, el } from './ui/dom';

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
  const panelContainer = requireElement('panel');
  const search = window.location.search;

  // Layout stack/side przełączany w runtime parametrem URL (docs/02_ARCHITEKTURA.md sekcja 10).
  gameRoot.dataset.layout = resolveLayout(search, import.meta.env.VITE_LAYOUT);

  const strings = loadUiStrings();
  const debug = urlFlag(search, 'debug');

  // Tryb wolnego biegu (Etap 1): bez historii, przeszkody proceduralne — do oceny tempa biegu.
  if (urlFlag(search, 'free')) {
    renderFreeRunPanel(panelContainer, strings);
    await document.fonts.ready;
    const game = new Phaser.Game(createGameConfig(runnerContainer));
    game.registry.set('runnerData', { debug } satisfies RunnerSceneData);
    watchResize(game);
    document.body.dataset.gameReady = 'true';
    document.body.dataset.mode = 'free';
    return;
  }

  // Treść: case z ?case= (domyślnie pilot „Teatr jest nasz”), zwalidowany przez zod przy ładowaniu.
  const requestedCase = new URLSearchParams(search).get('case');
  const caseId =
    requestedCase !== null && isKnownCase(requestedCase) ? requestedCase : DEFAULT_CASE_ID;
  const kejs = await fetchCase(caseId);
  document.title = `${kejs.title} — Portfolio Runner`;

  const state = createGameState(kejs.runner.baseSpeed);
  const runner = new ScriptRunner(state);
  runner.load(kejs);

  const panel = new DialoguePanel(panelContainer, runner, state, strings, {
    overlayParent: gameRoot,
    returnLabel: strings.finaleReturn,
  });
  panel.showHub(kejs, false);

  // Wejście w obraz (klik na hubie / przycisk w panelu): świeży stan, panel gotowy na beaty.
  bus.on('hub:enter', () => {
    resetGameState(state, kejs.runner.baseSpeed);
    runner.load(kejs);
    panel.mount(kejs);
  });

  // Czekamy na fonty, żeby tekst w canvasie nie renderował się fontem zastępczym.
  await document.fonts.ready;

  const game = new Phaser.Game(createGameConfig(runnerContainer));
  const runnerData: RunnerSceneData = { debug, script: { runner, kejs, state } };
  game.registry.set('runnerData', runnerData);
  game.registry.set('uiStrings', strings);

  // Po finale: powrót do hubu z odrestaurowanym obrazem (docs/02_ARCHITEKTURA.md sekcja 2).
  runner.on('case:finished', () => {
    panel.showHub(kejs, true);
    game.scene.getScene('RunnerScene').scene.start('HubStubScene', { restored: true });
  });

  watchResize(game);

  if (debug) {
    // Uchwyt diagnostyczny (tylko ?debug=1) — do inspekcji w konsoli i testach.
    (window as unknown as { __portfolioRunner: unknown }).__portfolioRunner = {
      game,
      runner,
      state,
    };
  }

  document.body.dataset.gameReady = 'true';
  document.body.dataset.caseId = kejs.id;
}

/** Phaser nie zawsze wykrywa zmianę rozmiaru kontenera (CLAUDE.md, „Pułapki”) — debounce. */
function watchResize(game: Phaser.Game): void {
  let resizeTimer: number | undefined;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      game.scale.refresh();
    }, TUNING.RESIZE_DEBOUNCE_MS);
  });
}

function renderFreeRunPanel(panel: HTMLElement, strings: UiStrings): void {
  clear(panel);
  const hints = el('ul', { className: 'panel-hints' });
  for (const hint of strings.freeRunHints) hints.append(el('li', { text: hint }));
  panel.append(
    el('header', {
      className: 'panel-header',
      children: [
        el('h1', {
          className: 'case-title',
          attrs: { id: 'panel-title' },
          text: strings.freeRunTitle,
        }),
        el('p', { className: 'hint', text: strings.freeRunLead }),
      ],
    }),
    el('div', { className: 'story', children: [hints] }),
  );
}

void start();
