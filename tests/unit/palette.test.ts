import { describe, expect, it } from 'vitest';
import {
  PALETTE,
  PALETTE_KEYS,
  PALETTE_ROLES,
  hexToNumber,
  paletteNumber,
} from '../../src/config/palette';

describe('paleta', () => {
  it('ma dokładnie dziesięć kolorów z docs/04', () => {
    expect(PALETTE_KEYS).toHaveLength(10);
    expect(Object.values(PALETTE).sort()).toEqual(
      [
        '#261619',
        '#3E2219',
        '#742224',
        '#895F47',
        '#DFB67C',
        '#E2E9E1',
        '#ACCBC6',
        '#3D5E67',
        '#11485D',
        '#0B2F2E',
      ].sort(),
    );
  });

  it('każdy kolor jest poprawnym hexem i ma opis roli', () => {
    for (const key of PALETTE_KEYS) {
      expect(PALETTE[key]).toMatch(/^#[0-9A-F]{6}$/);
      expect(PALETTE_ROLES[key].length).toBeGreaterThan(0);
    }
  });

  it('zamienia hex na liczbę dla Phasera', () => {
    expect(hexToNumber('#DFB67C')).toBe(0xdfb67c);
    expect(paletteNumber('bgDeep')).toBe(0x261619);
    expect(() => hexToNumber('złoto')).toThrow();
  });
});
