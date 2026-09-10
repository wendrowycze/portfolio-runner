import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TUNING } from '../../src/config/tuning';
import { caseWarnings, loadCase } from '../../src/content/loader';
import { ScriptRunner } from '../../src/script/ScriptRunner';
import { totalFragments, type Beat, type Case } from '../../src/script/types';
import { createGameState } from '../../src/state/GameState';

const dir = new URL('../../content/cases/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));

function elapse(runner: ScriptRunner, ms: number): void {
  let left = ms;
  while (left > 0) {
    const step = Math.min(50, left);
    runner.tick(step);
    left -= step;
  }
}

function play(runner: ScriptRunner, beat: Beat): void {
  switch (beat.type) {
    case 'narration':
      runner.moveBy(runner.narrationRemainingPx);
      break;
    case 'choice':
      runner.resolveChoice(beat.options.findIndex((o) => o.correct));
      elapse(runner, 800);
      break;
    case 'action':
      elapse(runner, TUNING.ACTION_ZONE_START_MS + 100);
      runner.triggerAction();
      elapse(runner, 800);
      break;
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

describe.each(files)('case %s', (file) => {
  const kejs: Case = loadCase(JSON.parse(readFileSync(new URL(file, dir), 'utf8')));

  it('spełnia schemat, ma grafiki przeszkód i trzyma rytm z _SZABLON.md', () => {
    expect(file).toBe(`${kejs.id === 'demo' ? '_demo' : kejs.id}.json`);
    expect(caseWarnings(kejs)).toEqual([]);
    expect(kejs.painting.src).toBe(
      `assets/paintings/${kejs.id === 'demo' ? '_demo' : kejs.id}.svg`,
    );
    const types = kejs.beats.map((b) => b.type);
    let streak = 0;
    for (const type of types) {
      streak = type === 'narration' ? streak + 1 : 0;
      expect(streak).toBeLessThanOrEqual(3);
    }
    if (kejs.id !== 'demo') {
      expect(types.filter((t) => t === 'choice').length).toBeGreaterThanOrEqual(2);
      expect(types.filter((t) => t === 'choice').length).toBeLessThanOrEqual(3);
      expect(types.filter((t) => t === 'action').length).toBeGreaterThanOrEqual(1);
      expect(types.filter((t) => t === 'action').length).toBeLessThanOrEqual(2);
      expect(types.filter((t) => t === 'interaction').length).toBeGreaterThanOrEqual(1);
      expect(types.filter((t) => t === 'interaction').length).toBeLessThanOrEqual(2);
    }
    // Fragmenty numerowane w kolejności zbierania (1, 2, 3, …).
    const rewards = kejs.beats.flatMap((b) =>
      (b.type === 'choice' || b.type === 'action' || b.type === 'interaction') &&
      b.reward !== undefined
        ? [b.reward.fragment]
        : [],
    );
    expect(rewards).toEqual(rewards.map((_, i) => i + 1));
  });

  it('da się przejść z poprawnymi reakcjami do końca, z kompletem fragmentów', () => {
    const state = createGameState(kejs.runner.baseSpeed);
    const runner = new ScriptRunner(state);
    runner.load(kejs);
    runner.start();
    let guard = 0;
    while (runner.phase !== 'finished' && guard < 200) {
      const beat = runner.current;
      if (beat === undefined) break;
      play(runner, beat);
      guard += 1;
    }
    expect(runner.phase).toBe('finished');
    expect(state.fragments).toHaveLength(totalFragments(kejs));
    expect(state.stumbles).toBe(0);
  });
});
