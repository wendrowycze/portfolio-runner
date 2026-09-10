import type { UiStrings } from '../../content/uiStrings';
import type { InteractionBeat, Painting } from '../../script/types';
import { createButtonWidget } from './ButtonWidget';
import { createPuzzleWidget } from './PuzzleWidget';
import { createRevealWidget } from './RevealWidget';

export interface WidgetContext {
  reducedMotion: boolean;
  /** Obraz case'a (dla puzzle). */
  painting: Painting;
  /** Rodzic pełnoekranowych nakładek (reveal). */
  overlayParent: HTMLElement;
  /** Widget zakończony — ScriptRunner.completeInteraction(). */
  onComplete: () => void;
  /** Widget zmienił wysokość — panel przewija do końca. */
  onLayout: () => void;
}

export interface Widget {
  destroy(): void;
}

/**
 * Fabryka widgetów interakcji (docs/01_GDD_RUNNER_POC.md sekcja d, „interaction”).
 * Nowy rodzaj widgetu = schema JSON + script/types.ts + ten plik (CLAUDE.md, „trzy miejsca”).
 */
export function createWidget(
  beat: InteractionBeat,
  mount: HTMLElement,
  actions: HTMLElement,
  strings: UiStrings,
  context: WidgetContext,
): Widget {
  switch (beat.widget) {
    case 'button':
      return createButtonWidget(beat, mount, actions, strings, context);
    case 'puzzle':
      return createPuzzleWidget(beat, context.painting, mount, strings, context);
    case 'reveal':
      return createRevealWidget(beat, context.overlayParent, strings, context);
  }
}
