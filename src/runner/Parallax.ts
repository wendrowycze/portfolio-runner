import type Phaser from 'phaser';
import { BG_SIZES } from '../assets/generators/background';
import { runnerLayerTileKey, textureKey, type RunnerLayer } from '../assets/manifest';
import type { World } from '../script/types';

interface Layer {
  sprite: Phaser.GameObjects.TileSprite;
  /** Ułamek prędkości świata (1 = ziemia, 0 = nieruchome). */
  factor: number;
}

/** Mnożniki prędkości warstw z API — te same, których używają dryfujące kafle obrazu. */
export const LAYER_FACTORS: Record<RunnerLayer, number> = { far: 0.06, mid: 0.35, near: 0.7 };

/** Skala wyświetlania warstw z API (kafle 1440 px szerokie → scena 960 px). */
const LAYER_SCALE: Record<RunnerLayer, number> = { far: 960 / 1440, mid: 0.55, near: 0.4 };

/**
 * Paralaksa biegu. Dwa tryby:
 *  - „warstwy” — trzy obrazy z API per świat (daleki plan, środkowy z przezroczystością, bliski),
 *    każdy jako tileSprite z kafla „obraz + odbicie” zbudowanego w BootScene (bezszwowe zawijanie);
 *  - „kod” — dotychczasowe 5 warstw rysowanych kodem (fallback, gdy plików nie ma).
 * Ziemia zawsze rysowana kodem (postać i przeszkody stoją na niej).
 * Przewijanie wyłącznie przez tilePositionX (docs/02_ARCHITEKTURA.md sekcja 15) — zero alokacji w update().
 */
export class Parallax {
  private readonly layers: Layer[] = [];
  /** Dodatkowy mnożnik nakładany na prędkość świata (np. 1.15 w narracji). */
  private speedMultiplier = 1;
  /** Czy scena używa warstw z API (test/debug: `data-bg`). */
  readonly usesWorldLayers: boolean;
  /** Przebyta droga świata (px) — kafle obrazu liczą z niej swoją pozycję. */
  distance = 0;

  constructor(
    scene: Phaser.Scene,
    width: number,
    height: number,
    groundY: number,
    world: World | undefined,
  ) {
    this.usesWorldLayers = world !== undefined && Parallax.hasWorldLayers(scene, world);
    if (world !== undefined && this.usesWorldLayers) {
      this.buildWorldLayers(scene, world, width, height, groundY);
    } else {
      this.buildCodeLayers(scene, width, height, groundY);
    }
    const ground = this.addLayer(
      scene,
      textureKey('bg.ground'),
      width,
      height - groundY + 4,
      groundY - 4,
      1,
      -50,
    );
    // Ziemia rysowana kodem jest „kulturalna” (ciepłe deski); inne światy dostają własny odcień.
    if (this.usesWorldLayers && world === 'edukacja') ground.setTint(0xc9d3d0);
    if (this.usesWorldLayers && world === 'biznes') ground.setTint(0x86b2ad);
  }

  static hasWorldLayers(scene: Phaser.Scene, world: World): boolean {
    return (['far', 'mid', 'near'] as const).every((layer) =>
      scene.textures.exists(runnerLayerTileKey(world, layer)),
    );
  }

  private buildWorldLayers(
    scene: Phaser.Scene,
    world: World,
    width: number,
    height: number,
    groundY: number,
  ): void {
    // Daleki plan: pełny kadr pod całą sceną (niebo w obrazie).
    const far = scene.textures.get(runnerLayerTileKey(world, 'far')).getSourceImage();
    const farScale = height / far.height;
    this.addLayer(
      scene,
      runnerLayerTileKey(world, 'far'),
      width,
      height,
      0,
      LAYER_FACTORS.far,
      -100,
    ).setTileScale(farScale);
    // Środkowy i bliski plan: przezroczyste kafle przycięte do zawartości, dosunięte do ziemi.
    for (const layer of ['mid', 'near'] as const) {
      const key = runnerLayerTileKey(world, layer);
      const source = scene.textures.get(key).getSourceImage();
      const scale = LAYER_SCALE[layer];
      const shown = source.height * scale;
      const lift = layer === 'mid' ? 6 : 2;
      this.addLayer(
        scene,
        key,
        width,
        shown,
        groundY - shown + lift,
        LAYER_FACTORS[layer],
        layer === 'mid' ? -70 : -60,
      ).setTileScale(scale);
    }
  }

  private buildCodeLayers(
    scene: Phaser.Scene,
    width: number,
    height: number,
    groundY: number,
  ): void {
    scene.add.image(0, 0, textureKey('bg.sky')).setOrigin(0, 0).setDepth(-100);
    this.addLayer(scene, textureKey('bg.stars'), width, BG_SIZES.stars.height, 0, 0.03, -90);
    this.addLayer(
      scene,
      textureKey('bg.skyline'),
      width,
      BG_SIZES.skyline.height,
      groundY - BG_SIZES.skyline.height - 96,
      0.12,
      -80,
    );
    this.addLayer(
      scene,
      textureKey('bg.colonnade'),
      width,
      BG_SIZES.colonnade.height,
      groundY - BG_SIZES.colonnade.height + 4,
      0.35,
      -70,
    );
    this.addLayer(
      scene,
      textureKey('bg.props'),
      width,
      BG_SIZES.props.height,
      groundY - BG_SIZES.props.height + 6,
      0.7,
      -60,
    );
  }

  private addLayer(
    scene: Phaser.Scene,
    key: string,
    width: number,
    height: number,
    y: number,
    factor: number,
    depth: number,
  ): Phaser.GameObjects.TileSprite {
    const sprite = scene.add.tileSprite(0, y, width, height, key).setOrigin(0, 0).setDepth(depth);
    this.layers.push({ sprite, factor });
    return sprite;
  }

  /** Mnożnik prędkości względem prędkości świata (time dilation jest już w prędkości świata). */
  setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = multiplier;
  }

  /** @param worldSpeedPxPerSec prędkość świata (baza × time scale) */
  update(deltaMs: number, worldSpeedPxPerSec: number): void {
    const dx = (worldSpeedPxPerSec * this.speedMultiplier * deltaMs) / 1000;
    this.distance += dx;
    for (const layer of this.layers) {
      // tilePosition jest w pikselach tekstury, więc dzielimy przez skalę kafla.
      layer.sprite.tilePositionX += (dx * layer.factor) / layer.sprite.tileScaleX;
    }
  }
}
