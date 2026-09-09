import Phaser from 'phaser';
import { col } from '../assets/generators/draw';
import { PAINTING_RASTER, textureKey } from '../assets/manifest';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { PALETTE } from '../config/palette';
import type { UiStrings } from '../content/uiStrings';
import { bus } from '../events/bus';
import { totalFragments } from '../script/types';
import type { RunnerSceneData } from './RunnerScene';

export interface HubSceneData {
  restored: boolean;
}

const FONT_HUD = '"Press Start 2P", monospace';
const FONT_TEXT = 'Spectral, Georgia, serif';

/**
 * HubStubScene — jedna ściana hotelu z jednym obrazem (docs/00_KONCEPCJA.md, „stub hubu”).
 * Zniszczony: zaciemnione kafle + pęknięcia; odrestaurowany: pełny obraz w złotej poświacie.
 * Klik w obraz (albo `hub:enter` z panelu) = przejście do RunnerScene.
 * Pełny hotel do chodzenia — docs/06_BACKLOG_PO_POC.md (P1), nie tutaj.
 */
export class HubStubScene extends Phaser.Scene {
  private entering = false;
  private readonly unsubscribe: (() => void)[] = [];

  constructor() {
    super('HubStubScene');
  }

  create(data: HubSceneData): void {
    this.entering = false;
    const runnerData = this.registry.get('runnerData') as RunnerSceneData | undefined;
    const strings = this.registry.get('uiStrings') as UiStrings | undefined;
    const kejs = runnerData?.script?.kejs;
    if (runnerData === undefined || strings === undefined || kejs === undefined) {
      this.scene.start('RunnerScene', runnerData ?? {});
      return;
    }
    const restored = data.restored;
    document.body.dataset.painting = restored ? 'restored' : 'damaged';

    this.drawWall();

    // Obraz: rasteryzowany SVG (960×640) skalowany do ramy.
    const paintingW = 440;
    const paintingH = (paintingW * PAINTING_RASTER.height) / PAINTING_RASTER.width;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 - 34;

    if (restored) {
      const glow = this.add
        .rectangle(cx, cy, paintingW + 90, paintingH + 90, col('gold'), 0.18)
        .setDepth(1);
      this.tweens.add({
        targets: glow,
        alpha: 0.35,
        scaleX: 1.04,
        scaleY: 1.05,
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      const sparks = this.add.particles(cx, cy, textureKey('fx.spark'), {
        x: { min: -paintingW / 2, max: paintingW / 2 },
        y: { min: -paintingH / 2, max: paintingH / 2 },
        lifespan: { min: 800, max: 1600 },
        speedY: { min: -30, max: -8 },
        scale: { start: 0.9, end: 0 },
        alpha: { start: 0.9, end: 0 },
        frequency: 140,
        quantity: 1,
      });
      sparks.setDepth(6);
    }

    this.drawFrame(cx, cy, paintingW, paintingH);

    const painting = this.add
      .image(cx, cy, textureKey('painting.current'))
      .setDisplaySize(paintingW, paintingH)
      .setDepth(3);

    if (!restored) {
      this.drawDamage(cx, cy, paintingW, paintingH, kejs.painting.cols, kejs.painting.rows);
    }

    // Tabliczka pod obrazem.
    const plaqueY = cy + paintingH / 2 + 52;
    this.add
      .rectangle(cx, plaqueY, 380, 58, col('ground'), 1)
      .setStrokeStyle(2, col('gold'))
      .setDepth(3);
    this.add
      .text(cx, plaqueY - 12, kejs.title, {
        fontFamily: FONT_HUD,
        fontSize: '9px',
        color: PALETTE.bgDeep,
        align: 'center',
        wordWrap: { width: 360 },
      })
      .setOrigin(0.5)
      .setDepth(4);
    this.add
      .text(
        cx,
        plaqueY + 14,
        `${kejs.role} · ${restored ? strings.hubRestored : strings.hubDamaged}`,
        {
          fontFamily: FONT_TEXT,
          fontSize: '14px',
          fontStyle: 'italic',
          color: PALETTE.bgDeep,
        },
      )
      .setOrigin(0.5)
      .setDepth(4);

    const hint = this.add
      .text(cx, 44, restored ? strings.playAgain : strings.hubHint, {
        fontFamily: FONT_HUD,
        fontSize: '10px',
        color: PALETTE.gold,
      })
      .setOrigin(0.5)
      .setDepth(4);
    this.tweens.add({ targets: hint, alpha: 0.35, duration: 900, yoyo: true, repeat: -1 });

    // Interakcja: hover unosi obraz, klik wchodzi.
    const hit = this.add
      .rectangle(cx, cy, paintingW + 40, paintingH + 40, 0x000000, 0)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    hit.on(Phaser.Input.Events.POINTER_OVER, () => {
      this.tweens.add({ targets: painting, scale: painting.scale * 1.02, duration: 200 });
    });
    hit.on(Phaser.Input.Events.POINTER_OUT, () => {
      this.tweens.add({
        targets: painting,
        scale: paintingW / PAINTING_RASTER.width,
        duration: 200,
      });
    });
    hit.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.enter(runnerData, cx, cy);
    });
    this.unsubscribe.push(
      bus.on('hub:enter', () => {
        this.enter(runnerData, cx, cy);
      }),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const off of this.unsubscribe) off();
      this.unsubscribe.length = 0;
    });

    this.cameras.main.fadeIn(600, 0x26, 0x16, 0x19);
    document.body.dataset.scene = 'hub';
  }

  /** Ściana hotelu: ciepłe tło, boazeria, listwa, kinkiety ze złotym światłem. */
  private drawWall(): void {
    const g = this.add.graphics().setDepth(0);
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      const t = y / GAME_HEIGHT;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(col('panelBg')),
        Phaser.Display.Color.IntegerToColor(col('bgDeep')),
        100,
        Math.round(t * 100),
      );
      g.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      g.fillRect(0, y, GAME_WIDTH, 4);
    }
    // Tapeta: delikatny wzór maureskowy w rombach.
    g.lineStyle(1, col('gold'), 0.07);
    for (let x = -40; x < GAME_WIDTH + 40; x += 48) {
      for (let y = 0; y < GAME_HEIGHT - 120; y += 48) {
        g.strokeRect(x + 12, y + 12, 24, 24);
        g.lineBetween(x + 24, y, x + 48, y + 24);
        g.lineBetween(x + 48, y + 24, x + 24, y + 48);
        g.lineBetween(x + 24, y + 48, x, y + 24);
        g.lineBetween(x, y + 24, x + 24, y);
      }
    }
    // Boazeria i podłoga.
    g.fillStyle(col('ground'), 1);
    g.fillRect(0, GAME_HEIGHT - 120, GAME_WIDTH, 8);
    g.fillStyle(col('bgDeep'), 1);
    g.fillRect(0, GAME_HEIGHT - 112, GAME_WIDTH, 112);
    g.fillStyle(col('panelBg'), 1);
    for (let x = 0; x < GAME_WIDTH; x += 96) {
      g.fillRect(x + 6, GAME_HEIGHT - 104, 84, 60);
    }
    g.fillStyle(col('ground'), 1);
    g.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40);
    g.fillStyle(col('bgDeep'), 0.35);
    for (let x = 0; x < GAME_WIDTH; x += 64) {
      g.fillRect(x, GAME_HEIGHT - 40, 2, 40);
    }
    // Kinkiety.
    for (const x of [120, GAME_WIDTH - 120]) {
      for (let i = 5; i >= 1; i -= 1) {
        g.fillStyle(col('gold'), 0.05);
        g.fillCircle(x, 150, 26 + i * 16);
      }
      g.fillStyle(col('ground'), 1);
      g.fillRect(x - 4, 160, 8, 40);
      g.fillStyle(col('gold'), 1);
      g.fillRect(x - 10, 140, 20, 22);
      g.fillStyle(col('text'), 1);
      g.fillRect(x - 4, 146, 8, 10);
    }
  }

  /** Złota, zdobiona rama. */
  private drawFrame(cx: number, cy: number, w: number, h: number): void {
    const g = this.add.graphics().setDepth(2);
    const pad = 22;
    g.fillStyle(col('bgDeep'), 0.5);
    g.fillRect(cx - w / 2 - pad + 8, cy - h / 2 - pad + 12, w + pad * 2, h + pad * 2);
    g.fillStyle(col('ground'), 1);
    g.fillRect(cx - w / 2 - pad, cy - h / 2 - pad, w + pad * 2, h + pad * 2);
    g.lineStyle(4, col('gold'), 1);
    g.strokeRect(cx - w / 2 - pad + 3, cy - h / 2 - pad + 3, w + pad * 2 - 6, h + pad * 2 - 6);
    g.lineStyle(2, col('gold'), 0.8);
    g.strokeRect(cx - w / 2 - 6, cy - h / 2 - 6, w + 12, h + 12);
    // Narożne rozety.
    g.fillStyle(col('gold'), 1);
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      const x = cx + sx * (w / 2 + pad - 12);
      const y = cy + sy * (h / 2 + pad - 12);
      g.fillCircle(x, y, 6);
      g.fillStyle(col('ground'), 1);
      g.fillCircle(x, y, 2.5);
      g.fillStyle(col('gold'), 1);
    }
  }

  /** Zniszczenie: przyciemnione kafle (siatka fragmentów) i pęknięcia. */
  private drawDamage(
    cx: number,
    cy: number,
    w: number,
    h: number,
    cols: number,
    rows: number,
  ): void {
    const g = this.add.graphics().setDepth(4);
    const tileW = w / cols;
    const tileH = h / rows;
    const total = totalFragments({ painting: { cols, rows } } as never);
    for (let i = 0; i < total; i += 1) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const x = cx - w / 2 + c * tileW;
      const y = cy - h / 2 + r * tileH;
      // Środkowy górny kafel zostaje niemal widoczny — zachęta, że coś tu było.
      const alpha = i === Math.floor(cols / 2) ? 0.55 : 0.86;
      g.fillStyle(col('bgDeep'), alpha);
      g.fillRect(x, y, tileW, tileH);
      g.lineStyle(1, col('panelBg'), 0.9);
      g.strokeRect(x + 0.5, y + 0.5, tileW - 1, tileH - 1);
    }
    // Pęknięcia.
    g.lineStyle(2, col('bgDeep'), 1);
    const cracks: [number, number][][] = [
      [
        [0.05, 0.1],
        [0.22, 0.32],
        [0.3, 0.55],
        [0.44, 0.7],
        [0.5, 0.95],
      ],
      [
        [0.98, 0.15],
        [0.8, 0.28],
        [0.72, 0.5],
        [0.6, 0.6],
      ],
      [
        [0.3, 0.55],
        [0.15, 0.7],
        [0.1, 0.92],
      ],
    ];
    for (const crack of cracks) {
      g.beginPath();
      crack.forEach(([px, py], index) => {
        const x = cx - w / 2 + px * w;
        const y = cy - h / 2 + py * h;
        if (index === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      });
      g.strokePath();
      g.lineStyle(1, col('gold'), 0.35);
      g.strokePath();
      g.lineStyle(2, col('bgDeep'), 1);
    }
  }

  private enter(runnerData: RunnerSceneData, cx: number, cy: number): void {
    if (this.entering) return;
    this.entering = true;
    document.body.dataset.scene = 'entering';
    const camera = this.cameras.main;
    camera.pan(cx, cy, 700, 'Sine.easeInOut');
    camera.zoomTo(1.7, 700, 'Sine.easeIn');
    camera.fadeOut(650, 0x26, 0x16, 0x19);
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('RunnerScene', runnerData);
    });
  }
}
