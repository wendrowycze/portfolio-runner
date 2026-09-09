import { assetUrl } from '../../assets/manifest';
import type { UiStrings } from '../../content/uiStrings';
import type { InteractionBeat, Painting } from '../../script/types';
import { el } from '../dom';
import type { Widget, WidgetContext } from './createWidget';

/**
 * Układanka: siatka cols×rows kafli obrazu case'a. Klik w kafel #1, potem #2 = zamiana miejsc.
 * Kafel na dobrym miejscu dostaje złotą obwódkę; komplet → błysk i automatyczne „dalej” po 800 ms.
 * Brak limitu czasu (nie da się przegrać). Tasowanie deterministyczne (ten sam układ przy każdym
 * uruchomieniu — łatwiej opisać Arkowi i testować), bez kafla na właściwym miejscu na starcie.
 */
export function createPuzzleWidget(
  _beat: InteractionBeat,
  painting: Painting,
  mount: HTMLElement,
  strings: UiStrings,
  context: WidgetContext,
): Widget {
  const { cols, rows } = painting;
  const total = cols * rows;
  const image = `url("${assetUrl(painting.src)}")`;

  const grid = el('div', {
    className: 'puzzle',
    attrs: { role: 'group', 'aria-label': strings.puzzleHint, 'data-testid': 'puzzle' },
  });
  grid.style.setProperty('--cols', String(cols));
  grid.style.setProperty('--rows', String(rows));
  const hint = el('p', { className: 'hint puzzle-hint', text: strings.puzzleHint });

  const order = derangement(total);
  const tiles: HTMLButtonElement[] = [];
  for (let target = 0; target < total; target += 1) {
    const c = target % cols;
    const r = Math.floor(target / cols);
    const tile = el('button', {
      className: 'puzzle-tile',
      attrs: {
        type: 'button',
        'data-target': String(target),
        'data-pos': String(order[target] ?? target),
        'aria-label': String(target + 1),
      },
    });
    tile.style.backgroundImage = image;
    tile.style.backgroundSize = `${String(cols * 100)}% ${String(rows * 100)}%`;
    tile.style.backgroundPosition = `${String(cols > 1 ? (c / (cols - 1)) * 100 : 0)}% ${String(
      rows > 1 ? (r / (rows - 1)) * 100 : 0,
    )}%`;
    tile.style.order = tile.dataset.pos ?? '0';
    tiles.push(tile);
    grid.append(tile);
  }
  mount.append(grid, hint);

  let selected: HTMLButtonElement | undefined;
  let done = false;
  let timer = 0;

  const refresh = (): void => {
    let correct = 0;
    for (const tile of tiles) {
      const ok = tile.dataset.pos === tile.dataset.target;
      tile.classList.toggle('is-correct', ok);
      if (ok) correct += 1;
    }
    if (correct === total && !done) {
      done = true;
      grid.classList.add('is-complete');
      grid.dataset.complete = 'true';
      hint.textContent = strings.puzzleDone;
      for (const tile of tiles) tile.disabled = true;
      timer = window.setTimeout(() => {
        context.onComplete();
      }, 800);
    }
  };

  const swap = (a: HTMLButtonElement, b: HTMLButtonElement): void => {
    const posA = a.dataset.pos ?? '0';
    a.dataset.pos = b.dataset.pos ?? '0';
    b.dataset.pos = posA;
    a.style.order = a.dataset.pos;
    b.style.order = b.dataset.pos;
    if (!context.reducedMotion) {
      for (const tile of [a, b]) {
        tile.classList.remove('is-swapped');
        tile.getBoundingClientRect(); // wymusza reflow — restart animacji
        tile.classList.add('is-swapped');
      }
    }
  };

  for (const tile of tiles) {
    tile.addEventListener('click', (event) => {
      event.stopPropagation();
      if (done) return;
      if (selected === undefined) {
        selected = tile;
        tile.classList.add('is-selected');
        return;
      }
      if (selected === tile) {
        tile.classList.remove('is-selected');
        selected = undefined;
        return;
      }
      selected.classList.remove('is-selected');
      swap(selected, tile);
      selected = undefined;
      refresh();
    });
  }

  refresh();
  context.onLayout();
  return {
    destroy: () => {
      window.clearTimeout(timer);
    },
  };
}

/** Deterministyczna permutacja bez punktów stałych (żaden kafel nie zaczyna na swoim miejscu). */
export function derangement(n: number): number[] {
  if (n < 2) return Array.from({ length: n }, (_, i) => i);
  // Przesunięcie cykliczne o 1 z dodatkową zamianą, żeby układ nie wyglądał jak „przesunięty o jeden”.
  const order = Array.from({ length: n }, (_, i) => (i + 1) % n);
  if (n >= 4) {
    const a = order[0] ?? 0;
    order[0] = order[2] ?? 0;
    order[2] = a;
  }
  for (let i = 0; i < n; i += 1) {
    if (order[i] === i) return Array.from({ length: n }, (_, k) => (k + 1) % n);
  }
  return order;
}
