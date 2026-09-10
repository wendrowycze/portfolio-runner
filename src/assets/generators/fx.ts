import type Phaser from 'phaser';
import { textureKey } from '../manifest';
import { bake, col, makeGraphics } from './draw';

export const FRAGMENT_ICON_SIZE = 26;

export function generateFx(scene: Phaser.Scene): void {
  // Kurz spod stóp.
  let g = makeGraphics(scene);
  g.fillStyle(col('textMuted'), 0.6);
  g.fillCircle(4, 4, 4);
  g.fillStyle(col('text'), 0.8);
  g.fillCircle(4, 4, 2);
  bake(g, textureKey('fx.dust'), 8, 8);

  // Iskra złota.
  g = makeGraphics(scene);
  g.fillStyle(col('gold'), 1);
  g.fillRect(0, 2, 6, 2);
  g.fillRect(2, 0, 2, 6);
  g.fillStyle(col('text'), 1);
  g.fillRect(2, 2, 2, 2);
  bake(g, textureKey('fx.spark'), 6, 6);

  // Miniatura fragmentu obrazu (leci do licznika).
  g = makeGraphics(scene);
  const s = FRAGMENT_ICON_SIZE;
  g.fillStyle(col('gold'), 1);
  g.fillRect(0, 0, s, s);
  g.fillStyle(col('panelBg'), 1);
  g.fillRect(3, 3, s - 6, s - 6);
  g.fillStyle(col('ground'), 1);
  g.fillTriangle(5, s - 5, s / 2, 7, s - 5, s - 5);
  g.fillStyle(col('gold'), 1);
  g.fillCircle(s - 8, 8, 2.5);
  bake(g, textureKey('fx.fragment'), s, s);
}
