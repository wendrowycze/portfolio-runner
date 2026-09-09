import { describe, expect, it } from 'vitest';
import demo from '../../content/cases/_demo.json';
import { CaseValidationError, loadCase } from '../../src/content/loader';
import { loadUiStrings } from '../../src/content/uiStrings';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe('loadCase (zod, ADR-7)', () => {
  it('akceptuje _demo.json', () => {
    const kejs = loadCase(demo);
    expect(kejs.id).toBe('demo');
    expect(kejs.beats).toHaveLength(6);
    expect(kejs.beats.map((b) => b.type)).toEqual([
      'narration',
      'narration',
      'choice',
      'action',
      'results',
      'finale',
    ]);
  });

  it('odrzuca narration auto bez durationMs', () => {
    const broken = clone(demo);
    const beat = broken.beats[1] as { durationMs?: number };
    delete beat.durationMs;
    expect(() => loadCase(broken)).toThrow(CaseValidationError);
    expect(() => loadCase(broken)).toThrow(/durationMs/);
  });

  it('odrzuca dwa beaty przyznające ten sam fragment', () => {
    const broken = clone(demo);
    (broken.beats[3] as { reward: { fragment: number } }).reward.fragment = 1;
    expect(() => loadCase(broken)).toThrow(/fragment 1 przyznawany dwa razy/);
  });

  it('odrzuca skill spoza case.skills i nieznane pola', () => {
    const broken = clone(demo);
    const choice = broken.beats[2] as { options: { skill?: string }[] };
    const first = choice.options[0];
    if (first !== undefined) first.skill = 'Telepatia';
    expect(() => loadCase(broken)).toThrow(/Telepatia/);

    const extra = clone(demo) as Record<string, unknown>;
    extra.niespodzianka = true;
    expect(() => loadCase(extra)).toThrow(CaseValidationError);
  });

  it('wymaga, żeby liczba fragmentów równała się cols×rows i finale było ostatnie', () => {
    const broken = clone(demo);
    broken.painting.cols = 3;
    expect(() => loadCase(broken)).toThrow(/cols×rows/);

    const noFinale = clone(demo);
    noFinale.beats.pop();
    expect(() => loadCase(noFinale)).toThrow(/finale/);
  });

  it('zbiera czytelną listę problemów', () => {
    try {
      loadCase({ id: 'X' });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(CaseValidationError);
      if (error instanceof CaseValidationError) {
        expect(error.issues.length).toBeGreaterThan(3);
        expect(error.issues.some((issue) => issue.startsWith('beats'))).toBe(true);
      }
    }
  });
});

describe('teksty interfejsu', () => {
  it('content/ui.json jest kompletny', () => {
    const strings = loadUiStrings();
    expect(strings.continue.length).toBeGreaterThan(0);
    expect(strings.fragmentCollected).toContain('{n}');
  });
});
