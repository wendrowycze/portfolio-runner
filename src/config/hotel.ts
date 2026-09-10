import type { World } from '../script/types';

/**
 * Hotel: trzy piętra = trzy światy (decyzja Arka z 2026-09-10). Parter to Kultura — świat pilota
 * i najbogatszy w historie; wyżej Edukacja i Biznes. Kolejność pięter od dołu.
 */
export interface FloorDef {
  world: World;
  /** Numer piętra od dołu (0 = parter). */
  index: number;
}

export const FLOORS: readonly FloorDef[] = [
  { world: 'kultura', index: 0 },
  { world: 'edukacja', index: 1 },
  { world: 'biznes', index: 2 },
];

export const HOTEL = {
  /** Szerokość korytarza jednego piętra (świat), kamera pokazuje 960 px. */
  floorWidth: 2600,
  /** Wysokość piętra = wysokość sceny. */
  floorHeight: 540,
  /** Linia podłogi w obrębie piętra (od góry piętra). */
  floorLineY: 470,
  /** Winda: środek kabiny (x) i szerokość strefy „jestem w windzie”. */
  elevatorX: 150,
  elevatorZone: 70,
  /** Pierwszy obraz i odstęp między obrazami na ścianie. */
  firstPaintingX: 420,
  paintingGap: 280,
  /** Rozmiar obrazu na ścianie (bez ramy) i wysokość zawieszenia (środek, od góry piętra). */
  paintingWidth: 168,
  paintingHeight: 112,
  paintingY: 250,
  /** Posąg (easter egg) — na końcu korytarza. */
  statueOffsetFromEnd: 160,
  /** Prędkość chodzenia (px/s) i próg „stoję przy obrazie”. */
  walkSpeed: 260,
  nearDistance: 110,
  /** Skąd zaczyna gość po wejściu: tuż za windą. */
  spawnX: 260,
} as const;

export function floorForWorld(world: World): FloorDef {
  const floor = FLOORS.find((f) => f.world === world);
  if (floor === undefined) throw new Error(`Brak piętra dla świata ${world}`);
  return floor;
}
