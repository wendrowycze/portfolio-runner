import Phaser from 'phaser';
import {
  generateColonnade,
  generateGround,
  generateProps,
  generateSky,
  generateSkyline,
  generateStars,
} from '../assets/generators/background';
import { generateFx } from '../assets/generators/fx';
import { generateHotel } from '../assets/generators/hotel';
import { generateObstacles } from '../assets/generators/obstacles';
import { generatePlayer } from '../assets/generators/player';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { PALETTE } from '../config/palette';
import { assetUrl, PAINTING_RASTER, paintingTextureKey } from '../assets/manifest';
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
      this.load.svg(paintingTextureKey(kejs.id), assetUrl(kejs.painting.src), {
        width: PAINTING_RASTER.width,
        height: PAINTING_RASTER.height,
      });
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
    generateHotel(this);

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
