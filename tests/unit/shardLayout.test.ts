import { describe, expect, it } from 'vitest';
import { clampToScreen, shardLayout, shardX } from '../../src/runner/shardLayout';

describe('shardLayout', () => {
  it('rozkłada kafle równomiernie na cyklu, każdy z numerem fragmentu', () => {
    const slots = shardLayout(6, 1920);
    expect(slots.map((s) => s.fragment)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const slot of slots) {
      expect(slot.offset).toBeGreaterThanOrEqual(0);
      expect(slot.offset).toBeLessThan(1920);
      expect(slot.height).toBeGreaterThan(0.3);
      expect(slot.height).toBeLessThan(1);
    }
    const gaps = slots.slice(1).map((s, i) => s.offset - (slots[i]?.offset ?? 0));
    expect(new Set(gaps).size).toBe(1);
  });

  it('zwraca pustą listę dla zera fragmentów', () => {
    expect(shardLayout(0, 1920)).toEqual([]);
  });

  it('przesuwa kafel z mnożnikiem warstwy i zawija na cyklu', () => {
    const slot = { fragment: 1, offset: 100, height: 0.5, factor: 0.5 };
    expect(shardX(slot, 0, 1000)).toBe(100);
    expect(shardX(slot, 100, 1000)).toBe(50);
    expect(shardX(slot, 400, 1000)).toBe(900);
    expect(shardX(slot, 2400, 1000)).toBe(900);
  });

  it('sprowadza pozycję spoza kadru na ekran z marginesem', () => {
    expect(clampToScreen(500, 960, 40)).toBe(500);
    expect(clampToScreen(1500, 960, 40)).toBe(1500 - 880);
    expect(clampToScreen(-100, 960, 40)).toBeGreaterThanOrEqual(40);
    expect(clampToScreen(-100, 960, 40)).toBeLessThan(920);
  });
});
