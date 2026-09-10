import { describe, expect, it } from 'vitest';
import { FLOORS, HOTEL } from '../../src/config/hotel';
import {
  casesOnFloor,
  floorAtY,
  floorGeometry,
  floorRestoration,
  hotelHeight,
  paintingSlots,
} from '../../src/scenes/hotelLayout';
import { choiceTimerMs } from '../../src/script/timing';
import type { Case } from '../../src/script/types';
import { canEnter, createVisitor, isValidEmail, litTorches } from '../../src/state/Visitor';

const stub = (id: string, world: Case['world']): Case => ({
  id,
  world,
  title: id,
  lead: '',
  role: '',
  skills: ['a'],
  painting: { src: '', cols: 3, rows: 2, caption: '' },
  runner: { theme: world, baseSpeed: 220, choiceSlowdown: 0.35 },
  beats: [],
});

describe('hotel: piętra i obrazy', () => {
  it('trzy piętra od dołu: Kultura, Edukacja, Biznes; parter na dole świata', () => {
    expect(FLOORS.map((f) => f.world)).toEqual(['kultura', 'edukacja', 'biznes']);
    expect(floorGeometry(0).top).toBe(2 * HOTEL.floorHeight);
    expect(floorGeometry(2).top).toBe(0);
    expect(hotelHeight()).toBe(3 * HOTEL.floorHeight);
    expect(floorAtY(10)).toBe(2);
    expect(floorAtY(hotelHeight() - 10)).toBe(0);
  });

  it('obrazy wiszą na piętrze swojego świata, w równych odstępach', () => {
    const cases = [
      stub('a', 'kultura'),
      stub('b', 'biznes'),
      stub('c', 'kultura'),
      stub('d', 'edukacja'),
    ];
    const slots = paintingSlots(cases);
    expect(slots.map((s) => s.floor)).toEqual([0, 2, 0, 1]);
    const kultura = slots.filter((s) => s.floor === 0).map((s) => s.x);
    expect(kultura).toEqual([HOTEL.firstPaintingX, HOTEL.firstPaintingX + HOTEL.paintingGap]);
    expect(slots.map((s) => s.x)[1]).toBe(HOTEL.firstPaintingX);
    expect(casesOnFloor(cases, 0).map((c) => c.id)).toEqual(['a', 'c']);
  });

  it('naprawa piętra = ułamek odrestaurowanych obrazów na nim', () => {
    const cases = [stub('a', 'kultura'), stub('c', 'kultura'), stub('d', 'edukacja')];
    expect(floorRestoration(cases, new Set(), 0)).toBe(0);
    expect(floorRestoration(cases, new Set(['a']), 0)).toBe(0.5);
    expect(floorRestoration(cases, new Set(['a', 'c']), 0)).toBe(1);
    expect(floorRestoration(cases, new Set(['a']), 2)).toBe(0);
  });
});

describe('czas na wybór rośnie z długością tekstu', () => {
  it('krótki tekst = minimum z JSON, długi = czas czytania + bufor', () => {
    const short = {
      prompt: 'Co robisz?',
      timerMs: 7000,
      options: [{ text: 'A', correct: true, feedback: '' }],
    };
    expect(choiceTimerMs(short)).toBe(7000);
    const long = {
      prompt: 'x'.repeat(100),
      timerMs: 7000,
      options: [
        { text: 'y'.repeat(100), correct: true, feedback: '' },
        { text: 'z'.repeat(100), correct: false, feedback: '' },
      ],
    };
    const expected = Math.round((300 / 22) * 1000 + 3000);
    expect(choiceTimerMs(long)).toBe(expected);
    expect(choiceTimerMs(long)).toBeGreaterThan(15_000);
  });
});

describe('gość i pochodnie', () => {
  it('każde pole zapala pochodnię; wejście po trzech albo jako gość', () => {
    const v = createVisitor();
    expect(litTorches(v)).toBe(0);
    expect(canEnter(v)).toBe(false);
    v.name = 'Ola';
    expect(litTorches(v)).toBe(1);
    v.email = 'zly-mail';
    expect(litTorches(v)).toBe(1);
    v.email = 'ola@przyklad.pl';
    expect(litTorches(v)).toBe(2);
    v.consent = true;
    expect(litTorches(v)).toBe(3);
    expect(canEnter(v)).toBe(true);
    const guest = createVisitor();
    guest.guest = true;
    expect(canEnter(guest)).toBe(true);
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('a@b')).toBe(false);
  });
});
