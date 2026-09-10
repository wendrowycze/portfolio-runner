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

export type RunnerLayer = 'far' | 'mid' | 'near';
type RunnerWorld = 'kultura' | 'edukacja' | 'biznes';

function runnerLayer(world: RunnerWorld, layer: RunnerLayer): FileAsset {
  return {
    source: 'file',
    path: `assets/runner/${world}/${layer}.webp`,
    license: 'obraz wygenerowany przez API (Gamma) na koncie właściciela — ASSETS_ATTRIBUTION.md',
  };
}

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
  'obstacle.dokumenty': generated,
  'obstacle.kable': generated,

  // --- obrazy case'ów: ścieżki pochodzą z JSON (painting.src); klucz tekstury = painting.<id> ---
  'painting.*': {
    source: 'case',
    license:
      'obrazy z API (Gamma, public/assets/paintings/*.jpg, ASSETS_ATTRIBUTION.md); placeholdery SVG ze scripts/paintings.mjs',
  },

  // --- hotel i ekran startowy: tekstury generowane kodem (src/assets/generators/hotel.ts) ---
  'hotel.*': generated,
  'start.facade': generated,
  /** Posągi z Meshy (rendery przycięte z tła; workflow meshy-generate + scripts). Opcjonalne. */
  'hotel.statue.image.kultura': {
    source: 'file',
    path: 'assets/hotel/statue-kultura.png',
    license: 'model wygenerowany przez API Meshy na koncie właściciela — ASSETS_ATTRIBUTION.md',
  },
  'hotel.statue.image.edukacja': {
    source: 'file',
    path: 'assets/hotel/statue-edukacja.png',
    license: 'model wygenerowany przez API Meshy na koncie właściciela — ASSETS_ATTRIBUTION.md',
  },
  'hotel.statue.image.biznes': {
    source: 'file',
    path: 'assets/hotel/statue-biznes.png',
    license: 'model wygenerowany przez API Meshy na koncie właściciela — ASSETS_ATTRIBUTION.md',
  },
  /** Fasada z API: public/assets/hotel/facade.jpg (workflow paintings-import), opcjonalna. */
  'start.facade.image': {
    source: 'file',
    path: 'assets/hotel/facade.jpg',
    license: 'obraz wygenerowany przez API (Gamma) na koncie właściciela — ASSETS_ATTRIBUTION.md',
  },

  // --- tła biegu z API: trzy warstwy paralaksy per świat (workflow paintings-import + npm run layers) ---
  // Brak pliku = paralaksa rysowana kodem (bg.*). mid/near mają przezroczystość (wycięta magenta).
  'runner.layer.kultura.far': runnerLayer('kultura', 'far'),
  'runner.layer.kultura.mid': runnerLayer('kultura', 'mid'),
  'runner.layer.kultura.near': runnerLayer('kultura', 'near'),
  'runner.layer.edukacja.far': runnerLayer('edukacja', 'far'),
  'runner.layer.edukacja.mid': runnerLayer('edukacja', 'mid'),
  'runner.layer.edukacja.near': runnerLayer('edukacja', 'near'),
  'runner.layer.biznes.far': runnerLayer('biznes', 'far'),
  'runner.layer.biznes.mid': runnerLayer('biznes', 'mid'),
  'runner.layer.biznes.near': runnerLayer('biznes', 'near'),

  // --- efekty ---
  'fx.dust': generated,
  'fx.ray': generated,
  'fx.mote': generated,
  'fx.streak': generated,
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

/** Klucz tekstury obrazu danego case'a (wpis 'painting.*' w manifeście). */
export function paintingTextureKey(caseId: string): string {
  return `painting.${caseId}`;
}

/** Rozmiar, do jakiego rasteryzowany jest obraz case'a (SVG) w Phaserze — 3:2 jak siatka 3×2. */
export const PAINTING_RASTER = { width: 960, height: 640 } as const;

/** Klucz i ścieżka posągu z Meshy dla świata (wpis w manifeście). */
export function statueImageKey(world: 'kultura' | 'edukacja' | 'biznes'): AssetKey {
  return `hotel.statue.image.${world}`;
}

/** Klucz warstwy tła biegu danego świata (wpis w manifeście). */
export function runnerLayerKey(world: RunnerWorld, layer: RunnerLayer): AssetKey {
  return `runner.layer.${world}.${layer}`;
}

/** Klucz kafla (obraz + jego lustrzane odbicie) budowanego w BootScene z warstwy — do tileSprite. */
export function runnerLayerTileKey(world: RunnerWorld, layer: RunnerLayer): string {
  return `${runnerLayerKey(world, layer)}.tile`;
}

export const RUNNER_LAYERS: readonly RunnerLayer[] = ['far', 'mid', 'near'];

export function fileAssetPath(key: AssetKey): string | undefined {
  const entry: AssetEntry = ASSET_MANIFEST[key];
  return entry.source === 'file' ? entry.path : undefined;
}

/** Pełna ścieżka pliku uwzględniająca base URL Vite (GitHub Pages). */
export function assetUrl(path: string): string {
  // Adresy absolutne i data-URI (np. obraz osadzony w pojedynczym pliku podglądu) bez zmian.
  if (/^(?:data:|https?:\/\/)/.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
