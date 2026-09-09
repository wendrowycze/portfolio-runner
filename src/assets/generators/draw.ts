import Phaser from 'phaser';
import { hexToNumber, PALETTE, type PaletteKey } from '../../config/palette';

/** Kolor z palety jako liczba Phasera. */
export function col(key: PaletteKey): number {
  return hexToNumber(PALETTE[key]);
}

/** Deterministyczny generator liczb pseudolosowych (mulberry32) — tekstury wyglądają tak samo przy każdym starcie. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Interpolacja dwóch kolorów (0..1) → liczba Phasera. */
export function lerpColor(from: number, to: number, t: number): number {
  const a = Phaser.Display.Color.IntegerToColor(from);
  const b = Phaser.Display.Color.IntegerToColor(to);
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, 100, Math.round(t * 100));
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
}

/**
 * Pionowy gradient rysowany paskami — Graphics.fillGradientStyle nie działa w trybie
 * generateTexture (renderer canvas), więc rysujemy sami.
 */
export function fillVerticalGradient(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  stops: { at: number; color: number }[],
  step = 2,
): void {
  for (let yy = 0; yy < height; yy += step) {
    const t = yy / height;
    let lower = stops[0];
    let upper = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i += 1) {
      const s0 = stops[i];
      const s1 = stops[i + 1];
      if (s0 !== undefined && s1 !== undefined && t >= s0.at && t <= s1.at) {
        lower = s0;
        upper = s1;
        break;
      }
    }
    if (lower === undefined || upper === undefined) continue;
    const span = upper.at - lower.at;
    const local = span <= 0 ? 0 : (t - lower.at) / span;
    g.fillStyle(lerpColor(lower.color, upper.color, local), 1);
    g.fillRect(x, y + yy, width, Math.min(step, height - yy));
  }
}

/**
 * Rysuje element trzykrotnie (x, x-W, x+W), żeby tekstura o szerokości W była bezszwowa
 * przy przewijaniu w tileSprite.
 */
export function drawWrapped(width: number, x: number, draw: (x: number) => void): void {
  draw(x);
  draw(x - width);
  draw(x + width);
}

export function makeGraphics(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

/** Zamyka Graphics w teksturę i sprząta. */
export function bake(
  g: Phaser.GameObjects.Graphics,
  key: string,
  width: number,
  height: number,
): void {
  g.generateTexture(key, width, height);
  g.destroy();
}
