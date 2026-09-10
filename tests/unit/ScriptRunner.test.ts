import { describe, expect, it } from 'vitest';
import demo from '../../content/cases/_demo.json';
import { TUNING } from '../../src/config/tuning';
import { loadCase } from '../../src/content/loader';
import { choiceTimerMs } from '../../src/script/timing';
import { ScriptRunner, type Phase } from '../../src/script/ScriptRunner';
import type { Beat, Case } from '../../src/script/types';
import { createGameState } from '../../src/state/GameState';

/** Symuluje upływ czasu w krokach po 50 ms (jak klatki gry). */
function elapse(runner: ScriptRunner, ms: number): void {
  let left = ms;
  while (left > 0) {
    const step = Math.min(50, left);
    runner.tick(step);
    left -= step;
  }
}

function setup(kejs: Case = loadCase(demo)) {
  const state = createGameState(kejs.runner.baseSpeed);
  const runner = new ScriptRunner(state, { feedbackHoldMs: 500, successHoldMs: 200 });
  const log: string[] = [];
  const phases: Phase[] = [];
  runner.on('beat:start', (beat, ctx) => log.push(`start:${beat.id}#${String(ctx.attempt)}`));
  runner.on('beat:resolved', (beat, outcome) =>
    log.push(
      `${outcome.correct ? 'ok' : 'fail'}:${beat.id}${outcome.reason ? `:${outcome.reason}` : ''}`,
    ),
  );
  runner.on('fragment:collected', (n) => log.push(`fragment:${String(n)}`));
  runner.on('case:finished', () => log.push('finished'));
  runner.on('phase', (phase) => phases.push(phase));
  runner.load(kejs);
  return { runner, state, log, phases, kejs };
}

function correctIndex(beat: Beat): number {
  if (beat.type !== 'choice') throw new Error('nie choice');
  return beat.options.findIndex((o) => o.correct);
}

describe('ScriptRunner — _demo.json, wszystkie wybory poprawne', () => {
  it('przechodzi od startu do finału i zbiera komplet fragmentów', () => {
    const { runner, state, log } = setup();
    runner.start();
    expect(runner.current?.id).toBe('b01');
    expect(runner.phase).toBe('narration');

    // Narracja odsłania się biegiem: b01 i b02 to jeden odcinek drogi.
    const b01Length = (runner.current as { text: string }).text.length;
    runner.moveBy(TUNING.NARRATION_PX_PER_CHAR * 10);
    expect(runner.narrationProgress()).toEqual([
      { beatId: 'b01', revealed: 10, length: b01Length },
    ]);
    runner.moveBy(-TUNING.NARRATION_PX_PER_CHAR * 4); // cofanie chowa tekst
    expect(runner.narrationProgress()[0]?.revealed).toBe(6);
    runner.moveBy(-10_000); // nie da się cofnąć przed początek odcinka
    expect(runner.narrationProgress()[0]?.revealed).toBe(0);
    expect(runner.current?.id).toBe('b01');
    runner.moveBy(b01Length * TUNING.NARRATION_PX_PER_CHAR + TUNING.NARRATION_BEAT_GAP_PX + 1);
    expect(runner.current?.id).toBe('b02');
    expect(runner.phase).toBe('narration');
    expect(runner.narrationProgress().map((p) => p.beatId)).toEqual(['b01', 'b02']);
    runner.moveBy(runner.narrationRemainingPx);
    expect(runner.current?.id).toBe('b03');
    expect(runner.phase).toBe('choice');

    elapse(runner, 1000);
    const beat = runner.current;
    if (beat === undefined) throw new Error('brak beatu');
    runner.resolveChoice(correctIndex(beat));
    expect(runner.phase).toBe('success');
    expect(state.fragments).toEqual([1]);
    expect(state.skills.Refleks).toBe(1);
    elapse(runner, 200);
    expect(runner.current?.id).toBe('b04');
    expect(runner.phase).toBe('action');

    // Okno QTE otwiera się po ACTION_ZONE_START_MS.
    elapse(runner, TUNING.ACTION_ZONE_START_MS - 100);
    expect(runner.isActionWindowOpen).toBe(false);
    elapse(runner, 200);
    expect(runner.isActionWindowOpen).toBe(true);
    runner.triggerAction();
    expect(state.fragments).toEqual([1, 2]);
    elapse(runner, 200);
    expect(runner.phase).toBe('results');

    runner.advance();
    expect(runner.phase).toBe('finale');
    runner.advance();
    expect(runner.phase).toBe('finished');
    expect(state.stumbles).toBe(0);
    expect(log).toEqual([
      'start:b01#1',
      'start:b02#1',
      'start:b03#1',
      'ok:b03',
      'fragment:1',
      'start:b04#1',
      'ok:b04',
      'fragment:2',
      'start:b05#1',
      'start:b06#1',
      'finished',
    ]);
  });

  it('ignoruje wejścia nieadekwatne do fazy', () => {
    const { runner, state } = setup();
    runner.start();
    runner.resolveChoice(0);
    runner.triggerAction();
    runner.completeInteraction();
    runner.advance();
    expect(runner.phase).toBe('narration');
    expect(state.stumbles).toBe(0);
    runner.moveBy(10_000);
    expect(runner.phase).toBe('choice');
    runner.moveBy(10_000); // bieg nie działa w fazie wyboru
    expect(runner.phase).toBe('choice');
  });
});

describe('ScriptRunner — błędne wybory: potknięcie i powrót do tego samego beatu', () => {
  it('zły wybór → feedback → ten sam beat (attempt 2) → poprawny wybór → dalej', () => {
    const { runner, state, log } = setup();
    runner.start();
    runner.moveBy(10_000);
    expect(runner.current?.id).toBe('b03');
    const beat = runner.current;
    if (beat === undefined) throw new Error('brak beatu');
    const wrong = beat.type === 'choice' ? beat.options.findIndex((o) => !o.correct) : -1;

    runner.resolveChoice(wrong);
    expect(runner.phase).toBe('feedback');
    expect(state.stumbles).toBe(1);
    expect(state.fragments).toEqual([]);
    runner.resolveChoice(correctIndex(beat)); // w feedbacku wejście jest ignorowane
    expect(runner.phase).toBe('feedback');

    elapse(runner, 500);
    expect(runner.current?.id).toBe('b03');
    expect(runner.context.attempt).toBe(2);
    expect(runner.phase).toBe('choice');

    runner.resolveChoice(correctIndex(beat));
    expect(state.fragments).toEqual([1]);
    expect(log.filter((l) => l.startsWith('start:b03'))).toEqual(['start:b03#1', 'start:b03#2']);
  });

  it('brak wyboru w czasie = timeout, potem powrót', () => {
    const { runner, state, log } = setup();
    runner.start();
    runner.moveBy(10_000);
    // Limit rośnie z długością tekstu (choiceTimerMs) — tuż przed nim jeszcze bez potknięcia.
    const beat = runner.current;
    const limit = beat?.type === 'choice' ? choiceTimerMs(beat) : 0;
    elapse(runner, limit - 100);
    expect(log).not.toContain('fail:b03:timeout');
    elapse(runner, 200);
    expect(log).toContain('fail:b03:timeout');
    expect(state.stumbles).toBe(1);
    elapse(runner, 500);
    expect(runner.current?.id).toBe('b03');
    expect(runner.phase).toBe('choice');
  });

  it('QTE: za wcześnie i za późno = potknięcia, trafienie w oknie = fragment; case i tak się kończy', () => {
    const { runner, state, log } = setup();
    runner.start();
    runner.moveBy(10_000);
    const choice = runner.current;
    if (choice === undefined) throw new Error('brak beatu');
    runner.resolveChoice(correctIndex(choice));
    elapse(runner, 200);
    expect(runner.current?.id).toBe('b04');

    runner.triggerAction(); // za wcześnie
    expect(log).toContain('fail:b04:early');
    elapse(runner, 500);
    expect(runner.context.attempt).toBe(2);

    elapse(runner, TUNING.ACTION_ZONE_START_MS + 800 + 50); // za późno
    expect(log).toContain('fail:b04:late');
    elapse(runner, 500);
    expect(runner.context.attempt).toBe(3);

    elapse(runner, TUNING.ACTION_ZONE_START_MS + 100);
    runner.triggerAction();
    expect(state.fragments).toEqual([1, 2]);
    expect(state.stumbles).toBe(2);
    elapse(runner, 200);
    expect(runner.phase).toBe('results');
    runner.advance();
    runner.advance();
    expect(runner.phase).toBe('finished');
  });
});
