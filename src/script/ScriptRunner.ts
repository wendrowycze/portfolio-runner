import { TUNING } from '../config/tuning';
import { Emitter } from '../events/Emitter';
import type { GameState } from '../state/GameState';
import { hasReward, type Beat, type Case } from './types';

/**
 * ScriptRunner — maszyna stanów beatów. Czysta logika: nie zna Phasera ani DOM.
 * Czas dostaje z zewnątrz przez tick(deltaMs) (scena woła co klatkę; testy — ręcznie).
 *
 * Narracja (decyzja Arka z 2026-09-09): kolejne beaty narracji tworzą jeden „odcinek drogi”.
 * Gracz trzyma D/→ i biegnie — tekst odsłania się proporcjonalnie do przebiegniętych px;
 * A/← cofa bieg i tekst. Scena woła moveBy(±px) co klatkę. Odcinek kończy się, gdy gracz
 * przebiegnie cały tekst ostatniej narracji (plus oddech) — wtedy startuje kolejny beat.
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

/** Stan odsłonięcia jednego beatu narracji w bieżącym odcinku. */
export interface NarrationProgress {
  beatId: string;
  /** Liczba odsłoniętych znaków. */
  revealed: number;
  /** Długość tekstu. */
  length: number;
}

export interface ScriptEvents extends Record<string, unknown[]> {
  'beat:start': [beat: Beat, ctx: BeatContext];
  /** Postęp odcinka narracji (po każdym moveBy, który coś zmienił). fraction = pozycja/długość. */
  'narration:progress': [progress: NarrationProgress[], fraction: number];
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
  pxPerChar?: number;
  beatGapPx?: number;
}

interface NarrationRun {
  /** Indeksy kolejnych beatów narracji w case.beats. */
  indices: number[];
  /** Pozycja startowa (px) każdego beatu w odcinku. */
  starts: number[];
  /** Długość tekstu każdego beatu (znaki). */
  lengths: number[];
  /** Długość całego odcinka (px). */
  total: number;
  /** Ile beatów odcinka już „rozpoczęto” (emitowano beat:start). */
  entered: number;
}

export class ScriptRunner extends Emitter<ScriptEvents> {
  private kejs: Case | undefined;
  private index = -1;
  private attempt = 1;
  private phaseValue: Phase = 'idle';
  private beatElapsedMs = 0;
  private holdElapsedMs = 0;
  private windowOpen = false;
  private totalElapsedMs = 0;
  private run: NarrationRun | undefined;
  private runPosition = 0;
  private readonly feedbackHoldMs: number;
  private readonly successHoldMs: number;
  private readonly actionZoneStartMs: number;
  private readonly pxPerChar: number;
  private readonly beatGapPx: number;

  constructor(
    private readonly state: GameState,
    options: ScriptRunnerOptions = {},
  ) {
    super();
    this.feedbackHoldMs = options.feedbackHoldMs ?? TUNING.FEEDBACK_HOLD_MS;
    this.successHoldMs = options.successHoldMs ?? 700;
    this.actionZoneStartMs = options.actionZoneStartMs ?? TUNING.ACTION_ZONE_START_MS;
    this.pxPerChar = options.pxPerChar ?? TUNING.NARRATION_PX_PER_CHAR;
    this.beatGapPx = options.beatGapPx ?? TUNING.NARRATION_BEAT_GAP_PX;
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

  /** Postęp bieżącego odcinka narracji 0..1 (0, gdy nie ma odcinka). */
  get narrationFraction(): number {
    if (this.run === undefined || this.run.total <= 0) return 0;
    return this.runPosition / this.run.total;
  }

  /** Ile px biegu zostało do końca odcinka narracji. */
  get narrationRemainingPx(): number {
    return this.run === undefined ? 0 : Math.max(0, this.run.total - this.runPosition);
  }

  load(kejs: Case): void {
    this.kejs = kejs;
    this.index = -1;
    this.attempt = 1;
    this.totalElapsedMs = 0;
    this.run = undefined;
    this.runPosition = 0;
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

  /**
   * Bieg w narracji: deltaPx > 0 = do przodu (odsłania tekst), < 0 = cofanie (chowa tekst).
   * Poza fazą narration — no-op. Po przebiegnięciu całego odcinka startuje kolejny beat.
   */
  moveBy(deltaPx: number): void {
    const run = this.run;
    if (this.phaseValue !== 'narration' || run === undefined) return;
    const next = Math.min(run.total, Math.max(0, this.runPosition + deltaPx));
    if (next === this.runPosition) return;
    this.runPosition = next;
    while (run.entered < run.indices.length && this.runPosition >= (run.starts[run.entered] ?? 0)) {
      const index = run.indices[run.entered];
      run.entered += 1;
      if (index !== undefined && index !== this.index) {
        this.index = index;
        this.attempt = 1;
        const beat = this.current;
        if (beat !== undefined) this.emit('beat:start', beat, this.context);
      }
    }
    this.emit('narration:progress', this.narrationProgress(), this.narrationFraction);
    if (this.runPosition >= run.total) {
      const after = (run.indices[run.indices.length - 1] ?? this.index) + 1;
      this.run = undefined;
      this.attempt = 1;
      this.startBeat(after);
    }
  }

  /** Stan odsłonięcia rozpoczętych beatów bieżącego odcinka. */
  narrationProgress(): NarrationProgress[] {
    const run = this.run;
    const kejs = this.kejs;
    if (run === undefined || kejs === undefined) return [];
    const result: NarrationProgress[] = [];
    for (let i = 0; i < run.entered; i += 1) {
      const index = run.indices[i];
      const beat = index === undefined ? undefined : kejs.beats[index];
      if (beat?.type !== 'narration') continue;
      const start = run.starts[i] ?? 0;
      const length = run.lengths[i] ?? 0;
      const revealed = Math.min(
        length,
        Math.max(0, Math.floor((this.runPosition - start) / this.pxPerChar)),
      );
      result.push({ beatId: beat.id, revealed, length });
    }
    return result;
  }

  /** „Zobacz obraz” w results, „Wróć” w finale. Narracja idzie biegiem (moveBy), nie kliknięciem. */
  advance(): void {
    switch (this.phaseValue) {
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
    this.windowOpen = false;
    this.run = undefined;
    this.runPosition = 0;
    if (beat.type === 'narration') this.run = this.buildRun(kejs, index);
    this.setPhase(beat.type);
    if (this.run !== undefined) this.run.entered = 1;
    this.emit('beat:start', beat, this.context);
    if (this.run !== undefined) this.emit('narration:progress', this.narrationProgress(), 0);
  }

  /** Odcinek drogi = ciąg kolejnych beatów narracji od `from`. */
  private buildRun(kejs: Case, from: number): NarrationRun {
    const indices: number[] = [];
    const starts: number[] = [];
    const lengths: number[] = [];
    let total = 0;
    for (let i = from; i < kejs.beats.length; i += 1) {
      const beat = kejs.beats[i];
      if (beat?.type !== 'narration') break;
      indices.push(i);
      starts.push(total);
      lengths.push(beat.text.length);
      total += beat.text.length * this.pxPerChar + this.beatGapPx;
    }
    return { indices, starts, lengths, total, entered: 0 };
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
