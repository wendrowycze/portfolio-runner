import type { UiStrings } from '../../content/uiStrings';
import type { InteractionBeat } from '../../script/types';
import { el } from '../dom';

export interface WidgetContext {
  reducedMotion: boolean;
  /** Widget zakończony — ScriptRunner.completeInteraction(). */
  onComplete: () => void;
  /** Widget zmienił wysokość — panel przewija do końca. */
  onLayout: () => void;
}

export interface Widget {
  destroy(): void;
}

/**
 * Fabryka widgetów interakcji. Etap 2: szkielet — każdy widget pokazuje tekst i przycisk „Dalej”.
 * Pełne widgety button/puzzle/reveal wchodzą w Etapie 3 (src/ui/widgets/*Widget.ts).
 */
export function createWidget(
  beat: InteractionBeat,
  mount: HTMLElement,
  actions: HTMLElement,
  strings: UiStrings,
  context: WidgetContext,
): Widget {
  const button = el('button', {
    className: 'button button-primary',
    text: beat.label ?? strings.widgetContinue,
    attrs: { type: 'button', 'data-testid': 'widget-continue' },
  });
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    button.disabled = true;
    context.onComplete();
  });
  actions.append(button);
  mount.append(el('p', { className: 'hint', text: `[${beat.widget}]` }));
  context.onLayout();
  return {
    destroy: () => {
      button.remove();
    },
  };
}
