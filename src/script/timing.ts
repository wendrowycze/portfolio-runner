import { TUNING } from '../config/tuning';
import type { ChoiceBeat } from './types';

/**
 * Limit czasu beatu wyboru: JSON podaje minimum (`timerMs`), a faktyczny czas rośnie z ilością
 * tekstu do przeczytania (prompt + wszystkie opcje). Jedno źródło prawdy dla ScriptRunnera
 * (zegar), sceny biegu (kiedy przeszkoda dobiega do postaci) i panelu (opis paska).
 */
export function choiceTimerMs(beat: Pick<ChoiceBeat, 'prompt' | 'options' | 'timerMs'>): number {
  const characters =
    beat.prompt.length + beat.options.reduce((sum, option) => sum + option.text.length, 0);
  const reading = (characters / TUNING.CHOICE_READ_CPS) * 1000 + TUNING.CHOICE_READ_BUFFER_MS;
  return Math.max(beat.timerMs, Math.round(reading));
}
