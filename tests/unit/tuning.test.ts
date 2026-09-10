import { describe, expect, it } from 'vitest';
import { TUNING } from '../../src/config/tuning';
import { OBSTACLES, OBSTACLE_KEYS, obstacleDef, isObstacleKey } from '../../src/content/obstacles';
import { ASSET_MANIFEST } from '../../src/assets/manifest';

describe('strojenie (docs/01_GDD_RUNNER_POC.md sekcja k)', () => {
  it('trzyma wartości w zakresach z GDD', () => {
    expect(TUNING.BASE_SPEED).toBeGreaterThanOrEqual(120);
    expect(TUNING.BASE_SPEED).toBeLessThanOrEqual(400);
    expect(TUNING.TIME_DILATION_FACTOR).toBeGreaterThanOrEqual(0.2);
    expect(TUNING.TIME_DILATION_FACTOR).toBeLessThanOrEqual(0.6);
    expect(TUNING.STUMBLE_SPEED_MULT).toBeGreaterThanOrEqual(0.3);
    expect(TUNING.STUMBLE_SPEED_MULT).toBeLessThanOrEqual(0.7);
    expect(TUNING.TYPEWRITER_CPS).toBeGreaterThanOrEqual(20);
    expect(TUNING.TYPEWRITER_CPS).toBeLessThanOrEqual(80);
  });

  it('skok jest fizycznie sensowny (postać przeskoczy najwyższą przeszkodę)', () => {
    const jumpHeight = TUNING.JUMP_VELOCITY ** 2 / (2 * TUNING.GRAVITY_Y);
    const tallest = Math.max(...Object.values(OBSTACLES).map((o) => o.bodyHeight));
    expect(jumpHeight).toBeGreaterThan(tallest);
  });
});

describe('słownik przeszkód', () => {
  it('każda przeszkoda ma teksturę w manifeście i ciało nie większe niż grafika', () => {
    for (const key of OBSTACLE_KEYS) {
      const def = OBSTACLES[key];
      expect(Object.hasOwn(ASSET_MANIFEST, def.texture)).toBe(true);
      expect(def.bodyWidth).toBeLessThanOrEqual(def.width);
      expect(def.bodyHeight).toBeLessThanOrEqual(def.height);
    }
  });

  it('nieznany klucz dostaje bezpieczny fallback zamiast crasha', () => {
    expect(isObstacleKey('nie-ma-takiej')).toBe(false);
    expect(obstacleDef('nie-ma-takiej')).toBe(OBSTACLES.skrzynia);
  });
});
