/**
 * Paleta projektu — dziesięć kolorów z docs/04_STYL_I_ASSETY.md.
 * Jedyne źródło prawdy dla kolorów w Phaserze; wartości CSS w src/styles.css muszą być identyczne.
 */
export const PALETTE = {
  bgDeep: '#261619',
  panelBg: '#3E2219',
  warn: '#742224',
  ground: '#895F47',
  gold: '#DFB67C',
  text: '#E2E9E1',
  textMuted: '#ACCBC6',
  cool: '#3D5E67',
  parallaxMid: '#11485D',
  parallaxFar: '#0B2F2E',
} as const;

export type PaletteKey = keyof typeof PALETTE;

/** Opis roli koloru (propozycja z docs/04) — do ekranu palety i dokumentacji. */
export const PALETTE_ROLES: Readonly<Record<PaletteKey, string>> = {
  bgDeep: 'Tło głębokie',
  panelBg: 'Tło panelu',
  warn: 'Ostrzeżenie / potknięcie',
  ground: 'Ziemia, drewno',
  gold: 'Złoto — akcent',
  text: 'Tekst jasny',
  textMuted: 'Tekst drugorzędny',
  cool: 'Akcent chłodny',
  parallaxMid: 'Paralaksa środek',
  parallaxFar: 'Paralaksa dal',
};

export const PALETTE_KEYS = Object.keys(PALETTE) as PaletteKey[];

/** Zamiana '#RRGGBB' na liczbę, jakiej oczekuje Phaser (0xRRGGBB). */
export function hexToNumber(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (match?.[1] === undefined) {
    throw new Error(`Niepoprawny kolor hex: ${hex}`);
  }
  return Number.parseInt(match[1], 16);
}

export function paletteNumber(key: PaletteKey): number {
  return hexToNumber(PALETTE[key]);
}
