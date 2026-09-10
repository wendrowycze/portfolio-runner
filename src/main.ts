import Phaser from 'phaser';
import { createGameConfig } from './config/gameConfig';
import { resolveLayout, urlFlag } from './config/layout';
import { TUNING } from './config/tuning';
import { fetchCase, fetchGalleryCases, isKnownCase } from './content/cases';
import { loadUiStrings, type UiStrings } from './content/uiStrings';
import type { RunnerSceneData } from './scenes/RunnerScene';
import { ScriptRunner } from './script/ScriptRunner';
import type { Case } from './script/types';
import { createGameState, resetGameState } from './state/GameState';
import { createProgress } from './state/progress';
import { createVisitor } from './state/Visitor';
import { AudioDirector } from './audio/AudioDirector';
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

  // Treść: wszystkie historie galerii (zod przy ładowaniu); ?case= startuje wybraną od razu.
  const gallery = await fetchGalleryCases();
  const requestedCase = new URLSearchParams(search).get('case');
  const startCase =
    requestedCase !== null && isKnownCase(requestedCase)
      ? (gallery.find((c) => c.id === requestedCase) ?? (await fetchCase(requestedCase)))
      : undefined;

  const progress = createProgress();
  const visitor = createVisitor();
  const state = createGameState(TUNING.BASE_SPEED);
  const runner = new ScriptRunner(state);
  const panel = new DialoguePanel(panelContainer, runner, state, strings, {
    overlayParent: gameRoot,
    returnLabel: strings.finaleReturn,
  });
  const muted = urlFlag(search, 'mute');
  const audio = new AudioDirector(runner, { muted });
  if (muted) panel.setMuted(true);
  // ?guest=1 pomija ekran startowy (także testy e2e); ?case=… pomija i start, i hotel.
  const guest = urlFlag(search, 'guest');
  if (guest) visitor.guest = true;
  const runnerData: RunnerSceneData = {
    debug,
    startInRunner: startCase !== undefined,
    skipStart: guest,
  };
  let currentFloor = 0;

  /** Przygotowuje silnik i panel na wybraną historię (świeży stan, przeładowany skrypt). */
  const prepare = (kejs: Case): void => {
    resetGameState(state, kejs.runner.baseSpeed);
    runner.load(kejs);
    panel.mount(kejs);
    runnerData.script = { runner, kejs, state };
    document.title = `${kejs.title} — Portfolio Runner`;
    document.body.dataset.caseId = kejs.id;
    document.body.dataset.painting = progress.completed.has(kejs.id) ? 'restored' : 'damaged';
  };

  bus.on('hub:selected', (caseId) => {
    const kejs = gallery.find((c) => c.id === caseId) ?? runnerData.script?.kejs;
    if (kejs !== undefined) prepare(kejs);
  });

  if (startCase !== undefined) prepare(startCase);
  else if (guest) panel.showHotel(gallery, progress.completed, visitor, currentFloor);
  else panel.showStart(visitor);

  // Ekran startowy → hotel: panel przełącza się na widok hotelu, gdy brama się otwiera.
  bus.on('start:enter', () => {
    window.setTimeout(() => {
      panel.showHotel(gallery, progress.completed, visitor, currentFloor);
    }, 1200);
  });
  bus.on('hotel:floor', (floor, world) => {
    currentFloor = floor;
    panel.setHotelFloor(floor);
    document.body.dataset.world = world;
  });
  bus.on('runner:ready', () => {
    const world = runnerData.script?.kejs.world;
    audio.ambient(world ?? 'kultura');
  });
  bus.on('start:progress', () => {
    audio.ambient('start');
  });

  // Czekamy na fonty, żeby tekst w canvasie nie renderował się fontem zastępczym.
  await document.fonts.ready;

  const game = new Phaser.Game(createGameConfig(runnerContainer));
  game.registry.set('runnerData', runnerData);
  game.registry.set('uiStrings', strings);
  game.registry.set('cases', gallery);
  game.registry.set('progress', progress);

  // Po finale: obraz odrestaurowany, powrót do galerii (docs/02_ARCHITEKTURA.md sekcja 2).
  runner.on('case:finished', () => {
    const finished = runnerData.script?.kejs.id;
    if (finished !== undefined) progress.completed.add(finished);
    document.body.dataset.painting = 'restored';
    document.title = 'Portfolio Runner';
    panel.showHotel(gallery, progress.completed, visitor, currentFloor);
    game.scene.getScene('RunnerScene').scene.start('HotelScene', { justFinished: finished });
  });

  watchResize(game);

  if (debug) {
    // Uchwyt diagnostyczny (tylko ?debug=1) — do inspekcji w konsoli i testach.
    (window as unknown as { __portfolioRunner: unknown }).__portfolioRunner = {
      game,
      runner,
      state,
      progress,
      visitor,
    };
  }

  document.body.dataset.gameReady = 'true';
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
