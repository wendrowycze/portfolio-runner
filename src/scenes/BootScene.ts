import Phaser from 'phaser';
import {
  generateColonnade,
  generateGround,
  generateProps,
  generateSky,
  generateSkyline,
  generateStars,
} from '../assets/generators/background';
import { generateAtmosphere, generateFx } from '../assets/generators/fx';
import { FACADE_IMAGE_PATH, generateHotel, HOTEL_KEYS } from '../assets/generators/hotel';
import { generateObstacles } from '../assets/generators/obstacles';
import { generatePlayer } from '../assets/generators/player';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { PALETTE } from '../config/palette';
import {
  assetUrl,
  fileAssetPath,
  PAINTING_RASTER,
  paintingTextureKey,
  RUNNER_LAYERS,
  runnerLayerKey,
  runnerLayerTileKey,
  statueImageKey,
} from '../assets/manifest';
import type { Case } from '../script/types';
import type { RunnerSceneData } from './RunnerScene';

export const PROJECT_TITLE = 'PORTFOLIO RUNNER';

/**
 * BootScene: generuje WSZYSTKIE tekstury placeholder (Phaser.Graphics → generateTexture)
 * zanim jakakolwiek scena ich użyje (CLAUDE.md, „Pułapki”), po czym przechodzi dalej.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  /** Obrazy case'ów (SVG ze ścieżek w JSON) — jedyne pliki ładowane z dysku w PoC. */
  preload(): void {
    const runnerData = this.registry.get('runnerData') as RunnerSceneData | undefined;
    const gallery = (this.registry.get('cases') as Case[] | undefined) ?? [];
    const cases = [...gallery];
    const current = runnerData?.script?.kejs;
    if (current !== undefined && !cases.some((c) => c.id === current.id)) cases.push(current);
    for (const kejs of cases) {
      const key = paintingTextureKey(kejs.id);
      if (/\.svg$/i.test(kejs.painting.src)) {
        this.load.svg(key, assetUrl(kejs.painting.src), {
          width: PAINTING_RASTER.width,
          height: PAINTING_RASTER.height,
        });
      } else {
        // Obrazy z API (JPG/PNG) — rasterowane już w rozmiarze PAINTING_RASTER.
        this.load.image(key, assetUrl(kejs.painting.src));
      }
    }
    // Fasada z API na ekran startowy i posągi z Meshy (opcjonalne — brak pliku = wersja rysowana kodem).
    this.load.image(HOTEL_KEYS.facadeImage, assetUrl(FACADE_IMAGE_PATH));
    const optional = new Set<string>([HOTEL_KEYS.facadeImage]);
    for (const world of ['kultura', 'edukacja', 'biznes'] as const) {
      const key = statueImageKey(world);
      const path = fileAssetPath(key);
      if (path === undefined) continue;
      optional.add(key);
      this.load.image(key, assetUrl(path));
    }
    // Warstwy tła biegu z API (opcjonalne — brak = paralaksa rysowana kodem).
    for (const world of ['kultura', 'edukacja', 'biznes'] as const) {
      for (const layer of RUNNER_LAYERS) {
        const key = runnerLayerKey(world, layer);
        const path = fileAssetPath(key);
        if (path === undefined) continue;
        optional.add(key);
        this.load.image(key, assetUrl(path));
      }
    }
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      if (optional.has(file.key)) return;
      console.error(`[assets] nie udało się wczytać ${file.key}`);
    });
  }

  /**
   * Z każdej wczytanej warstwy tła buduje kafel „obraz + lustrzane odbicie” (tekstura canvas),
   * żeby tileSprite zawijał bez szwu. TileSprite nie przyjmuje RenderTexture, stąd canvas.
   * Warstwa jest „malarska”, więc filtr liniowy.
   */
  private buildRunnerLayerTiles(): void {
    for (const world of ['kultura', 'edukacja', 'biznes'] as const) {
      for (const layer of RUNNER_LAYERS) {
        const key = runnerLayerKey(world, layer);
        if (!this.textures.exists(key)) continue;
        const source = this.textures.get(key).getSourceImage();
        if (!(source instanceof HTMLImageElement) && !(source instanceof HTMLCanvasElement)) {
          continue;
        }
        const { width, height } = source;
        const tile = this.textures.createCanvas(
          runnerLayerTileKey(world, layer),
          width * 2,
          height,
        );
        if (tile === null) continue;
        const ctx = tile.getContext();
        ctx.drawImage(source, 0, 0);
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(source, -width * 2, 0);
        ctx.restore();
        tile.refresh();
        tile.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    }
  }

  create(): void {
    const label = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, PROJECT_TITLE, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '18px',
        color: PALETTE.gold,
      })
      .setOrigin(0.5);

    generateSky(this, GAME_WIDTH, GAME_HEIGHT);
    generateStars(this);
    generateSkyline(this);
    generateColonnade(this);
    generateProps(this);
    generateGround(this);
    generatePlayer(this);
    generateObstacles(this);
    generateFx(this);
    generateAtmosphere(this);
    generateHotel(this);
    this.buildRunnerLayerTiles();
    for (const world of ['kultura', 'edukacja', 'biznes'] as const) {
      const key = statueImageKey(world);
      // Rendery z Meshy to „rzeźby”, nie pixel-art — filtrowanie liniowe jak dla obrazów.
      if (this.textures.exists(key)) {
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    }

    label.destroy();
    const runnerData = this.registry.get('runnerData') as RunnerSceneData | undefined;
    const gallery = (this.registry.get('cases') as Case[] | undefined) ?? [];
    if (runnerData?.startInRunner === true && runnerData.script !== undefined) {
      // ?case=… startuje historię od razu.
      this.scene.start('RunnerScene', runnerData);
    } else if (gallery.length > 0 && runnerData?.skipStart === true) {
      // ?guest=1 (i testy): prosto do hotelu.
      this.scene.start('HotelScene', { floor: 0 });
    } else if (gallery.length > 0) {
      // Domyślnie: ciemny ekran startowy z pochodniami, potem hotel.
      this.scene.start('StartScene');
    } else {
      // Tryb wolnego biegu (?free=1).
      this.scene.start('RunnerScene', runnerData ?? {});
    }
  }
}
