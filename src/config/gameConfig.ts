import Phaser from 'phaser';
import { PALETTE } from './palette';
import { TUNING } from './tuning';
import { BootScene } from '../scenes/BootScene';
import { HotelScene } from '../scenes/HotelScene';
import { StartScene } from '../scenes/StartScene';
import { RunnerScene } from '../scenes/RunnerScene';

/** Bazowa rozdzielczość sceny biegu; Scale Manager (FIT) dopasowuje ją do kontenera. */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: PALETTE.bgDeep,
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: TUNING.GRAVITY_Y }, debug: false },
    },
    fps: { target: 60 },
    scene: [BootScene, StartScene, HotelScene, RunnerScene],
  };
}
