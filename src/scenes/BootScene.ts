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
import { generateObstacles } from '../assets/generators/obstacles';
import { generatePlayer } from '../assets/generators/player';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { PALETTE } from '../config/palette';
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

    label.destroy();
    const runnerData = this.registry.get('runnerData') as RunnerSceneData | undefined;
    this.scene.start('RunnerScene', runnerData ?? {});
  }
}
