import Phaser from 'phaser';
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

/** Rozmiary tekstur atmosfery biegu (smugi światła, pyłki, smugi prędkości). */
export const ATMO_SIZES = {
  ray: { width: 160, height: 480 },
  mote: { width: 12, height: 12 },
  streak: { width: 96, height: 3 },
} as const;

/**
 * Atmosfera biegu: snop światła (miękki klin, blend ADD), pyłek kurzu (miękka kropka),
 * smuga prędkości (pozioma kreska z gradientem). Gradienty przez canvas — Graphics
 * nie ma płynnych przejść przy generateTexture.
 */
export function generateAtmosphere(scene: Phaser.Scene): void {
  const ray = scene.textures.createCanvas(
    textureKey('fx.ray'),
    ATMO_SIZES.ray.width,
    ATMO_SIZES.ray.height,
  );
  if (ray !== null) {
    const { width, height } = ATMO_SIZES.ray;
    const ctx = ray.getContext();
    const vertical = ctx.createLinearGradient(0, 0, 0, height);
    vertical.addColorStop(0, 'rgba(255,240,200,0.9)');
    vertical.addColorStop(0.6, 'rgba(255,240,200,0.35)');
    vertical.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = vertical;
    ctx.beginPath();
    ctx.moveTo(width * 0.42, 0);
    ctx.lineTo(width * 0.58, 0);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    // Miękkie brzegi klina.
    const horizontal = ctx.createLinearGradient(0, 0, width, 0);
    horizontal.addColorStop(0, 'rgba(0,0,0,1)');
    horizontal.addColorStop(0.25, 'rgba(0,0,0,0)');
    horizontal.addColorStop(0.75, 'rgba(0,0,0,0)');
    horizontal.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = horizontal;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
    ray.refresh();
    ray.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }

  const mote = scene.textures.createCanvas(
    textureKey('fx.mote'),
    ATMO_SIZES.mote.width,
    ATMO_SIZES.mote.height,
  );
  if (mote !== null) {
    const { width } = ATMO_SIZES.mote;
    const ctx = mote.getContext();
    const radial = ctx.createRadialGradient(
      width / 2,
      width / 2,
      0,
      width / 2,
      width / 2,
      width / 2,
    );
    radial.addColorStop(0, 'rgba(255,245,215,1)');
    radial.addColorStop(0.4, 'rgba(255,235,190,0.6)');
    radial.addColorStop(1, 'rgba(255,235,190,0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, width);
    mote.refresh();
    mote.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }

  const streak = scene.textures.createCanvas(
    textureKey('fx.streak'),
    ATMO_SIZES.streak.width,
    ATMO_SIZES.streak.height,
  );
  if (streak !== null) {
    const { width, height } = ATMO_SIZES.streak;
    const ctx = streak.getContext();
    const linear = ctx.createLinearGradient(0, 0, width, 0);
    linear.addColorStop(0, 'rgba(255,255,255,0)');
    linear.addColorStop(0.5, 'rgba(255,250,230,0.9)');
    linear.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = linear;
    ctx.fillRect(0, 0, width, height);
    streak.refresh();
    streak.setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
}
