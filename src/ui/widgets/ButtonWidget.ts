import { TUNING } from '../../config/tuning';
import type { UiStrings } from '../../content/uiStrings';
import type { InteractionBeat } from '../../script/types';
import { el, formatNumber } from '../dom';
import type { Widget, WidgetContext } from './createWidget';

/**
 * Widget „zrzutka”: przycisk stylizowany na crowdfunding; klik uruchamia licznik
 * counter.from → counter.to (Cubic.easeOut, BUTTON_COUNTER_MS), pasek i konfetti.
 * „Dalej” aktywuje się dopiero po zakończeniu animacji (GDD sekcja d).
 */
export function createButtonWidget(
  beat: InteractionBeat,
  mount: HTMLElement,
  actions: HTMLElement,
  strings: UiStrings,
  context: WidgetContext,
): Widget {
  const counter = beat.counter ?? { from: 0, to: 0 };
  const suffix = counter.suffix ?? '';
  const value = el('span', { className: 'zrzutka-value', text: formatNumber(counter.from) });
  const fill = el('span', { className: 'zrzutka-fill' });
  const card = el('div', {
    className: `zrzutka zrzutka-${beat.style ?? 'default'}`,
    attrs: { 'data-testid': 'zrzutka' },
    children: [
      el('div', {
        className: 'zrzutka-amount',
        children: [value, el('span', { className: 'zrzutka-suffix', text: suffix })],
      }),
      el('div', { className: 'zrzutka-bar', children: [fill] }),
      el('p', { className: 'zrzutka-meta', text: strings.buttonDonors }),
    ],
  });
  mount.append(card);

  const button = el('button', {
    className: 'button button-primary zrzutka-button',
    text: beat.label ?? strings.widgetContinue,
    attrs: { type: 'button', 'data-testid': 'widget-button' },
  });
  const next = el('button', {
    className: 'button button-continue',
    text: strings.widgetContinue,
    attrs: { type: 'button', 'data-testid': 'widget-continue' },
  });
  next.disabled = true;
  next.hidden = true;
  actions.append(button, next);
  button.focus({ preventScroll: true });

  let frame = 0;
  const confetti: HTMLElement[] = [];

  const burst = (): void => {
    if (context.reducedMotion) return;
    for (let i = 0; i < 26; i += 1) {
      const piece = el('span', { className: 'confetti', attrs: { 'aria-hidden': 'true' } });
      piece.style.setProperty('--x', `${String(Math.random() * 100)}%`);
      piece.style.setProperty('--d', `${String(600 + Math.random() * 900)}ms`);
      piece.style.setProperty('--r', `${String(Math.random() * 720 - 360)}deg`);
      piece.style.setProperty('--delay', `${String(Math.random() * 300)}ms`);
      piece.classList.add(i % 3 === 0 ? 'is-gold' : i % 3 === 1 ? 'is-light' : 'is-warn');
      card.append(piece);
      confetti.push(piece);
    }
  };

  const finish = (): void => {
    value.textContent = formatNumber(counter.to);
    fill.style.width = '100%';
    card.classList.add('is-done');
    next.hidden = false;
    next.disabled = false;
    next.focus({ preventScroll: true });
    context.onLayout();
  };

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    button.disabled = true;
    button.textContent = strings.buttonThanks;
    button.classList.add('is-pressed');
    burst();
    if (context.reducedMotion) {
      finish();
      return;
    }
    const start = performance.now();
    const step = (now: number): void => {
      const t = Math.min(1, (now - start) / TUNING.BUTTON_COUNTER_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      value.textContent = formatNumber(counter.from + (counter.to - counter.from) * eased);
      fill.style.width = `${String(eased * 100)}%`;
      if (t < 1) frame = requestAnimationFrame(step);
      else finish();
    };
    frame = requestAnimationFrame(step);
  });

  next.addEventListener('click', (event) => {
    event.stopPropagation();
    next.disabled = true;
    context.onComplete();
  });

  context.onLayout();
  return {
    destroy: () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      for (const piece of confetti) piece.remove();
      button.remove();
      next.remove();
    },
  };
}
