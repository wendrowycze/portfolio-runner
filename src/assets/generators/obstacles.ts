import type Phaser from 'phaser';
import { OBSTACLES } from '../../content/obstacles';
import { textureKey } from '../manifest';
import { bake, col, makeGraphics } from './draw';

type Painter = (g: Phaser.GameObjects.Graphics, w: number, h: number) => void;

const barierka: Painter = (g, w, h) => {
  const wood = col('ground');
  const dark = col('panelBg');
  g.fillStyle(dark, 1);
  g.fillRect(6, h - 6, 16, 6);
  g.fillRect(w - 22, h - 6, 16, 6);
  g.fillStyle(wood, 1);
  g.fillRect(10, 8, 8, h - 8);
  g.fillRect(w - 18, 8, 8, h - 8);
  // Górna listwa w pasy — jak barierka policyjna.
  for (let x = 4; x < w - 4; x += 12) {
    g.fillStyle((x / 12) % 2 === 0 ? col('text') : col('warn'), 1);
    g.fillRect(x, 10, Math.min(12, w - 4 - x), 8);
  }
  g.fillStyle(wood, 1);
  g.fillRect(4, 30, w - 8, 6);
  g.fillStyle(col('gold'), 1);
  g.fillRect(4, 9, w - 8, 1);
};

const skrzynia: Painter = (g, w, h) => {
  const wood = col('ground');
  const dark = col('panelBg');
  g.fillStyle(wood, 1);
  g.fillRect(2, 4, w - 4, h - 4);
  g.lineStyle(3, dark, 1);
  g.strokeRect(3.5, 5.5, w - 7, h - 7);
  g.lineBetween(4, 6, w - 4, h - 2);
  g.lineBetween(w - 4, 6, 4, h - 2);
  g.fillStyle(col('gold'), 1);
  for (const [x, y] of [
    [8, 10],
    [w - 10, 10],
    [8, h - 8],
    [w - 10, h - 8],
  ] as const) {
    g.fillRect(x, y, 2, 2);
  }
};

const kolumna: Painter = (g, w, h) => {
  const marble = col('text');
  const shade = col('textMuted');
  g.fillStyle(shade, 1);
  g.fillRect(2, h - 10, w - 4, 10);
  g.fillStyle(marble, 1);
  g.fillRect(4, h - 14, w - 8, 4);
  g.fillRect(10, 18, w - 20, h - 32);
  // Złamany szczyt.
  g.fillPoints(
    [
      { x: 10, y: 18 },
      { x: 16, y: 8 },
      { x: 22, y: 14 },
      { x: 28, y: 4 },
      { x: w - 10, y: 12 },
      { x: w - 10, y: 18 },
    ],
    true,
  );
  g.lineStyle(1, shade, 1);
  g.lineBetween(16, 22, 16, h - 16);
  g.lineBetween(w / 2, 22, w / 2, h - 16);
  g.lineBetween(w - 16, 22, w - 16, h - 16);
  g.lineStyle(2, col('panelBg'), 0.7);
  g.lineBetween(14, 30, 22, 40);
  g.lineBetween(22, 40, 18, 52);
};

const kordonKamer: Painter = (g, w, h) => {
  const dark = col('bgDeep');
  const body = col('cool');
  const lens = col('parallaxFar');
  const camera = (x: number, top: number): void => {
    // Statyw.
    g.lineStyle(3, dark, 1);
    g.lineBetween(x, top + 16, x - 12, h);
    g.lineBetween(x, top + 16, x + 12, h);
    g.lineBetween(x, top + 16, x, h);
    // Korpus.
    g.fillStyle(body, 1);
    g.fillRect(x - 12, top, 24, 16);
    g.fillRect(x + 12, top + 3, 8, 10);
    g.fillStyle(lens, 1);
    g.fillCircle(x + 18, top + 8, 4);
    g.fillStyle(col('gold'), 1);
    g.fillCircle(x + 17, top + 7, 1.5);
    g.fillStyle(col('warn'), 1);
    g.fillCircle(x - 8, top + 4, 2);
    // Mikrofon na górze.
    g.fillStyle(dark, 1);
    g.fillRect(x - 4, top - 6, 8, 6);
  };
  camera(20, 14);
  camera(w / 2, 6);
  camera(w - 20, 12);
};

const boty: Painter = (g, w, h) => {
  const bubble = col('textMuted');
  const dark = col('bgDeep');
  const draw = (x: number, y: number, s: number): void => {
    g.fillStyle(bubble, 1);
    g.fillRoundedRect(x - s, y - s * 0.7, s * 2, s * 1.4, 6);
    g.fillTriangle(x - s * 0.3, y + s * 0.65, x + s * 0.3, y + s * 0.65, x - s * 0.1, y + s * 1.1);
    // Antenka robota.
    g.lineStyle(2, bubble, 1);
    g.lineBetween(x, y - s * 0.7, x, y - s * 1.1);
    g.fillStyle(col('warn'), 1);
    g.fillCircle(x, y - s * 1.15, 2.5);
    // Oczy „X”.
    g.lineStyle(2, dark, 1);
    const e = s * 0.22;
    for (const ex of [x - s * 0.4, x + s * 0.4]) {
      g.lineBetween(ex - e, y - e, ex + e, y + e);
      g.lineBetween(ex + e, y - e, ex - e, y + e);
    }
  };
  draw(w * 0.22, h * 0.6, 14);
  draw(w * 0.5, h * 0.42, 17);
  draw(w * 0.8, h * 0.62, 13);
};

const telefony: Painter = (g, w, h) => {
  const dark = col('bgDeep');
  const light = col('textMuted');
  const handset = (x: number, y: number, angle: number): void => {
    const len = 30;
    const dx = Math.cos(angle) * len;
    const dy = Math.sin(angle) * len;
    g.lineStyle(5, dark, 1);
    g.lineBetween(x, y, x + dx, y + dy);
    g.fillStyle(dark, 1);
    g.fillCircle(x, y, 6);
    g.fillCircle(x + dx, y + dy, 6);
    g.fillStyle(light, 1);
    g.fillCircle(x, y, 2);
    g.fillCircle(x + dx, y + dy, 2);
  };
  // Podstawa telefonu.
  g.fillStyle(dark, 1);
  g.fillRoundedRect(10, h - 26, w - 20, 22, 4);
  g.fillStyle(light, 1);
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      g.fillRect(20 + i * 8, h - 20 + j * 5, 4, 3);
    }
  }
  handset(18, 22, -0.25);
  handset(40, 12, 0.35);
  // Dzwonienie — złote łuki.
  g.lineStyle(2, col('gold'), 1);
  for (let r = 6; r <= 14; r += 4) {
    g.beginPath();
    g.arc(w - 10, 10, r, Math.PI * 1.2, Math.PI * 1.8, false);
    g.strokePath();
  }
};

const brama: Painter = (g, w, h) => {
  const iron = col('panelBg');
  const dark = col('bgDeep');
  g.fillStyle(dark, 1);
  g.fillRect(0, h - 6, w, 6);
  g.fillStyle(iron, 1);
  g.fillRect(4, 4, 8, h - 4);
  g.fillRect(w - 12, 4, 8, h - 4);
  g.fillRect(4, 4, w - 8, 6);
  g.fillRect(4, h / 2, w - 8, 5);
  for (let x = 20; x < w - 12; x += 12) {
    g.fillRect(x, 8, 4, h - 8);
    g.fillTriangle(x - 2, 8, x + 6, 8, x + 2, 0);
  }
  // Kłódka i tabliczka.
  g.fillStyle(col('gold'), 1);
  g.fillRoundedRect(w / 2 - 8, h / 2 - 4, 16, 14, 3);
  g.lineStyle(3, col('gold'), 1);
  g.beginPath();
  g.arc(w / 2, h / 2 - 4, 6, Math.PI, 0, false);
  g.strokePath();
  g.fillStyle(col('warn'), 1);
  g.fillRect(w / 2 - 20, 18, 40, 18);
  g.lineStyle(3, col('text'), 1);
  g.lineBetween(w / 2 - 7, 22, w / 2 + 7, 32);
  g.lineBetween(w / 2 + 7, 22, w / 2 - 7, 32);
};

const PAINTERS: Record<keyof typeof OBSTACLES, Painter> = {
  barierka,
  skrzynia,
  kolumna,
  'kordon-kamer': kordonKamer,
  boty,
  telefony,
  brama,
};

export function generateObstacles(scene: Phaser.Scene): void {
  for (const key of Object.keys(OBSTACLES) as (keyof typeof OBSTACLES)[]) {
    const def = OBSTACLES[key];
    const g = makeGraphics(scene);
    PAINTERS[key](g, def.width, def.height);
    bake(g, textureKey(def.texture), def.width, def.height);
  }
}
