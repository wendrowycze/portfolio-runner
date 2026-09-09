import { TUNING } from '../config/tuning';
import { Emitter } from '../events/Emitter';
import type { GameState } from '../state/GameState';
import { hasReward, type Beat, type Case } from './types';

/**
 * ScriptRunner — maszyna stanów beatów. Czysta logika: nie zna Phasera ani DOM.
 * Czas dostaje z zewnątrz przez tick(deltaMs) (scena woła co klatkę; testy — ręcznie).
 *
 * Zasada „nie da się przegrać” + decyzja Arka z 2026-09-09 („zła decyzja zatrzymuje bieg”):
 * nietrafiony choice/action = potknięcie + feedback + POWRÓT do tego samego beatu,
 * aż do trafnej reakcji. Dzięki temu finał zawsze ma komplet fragmentów.
 */
export type Phase =
  | 'idle'
  | 'narration'
  | 'choice'
  | 'action'
  | 'interaction'
  | 'feedback'
  | 'success'
  | 'results'
  | 'finale'
  | 'finished';

export type FailReason = 'wrong' | 'timeout' | 'early' | 'late';

export interface BeatContext {
  index: number;
  total: number;
  /** Numer podejścia do beatu (1 = pierwsze). */
  attempt: number;
}

export interface BeatOutcome {
  correct: boolean;
  reason?: FailReason | undefined;
  optionIndex?: number | undefined;
  /** Feedback z treści (opcja nietrafna) — dla powodów generycznych UI bierze tekst z ui.json. */
  feedback?: string | undefined;
  fragment?: number | undefined;
  skill?: string | undefined;
}

export interface ScriptEvents extends Record<string, unknown[]> {
  'beat:start': [beat: Beat, ctx: BeatContext];
  'beat:resolved': [beat: Beat, outcome: BeatOutcome];
  'beat:retry': [beat: Beat, ctx: BeatContext];
  'fragment:collected': [fragment: number, total: number];
  'skill:gained': [skill: string, value: number];
  /** Postęp zegara beatu choice/action: 0 = start, 1 = przeszkoda przy postaci. */
  'timer:progress': [fraction: number, remainingMs: number];
  'action:window': [open: boolean];
  phase: [phase: Phase];
  'case:finished': [];
}

export interface ScriptRunnerOptions {
  feedbackHoldMs?: number;
  successHoldMs?: number;
  actionZoneStartMs?: number;
}

export class ScriptRunner extends Emitter<ScriptEvents> {
  private kejs: Case | undefined;
  private index = -1;
  private attempt = 1;
  private phaseValue: Phase = 'idle';
  private beatElapsedMs = 0;
  private holdElapsedMs = 0;
  private autoElapsedMs: number | undefined;
  private windowOpen = false;
  private totalElapsedMs = 0;
  private readonly feedbackHoldMs: number;
  private readonly successHoldMs: number;
  private readonly actionZoneStartMs: number;

  constructor(
    private readonly state: GameState,
    options: ScriptRunnerOptions = {},
  ) {
    super();
    this.feedbackHoldMs = options.feedbackHoldMs ?? TUNING.FEEDBACK_HOLD_MS;
    this.successHoldMs = options.successHoldMs ?? 700;
    this.actionZoneStartMs = options.actionZoneStartMs ?? TUNING.ACTION_ZONE_START_MS;
  }

  get phase(): Phase {
    return this.phaseValue;
  }

  get current(): Beat | undefined {
    return this.kejs?.beats[this.index];
  }

  get currentCase(): Case | undefined {
    return this.kejs;
  }

  get context(): BeatContext {
    return { index: this.index, total: this.kejs?.beats.length ?? 0, attempt: this.attempt };
  }

  /** Czas rzeczywisty od startu do wejścia w results (stoper GDD sekcja g). */
  get elapsedMs(): number {
    return this.totalElapsedMs;
  }

  get isActionWindowOpen(): boolean {
    return this.windowOpen;
  }

  load(kejs: Case): void {
    this.kejs = kejs;
    this.index = -1;
    this.attempt = 1;
    this.totalElapsedMs = 0;
    this.setPhase('idle');
  }

  start(): void {
    if (this.kejs === undefined) throw new Error('ScriptRunner.start() przed load()');
    this.totalElapsedMs = 0;
    this.index = -1;
    this.next();
  }

  /** Zegar. deltaMs = czas rzeczywisty (time dilation nie zmienia limitów czasu z JSON). */
  tick(deltaMs: number): void {
    const beat = this.current;
    if (beat === undefined) return;
    if (
      this.phaseValue !== 'results' &&
      this.phaseValue !== 'finale' &&
      this.phaseValue !== 'finished'
    ) {
      this.totalElapsedMs += deltaMs;
    }
    switch (this.phaseValue) {
      case 'narration': {
        if (
          beat.type === 'narration' &&
          beat.advance === 'auto' &&
          this.autoElapsedMs !== undefined
        ) {
          this.autoElapsedMs += deltaMs;
          if (this.autoElapsedMs >= (beat.durationMs ?? 0)) this.next();
        }
        break;
      }
      case 'choice': {
        if (beat.type !== 'choice') break;
        this.beatElapsedMs += deltaMs;
        const fraction = Math.min(1, this.beatElapsedMs / beat.timerMs);
        this.emit('timer:progress', fraction, Math.max(0, beat.timerMs - this.beatElapsedMs));
        if (this.beatElapsedMs >= beat.timerMs) this.fail('timeout');
        break;
      }
      case 'action': {
        if (beat.type !== 'action') break;
        this.beatElapsedMs += deltaMs;
        const total = this.actionZoneStartMs + beat.windowMs;
        const fraction = Math.min(1, this.beatElapsedMs / total);
        this.emit('timer:progress', fraction, Math.max(0, total - this.beatElapsedMs));
        if (!this.windowOpen && this.beatElapsedMs >= this.actionZoneStartMs) {
          this.windowOpen = true;
          this.emit('action:window', true);
        }
        if (this.beatElapsedMs >= total) {
          this.closeWindow();
          this.fail('late');
        }
        break;
      }
      case 'feedback': {
        this.holdElapsedMs += deltaMs;
        if (this.holdElapsedMs >= this.feedbackHoldMs) this.retry();
        break;
      }
      case 'success': {
        this.holdElapsedMs += deltaMs;
        if (this.holdElapsedMs >= this.successHoldMs) this.next();
        break;
      }
      default:
        break;
    }
  }

  /** Wybór opcji (klik/tap/klawisz 1-3). Poza fazą choice — no-op. */
  resolveChoice(optionIndex: number): void {
    const beat = this.current;
    if (this.phaseValue !== 'choice' || beat?.type !== 'choice') return;
    const option = beat.options[optionIndex];
    if (option === undefined) return;
    if (option.correct) {
      this.succeed({ optionIndex, skill: option.skill });
    } else {
      this.fail('wrong', option.feedback, optionIndex);
    }
  }

  /** Skok gracza w beacie action. Poza oknem = nietrafienie (GDD sekcja d). */
  triggerAction(): void {
    const beat = this.current;
    if (this.phaseValue !== 'action' || beat?.type !== 'action') return;
    if (this.windowOpen) {
      this.closeWindow();
      this.succeed({});
    } else if (this.beatElapsedMs < this.actionZoneStartMs) {
      this.fail('early');
    }
  }

  /** Panel zgłasza, że tekst narracji został w całości pokazany (start zegara auto). */
  textRevealed(): void {
    const beat = this.current;
    if (this.phaseValue === 'narration' && beat?.type === 'narration' && beat.advance === 'auto') {
      this.autoElapsedMs ??= 0;
    }
  }

  /** „Dalej” w narracji (tap), „Zobacz obraz” w results, „Wróć” w finale. */
  advance(): void {
    switch (this.phaseValue) {
      case 'narration':
      case 'results':
        this.next();
        break;
      case 'finale':
        this.finish();
        break;
      default:
        break;
    }
  }

  /** Widget interakcji zakończony (kliknięty przycisk, ułożone puzzle, koniec reveal). */
  completeInteraction(): void {
    if (this.phaseValue !== 'interaction') return;
    this.succeed({});
  }

  private succeed(extra: { optionIndex?: number | undefined; skill?: string | undefined }): void {
    const beat = this.current;
    if (beat === undefined || this.kejs === undefined) return;
    this.setPhase('success');
    this.holdElapsedMs = 0;
    const outcome: BeatOutcome = {
      correct: true,
      optionIndex: extra.optionIndex,
      skill: extra.skill,
    };
    if (hasReward(beat) && !this.state.fragments.includes(beat.reward.fragment)) {
      this.state.fragments.push(beat.reward.fragment);
      outcome.fragment = beat.reward.fragment;
    }
    if (extra.skill !== undefined) {
      const value = (this.state.skills[extra.skill] ?? 0) + 1;
      this.state.skills[extra.skill] = value;
      this.emit('skill:gained', extra.skill, value);
    }
    this.emit('beat:resolved', beat, outcome);
    if (outcome.fragment !== undefined) {
      this.emit(
        'fragment:collected',
        outcome.fragment,
        this.kejs.painting.cols * this.kejs.painting.rows,
      );
    }
  }

  private fail(reason: FailReason, feedback?: string, optionIndex?: number): void {
    const beat = this.current;
    if (beat === undefined) return;
    this.state.stumbles += 1;
    this.setPhase('feedback');
    this.holdElapsedMs = 0;
    this.emit('beat:resolved', beat, { correct: false, reason, feedback, optionIndex });
  }

  private retry(): void {
    const beat = this.current;
    if (beat === undefined) return;
    this.attempt += 1;
    this.emit('beat:retry', beat, this.context);
    this.startBeat(this.index);
  }

  private next(): void {
    this.attempt = 1;
    this.startBeat(this.index + 1);
  }

  private startBeat(index: number): void {
    const kejs = this.kejs;
    if (kejs === undefined) return;
    const beat = kejs.beats[index];
    if (beat === undefined) {
      this.finish();
      return;
    }
    this.index = index;
    this.beatElapsedMs = 0;
    this.holdElapsedMs = 0;
    this.autoElapsedMs = undefined;
    this.windowOpen = false;
    this.setPhase(beat.type);
    this.emit('beat:start', beat, this.context);
  }

  private closeWindow(): void {
    if (!this.windowOpen) return;
    this.windowOpen = false;
    this.emit('action:window', false);
  }

  private finish(): void {
    if (this.phaseValue === 'finished') return;
    this.setPhase('finished');
    this.emit('case:finished');
  }

  private setPhase(phase: Phase): void {
    this.phaseValue = phase;
    this.emit('phase', phase);
  }
}
