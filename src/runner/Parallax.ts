import type Phaser from 'phaser';
import { BG_SIZES } from '../assets/generators/background';
import { textureKey } from '../assets/manifest';

interface Layer {
  sprite: Phaser.GameObjects.TileSprite;
  /** Ułamek prędkości świata (1 = ziemia, 0 = nieruchome). */
  factor: number;
}

/**
 * Paralaksa: 5 warstw tileSprite o różnych prędkościach. Przewijanie wyłącznie przez
 * tilePositionX (docs/02_ARCHITEKTURA.md sekcja 15) — zero alokacji w update().
 */
export class Parallax {
  private readonly layers: Layer[] = [];
  /** Dodatkowy mnożnik nakładany na prędkość świata (np. 1.15 w narracji). */
  private speedMultiplier = 1;

  constructor(scene: Phaser.Scene, width: number, height: number, groundY: number) {
    scene.add.image(0, 0, textureKey('bg.sky')).setOrigin(0, 0).setDepth(-100);

    this.addLayer(scene, 'bg.stars', width, BG_SIZES.stars.height, 0, 0.03, -90);
    this.addLayer(
      scene,
      'bg.skyline',
      width,
      BG_SIZES.skyline.height,
      groundY - BG_SIZES.skyline.height - 96,
      0.12,
      -80,
    );
    this.addLayer(
      scene,
      'bg.colonnade',
      width,
      BG_SIZES.colonnade.height,
      groundY - BG_SIZES.colonnade.height + 4,
      0.35,
      -70,
    );
    this.addLayer(
      scene,
      'bg.props',
      width,
      BG_SIZES.props.height,
      groundY - BG_SIZES.props.height + 6,
      0.7,
      -60,
    );
    this.addLayer(scene, 'bg.ground', width, height - groundY + 4, groundY - 4, 1, -50);
  }

  private addLayer(
    scene: Phaser.Scene,
    key: Parameters<typeof textureKey>[0],
    width: number,
    height: number,
    y: number,
    factor: number,
    depth: number,
  ): void {
    const sprite = scene.add
      .tileSprite(0, y, width, height, textureKey(key))
      .setOrigin(0, 0)
      .setDepth(depth);
    this.layers.push({ sprite, factor });
  }

  /** Mnożnik prędkości względem prędkości świata (time dilation jest już w prędkości świata). */
  setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = multiplier;
  }

  /** @param worldSpeedPxPerSec prędkość świata (baza × time scale) */
  update(deltaMs: number, worldSpeedPxPerSec: number): void {
    const dx = (worldSpeedPxPerSec * this.speedMultiplier * deltaMs) / 1000;
    for (const layer of this.layers) {
      layer.sprite.tilePositionX += dx * layer.factor;
    }
  }
}
