import Phaser from 'phaser';
import type { World } from '../../script/types';
import { HOTEL } from '../../config/hotel';
import { bake, col, fillVerticalGradient, lerpColor, makeGraphics, seededRandom } from './draw';

/**
 * Tekstury hotelu: korytarz każdego piętra w DWÓCH wersjach — pixelartowej (świat gry) i
 * „malarskiej” (piętro naprawia się razem z obrazami — decyzja Arka z 2026-09-10). Obie mają
 * ten sam układ, więc da się je przenikać; malarska jest rysowana w 2× i filtrowana liniowo,
 * więc na pixelartowym tle wygląda jak płótno, nie jak piksele.
 */
export const WALL_TILE = { width: 440, height: HOTEL.floorHeight } as const;
export const PAINT_SCALE = 2;

export const HOTEL_KEYS = {
  wall: (world: World, variant: 'pixel' | 'paint'): string => `hotel.wall.${world}.${variant}`,
  sconce: (variant: 'pixel' | 'paint'): string => `hotel.sconce.${variant}`,
  door: (variant: 'pixel' | 'paint'): string => `hotel.door.${variant}`,
  elevatorFrame: 'hotel.elevator.frame',
  elevatorDoor: 'hotel.elevator.door',
  statue: (world: World): string => `hotel.statue.${world}`,
  plant: 'hotel.plant',
  /** Wyposażenie wnętrz per świat (żyrandol, okno, regał, panel art déco, kotara, pilaster). */
  furniture: (kind: Furniture, variant: 'pixel' | 'paint'): string =>
    `hotel.furniture.${kind}.${variant}`,
  flame: 'fx.flame',
  glow: 'fx.glow',
  facade: 'start.facade',
  /** Fasada z API (plik) — używana zamiast rysowanej, jeśli się wczyta. */
  facadeImage: 'start.facade.image',
  light: 'fx.light',
  vignette: 'fx.vignette',
  torch: 'start.torch',
  gateDoor: 'start.gate',
} as const;

export type Furniture = 'chandelier' | 'window' | 'bookshelf' | 'deco' | 'drape' | 'pilaster';

/** Rozmiary mebli (wersja pixel; malarska = ×PAINT_SCALE). */
export const FURNITURE_SIZE: Record<Furniture, { width: number; height: number }> = {
  chandelier: { width: 96, height: 96 },
  window: { width: 104, height: 210 },
  bookshelf: { width: 132, height: 160 },
  deco: { width: 140, height: 76 },
  drape: { width: 44, height: 210 },
  pilaster: { width: 40, height: 430 },
};

interface WorldTheme {
  wallTop: number;
  wallBottom: number;
  ornament: number;
  wainscot: number;
  carpet: number;
  carpetEdge: number;
  ceiling: number;
}

export function worldTheme(world: World): WorldTheme {
  switch (world) {
    case 'kultura':
      return {
        wallTop: 0x4a1d21,
        wallBottom: col('warn'),
        ornament: col('gold'),
        wainscot: col('ground'),
        carpet: 0x5a1c1f,
        carpetEdge: col('gold'),
        ceiling: col('bgDeep'),
      };
    case 'edukacja':
      // Tablica FigJam: „Edu — minimalistyczny marmur”: jasny kamień, chłodne cienie, mało ozdób.
      return {
        wallTop: 0x8fa6a3,
        wallBottom: 0x6f8c8b,
        ornament: col('text'),
        wainscot: 0x4f6664,
        carpet: col('cool'),
        carpetEdge: col('textMuted'),
        ceiling: 0x3f5654,
      };
    case 'biznes':
      return {
        wallTop: col('parallaxFar'),
        wallBottom: col('parallaxMid'),
        ornament: col('gold'),
        wainscot: 0x2b2a2e,
        carpet: 0x0e2f36,
        carpetEdge: col('gold'),
        ceiling: 0x07201f,
      };
  }
}

const FLOOR_Y = HOTEL.floorLineY;

function drawWallPixel(g: Phaser.GameObjects.Graphics, world: World): void {
  const t = worldTheme(world);
  const { width: w, height: h } = WALL_TILE;
  // Sufit z gzymsem.
  g.fillStyle(t.ceiling, 1);
  g.fillRect(0, 0, w, 40);
  g.fillStyle(t.ornament, 0.5);
  g.fillRect(0, 36, w, 3);
  g.fillStyle(t.ornament, 0.25);
  g.fillRect(0, 42, w, 1);
  // Tapeta — schodkowy gradient (pixel), wzór per świat.
  const bands = 8;
  for (let i = 0; i < bands; i += 1) {
    g.fillStyle(lerpColor(t.wallTop, t.wallBottom, i / (bands - 1)), 1);
    g.fillRect(0, 44 + (i * (FLOOR_Y - 120 - 44)) / bands, w, (FLOOR_Y - 120 - 44) / bands + 1);
  }
  const rnd = seededRandom(world.length * 97);
  if (world === 'kultura') {
    // Maureskowe romby.
    g.lineStyle(1, t.ornament, 0.18);
    for (let x = 0; x < w; x += 44) {
      for (let y = 60; y < FLOOR_Y - 130; y += 44) {
        g.strokeRect(x + 11, y + 11, 22, 22);
        g.lineBetween(x + 22, y, x + 44, y + 22);
        g.lineBetween(x + 44, y + 22, x + 22, y + 44);
        g.lineBetween(x + 22, y + 44, x, y + 22);
        g.lineBetween(x, y + 22, x + 22, y);
      }
    }
  } else if (world === 'edukacja') {
    // Liście/kartki — drobne łuki.
    g.lineStyle(1, t.ornament, 0.09);
    for (let x = 0; x < w; x += 40) {
      for (let y = 64; y < FLOOR_Y - 130; y += 40) {
        g.beginPath();
        g.arc(x + 20, y + 20, 9, Math.PI, Math.PI * 1.5, false);
        g.strokePath();
        g.beginPath();
        g.arc(x + 20, y + 20, 9, 0, Math.PI * 0.5, false);
        g.strokePath();
        if (rnd() > 0.7) g.fillRect(x + 19, y + 12, 2, 2);
      }
    }
  } else {
    // Blueprint: siatka i schematyczne linie.
    g.lineStyle(1, t.ornament, 0.1);
    for (let x = 0; x < w; x += 24) g.lineBetween(x, 44, x, FLOOR_Y - 120);
    for (let y = 44; y < FLOOR_Y - 120; y += 24) g.lineBetween(0, y, w, y);
    g.lineStyle(1, t.ornament, 0.28);
    for (let i = 0; i < 5; i += 1) {
      const x = Math.floor(rnd() * w);
      const y = 80 + Math.floor(rnd() * 180);
      g.strokeRect(x, y, 48, 24);
      g.lineBetween(x + 48, y + 12, x + 72, y + 12);
      g.strokeCircle(x + 80, y + 12, 6);
    }
  }
  // Boazeria z listwą.
  g.fillStyle(t.wainscot, 1);
  g.fillRect(0, FLOOR_Y - 120, w, 120);
  g.fillStyle(t.ornament, 0.6);
  g.fillRect(0, FLOOR_Y - 122, w, 3);
  g.fillStyle(col('bgDeep'), 0.35);
  for (let x = 0; x < w; x += 88) {
    g.fillRect(x + 8, FLOOR_Y - 104, 72, 76);
    g.fillStyle(t.wainscot, 1);
    g.fillRect(x + 12, FLOOR_Y - 100, 64, 68);
    g.fillStyle(col('bgDeep'), 0.35);
  }
  g.fillStyle(col('bgDeep'), 0.5);
  g.fillRect(0, FLOOR_Y - 8, w, 8);
  // Podłoga: deski i dywan.
  g.fillStyle(0x3a2419, 1);
  g.fillRect(0, FLOOR_Y, w, h - FLOOR_Y);
  g.fillStyle(0x2c1b13, 1);
  for (let x = 0; x < w; x += 32) g.fillRect(x, FLOOR_Y, 1, h - FLOOR_Y);
  g.fillStyle(t.carpet, 1);
  g.fillRect(0, FLOOR_Y + 14, w, 40);
  g.fillStyle(t.carpetEdge, 0.8);
  g.fillRect(0, FLOOR_Y + 14, w, 2);
  g.fillRect(0, FLOOR_Y + 52, w, 2);
  g.fillStyle(t.carpetEdge, 0.25);
  for (let x = 8; x < w; x += 28) g.fillRect(x, FLOOR_Y + 30, 12, 8);
}

/** Wersja malarska: miękkie gradienty, poświaty, pociągnięcia pędzla — ten sam układ, 2×. */
function drawWallPaint(g: Phaser.GameObjects.Graphics, world: World): void {
  const t = worldTheme(world);
  const S = PAINT_SCALE;
  const w = WALL_TILE.width * S;
  const h = WALL_TILE.height * S;
  const fy = FLOOR_Y * S;
  fillVerticalGradient(g, 0, 0, w, 44 * S, [
    { at: 0, color: t.ceiling },
    { at: 1, color: lerpColor(t.ceiling, t.ornament, 0.25) },
  ]);
  fillVerticalGradient(g, 0, 44 * S, w, fy - 120 * S - 44 * S, [
    { at: 0, color: lerpColor(t.wallTop, t.ornament, 0.1) },
    { at: 0.5, color: lerpColor(t.wallTop, t.wallBottom, 0.5) },
    { at: 1, color: t.wallBottom },
  ]);
  // Pociągnięcia pędzla — półprzezroczyste, ciepłe.
  const rnd = seededRandom(world.length * 131);
  for (let i = 0; i < 90; i += 1) {
    const x = rnd() * w;
    const y = 44 * S + rnd() * (fy - 170 * S);
    const len = 40 + rnd() * 160;
    const thick = 6 + rnd() * 18;
    g.fillStyle(lerpColor(t.wallBottom, t.ornament, rnd() * 0.5), 0.05 + rnd() * 0.08);
    g.fillRoundedRect(x, y, len, thick, thick / 2);
  }
  // Poświaty kinkietów (co 220 px, jak w scenie).
  for (const cx of [110 * S, 330 * S]) {
    for (let r = 220; r > 20; r -= 18) {
      g.fillStyle(t.ornament, 0.018);
      g.fillCircle(cx, 190 * S, r);
    }
  }
  // Ornament — złote łuki i linie zamiast rombów.
  g.lineStyle(2, t.ornament, 0.22);
  for (let x = 0; x < w; x += 110 * S) {
    g.beginPath();
    g.arc(x + 55 * S, 150 * S, 40 * S, Math.PI, 0, false);
    g.strokePath();
    g.lineBetween(x + 15 * S, 150 * S, x + 15 * S, fy - 130 * S);
    g.lineBetween(x + 95 * S, 150 * S, x + 95 * S, fy - 130 * S);
  }
  g.lineStyle(3, t.ornament, 0.5);
  g.lineBetween(0, 38 * S, w, 38 * S);
  // Boazeria: ciepłe drewno z gradientem i połyskiem.
  fillVerticalGradient(g, 0, fy - 120 * S, w, 120 * S, [
    { at: 0, color: lerpColor(t.wainscot, t.ornament, 0.35) },
    { at: 0.35, color: t.wainscot },
    { at: 1, color: lerpColor(t.wainscot, col('bgDeep'), 0.5) },
  ]);
  g.fillStyle(t.ornament, 0.7);
  g.fillRect(0, fy - 123 * S, w, 3 * S);
  for (let x = 0; x < w; x += 88 * S) {
    g.fillStyle(col('bgDeep'), 0.18);
    g.fillRoundedRect(x + 8 * S, fy - 104 * S, 72 * S, 76 * S, 10);
    g.fillStyle(t.ornament, 0.12);
    g.fillRoundedRect(x + 14 * S, fy - 98 * S, 60 * S, 64 * S, 8);
  }
  // Podłoga: lśniący parkiet i miękki dywan.
  fillVerticalGradient(g, 0, fy, w, h - fy, [
    { at: 0, color: 0x4a2f20 },
    { at: 1, color: 0x2a1a12 },
  ]);
  for (let x = 0; x < w; x += 64) {
    g.fillStyle(0xffffff, 0.03);
    g.fillRect(x, fy, 30, h - fy);
  }
  fillVerticalGradient(g, 0, fy + 12 * S, w, 44 * S, [
    { at: 0, color: lerpColor(t.carpet, t.ornament, 0.15) },
    { at: 1, color: t.carpet },
  ]);
  g.fillStyle(t.carpetEdge, 0.85);
  g.fillRect(0, fy + 13 * S, w, 2 * S);
  g.fillRect(0, fy + 53 * S, w, 2 * S);
  g.lineStyle(2, t.carpetEdge, 0.35);
  for (let x = 0; x < w; x += 56 * S) {
    g.beginPath();
    g.arc(x + 28 * S, fy + 34 * S, 10 * S, 0, Math.PI * 2, false);
    g.strokePath();
  }
}

function drawSconce(g: Phaser.GameObjects.Graphics, paint: boolean): void {
  const S = paint ? PAINT_SCALE : 1;
  if (paint) {
    for (let r = 60; r > 8; r -= 6) {
      g.fillStyle(col('gold'), 0.03);
      g.fillCircle(30 * S, 22 * S, r);
    }
  }
  g.fillStyle(col('ground'), 1);
  g.fillRect(27 * S, 36 * S, 6 * S, 30 * S);
  g.fillStyle(col('gold'), 1);
  g.fillRect(20 * S, 28 * S, 20 * S, 10 * S);
  g.fillRect(14 * S, 24 * S, 32 * S, 4 * S);
  g.fillStyle(col('text'), 1);
  g.fillRect(27 * S, 30 * S, 6 * S, 6 * S);
}

function drawDoor(g: Phaser.GameObjects.Graphics, paint: boolean): void {
  const S = paint ? PAINT_SCALE : 1;
  const w = 90 * S;
  const h = 170 * S;
  g.fillStyle(col('bgDeep'), 1);
  g.fillRect(0, 0, w, h);
  if (paint) {
    fillVerticalGradient(g, 6 * S, 8 * S, w - 12 * S, h - 8 * S, [
      { at: 0, color: 0x6a4632 },
      { at: 1, color: 0x3a2419 },
    ]);
  } else {
    g.fillStyle(0x5a3a28, 1);
    g.fillRect(6 * S, 8 * S, w - 12 * S, h - 8 * S);
  }
  g.fillStyle(col('gold'), paint ? 0.9 : 1);
  g.fillRect(0, 0, w, 6 * S);
  g.fillRect(0, 0, 6 * S, h);
  g.fillRect(w - 6 * S, 0, 6 * S, h);
  g.fillStyle(col('bgDeep'), 0.4);
  g.fillRect(16 * S, 22 * S, w - 32 * S, 56 * S);
  g.fillRect(16 * S, 92 * S, w - 32 * S, 62 * S);
  g.fillStyle(col('gold'), 1);
  g.fillCircle(w - 20 * S, 96 * S, 3 * S);
}

function drawElevator(scene: Phaser.Scene): void {
  // Rama windy z tabliczką i strzałkami.
  let g = makeGraphics(scene);
  const w = 140;
  const h = 230;
  g.fillStyle(col('gold'), 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(col('bgDeep'), 1);
  g.fillRect(8, 8, w - 16, h - 8);
  g.fillStyle(col('gold'), 1);
  g.fillRect(w / 2 - 30, 14, 60, 18);
  g.fillStyle(col('bgDeep'), 1);
  g.fillTriangle(w / 2 - 18, 28, w / 2 - 10, 18, w / 2 - 2, 28);
  g.fillTriangle(w / 2 + 2, 18, w / 2 + 10, 28, w / 2 + 18, 18);
  bake(g, HOTEL_KEYS.elevatorFrame, w, h);
  // Jedno skrzydło drzwi (drugie = odbicie).
  g = makeGraphics(scene);
  g.fillStyle(0x7a6a52, 1);
  g.fillRect(0, 0, 62, 190);
  g.fillStyle(col('gold'), 0.9);
  g.fillRect(0, 0, 62, 4);
  g.fillRect(58, 0, 4, 190);
  g.fillStyle(col('bgDeep'), 0.35);
  g.fillRect(10, 20, 40, 150);
  g.fillStyle(col('text'), 0.25);
  g.fillRect(14, 24, 8, 142);
  bake(g, HOTEL_KEYS.elevatorDoor, 62, 190);
}

function drawStatue(scene: Phaser.Scene, world: World): void {
  const g = makeGraphics(scene);
  const stone = world === 'biznes' ? 0x8f8c84 : col('textMuted');
  const shade = lerpColor(stone, col('bgDeep'), 0.45);
  // Cokół.
  g.fillStyle(col('ground'), 1);
  g.fillRect(10, 130, 60, 30);
  g.fillStyle(col('gold'), 1);
  g.fillRect(6, 126, 68, 4);
  // Popiersie: barki, szyja, głowa.
  g.fillStyle(shade, 1);
  g.fillRect(16, 96, 48, 30);
  g.fillStyle(stone, 1);
  g.fillRect(20, 92, 40, 30);
  g.fillRect(34, 76, 12, 18);
  g.fillCircle(40, 64, 14);
  if (world === 'kultura') {
    g.lineStyle(3, col('gold'), 1);
    g.beginPath();
    g.arc(40, 64, 15, Math.PI * 1.1, Math.PI * 1.9, false);
    g.strokePath();
  } else if (world === 'edukacja') {
    g.fillStyle(col('gold'), 1);
    g.fillRect(26, 50, 28, 4);
    g.fillRect(36, 42, 8, 8);
  } else {
    g.fillStyle(col('gold'), 1);
    g.fillRect(30, 46, 20, 4);
    g.fillRect(38, 40, 4, 8);
  }
  g.fillStyle(col('bgDeep'), 1);
  g.fillRect(34, 60, 3, 3);
  g.fillRect(43, 60, 3, 3);
  bake(g, HOTEL_KEYS.statue(world), 80, 160);
}

function drawPlant(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  g.fillStyle(col('ground'), 1);
  g.fillRect(12, 54, 24, 26);
  g.fillStyle(col('gold'), 1);
  g.fillRect(10, 50, 28, 5);
  g.fillStyle(0x2f5a3a, 1);
  g.fillCircle(24, 36, 16);
  g.fillCircle(12, 44, 10);
  g.fillCircle(36, 42, 11);
  g.fillStyle(0x3f7a4a, 1);
  g.fillCircle(20, 30, 8);
  g.fillCircle(30, 34, 7);
  bake(g, HOTEL_KEYS.plant, 48, 80);
}

function drawFx(scene: Phaser.Scene): void {
  // Płomień (cząsteczki pochodni/kinkietów).
  let g = makeGraphics(scene);
  g.fillStyle(col('gold'), 0.9);
  g.fillCircle(5, 6, 5);
  g.fillStyle(0xffe9a8, 1);
  g.fillCircle(5, 6, 2.5);
  bake(g, HOTEL_KEYS.flame, 10, 12);
  // Miękka poświata (maska światła pochodni, halo).
  g = makeGraphics(scene);
  const R = 128;
  for (let r = R; r > 0; r -= 4) {
    const a = Math.pow(1 - r / R, 1.6) * 0.06;
    g.fillStyle(0xffffff, a);
    g.fillCircle(R, R, r);
  }
  bake(g, HOTEL_KEYS.glow, R * 2, R * 2);
  scene.textures.get(HOTEL_KEYS.glow).setFilter(Phaser.Textures.FilterMode.LINEAR);
  // Światło pochodni (do wycierania ciemności) i winieta — gradienty radialne na canvasie.
  radialCanvas(scene, HOTEL_KEYS.light, 256, [
    [0, 'rgba(255,255,255,1)'],
    [0.3, 'rgba(255,255,255,0.9)'],
    [0.7, 'rgba(255,255,255,0.35)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  radialCanvas(scene, HOTEL_KEYS.vignette, 512, [
    [0, 'rgba(0,0,0,0)'],
    [0.55, 'rgba(0,0,0,0)'],
    [1, 'rgba(0,0,0,1)'],
  ]);
}

function radialCanvas(
  scene: Phaser.Scene,
  key: string,
  size: number,
  stops: [number, string][],
): void {
  const canvas = scene.textures.createCanvas(key, size, size);
  if (canvas === null) return;
  const ctx = canvas.getContext();
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [at, color] of stops) gradient.addColorStop(at, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  canvas.refresh();
  canvas.setFilter(Phaser.Textures.FilterMode.LINEAR);
}

/** Fasada pałacu na ekran startowy (960×540): trzy kondygnacje, brama, uchwyty pochodni. */
function drawFacade(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 960;
  const H = 540;
  // Niebo nocne.
  fillVerticalGradient(g, 0, 0, W, H, [
    { at: 0, color: 0x05080d },
    { at: 1, color: col('parallaxFar') },
  ]);
  const rnd = seededRandom(7);
  for (let i = 0; i < 90; i += 1) {
    g.fillStyle(col('text'), 0.35 + rnd() * 0.5);
    g.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * 200), 1, 1);
  }
  // Bryła.
  const left = 120;
  const right = W - 120;
  const top = 120;
  g.fillStyle(0x3b2a26, 1);
  g.fillRect(left, top, right - left, H - top);
  g.fillStyle(0x4a3630, 1);
  g.fillRect(left, top, right - left, 8);
  // Dach mansardowy i attyka.
  g.fillStyle(0x2a1d1b, 1);
  g.fillTriangle(left - 30, top, right + 30, top, W / 2, 40);
  g.fillStyle(col('gold'), 0.9);
  g.fillRect(W / 2 - 3, 36, 6, 18);
  g.fillCircle(W / 2, 34, 5);
  // Kondygnacje okien.
  for (let row = 0; row < 3; row += 1) {
    const y = top + 40 + row * 118;
    for (let i = 0; i < 9; i += 1) {
      const x = left + 36 + i * 88;
      if (row === 2 && (i === 4 || i === 3 || i === 5)) continue;
      g.fillStyle(0x0d1418, 1);
      g.fillRect(x, y, 40, 64);
      g.fillStyle(col('ground'), 1);
      g.fillRect(x - 4, y - 4, 48, 4);
      g.fillRect(x - 4, y + 64, 48, 6);
      g.fillStyle(0x1b2a30, 1);
      g.fillRect(x + 18, y, 4, 64);
      g.fillRect(x, y + 30, 40, 4);
    }
    g.fillStyle(col('ground'), 0.8);
    g.fillRect(left, y + 96, right - left, 4);
  }
  // Pilastry.
  for (let i = 0; i <= 9; i += 1) {
    const x = left + 6 + i * 88;
    g.fillStyle(0x4d3a33, 1);
    g.fillRect(x, top + 20, 12, H - top - 20);
    g.fillStyle(col('gold'), 0.35);
    g.fillRect(x, top + 20, 12, 6);
  }
  // Portal i brama (skrzydła osobno — start.gate).
  g.fillStyle(col('ground'), 1);
  g.fillRect(W / 2 - 78, H - 200, 156, 200);
  g.fillStyle(col('gold'), 1);
  g.fillRect(W / 2 - 72, H - 194, 144, 6);
  g.fillStyle(0x0a0707, 1);
  g.fillRect(W / 2 - 60, H - 184, 120, 184);
  // Schody.
  for (let s = 0; s < 4; s += 1) {
    g.fillStyle(lerpColor(col('ground'), col('bgDeep'), s * 0.15), 1);
    g.fillRect(W / 2 - 100 - s * 22, H - 16 * (4 - s), 200 + s * 44, 16);
  }
  // Uchwyty pochodni (3): przy bramie i na piętrze.
  for (const [x, y] of [
    [W / 2 - 110, H - 150],
    [W / 2 + 110, H - 150],
    [W / 2, top + 24],
  ] as const) {
    g.fillStyle(col('ground'), 1);
    g.fillRect(x - 4, y, 8, 26);
    g.fillStyle(col('gold'), 1);
    g.fillRect(x - 9, y - 6, 18, 8);
  }
  bake(g, HOTEL_KEYS.facade, W, H);

  // Skrzydło bramy.
  const d = makeGraphics(scene);
  d.fillStyle(0x4a3226, 1);
  d.fillRect(0, 0, 60, 184);
  d.fillStyle(col('gold'), 0.9);
  d.fillRect(0, 0, 60, 4);
  d.fillRect(0, 0, 4, 184);
  d.fillStyle(col('bgDeep'), 0.5);
  d.fillRect(10, 14, 40, 70);
  d.fillRect(10, 98, 40, 74);
  d.fillStyle(col('gold'), 1);
  d.fillCircle(48, 96, 4);
  bake(d, HOTEL_KEYS.gateDoor, 60, 184);

  const torch = makeGraphics(scene);
  torch.fillStyle(col('ground'), 1);
  torch.fillRect(5, 10, 6, 26);
  torch.fillStyle(col('gold'), 1);
  torch.fillRect(2, 6, 12, 6);
  bake(torch, HOTEL_KEYS.torch, 16, 36);
}

/** Geometria fasady: uchwyty pochodni i brama (współrzędne sceny startowej 960×540). */
export interface FacadeLayout {
  torches: readonly { x: number; y: number }[];
  gate: { x: number; y: number; width: number; height: number };
}

/** Fasada rysowana kodem. */
export const FACADE_CODE: FacadeLayout = {
  torches: [
    { x: 480 - 110, y: 540 - 150 },
    { x: 480 + 110, y: 540 - 150 },
    { x: 480, y: 120 + 24 },
  ],
  gate: { x: 480, y: 540 - 184, width: 120, height: 184 },
};

/** Fasada z API (public/assets/hotel/facade.jpg) — pochodnie i brama tam, gdzie na obrazie. */
export const FACADE_IMAGE: FacadeLayout = {
  torches: [
    { x: 400, y: 362 },
    { x: 560, y: 362 },
    { x: 480, y: 150 },
  ],
  gate: { x: 480, y: 352, width: 84, height: 150 },
};

export const FACADE_TORCHES = FACADE_CODE.torches;

/** Ścieżka fasady z API (importowanej workflow'em) — wpis 'facade.image' w manifeście. */
export const FACADE_IMAGE_PATH = 'assets/hotel/facade.jpg';

export const FACADE_GATE = FACADE_CODE.gate;

/**
 * Wyposażenie wnętrz — każdy mebel w wersji pixel (S=1, ostre krawędzie) i malarskiej (S=2,
 * gradienty, poświaty). Ten sam układ, więc Floor może je przenikać razem ze ścianą.
 */
function drawFurniture(g: Phaser.GameObjects.Graphics, kind: Furniture, paint: boolean): void {
  const S = paint ? PAINT_SCALE : 1;
  const { width, height } = FURNITURE_SIZE[kind];
  const w = width * S;
  const h = height * S;
  const gold = col('gold');
  switch (kind) {
    case 'chandelier': {
      // Łańcuch, korona, ramiona ze świecami, kryształowe sople.
      g.fillStyle(gold, 0.9);
      g.fillRect(w / 2 - 1 * S, 0, 2 * S, 22 * S);
      g.fillStyle(gold, 1);
      g.fillRect(w / 2 - 10 * S, 22 * S, 20 * S, 6 * S);
      g.lineStyle(3 * S, gold, 1);
      g.beginPath();
      g.arc(w / 2, 30 * S, 36 * S, Math.PI * 0.15, Math.PI * 0.85, false);
      g.strokePath();
      for (let i = 0; i < 5; i += 1) {
        const a = Math.PI * (0.15 + (0.7 * i) / 4);
        const x = w / 2 + Math.cos(a) * 36 * S;
        const y = 30 * S + Math.sin(a) * 36 * S;
        g.fillStyle(gold, 1);
        g.fillRect(x - 3 * S, y - 12 * S, 6 * S, 12 * S);
        g.fillStyle(0xfff1c2, 1);
        g.fillRect(x - 2 * S, y - 18 * S, 4 * S, 6 * S);
        if (paint) {
          for (let r = 14; r > 2; r -= 3) {
            g.fillStyle(gold, 0.05);
            g.fillCircle(x, y - 16 * S, r * S);
          }
        }
        g.fillStyle(col('text'), 0.75);
        g.fillTriangle(x - 3 * S, y + 2 * S, x + 3 * S, y + 2 * S, x, y + 18 * S);
      }
      g.fillStyle(col('text'), 0.8);
      g.fillTriangle(w / 2 - 5 * S, 62 * S, w / 2 + 5 * S, 62 * S, w / 2, 90 * S);
      break;
    }
    case 'window': {
      // Okno ostrołukowe z księżycową nocą i szprosami; malarskie ma poświatę.
      const arc = 52 * S;
      g.fillStyle(col('ground'), 1);
      g.fillRect(0, arc, w, h - arc);
      g.fillCircle(w / 2, arc, w / 2);
      g.fillStyle(0x0f1c26, 1);
      g.fillRect(8 * S, arc, w - 16 * S, h - arc - 8 * S);
      g.fillCircle(w / 2, arc, w / 2 - 8 * S);
      if (paint) {
        fillVerticalGradient(g, 8 * S, arc, w - 16 * S, h - arc - 8 * S, [
          { at: 0, color: 0x17303f },
          { at: 1, color: 0x0b141b },
        ]);
      }
      g.fillStyle(0xf3ecd2, 1);
      g.fillCircle(w * 0.62, arc - 4 * S, 12 * S);
      g.fillStyle(0x0f1c26, 1);
      g.fillCircle(w * 0.66, arc - 8 * S, 10 * S);
      g.fillStyle(col('text'), 0.5);
      for (let i = 0; i < 12; i += 1) {
        g.fillRect((10 + ((i * 37) % 80)) * S, (arc / S - 30 + ((i * 53) % 26)) * S, S, S);
      }
      g.fillStyle(col('ground'), 1);
      g.fillRect(w / 2 - 2 * S, 8 * S, 4 * S, h - 16 * S);
      g.fillRect(8 * S, arc + 40 * S, w - 16 * S, 4 * S);
      g.fillRect(8 * S, arc + 100 * S, w - 16 * S, 4 * S);
      g.fillStyle(gold, 0.9);
      g.fillRect(0, h - 10 * S, w, 10 * S);
      break;
    }
    case 'bookshelf': {
      g.fillStyle(0x3a2419, 1);
      g.fillRect(0, 0, w, h);
      g.fillStyle(gold, 0.8);
      g.fillRect(0, 0, w, 4 * S);
      const rnd = seededRandom(kind.length * 11);
      const spines = [
        col('warn'),
        col('cool'),
        0x6b4a2a,
        col('parallaxMid'),
        0x8a6d3b,
        col('textMuted'),
      ];
      for (let shelf = 0; shelf < 4; shelf += 1) {
        const y = (8 + shelf * 38) * S;
        g.fillStyle(0x5a3a28, 1);
        g.fillRect(4 * S, y + 32 * S, w - 8 * S, 4 * S);
        let x = 6 * S;
        while (x < w - 12 * S) {
          const bw = (5 + Math.floor(rnd() * 8)) * S;
          const bh = (20 + Math.floor(rnd() * 12)) * S;
          g.fillStyle(spines[Math.floor(rnd() * spines.length)] ?? gold, 1);
          g.fillRect(x, y + 32 * S - bh, bw, bh);
          g.fillStyle(gold, 0.35);
          g.fillRect(x + bw / 2 - S, y + 32 * S - bh + 4 * S, S, 3 * S);
          x += bw + S;
        }
      }
      break;
    }
    case 'deco': {
      // Art déco: promienie słońca w półkolu (Transistor/Łempicka w mosiądzu).
      g.fillStyle(0x2b2a2e, 1);
      g.fillRect(0, 0, w, h);
      g.lineStyle(2 * S, gold, 0.9);
      g.strokeRect(S, S, w - 2 * S, h - 2 * S);
      const cx = w / 2;
      const cy = h - 6 * S;
      for (let i = 0; i <= 10; i += 1) {
        const a = Math.PI + (Math.PI * i) / 10;
        g.lineStyle(paint ? 3 : 2, gold, paint ? 0.7 : 1);
        g.lineBetween(cx, cy, cx + Math.cos(a) * 62 * S, cy + Math.sin(a) * 62 * S);
      }
      for (let r = 14; r <= 56; r += 14) {
        g.lineStyle(2, gold, 0.6);
        g.beginPath();
        g.arc(cx, cy, r * S, Math.PI, Math.PI * 2, false);
        g.strokePath();
      }
      g.fillStyle(gold, 1);
      g.fillCircle(cx, cy, 6 * S);
      break;
    }
    case 'drape': {
      // Kotara: aksamit w fałdach, złota szarfa.
      if (paint) {
        fillVerticalGradient(g, 0, 0, w, h, [
          { at: 0, color: 0x6a1d22 },
          { at: 0.5, color: 0x4a1418 },
          { at: 1, color: 0x2e0c0f },
        ]);
      } else {
        g.fillStyle(0x4a1418, 1);
        g.fillRect(0, 0, w, h);
      }
      for (let x = 4 * S; x < w; x += 10 * S) {
        g.fillStyle(0x7a2a30, paint ? 0.5 : 1);
        g.fillRect(x, 0, 3 * S, h);
      }
      g.fillStyle(gold, 1);
      g.fillRect(0, 0, w, 6 * S);
      g.fillRect(2 * S, 120 * S, w - 4 * S, 8 * S);
      g.fillStyle(gold, 0.6);
      g.fillRect(w / 2 - 2 * S, 128 * S, 4 * S, 20 * S);
      break;
    }
    case 'pilaster': {
      // Pilaster od gzymsu do podłogi: głowica, trzon z kanelurami, baza.
      const body = paint ? lerpColor(col('ground'), col('gold'), 0.25) : col('ground');
      g.fillStyle(body, 1);
      g.fillRect(6 * S, 0, w - 12 * S, h);
      g.fillStyle(col('bgDeep'), 0.25);
      for (let x = 10 * S; x < w - 10 * S; x += 8 * S) g.fillRect(x, 24 * S, 2 * S, h - 48 * S);
      g.fillStyle(gold, 1);
      g.fillRect(0, 0, w, 10 * S);
      g.fillRect(2 * S, 10 * S, w - 4 * S, 6 * S);
      g.fillRect(0, h - 14 * S, w, 14 * S);
      if (paint) {
        g.fillStyle(0xffffff, 0.08);
        g.fillRect(8 * S, 0, 6 * S, h);
      }
      break;
    }
  }
}

export function generateHotel(scene: Phaser.Scene): void {
  const worlds: World[] = ['kultura', 'edukacja', 'biznes'];
  for (const world of worlds) {
    let g = makeGraphics(scene);
    drawWallPixel(g, world);
    bake(g, HOTEL_KEYS.wall(world, 'pixel'), WALL_TILE.width, WALL_TILE.height);
    g = makeGraphics(scene);
    drawWallPaint(g, world);
    bake(
      g,
      HOTEL_KEYS.wall(world, 'paint'),
      WALL_TILE.width * PAINT_SCALE,
      WALL_TILE.height * PAINT_SCALE,
    );
    scene.textures
      .get(HOTEL_KEYS.wall(world, 'paint'))
      .setFilter(Phaser.Textures.FilterMode.LINEAR);
    drawStatue(scene, world);
  }
  for (const paint of [false, true]) {
    const S = paint ? PAINT_SCALE : 1;
    let g = makeGraphics(scene);
    drawSconce(g, paint);
    bake(g, HOTEL_KEYS.sconce(paint ? 'paint' : 'pixel'), 60 * S, 70 * S);
    g = makeGraphics(scene);
    drawDoor(g, paint);
    bake(g, HOTEL_KEYS.door(paint ? 'paint' : 'pixel'), 90 * S, 170 * S);
    if (paint) {
      scene.textures.get(HOTEL_KEYS.sconce('paint')).setFilter(Phaser.Textures.FilterMode.LINEAR);
      scene.textures.get(HOTEL_KEYS.door('paint')).setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
  }
  const furniture: Furniture[] = ['chandelier', 'window', 'bookshelf', 'deco', 'drape', 'pilaster'];
  for (const kind of furniture) {
    for (const paint of [false, true]) {
      const S = paint ? PAINT_SCALE : 1;
      const g = makeGraphics(scene);
      drawFurniture(g, kind, paint);
      const key = HOTEL_KEYS.furniture(kind, paint ? 'paint' : 'pixel');
      bake(g, key, FURNITURE_SIZE[kind].width * S, FURNITURE_SIZE[kind].height * S);
      if (paint) scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
  }
  drawElevator(scene);
  drawPlant(scene);
  drawFx(scene);
  drawFacade(scene);
}
