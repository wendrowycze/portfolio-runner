import { assetUrl } from '../assets/manifest';
import { TUNING } from '../config/tuning';
import type { UiStrings } from '../content/uiStrings';
import type { Case, Cta } from '../script/types';
import { totalFragments } from '../script/types';
import type { GameState } from '../state/GameState';
import { clear, el, prefersReducedMotion } from './dom';
import { typewrite } from './typewriter';

/**
 * Finał (docs/01_GDD_RUNNER_POC.md sekcja h): pełnoekranowa nakładka DOM. Kafle wlatują
 * w kolejności zebrania na swoje miejsca geometryczne, złoty rozbłysk, podpis, tekst, CTA.
 */
export interface FinaleOptions {
  returnLabel: string;
  onReturn: () => void;
}

export class FinaleOverlay {
  private readonly root: HTMLElement;
  private readonly reducedMotion = prefersReducedMotion();
  private timers: number[] = [];

  constructor(
    parent: HTMLElement,
    private readonly strings: UiStrings,
  ) {
    this.root = el('div', {
      className: 'finale',
      attrs: { id: 'finale', role: 'dialog', 'aria-modal': 'true', 'data-testid': 'finale' },
    });
    this.root.hidden = true;
    parent.append(this.root);
  }

  get element(): HTMLElement {
    return this.root;
  }

  show(kejs: Case, state: GameState, text: string, cta: Cta, options: FinaleOptions): void {
    this.reset();
    const { cols, rows } = kejs.painting;
    const total = totalFragments(kejs);
    const image = `url("${assetUrl(kejs.painting.src)}")`;

    const grid = el('div', { className: 'finale-grid', attrs: { 'data-testid': 'finale-grid' } });
    grid.style.setProperty('--cols', String(cols));
    grid.style.setProperty('--rows', String(rows));
    const tiles = new Map<number, HTMLElement>();
    for (let fragment = 1; fragment <= total; fragment += 1) {
      const c = (fragment - 1) % cols;
      const r = Math.floor((fragment - 1) / cols);
      const tile = el('div', {
        className: 'finale-tile',
        attrs: { 'data-fragment': String(fragment), 'data-landed': 'false' },
      });
      tile.style.backgroundImage = image;
      tile.style.backgroundSize = `${String(cols * 100)}% ${String(rows * 100)}%`;
      tile.style.backgroundPosition = `${String(cols > 1 ? (c / (cols - 1)) * 100 : 0)}% ${String(
        rows > 1 ? (r / (rows - 1)) * 100 : 0,
      )}%`;
      tile.classList.add(fragment % 2 === 0 ? 'from-right' : 'from-left');
      grid.append(tile);
      tiles.set(fragment, tile);
    }
    const flash = el('div', { className: 'finale-flash', attrs: { 'aria-hidden': 'true' } });
    const frame = el('div', { className: 'finale-frame', children: [grid, flash] });
    const caption = el('p', { className: 'finale-caption', text: kejs.painting.caption });
    const textNode = el('p', { className: 'finale-text' });
    const link = el('a', {
      className: 'button button-primary',
      text: cta.label,
      attrs: {
        href: cta.url,
        target: '_blank',
        rel: 'noopener noreferrer',
        'data-testid': 'finale-cta',
      },
    });
    const back = el('button', {
      className: 'button',
      text: options.returnLabel,
      attrs: { type: 'button', 'data-testid': 'finale-return' },
    });
    back.addEventListener('click', () => {
      options.onReturn();
    });
    const ctaRow = el('div', { className: 'finale-cta', children: [link, back] });
    const badge = el('p', { className: 'finale-badge', text: this.strings.finaleRestored });
    const stage = el('div', {
      className: 'finale-stage',
      children: [badge, frame, caption, textNode, ctaRow],
    });
    this.root.append(stage);
    this.root.hidden = false;
    requestAnimationFrame(() => {
      this.root.classList.add('is-visible');
    });

    // Kolejność wlatywania = kolejność zebrania; brakujące (teoretycznie) dolatują na końcu.
    const order = [...state.fragments];
    for (let fragment = 1; fragment <= total; fragment += 1) {
      if (!order.includes(fragment)) order.push(fragment);
    }
    const stagger = this.reducedMotion
      ? 60
      : TUNING.FINALE_TILE_STAGGER_MS + TUNING.FINALE_TILE_FLY_MS * 0.5;
    order.forEach((fragment, i) => {
      this.later(500 + i * stagger, () => {
        const tile = tiles.get(fragment);
        if (tile === undefined) return;
        tile.classList.add('is-landed');
        tile.dataset.landed = 'true';
      });
    });
    const landedAt = 500 + (order.length - 1) * stagger + TUNING.FINALE_TILE_FLY_MS;
    this.later(landedAt + 300, () => {
      frame.classList.add('is-complete');
      flash.classList.add('is-on');
      badge.classList.add('is-visible');
    });
    this.later(landedAt + 300 + TUNING.FINALE_FLASH_MS, () => {
      caption.classList.add('is-visible');
    });
    this.later(landedAt + 300 + TUNING.FINALE_FLASH_MS + 400, () => {
      void typewrite(textNode, text, {
        cps: TUNING.TYPEWRITER_CPS,
        instant: this.reducedMotion,
      }).done.then(() => {
        ctaRow.classList.add('is-visible');
        back.focus({ preventScroll: true });
      });
    });
  }

  hide(): void {
    this.root.classList.remove('is-visible');
    this.root.hidden = true;
    this.reset();
  }

  private later(delayMs: number, fn: () => void): void {
    this.timers.push(window.setTimeout(fn, delayMs));
  }

  private reset(): void {
    for (const timer of this.timers) window.clearTimeout(timer);
    this.timers = [];
    clear(this.root);
  }
}
