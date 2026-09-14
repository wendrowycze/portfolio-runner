/**
 * Rozmieszczenie „ukrytych” kawałków obrazu w scenerii biegu — czysta funkcja (testowana).
 * Kafle obrazu dryfują w warstwach paralaksy (każdy z własnym mnożnikiem prędkości), rozłożone
 * równomiernie na cyklu o długości `cycleWidth`, na przemian wysoko/nisko, żeby nie zasłaniały
 * siebie nawzajem ani drogi. Finał zbiera je z miejsc, w których akurat są.
 */
export interface ShardSlot {
  /** Numer fragmentu (1..total). */
  fragment: number;
  /** Pozycja startowa na cyklu (px, 0..cycleWidth). */
  offset: number;
  /** Wysokość (0..1 wysokości nad ziemią, 0 = ziemia, 1 = góra ekranu). */
  height: number;
  /** Mnożnik prędkości warstwy (im mniejszy, tym dalej). */
  factor: number;
}

export const SHARD_FACTORS = [0.35, 0.7] as const;

export function shardLayout(total: number, cycleWidth: number): ShardSlot[] {
  const slots: ShardSlot[] = [];
  if (total <= 0 || cycleWidth <= 0) return slots;
  const step = cycleWidth / total;
  for (let i = 0; i < total; i += 1) {
    const factor = SHARD_FACTORS[i % SHARD_FACTORS.length] ?? 0.5;
    slots.push({
      fragment: i + 1,
      offset: Math.round(step * i + step * 0.5),
      // Trzy poziomy: wysoko (dalsze), średnio, nisko — nigdy przy samej ziemi.
      height: [0.72, 0.5, 0.62][i % 3] ?? 0.6,
      factor,
    });
  }
  return slots;
}

/** Pozycja x kafla po przebiegu `distance` px świata: warstwa przesuwa się `distance × factor`. */
export function shardX(slot: ShardSlot, distance: number, cycleWidth: number): number {
  const x = (slot.offset - distance * slot.factor) % cycleWidth;
  return x < 0 ? x + cycleWidth : x;
}

/** Sprowadza x do widocznego zakresu ekranu (na finał — kafel spoza kadru „wchodzi” w kadr). */
export function clampToScreen(x: number, screenWidth: number, margin: number): number {
  const span = screenWidth - margin * 2;
  if (span <= 0) return screenWidth / 2;
  let inner = (x - margin) % span;
  if (inner < 0) inner += span;
  return margin + inner;
}
