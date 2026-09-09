/**
 * Manifest assetów — JEDYNE miejsce mapujące klucz logiczny na plik/źródło i licencję.
 * Sceny i UI odwołują się wyłącznie do kluczy; podmiana placeholdera = zmiana jednej linii tutaj.
 *
 * `source: 'generated'` = tekstura rysowana kodem w BootScene (Phaser.Graphics → generateTexture).
 * `source: 'file'` = plik w public/assets/... (ścieżka względem base URL Vite).
 */
export interface GeneratedAsset {
  source: 'generated';
  license: 'wygenerowane kodem';
}

export interface FileAsset {
  source: 'file';
  path: string;
  license: string;
}

/** Asset, którego ścieżka pochodzi z treści case'a (JSON), nie z manifestu. */
export interface CaseAsset {
  source: 'case';
  license: string;
}

export type AssetEntry = GeneratedAsset | FileAsset | CaseAsset;

const generated: GeneratedAsset = { source: 'generated', license: 'wygenerowane kodem' };

export const ASSET_MANIFEST = {
  // --- tło i paralaksa (świat Kultura) ---
  'bg.sky': generated,
  'bg.stars': generated,
  'bg.skyline': generated,
  'bg.colonnade': generated,
  'bg.props': generated,
  'bg.ground': generated,

  // --- postać ---
  'player.run': generated,
  'player.jump': generated,
  'player.stumble': generated,
  'player.idle': generated,

  // --- przeszkody (klucze z src/content/obstacles.ts) ---
  'obstacle.barierka': generated,
  'obstacle.skrzynia': generated,
  'obstacle.kolumna': generated,
  'obstacle.kordon-kamer': generated,
  'obstacle.boty': generated,
  'obstacle.telefony': generated,
  'obstacle.brama': generated,

  // --- obraz case'a: ścieżka pochodzi z JSON case'a (painting.src), klucz tekstury jest stały ---
  'painting.current': {
    source: 'case',
    license: 'placeholder SVG generowany kodem (public/assets/paintings/*)',
  },

  // --- efekty ---
  'fx.dust': generated,
  'fx.spark': generated,
  'fx.fragment': generated,
} as const satisfies Record<string, AssetEntry>;

export type AssetKey = keyof typeof ASSET_MANIFEST;

/** Klucz tekstury w Phaserze = klucz manifestu (bez mapowania pośredniego). */
export function textureKey(key: AssetKey): string {
  return key;
}

/** Liczba klatek animacji biegu — generator i animacja czytają tę samą stałą. */
export const PLAYER_RUN_FRAMES = 6;

export function playerRunFrameKey(index: number): string {
  return `${textureKey('player.run')}.${String(index)}`;
}

/** Rozmiar, do jakiego rasteryzowany jest obraz case'a (SVG) w Phaserze — 3:2 jak siatka 3×2. */
export const PAINTING_RASTER = { width: 960, height: 640 } as const;

/** Pełna ścieżka pliku uwzględniająca base URL Vite (GitHub Pages). */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
