import type Phaser from 'phaser';
import { PLAYER_RUN_FRAMES, playerRunFrameKey, textureKey } from '../manifest';
import { bake, col, makeGraphics } from './draw';

/** Skala rysunku: baza projektowa 48×64, rysowana ×1.5 dla czytelności na scenie 960×540. */
const K = 1.5;
export const PLAYER_SIZE = { width: 48 * K, height: 64 * K } as const;

/** Poza postaci: kąty w stopniach (0 = pionowo w dół, dodatnie = do przodu/prawo). */
interface Pose {
  thighL: number;
  kneeL: number;
  thighR: number;
  kneeR: number;
  armL: number;
  armR: number;
  /** Przesunięcie tułowia w pionie (ujemne = wyżej, faza lotu). */
  dy: number;
  /** Pochylenie tułowia do przodu (stopnie). */
  lean: number;
}

const RUN_POSES: Pose[] = [
  { thighL: 38, kneeL: 15, thighR: -28, kneeR: 70, armL: -30, armR: 35, dy: 0, lean: 8 },
  { thighL: 12, kneeL: 8, thighR: -42, kneeR: 100, armL: -12, armR: 40, dy: -2, lean: 8 },
  { thighL: -18, kneeL: 55, thighR: -6, kneeR: 30, armL: 10, armR: 10, dy: -4, lean: 8 },
  { thighL: -28, kneeL: 70, thighR: 38, kneeR: 15, armL: 35, armR: -30, dy: 0, lean: 8 },
  { thighL: -42, kneeL: 100, thighR: 12, kneeR: 8, armL: 40, armR: -12, dy: -2, lean: 8 },
  { thighL: -6, kneeL: 30, thighR: -18, kneeR: 55, armL: 10, armR: 10, dy: -4, lean: 8 },
];

const JUMP_POSE: Pose = {
  thighL: 55,
  kneeL: 75,
  thighR: -15,
  kneeR: 40,
  armL: -60,
  armR: -70,
  dy: -2,
  lean: 4,
};

const STUMBLE_POSE: Pose = {
  thighL: 30,
  kneeL: 10,
  thighR: -20,
  kneeR: 25,
  armL: 70,
  armR: 55,
  dy: 3,
  lean: 26,
};

const IDLE_POSE: Pose = {
  thighL: 4,
  kneeL: 0,
  thighR: -4,
  kneeR: 0,
  armL: 6,
  armR: -6,
  dy: 0,
  lean: 0,
};

const rad = (deg: number): number => (deg * Math.PI) / 180;

function drawFigure(g: Phaser.GameObjects.Graphics, pose: Pose): void {
  const body = col('text');
  const gold = col('gold');
  const shade = col('textMuted');
  const cx = PLAYER_SIZE.width / 2;
  const hipY = (40 + pose.dy) * K;
  const shoulderY = (22 + pose.dy) * K;
  const leanDx = Math.sin(rad(pose.lean)) * (hipY - shoulderY);
  const shoulderX = cx + leanDx;

  const limb = (
    x: number,
    y: number,
    upperLen: number,
    lowerLen: number,
    upperAngle: number,
    bend: number,
    width: number,
    color: number,
  ): void => {
    const kx = x + Math.sin(rad(upperAngle)) * upperLen * K;
    const ky = y + Math.cos(rad(upperAngle)) * upperLen * K;
    const lowerAngle = upperAngle - bend;
    const fx = kx + Math.sin(rad(lowerAngle)) * lowerLen * K;
    const fy = ky + Math.cos(rad(lowerAngle)) * lowerLen * K;
    const lw = width * K;
    g.lineStyle(lw, color, 1);
    g.lineBetween(x, y, kx, ky);
    g.lineBetween(kx, ky, fx, fy);
    g.fillStyle(color, 1);
    g.fillCircle(kx, ky, lw / 2);
    g.fillCircle(fx, fy, lw / 2 + 0.5);
  };

  // Tylna noga i tylna ręka — ciemniejsze (głębia).
  limb(cx - K, hipY, 13, 13, pose.thighL, pose.kneeL, 5, shade);
  limb(shoulderX - 2 * K, shoulderY, 9, 8, pose.armL, -pose.armL * 0.6 - 40, 4, shade);

  // Tunika (trapez) — sylwetka czarnofigurowa w negatywie.
  const sw = 7 * K;
  const hw = 9 * K;
  g.fillStyle(body, 1);
  g.fillPoints(
    [
      { x: shoulderX - sw, y: shoulderY - 2 * K },
      { x: shoulderX + sw, y: shoulderY - 2 * K },
      { x: cx + hw, y: hipY + 6 * K },
      { x: cx - hw, y: hipY + 6 * K },
    ],
    true,
  );
  // Złota przepaska w pasie — akcent Kultury.
  const beltTop = shoulderY + 8 * K;
  const beltBottom = shoulderY + 11 * K;
  const span = hipY + 6 * K - (shoulderY - 2 * K);
  const edgeAt = (y: number, side: -1 | 1): number => {
    const t = (y - (shoulderY - 2 * K)) / span;
    return shoulderX + side * sw + (cx + side * hw - (shoulderX + side * sw)) * t;
  };
  g.fillStyle(gold, 1);
  g.fillPoints(
    [
      { x: edgeAt(beltTop, -1), y: beltTop },
      { x: edgeAt(beltTop, 1), y: beltTop },
      { x: edgeAt(beltBottom, 1), y: beltBottom },
      { x: edgeAt(beltBottom, -1), y: beltBottom },
    ],
    true,
  );

  // Przednia noga i przednia ręka.
  limb(cx + K, hipY, 13, 13, pose.thighR, pose.kneeR, 5, body);
  limb(shoulderX + 2 * K, shoulderY, 9, 8, pose.armR, -pose.armR * 0.6 - 40, 4, body);

  // Szyja i głowa z wieńcem laurowym.
  const headX = shoulderX + Math.sin(rad(pose.lean)) * 6 * K;
  const headY = shoulderY - 11 * K;
  g.lineStyle(4 * K, body, 1);
  g.lineBetween(shoulderX, shoulderY, headX, headY + 5 * K);
  g.fillStyle(body, 1);
  g.fillCircle(headX, headY, 6.5 * K);
  // Nos/profil — sylwetka patrzy w prawo.
  g.fillTriangle(headX + 5 * K, headY - K, headX + 9 * K, headY + K, headX + 5 * K, headY + 3 * K);
  g.lineStyle(2 * K, gold, 1);
  g.beginPath();
  g.arc(headX, headY, 7 * K, rad(200), rad(330), false);
  g.strokePath();
}

function bakePose(scene: Phaser.Scene, key: string, pose: Pose): void {
  const g = makeGraphics(scene);
  drawFigure(g, pose);
  bake(g, key, PLAYER_SIZE.width, PLAYER_SIZE.height);
}

export function generatePlayer(scene: Phaser.Scene): void {
  for (let i = 0; i < PLAYER_RUN_FRAMES; i += 1) {
    const pose = RUN_POSES[i % RUN_POSES.length];
    if (pose !== undefined) bakePose(scene, playerRunFrameKey(i), pose);
  }
  bakePose(scene, textureKey('player.jump'), JUMP_POSE);
  bakePose(scene, textureKey('player.stumble'), STUMBLE_POSE);
  bakePose(scene, textureKey('player.idle'), IDLE_POSE);
}
