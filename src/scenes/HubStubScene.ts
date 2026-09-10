import Phaser from 'phaser';
import { col } from '../assets/generators/draw';
import { paintingTextureKey, textureKey } from '../assets/manifest';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { PALETTE } from '../config/palette';
import type { UiStrings } from '../content/uiStrings';
import { format } from '../content/uiStrings';
import { bus } from '../events/bus';
import type { Case } from '../script/types';
import type { Progress } from '../state/progress';
import { hubSlots } from './hubLayout';
import type { RunnerSceneData } from './RunnerScene';

export interface HubSceneData {
  /** Case, który właśnie ukończono (jego obraz dostaje rozbłysk odrestaurowania). */
  justFinished?: string;
}

const FONT_HUD = '"Press Start 2P", monospace';
const FONT_TEXT = 'Spectral, Georgia, serif';

/**
 * HubStubScene — jedna ściana hotelu z galerią obrazów: po jednym na case (docs/00_KONCEPCJA.md,
 * „stub hubu”; pełny hotel do chodzenia — backlog P1). Zniszczony: zaciemnione kafle + pęknięcia;
 * odrestaurowany: pełny obraz w złotej poświacie. Klik w obraz (albo `hub:enter` z panelu)
 * przenosi do RunnerScene z wybranym case'em.
 */
export class HubStubScene extends Phaser.Scene {
  private entering = false;
  private readonly unsubscribe: (() => void)[] = [];
  private focusText!: Phaser.GameObjects.Text;

  constructor() {
    super('HubStubScene');
  }

  create(data: HubSceneData): void {
    this.entering = false;
    const runnerData = this.registry.get('runnerData') as RunnerSceneData | undefined;
    const strings = this.registry.get('uiStrings') as UiStrings | undefined;
    const cases = (this.registry.get('cases') as Case[] | undefined) ?? [];
    const progress = this.registry.get('progress') as Progress | undefined;
    if (runnerData === undefined || strings === undefined || cases.length === 0) {
      this.scene.start('RunnerScene', runnerData ?? {});
      return;
    }
    const completed = progress?.completed ?? new Set<string>();
    document.body.dataset.scene = 'hub';
    document.body.dataset.restored = [...completed].join(' ');
    if (data.justFinished === undefined) document.body.dataset.painting = 'damaged';

    this.drawWall();

    // Licznik odrestaurowanych obrazów i nazwa obrazu pod kursorem.
    this.add
      .text(
        GAME_WIDTH - 16,
        14,
        format(strings.hubProgress, { done: completed.size, total: cases.length }),
        { fontFamily: FONT_HUD, fontSize: '9px', color: PALETTE.gold },
      )
      .setOrigin(1, 0)
      .setDepth(20);
    this.focusText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 62, strings.hubHint, {
        fontFamily: FONT_TEXT,
        fontSize: '16px',
        fontStyle: 'italic',
        color: PALETTE.text,
        align: 'center',
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5)
      .setDepth(20);

    const slots = hubSlots(cases.length);
    cases.forEach((kejs, index) => {
      const slot = slots[index];
      if (slot !== undefined) {
        this.addPainting(
          kejs,
          slot,
          completed.has(kejs.id),
          data.justFinished === kejs.id,
          strings,
        );
      }
    });

    this.unsubscribe.push(
      bus.on('hub:enter', (caseId) => {
        const slot = slots[cases.findIndex((c) => c.id === caseId)];
        if (slot !== undefined) this.enter(caseId, slot.x, slot.y);
      }),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const off of this.unsubscribe) off();
      this.unsubscribe.length = 0;
    });
    this.cameras.main.fadeIn(600, 0x26, 0x16, 0x19);
  }

  private addPainting(
    kejs: Case,
    slot: { x: number; y: number; width: number; height: number },
    restored: boolean,
    celebrate: boolean,
    strings: UiStrings,
  ): void {
    const { x, y, width: w, height: h } = slot;
    const container = this.add.container(x, y).setDepth(5);

    if (restored) {
      const glow = this.add.rectangle(0, 0, w + 44, h + 44, col('gold'), 0.16);
      container.add(glow);
      this.tweens.add({
        targets: glow,
        alpha: 0.3,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    // Rama.
    const frame = this.add.graphics();
    const pad = 10;
    frame.fillStyle(col('bgDeep'), 0.5);
    frame.fillRect(-w / 2 - pad + 5, -h / 2 - pad + 7, w + pad * 2, h + pad * 2);
    frame.fillStyle(col('ground'), 1);
    frame.fillRect(-w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2);
    frame.lineStyle(3, col('gold'), restored ? 1 : 0.8);
    frame.strokeRect(-w / 2 - pad + 2, -h / 2 - pad + 2, w + pad * 2 - 4, h + pad * 2 - 4);
    frame.fillStyle(col('gold'), 1);
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      frame.fillCircle(sx * (w / 2 + pad - 5), sy * (h / 2 + pad - 5), 3);
    }
    container.add(frame);

    const image = this.add.image(0, 0, paintingTextureKey(kejs.id)).setDisplaySize(w, h);
    container.add(image);

    if (!restored) {
      container.add(this.drawDamage(w, h, kejs.painting.cols, kejs.painting.rows));
    }

    // Tabliczka: tytuł (skrócony) i świat.
    const plaqueY = h / 2 + pad + 16;
    container.add(
      this.add.rectangle(0, plaqueY, w + 20, 26, col('ground'), 1).setStrokeStyle(1, col('gold')),
    );
    container.add(
      this.add
        .text(0, plaqueY, shorten(kejs.title, 30), {
          fontFamily: FONT_HUD,
          fontSize: '6px',
          color: PALETTE.bgDeep,
          align: 'center',
          wordWrap: { width: w + 10 },
        })
        .setOrigin(0.5),
    );

    if (celebrate) {
      const sparks = this.add.particles(x, y, textureKey('fx.spark'), {
        x: { min: -w / 2, max: w / 2 },
        y: { min: -h / 2, max: h / 2 },
        lifespan: { min: 700, max: 1400 },
        speedY: { min: -30, max: -8 },
        scale: { start: 0.9, end: 0 },
        alpha: { start: 0.9, end: 0 },
        frequency: 120,
        quantity: 1,
      });
      sparks.setDepth(9);
      this.time.delayedCall(6000, () => {
        sparks.stop();
      });
    }

    const hit = this.add
      .rectangle(x, y, w + pad * 2, h + pad * 2 + 30, 0x000000, 0)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    const label = `${kejs.title} · ${restored ? strings.hubRestored : strings.hubDamaged}`;
    hit.on(Phaser.Input.Events.POINTER_OVER, () => {
      this.tweens.add({ targets: container, scale: 1.12, duration: 180, ease: 'Quad.easeOut' });
      container.setDepth(8);
      this.focusText.setText(label);
      bus.emit('hub:focus', kejs.id);
    });
    hit.on(Phaser.Input.Events.POINTER_OUT, () => {
      this.tweens.add({ targets: container, scale: 1, duration: 180 });
      container.setDepth(5);
      this.focusText.setText(strings.hubHint);
      bus.emit('hub:focus', undefined);
    });
    hit.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.enter(kejs.id, x, y);
    });
  }

  /** Ściana hotelu: ciepłe tło, tapeta, boazeria, listwa, kinkiety. */
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
    g.lineStyle(1, col('gold'), 0.07);
    for (let x = -40; x < GAME_WIDTH + 40; x += 48) {
      for (let y = 0; y < GAME_HEIGHT - 100; y += 48) {
        g.strokeRect(x + 12, y + 12, 24, 24);
        g.lineBetween(x + 24, y, x + 48, y + 24);
        g.lineBetween(x + 48, y + 24, x + 24, y + 48);
        g.lineBetween(x + 24, y + 48, x, y + 24);
        g.lineBetween(x, y + 24, x + 24, y);
      }
    }
    g.fillStyle(col('ground'), 1);
    g.fillRect(0, GAME_HEIGHT - 96, GAME_WIDTH, 6);
    g.fillStyle(col('bgDeep'), 1);
    g.fillRect(0, GAME_HEIGHT - 90, GAME_WIDTH, 90);
    g.fillStyle(col('panelBg'), 1);
    for (let x = 0; x < GAME_WIDTH; x += 96) {
      g.fillRect(x + 6, GAME_HEIGHT - 84, 84, 44);
    }
    g.fillStyle(col('ground'), 1);
    g.fillRect(0, GAME_HEIGHT - 36, GAME_WIDTH, 36);
    g.fillStyle(col('bgDeep'), 0.35);
    for (let x = 0; x < GAME_WIDTH; x += 64) {
      g.fillRect(x, GAME_HEIGHT - 36, 2, 36);
    }
    for (const x of [40, GAME_WIDTH - 40]) {
      for (let i = 4; i >= 1; i -= 1) {
        g.fillStyle(col('gold'), 0.05);
        g.fillCircle(x, 250, 20 + i * 14);
      }
      g.fillStyle(col('ground'), 1);
      g.fillRect(x - 3, 258, 6, 30);
      g.fillStyle(col('gold'), 1);
      g.fillRect(x - 8, 242, 16, 18);
      g.fillStyle(col('text'), 1);
      g.fillRect(x - 3, 247, 6, 8);
    }
  }

  /** Zniszczenie: przyciemnione kafle (siatka fragmentów) i pęknięcia. */
  private drawDamage(
    w: number,
    h: number,
    cols: number,
    rows: number,
  ): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const tileW = w / cols;
    const tileH = h / rows;
    for (let i = 0; i < cols * rows; i += 1) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const alpha = i === Math.floor(cols / 2) ? 0.55 : 0.86;
      g.fillStyle(col('bgDeep'), alpha);
      g.fillRect(-w / 2 + c * tileW, -h / 2 + r * tileH, tileW, tileH);
      g.lineStyle(1, col('panelBg'), 0.9);
      g.strokeRect(-w / 2 + c * tileW + 0.5, -h / 2 + r * tileH + 0.5, tileW - 1, tileH - 1);
    }
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
    ];
    for (const crack of cracks) {
      g.lineStyle(1.5, col('gold'), 0.45);
      g.beginPath();
      crack.forEach(([px, py], index) => {
        const x = -w / 2 + px * w;
        const y = -h / 2 + py * h;
        if (index === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      });
      g.strokePath();
    }
    return g;
  }

  private enter(caseId: string, cx: number, cy: number): void {
    if (this.entering) return;
    this.entering = true;
    document.body.dataset.scene = 'entering';
    // main.ts przygotowuje ScriptRunner/panel na ten case i dopisuje `script` do runnerData.
    bus.emit('hub:selected', caseId);
    const runnerData = this.registry.get('runnerData') as RunnerSceneData | undefined;
    const camera = this.cameras.main;
    camera.pan(cx, cy, 700, 'Sine.easeInOut');
    camera.zoomTo(2.4, 700, 'Sine.easeIn');
    camera.fadeOut(650, 0x26, 0x16, 0x19);
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('RunnerScene', runnerData ?? {});
    });
  }
}

function shorten(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}
