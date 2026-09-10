import { FLOORS, HOTEL, floorForWorld } from '../config/hotel';
import type { Case, World } from '../script/types';

/**
 * Układ hotelu — czysta funkcja: przypisuje obrazy do pięter i pozycji na ścianie.
 * Współrzędne świata: piętro `index` zajmuje y ∈ [top, top + floorHeight), gdzie
 * top = (liczba pięter − 1 − index) · floorHeight (parter na dole).
 */
export interface PaintingSlot {
  caseId: string;
  world: World;
  floor: number;
  /** Środek obrazu we współrzędnych świata. */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FloorGeometry {
  index: number;
  world: World;
  top: number;
  floorY: number;
  width: number;
}

export function floorTop(index: number): number {
  return (FLOORS.length - 1 - index) * HOTEL.floorHeight;
}

export function floorGeometry(index: number): FloorGeometry {
  const def = FLOORS[index];
  if (def === undefined) throw new Error(`Nie ma piętra ${String(index)}`);
  const top = floorTop(index);
  return { index, world: def.world, top, floorY: top + HOTEL.floorLineY, width: HOTEL.floorWidth };
}

export function hotelHeight(): number {
  return FLOORS.length * HOTEL.floorHeight;
}

/** Które piętro zawiera dany punkt y świata. */
export function floorAtY(y: number): number {
  const fromTop = Math.floor(y / HOTEL.floorHeight);
  return Math.max(0, Math.min(FLOORS.length - 1, FLOORS.length - 1 - fromTop));
}

export function paintingSlots(cases: readonly Case[]): PaintingSlot[] {
  const perFloor = new Map<number, number>();
  const slots: PaintingSlot[] = [];
  for (const kejs of cases) {
    const floor = floorForWorld(kejs.world).index;
    const n = perFloor.get(floor) ?? 0;
    perFloor.set(floor, n + 1);
    slots.push({
      caseId: kejs.id,
      world: kejs.world,
      floor,
      x: HOTEL.firstPaintingX + n * HOTEL.paintingGap,
      y: floorTop(floor) + HOTEL.paintingY,
      width: HOTEL.paintingWidth,
      height: HOTEL.paintingHeight,
    });
  }
  return slots;
}

/** Ile obrazów wisi na piętrze (do liczenia „naprawy piętra”). */
export function casesOnFloor(cases: readonly Case[], floor: number): Case[] {
  return cases.filter((c) => floorForWorld(c.world).index === floor);
}

/** Ułamek odrestaurowanych obrazów na piętrze (0..1); puste piętro = 0. */
export function floorRestoration(
  cases: readonly Case[],
  completed: ReadonlySet<string>,
  floor: number,
): number {
  const on = casesOnFloor(cases, floor);
  if (on.length === 0) return 0;
  return on.filter((c) => completed.has(c.id)).length / on.length;
}

/** Pozycja x posągu na piętrze. */
export function statueX(): number {
  return HOTEL.floorWidth - HOTEL.statueOffsetFromEnd;
}
