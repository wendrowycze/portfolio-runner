import { TUNING } from '../../config/tuning';
import type { UiStrings } from '../../content/uiStrings';
import type { InteractionBeat } from '../../script/types';
import { el } from '../dom';
import type { Widget, WidgetContext } from './createWidget';

/**
 * Widget „reveal” („zamknij oczy”): pełnoekranowy fade-to-black nad całą grą, tekst na czarnym,
 * pauza, fade-from-black. Tap w trakcie ciemności skraca pauzę (nie sam fade). Sukces zawsze.
 */
export function createRevealWidget(
  beat: InteractionBeat,
  overlayParent: HTMLElement,
  strings: UiStrings,
  context: WidgetContext,
): Widget {
  const fade = context.reducedMotion ? 150 : TUNING.REVEAL_FADE_MS;
  const hold = context.reducedMotion ? 300 : TUNING.REVEAL_HOLD_MS;
  const overlay = el('div', {
    className: 'reveal',
    attrs: { role: 'dialog', 'aria-live': 'polite', 'data-testid': 'reveal' },
    children: [
      el('p', { className: 'reveal-text', text: beat.text ?? '' }),
      el('p', { className: 'hint reveal-hint', text: strings.revealTap }),
    ],
  });
  overlay.style.transitionDuration = `${String(fade)}ms`;
  overlayParent.append(overlay);

  const timers: number[] = [];
  let finished = false;
  const later = (ms: number, fn: () => void): void => {
    timers.push(window.setTimeout(fn, ms));
  };

  const fadeOut = (): void => {
    if (finished) return;
    finished = true;
    overlay.classList.remove('is-dark');
    later(fade, () => {
      overlay.remove();
      context.onComplete();
    });
  };

  overlay.addEventListener('click', () => {
    if (overlay.classList.contains('is-dark')) fadeOut();
  });

  requestAnimationFrame(() => {
    overlay.classList.add('is-dark');
    later(fade + hold + 1200, fadeOut);
  });

  return {
    destroy: () => {
      for (const timer of timers) window.clearTimeout(timer);
      overlay.remove();
    },
  };
}
