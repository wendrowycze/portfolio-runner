import { describe, expect, it } from 'vitest';
import teatr from '../../content/cases/teatr-jest-nasz.json';
import { TUNING } from '../../src/config/tuning';
import { caseWarnings, loadCase } from '../../src/content/loader';
import { isObstacleKey } from '../../src/content/obstacles';
import { ScriptRunner } from '../../src/script/ScriptRunner';
import { totalFragments, type Beat } from '../../src/script/types';
import { createGameState } from '../../src/state/GameState';
import { derangement } from '../../src/ui/widgets/PuzzleWidget';

function elapse(runner: ScriptRunner, ms: number): void {
  let left = ms;
  while (left > 0) {
    const step = Math.min(50, left);
    runner.tick(step);
    left -= step;
  }
}

/** Automatyczny gracz: rozwiązuje aktualny beat (opcjonalnie najpierw myląc się raz). */
function play(runner: ScriptRunner, beat: Beat, mistakes: boolean): void {
  switch (beat.type) {
    case 'narration':
      runner.textRevealed();
      if (beat.advance === 'auto') elapse(runner, (beat.durationMs ?? 0) + 50);
      else runner.advance();
      break;
    case 'choice': {
      if (mistakes) {
        runner.resolveChoice(beat.options.findIndex((o) => !o.correct));
        elapse(runner, TUNING.FEEDBACK_HOLD_MS + 50);
      }
      runner.resolveChoice(beat.options.findIndex((o) => o.correct));
      elapse(runner, 800);
      break;
    }
    case 'action': {
      if (mistakes) {
        elapse(runner, TUNING.ACTION_ZONE_START_MS + beat.windowMs + 100); // za późno
        elapse(runner, TUNING.FEEDBACK_HOLD_MS + 50);
      }
      elapse(runner, TUNING.ACTION_ZONE_START_MS + 100);
      runner.triggerAction();
      elapse(runner, 800);
      break;
    }
    case 'interaction':
      runner.completeInteraction();
      elapse(runner, 800);
      break;
    case 'results':
    case 'finale':
      runner.advance();
      break;
  }
}

describe('pilot „Teatr jest nasz”', () => {
  const kejs = loadCase(teatr);

  it('jest zgodny ze schematem i zasadami z content/cases/_SZABLON.md', () => {
    expect(kejs.id).toBe('teatr-jest-nasz');
    expect(totalFragments(kejs)).toBe(6);
    const types = kejs.beats.map((b) => b.type);
    expect(types.filter((t) => t === 'choice')).toHaveLength(3);
    expect(types.filter((t) => t === 'action')).toHaveLength(2);
    expect(types.filter((t) => t === 'interaction')).toHaveLength(2);
    expect(types.at(-2)).toBe('results');
    expect(types.at(-1)).toBe('finale');
    // Max 2-3 beaty narracyjne pod rząd.
    let streak = 0;
    for (const type of types) {
      streak = type === 'narration' ? streak + 1 : 0;
      expect(streak).toBeLessThanOrEqual(3);
    }
    // Każda przeszkoda z treści ma grafikę.
    for (const beat of kejs.beats) {
      if (beat.type === 'choice' || beat.type === 'action') {
        expect(isObstacleKey(beat.obstacle)).toBe(true);
      }
    }
    expect(caseWarnings(kejs)).toEqual([]);
  });

  it('da się przejść ze wszystkimi wyborami poprawnymi — 6/6 fragmentów, 0 potknięć', () => {
    const state = createGameState(kejs.runner.baseSpeed);
    const runner = new ScriptRunner(state);
    runner.load(kejs);
    runner.start();
    let guard = 0;
    while (runner.phase !== 'finished' && guard < 100) {
      const beat = runner.current;
      if (beat === undefined) break;
      play(runner, beat, false);
      guard += 1;
    }
    expect(runner.phase).toBe('finished');
    expect([...state.fragments].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(state.stumbles).toBe(0);
    expect(Object.values(state.skills).reduce((a, b) => a + b, 0)).toBe(3);
  });

  it('da się ukończyć mimo błędnych wyborów — potknięcia rosną, fragmenty i tak są komplet', () => {
    const state = createGameState(kejs.runner.baseSpeed);
    const runner = new ScriptRunner(state);
    runner.load(kejs);
    runner.start();
    let guard = 0;
    while (runner.phase !== 'finished' && guard < 100) {
      const beat = runner.current;
      if (beat === undefined) break;
      play(runner, beat, true);
      guard += 1;
    }
    expect(runner.phase).toBe('finished');
    expect(state.fragments).toHaveLength(6);
    expect(state.stumbles).toBe(5); // 3 choice + 2 action, po jednym błędzie
  });
});

describe('układanka — tasowanie', () => {
  it('żaden kafel nie zaczyna na swoim miejscu, a układ jest permutacją', () => {
    for (const n of [2, 4, 6, 9]) {
      const order = derangement(n);
      expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, i) => i));
      order.forEach((pos, i) => {
        expect(pos).not.toBe(i);
      });
    }
  });
});
