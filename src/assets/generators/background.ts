import type Phaser from 'phaser';
import { textureKey } from '../manifest';
import { bake, col, drawWrapped, fillVerticalGradient, makeGraphics, seededRandom } from './draw';

/** Wymiary warstw tła — Parallax.ts układa je względem linii ziemi. */
export const BG_SIZES = {
  stars: { width: 960, height: 320 },
  skyline: { width: 960, height: 240 },
  colonnade: { width: 960, height: 330 },
  props: { width: 960, height: 220 },
  ground: { width: 960, height: 120 },
} as const;

export function generateSky(scene: Phaser.Scene, width: number, height: number): void {
  const g = makeGraphics(scene);
  fillVerticalGradient(g, 0, 0, width, height, [
    { at: 0, color: col('parallaxFar') },
    { at: 0.45, color: col('parallaxMid') },
    { at: 0.72, color: col('cool') },
    { at: 0.8, color: 0x5a5a5c },
    { at: 1, color: col('bgDeep') },
  ]);
  // Ciepła poświata przy horyzoncie (zachód nad miastem).
  const horizonY = height * 0.78;
  for (let i = 0; i < 10; i += 1) {
    g.fillStyle(col('gold'), 0.035);
    g.fillEllipse(width * 0.62, horizonY, width * (0.9 - i * 0.06), 120 - i * 9);
  }
  // Księżyc.
  g.fillStyle(col('gold'), 0.25);
  g.fillCircle(width * 0.78, height * 0.22, 46);
  g.fillStyle(col('gold'), 1);
  g.fillCircle(width * 0.78, height * 0.22, 30);
  g.fillStyle(col('text'), 0.9);
  g.fillCircle(width * 0.78 - 6, height * 0.22 - 6, 24);
  g.fillStyle(col('gold'), 1);
  g.fillCircle(width * 0.78 - 14, height * 0.22 - 10, 12);
  bake(g, textureKey('bg.sky'), width, height);
}

export function generateStars(scene: Phaser.Scene): void {
  const { width, height } = BG_SIZES.stars;
  const g = makeGraphics(scene);
  const rnd = seededRandom(7);
  for (let i = 0; i < 90; i += 1) {
    const x = Math.floor(rnd() * width);
    const y = Math.floor(rnd() * height * 0.9);
    const size = rnd() < 0.15 ? 2 : 1;
    g.fillStyle(col('text'), 0.35 + rnd() * 0.5);
    g.fillRect(x, y, size, size);
  }
  bake(g, textureKey('bg.stars'), width, height);
}

/** Daleka panorama miasta (wieże, kopuły, teatr z tympanonem) — kolor środkowy palety. */
export function generateSkyline(scene: Phaser.Scene): void {
  const { width, height } = BG_SIZES.skyline;
  const g = makeGraphics(scene);
  const rnd = seededRandom(21);
  const base = col('parallaxMid');
  const windowColor = col('gold');

  const block = (x: number, w: number, h: number): void => {
    g.fillStyle(base, 1);
    g.fillRect(x, height - h, w, h);
    // Okna — pojedyncze ciepłe punkty.
    for (let wx = x + 6; wx < x + w - 4; wx += 10) {
      for (let wy = height - h + 8; wy < height - 10; wy += 12) {
        if (rnd() < 0.22) {
          g.fillStyle(windowColor, 0.55);
          g.fillRect(wx, wy, 2, 3);
        }
      }
    }
  };
  const tower = (x: number, w: number, h: number, spire: number): void => {
    g.fillStyle(base, 1);
    g.fillRect(x, height - h, w, h);
    g.fillTriangle(x - 2, height - h, x + w + 2, height - h, x + w / 2, height - h - spire);
  };
  const dome = (x: number, w: number, h: number): void => {
    g.fillStyle(base, 1);
    g.fillRect(x, height - h, w, h);
    g.fillEllipse(x + w / 2, height - h, w * 1.1, w * 0.9);
    g.fillRect(x + w / 2 - 1, height - h - w * 0.45 - 10, 2, 12);
  };
  const theatre = (x: number, w: number, h: number): void => {
    g.fillStyle(base, 1);
    g.fillRect(x, height - h, w, h);
    g.fillTriangle(x - 6, height - h, x + w + 6, height - h, x + w / 2, height - h - w * 0.22);
    // Kolumnada w tle — jaśniejsze szczeliny.
    g.fillStyle(col('cool'), 0.6);
    for (let cx = x + 8; cx < x + w - 6; cx += 12) {
      g.fillRect(cx, height - h + 8, 4, h - 16);
    }
  };

  // Rozkład elementów wzdłuż całej szerokości (bezszwowo).
  let x = 0;
  const items: (() => void)[] = [];
  while (x < width) {
    const roll = rnd();
    const w = 40 + Math.floor(rnd() * 50);
    const h = 50 + Math.floor(rnd() * 70);
    const at = x;
    if (roll < 0.5)
      items.push(() => {
        drawWrapped(width, at, (xx) => {
          block(xx, w, h);
        });
      });
    else if (roll < 0.68)
      items.push(() => {
        drawWrapped(width, at, (xx) => {
          tower(xx, 22, h + 40, 30 + rnd() * 30);
        });
      });
    else if (roll < 0.84)
      items.push(() => {
        drawWrapped(width, at, (xx) => {
          dome(xx, w, h);
        });
      });
    else
      items.push(() => {
        drawWrapped(width, at, (xx) => {
          theatre(xx, w + 40, h - 10);
        });
      });
    x += w + 4 + Math.floor(rnd() * 20);
  }
  for (const draw of items) draw();
  // Delikatna mgła u podstawy — miękkie przejście do kolonnady.
  fillVerticalGradient(g, 0, height - 40, width, 40, [
    { at: 0, color: col('parallaxMid') },
    { at: 1, color: col('parallaxFar') },
  ]);
  bake(g, textureKey('bg.skyline'), width, height);
}

/** Kolumnada teatru — bliższa warstwa, najciemniejszy chłodny kolor. */
export function generateColonnade(scene: Phaser.Scene): void {
  const { width, height } = BG_SIZES.colonnade;
  const g = makeGraphics(scene);
  const dark = col('parallaxFar');
  const edge = col('parallaxMid');
  const spacing = 160;
  const entablatureH = 34;

  // Belkowanie (fryz) z meandrem.
  g.fillStyle(dark, 1);
  g.fillRect(0, 0, width, entablatureH);
  g.lineStyle(2, edge, 0.5);
  g.lineBetween(0, entablatureH - 1, width, entablatureH - 1);
  g.lineBetween(0, 8, width, 8);
  for (let mx = 0; mx < width; mx += 24) {
    g.lineStyle(2, edge, 0.35);
    g.lineBetween(mx, 14, mx + 12, 14);
    g.lineBetween(mx + 12, 14, mx + 12, 24);
    g.lineBetween(mx + 12, 24, mx + 4, 24);
    g.lineBetween(mx + 4, 24, mx + 4, 19);
  }

  for (let x = 40; x < width; x += spacing) {
    drawWrapped(width, x, (xx) => {
      // Trzon kolumny.
      g.fillStyle(dark, 1);
      g.fillRect(xx - 13, entablatureH, 26, height - entablatureH);
      // Kapitel i baza.
      g.fillRect(xx - 19, entablatureH, 38, 12);
      g.fillRect(xx - 20, height - 16, 40, 16);
      // Żłobkowanie — jaśniejsze linie.
      g.lineStyle(1, edge, 0.35);
      g.lineBetween(xx - 8, entablatureH + 14, xx - 8, height - 18);
      g.lineBetween(xx, entablatureH + 14, xx, height - 18);
      g.lineBetween(xx + 8, entablatureH + 14, xx + 8, height - 18);
      // Łuk między kolumnami.
      g.lineStyle(6, dark, 1);
      g.beginPath();
      g.arc(xx + spacing / 2, entablatureH + 70, spacing / 2 - 13, Math.PI, 0, false);
      g.strokePath();
    });
  }
  bake(g, textureKey('bg.colonnade'), width, height);
}

/** Najbliższa warstwa: latarnie ze złotym światłem, cyprysy, słupy afiszowe. */
export function generateProps(scene: Phaser.Scene): void {
  const { width, height } = BG_SIZES.props;
  const g = makeGraphics(scene);
  const dark = col('bgDeep');
  const gold = col('gold');
  const light = col('text');

  const lamp = (x: number): void => {
    // Poświata.
    for (let i = 5; i >= 1; i -= 1) {
      g.fillStyle(gold, 0.05);
      g.fillCircle(x, 54, 14 + i * 9);
    }
    g.fillStyle(dark, 1);
    g.fillRect(x - 3, 60, 6, height - 60);
    g.fillRect(x - 12, height - 8, 24, 8);
    g.fillRect(x - 10, 42, 20, 4);
    g.fillTriangle(x - 12, 46, x + 12, 46, x, 36);
    // Lampion.
    g.fillStyle(gold, 1);
    g.fillRect(x - 7, 46, 14, 16);
    g.fillStyle(light, 1);
    g.fillRect(x - 3, 50, 6, 8);
  };
  const cypress = (x: number, h: number): void => {
    g.fillStyle(dark, 1);
    g.fillEllipse(x, height - h / 2, h * 0.3, h);
    g.fillRect(x - 2, height - 10, 4, 10);
  };
  const posterColumn = (x: number): void => {
    g.fillStyle(dark, 1);
    g.fillRect(x - 14, 90, 28, height - 90);
    g.fillEllipse(x, 90, 34, 14);
    g.fillRect(x - 17, 84, 34, 6);
    g.fillStyle(gold, 0.45);
    g.fillRect(x - 9, 104, 18, 24);
    g.fillStyle(col('warn'), 0.7);
    g.fillRect(x - 9, 136, 18, 16);
  };

  drawWrapped(width, 90, lamp);
  drawWrapped(width, 410, lamp);
  drawWrapped(width, 730, lamp);
  drawWrapped(width, 230, (x) => {
    cypress(x, 150);
  });
  drawWrapped(width, 262, (x) => {
    cypress(x, 110);
  });
  drawWrapped(width, 560, posterColumn);
  drawWrapped(width, 880, (x) => {
    cypress(x, 130);
  });

  bake(g, textureKey('bg.props'), width, height);
}

/** Ziemia: złota krawędź, marmurowa posadzka w cegiełkę, ciemny spód. */
export function generateGround(scene: Phaser.Scene): void {
  const { width, height } = BG_SIZES.ground;
  const g = makeGraphics(scene);
  const stone = col('ground');
  const seam = col('panelBg');

  g.fillStyle(stone, 1);
  g.fillRect(0, 0, width, 46);
  g.fillStyle(col('gold'), 1);
  g.fillRect(0, 0, width, 3);
  g.fillStyle(col('text'), 0.25);
  g.fillRect(0, 3, width, 1);

  // Płyty w cegiełkę.
  const slabW = 64;
  for (let row = 0; row < 2; row += 1) {
    const y = 6 + row * 20;
    g.fillStyle(seam, 1);
    g.fillRect(0, y + 19, width, 2);
    const offset = row % 2 === 0 ? 0 : slabW / 2;
    for (let x = offset; x < width + slabW; x += slabW) {
      g.fillRect(((x % width) + width) % width, y, 2, 20);
    }
  }
  // Delikatne prześwity marmuru.
  const rnd = seededRandom(3);
  for (let i = 0; i < 60; i += 1) {
    g.fillStyle(col('gold'), 0.12 + rnd() * 0.15);
    g.fillRect(Math.floor(rnd() * width), 8 + Math.floor(rnd() * 34), 3 + Math.floor(rnd() * 8), 1);
  }
  fillVerticalGradient(g, 0, 46, width, height - 46, [
    { at: 0, color: col('panelBg') },
    { at: 1, color: col('bgDeep') },
  ]);
  bake(g, textureKey('bg.ground'), width, height);
}
