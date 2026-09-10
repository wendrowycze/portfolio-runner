/**
 * Układ galerii w hubie: obrazy w dwóch rzędach (górny o jeden dłuższy przy nieparzystej liczbie),
 * wyśrodkowane. Czysta funkcja — używana przez scenę i przez testy e2e do kliknięcia w obraz.
 */
export interface HubSlot {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HubLayoutOptions {
  sceneWidth: number;
  /** Środek pierwszego rzędu i odstęp między rzędami (px). */
  firstRowY: number;
  rowGap: number;
  /** Rozmiar obrazu (bez ramy). */
  paintingWidth: number;
  paintingHeight: number;
  /** Odstęp między środkami obrazów w rzędzie. */
  columnGap: number;
}

export const HUB_LAYOUT: HubLayoutOptions = {
  sceneWidth: 960,
  firstRowY: 150,
  rowGap: 190,
  paintingWidth: 150,
  paintingHeight: 100,
  columnGap: 184,
};

export function hubSlots(count: number, options: HubLayoutOptions = HUB_LAYOUT): HubSlot[] {
  if (count <= 0) return [];
  const rows = count <= 4 ? 1 : 2;
  const topCount = rows === 1 ? count : Math.ceil(count / 2);
  const slots: HubSlot[] = [];
  for (let i = 0; i < count; i += 1) {
    const row = i < topCount ? 0 : 1;
    const inRow = row === 0 ? topCount : count - topCount;
    const index = row === 0 ? i : i - topCount;
    const rowWidth = (inRow - 1) * options.columnGap;
    const x = options.sceneWidth / 2 - rowWidth / 2 + index * options.columnGap;
    const y = options.firstRowY + row * options.rowGap;
    slots.push({ x, y, width: options.paintingWidth, height: options.paintingHeight });
  }
  return slots;
}
