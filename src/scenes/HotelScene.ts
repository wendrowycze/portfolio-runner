import Phaser from 'phaser';
import { HOTEL_KEYS } from '../assets/generators/hotel';
import { col } from '../assets/generators/draw';
import { paintingTextureKey, textureKey } from '../assets/manifest';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { FLOORS, HOTEL } from '../config/hotel';
import { PALETTE } from '../config/palette';
import type { UiStrings } from '../content/uiStrings';
import { bus } from '../events/bus';
import { Floor } from '../hotel/Floor';
import { Walker } from '../hotel/Walker';
import type { Case } from '../script/types';
import type { Progress } from '../state/progress';
import {
  floorGeometry,
  floorRestoration,
  hotelHeight,
  paintingSlots,
  statueX,
  type PaintingSlot,
} from './hotelLayout';
import type { RunnerSceneData } from './RunnerScene';

export interface HotelSceneData {
  /** Case, który właśnie ukończono — gość staje przed jego obrazem, piętro się naprawia. */
  justFinished?: string;
  /** Piętro startowe (domyślnie parter albo piętro ukończonego case'a). */
  floor?: number;
}

const FONT_HUD = '"Press Start 2P", monospace';

/**
 * HotelScene — pałac z trzema piętrami (Kultura / Edukacja / Biznes). Gość chodzi lewo–prawo,
 * windą jeździ między piętrami, staje przed obrazem i wchodzi w historię. Piętro w miarę
 * odrestaurowywania obrazów zmienia się z pixelartu w malarstwo (Floor.setRestoration).
 * Z DOM łączy ją wyłącznie magistrala (`hub:*`, `hotel:*`).
 */
export class HotelScene extends Phaser.Scene {
  private cases: Case[] = [];
  private progress: Progress | undefined;
  private strings!: UiStrings;
  private floors: Floor[] = [];
  private slots: PaintingSlot[] = [];
  private readonly paintings = new Map<string, Phaser.GameObjects.Container>();
  private walker!: Walker;
  private currentFloor = 0;
  private entering = false;
  private riding = false;
  private inElevator = false;
  private nearCase: string | undefined;
  private elevatorDoors: Phaser.GameObjects.Image[] = [];
  private pendingFloor: number | undefined;
  private statueClicks = 0;
  private lastStepAt = 0;
  private readonly unsubscribe: (() => void)[] = [];
  private floorLabel!: Phaser.GameObjects.Text;

  constructor() {
    super('HotelScene');
  }

  create(data: HotelSceneData): void {
    const runnerData = this.registry.get('runnerData') as RunnerSceneData | undefined;
    const strings = this.registry.get('uiStrings') as UiStrings | undefined;
    this.cases = (this.registry.get('cases') as Case[] | undefined) ?? [];
    this.progress = this.registry.get('progress') as Progress | undefined;
    if (runnerData === undefined || strings === undefined || this.cases.length === 0) {
      this.scene.start('RunnerScene', runnerData ?? {});
      return;
    }
    this.strings = strings;
    this.entering = false;
    this.riding = false;
    this.inElevator = false;
    this.nearCase = undefined;
    this.statueClicks = 0;
    this.floors = [];
    this.elevatorDoors = [];
    this.paintings.clear();
    const completed = this.progress?.completed ?? new Set<string>();
    document.body.dataset.scene = 'hub';
    document.body.dataset.restored = [...completed].join(' ');
    if (data.justFinished === undefined) document.body.dataset.painting = 'damaged';

    this.slots = paintingSlots(this.cases);
    const finishedSlot =
      data.justFinished === undefined
        ? undefined
        : this.slots.find((s) => s.caseId === data.justFinished);
    this.currentFloor = data.floor ?? finishedSlot?.floor ?? 0;

    // Piętra (tło i meble), obrazy, windy.
    for (const def of FLOORS) {
      const geometry = floorGeometry(def.index);
      const restoration = floorRestoration(this.cases, completed, def.index);
      const initial =
        finishedSlot?.floor === def.index
          ? floorRestoration(
              this.cases,
              new Set([...completed].filter((id) => id !== data.justFinished)),
              def.index,
            )
          : restoration;
      this.floors.push(new Floor(this, geometry, initial, statueX()));
      this.addElevator(geometry.top, geometry.floorY);
      this.addFloorSign(def.index, geometry.top);
      this.addStatueInteraction(def.index);
    }
    for (const slot of this.slots) {
      const kejs = this.cases.find((c) => c.id === slot.caseId);
      if (kejs !== undefined) this.addPainting(kejs, slot, completed.has(kejs.id));
    }

    // Gość.
    const geometry = floorGeometry(this.currentFloor);
    const startX = finishedSlot?.x ?? HOTEL.spawnX;
    this.walker = new Walker(this, startX, geometry.floorY, 60, HOTEL.floorWidth - 40);

    // Kamera: podąża za gościem w poziomie, w pionie trzyma się piętra.
    const camera = this.cameras.main;
    camera.setBounds(0, 0, HOTEL.floorWidth, hotelHeight());
    camera.setScroll(Math.max(0, startX - GAME_WIDTH / 2), geometry.top);
    this.lockCameraToFloor(this.currentFloor);
    camera.startFollow(this.walker.sprite, true, 0.09, 0);
    camera.setDeadzone(80, 0);

    this.floorLabel = this.add
      .text(16, 14, '', { fontFamily: FONT_HUD, fontSize: '9px', color: PALETTE.gold })
      .setScrollFactor(0)
      .setDepth(100);
    this.add
      .text(GAME_WIDTH - 16, 14, this.progressLabel(), {
        fontFamily: FONT_HUD,
        fontSize: '9px',
        color: PALETTE.gold,
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(100);
    this.updateFloorLabel();

    this.setupInput();
    camera.fadeIn(700, 0x26, 0x16, 0x19);
    bus.emit('hotel:floor', this.currentFloor, geometry.world);

    if (finishedSlot !== undefined && data.justFinished !== undefined) {
      this.celebrate(finishedSlot, completed);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const off of this.unsubscribe) off();
      this.unsubscribe.length = 0;
    });
  }

  // ----- budowa -----

  private addElevator(top: number, floorY: number): void {
    const x = HOTEL.elevatorX;
    this.add
      .image(x, floorY + 6, HOTEL_KEYS.elevatorFrame)
      .setOrigin(0.5, 1)
      .setDepth(8);
    const left = this.add
      .image(x - 1, floorY, HOTEL_KEYS.elevatorDoor)
      .setOrigin(1, 1)
      .setDepth(9)
      .setFlipX(true);
    const right = this.add
      .image(x + 1, floorY, HOTEL_KEYS.elevatorDoor)
      .setOrigin(0, 1)
      .setDepth(9);
    left.setData('closedX', x - 1).setData('openX', x - 60);
    right.setData('closedX', x + 1).setData('openX', x + 60);
    this.elevatorDoors.push(left, right);
    // Drzwi na bieżącym piętrze otwarte, pozostałe zamknięte.
    const open = top === floorGeometry(this.currentFloor).top;
    left.setX(open ? x - 60 : x - 1);
    right.setX(open ? x + 60 : x + 1);
    const zone = this.add
      .rectangle(x, floorY - 100, HOTEL.elevatorZone * 2, 200, 0x000000, 0)
      .setDepth(40)
      .setInteractive({ useHandCursor: true });
    zone.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.walker.walkTo(x);
    });
  }

  private addFloorSign(index: number, top: number): void {
    const label =
      index === 0
        ? this.strings.hotelFloorGround
        : this.strings.hotelFloorN.replace('{n}', String(index));
    this.add
      .text(HOTEL.elevatorX, top + 90, label.toUpperCase(), {
        fontFamily: FONT_HUD,
        fontSize: '8px',
        color: PALETTE.text,
      })
      .setOrigin(0.5)
      .setDepth(7);
  }

  private addStatueInteraction(index: number): void {
    const floor = this.floors[index];
    if (floor === undefined) return;
    floor.statue.setInteractive({ useHandCursor: true });
    floor.statue.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.statueClicks += 1;
      floor.pokeStatue(this.statueClicks);
      bus.emit('hotel:statue', floor.view.world, this.statueClicks);
      if (this.statueClicks % 10 === 0) {
        this.add
          .particles(floor.statue.x, floor.statue.y - 120, textureKey('fx.spark'), {
            lifespan: 900,
            speed: { min: 40, max: 160 },
            angle: { min: 200, max: 340 },
            gravityY: 300,
            scale: { start: 1.2, end: 0 },
            quantity: 30,
            emitting: false,
          })
          .setDepth(50)
          .explode(30);
      }
    });
  }

  private addPainting(kejs: Case, slot: PaintingSlot, restored: boolean): void {
    const { x, y, width: w, height: h } = slot;
    const container = this.add.container(x, y).setDepth(12);
    const pad = 12;
    if (restored) {
      const glow = this.add
        .image(0, 0, HOTEL_KEYS.glow)
        .setScale((w + 120) / 256, (h + 100) / 256)
        .setTint(0xdfb67c)
        .setAlpha(0.8)
        .setBlendMode(Phaser.BlendModes.ADD);
      container.add(glow);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.6, to: 0.95 },
        duration: 1700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    const frame = this.add.graphics();
    frame.fillStyle(col('bgDeep'), 0.45);
    frame.fillRect(-w / 2 - pad + 6, -h / 2 - pad + 8, w + pad * 2, h + pad * 2);
    frame.fillStyle(col('ground'), 1);
    frame.fillRect(-w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2);
    frame.lineStyle(3, col('gold'), restored ? 1 : 0.75);
    frame.strokeRect(-w / 2 - pad + 3, -h / 2 - pad + 3, w + pad * 2 - 6, h + pad * 2 - 6);
    frame.fillStyle(col('gold'), 1);
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      frame.fillCircle(sx * (w / 2 + pad - 6), sy * (h / 2 + pad - 6), 3);
    }
    container.add(frame);
    const image = this.add
      .image(0, 0, paintingTextureKey(kejs.id))
      .setDisplaySize(w, h)
      .setName('image');
    container.add(image);
    // Tablica FigJam: „gdy stoisz pod obrazem, pojawia się w nim postać” — sylwetka gościa w obrazie.
    const ghost = this.add
      .image(0, h / 2 - 4, textureKey('player.idle'))
      .setOrigin(0.5, 1)
      .setScale(0.55)
      .setTint(0xdfb67c)
      .setAlpha(0)
      .setName('ghost');
    container.add(ghost);
    if (!restored) container.add(this.drawDamage(w, h, kejs.painting.cols, kejs.painting.rows));

    const plaqueY = h / 2 + pad + 14;
    container.add(
      this.add.rectangle(0, plaqueY, w + 12, 22, col('ground'), 1).setStrokeStyle(1, col('gold')),
    );
    container.add(
      this.add
        .text(0, plaqueY, shorten(kejs.title, 30), {
          fontFamily: FONT_HUD,
          fontSize: '7px',
          color: PALETTE.bgDeep,
          align: 'center',
          wordWrap: { width: w + 4 },
        })
        .setOrigin(0.5),
    );
    // Podpowiedź „wejdź” nad obrazem — widoczna, gdy gość stoi obok.
    const hint = this.add
      .text(0, -h / 2 - pad - 16, this.strings.hotelEnterHint, {
        fontFamily: FONT_HUD,
        fontSize: '7px',
        color: PALETTE.gold,
        backgroundColor: 'rgba(38,22,25,0.85)',
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setAlpha(0)
      .setName('hint');
    container.add(hint);
    this.paintings.set(kejs.id, container);

    const hit = this.add
      .rectangle(x, y, w + pad * 2, h + pad * 2 + 26, 0x000000, 0)
      .setDepth(41)
      .setInteractive({ useHandCursor: true });
    const label = `${kejs.title} · ${restored ? this.strings.hubRestored : this.strings.hubDamaged}`;
    // „Jak ruszasz myszką, to poczucie, że obraz ma głębię” — obraz przesuwa się lekko za kursorem.
    hit.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
      const dx = (pointer.worldX - x) / (w / 2);
      const dy = (pointer.worldY - y) / (h / 2);
      image.setPosition(-dx * 4, -dy * 3);
    });
    hit.on(Phaser.Input.Events.POINTER_OVER, () => {
      this.tweens.add({ targets: container, scale: 1.06, duration: 180, ease: 'Quad.easeOut' });
      container.setDepth(14);
      bus.emit('hub:focus', kejs.id);
      this.floorLabel.setText(label);
    });
    hit.on(Phaser.Input.Events.POINTER_OUT, () => {
      this.tweens.add({ targets: image, x: 0, y: 0, duration: 250, ease: 'Sine.easeOut' });
      if (this.nearCase !== kejs.id) {
        this.tweens.add({ targets: container, scale: 1, duration: 180 });
        container.setDepth(12);
        bus.emit('hub:focus', this.nearCase);
      }
      this.updateFloorLabel();
    });
    hit.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.enter(kejs.id);
    });
  }

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
      const alpha = i === Math.floor(cols / 2) ? 0.5 : 0.84;
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
        const cx = -w / 2 + px * w;
        const cy = -h / 2 + py * h;
        if (index === 0) g.moveTo(cx, cy);
        else g.lineTo(cx, cy);
      });
      g.strokePath();
    }
    return g;
  }

  // ----- wejście -----

  private setupInput(): void {
    this.unsubscribe.push(
      bus.on('move:direction', (direction) => {
        if (!this.riding && !this.entering) this.walker.setDirection(direction);
      }),
      bus.on('hub:enter', (caseId) => {
        this.enter(caseId);
      }),
      bus.on('hotel:go', (floor) => {
        this.requestFloor(floor);
      }),
    );
    const keyboard = this.input.keyboard;
    const up = (): void => {
      this.requestFloor(this.currentFloor + 1);
    };
    const down = (): void => {
      this.requestFloor(this.currentFloor - 1);
    };
    keyboard?.on('keydown-W', up);
    keyboard?.on('keydown-S', down);
    keyboard?.on('keydown-UP', up);
    keyboard?.on('keydown-DOWN', down);
    const enterNear = (): void => {
      if (this.nearCase !== undefined) this.enter(this.nearCase);
    };
    keyboard?.on('keydown-E', enterNear);
    keyboard?.on('keydown-ENTER', enterNear);
    keyboard?.on('keydown-SPACE', enterNear);
    // Klik w podłogę/ścianę = idź tam (dotyk i mysz).
    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      (pointer: Phaser.Input.Pointer, over: unknown[]) => {
        if (over.length > 0 || this.riding || this.entering) return;
        this.walker.walkTo(pointer.worldX);
      },
    );
  }

  /** Jedź na piętro: jeśli gość nie stoi w windzie, najpierw do niej dochodzi. */
  private requestFloor(floor: number): void {
    if (this.riding || this.entering) return;
    if (floor < 0 || floor >= FLOORS.length || floor === this.currentFloor) return;
    this.pendingFloor = floor;
    if (this.inElevator) {
      this.ride(floor);
    } else {
      this.walker.walkTo(HOTEL.elevatorX);
    }
  }

  private ride(floor: number): void {
    this.pendingFloor = undefined;
    this.riding = true;
    this.walker.stop();
    const to = floorGeometry(floor);
    const camera = this.cameras.main;
    camera.stopFollow();
    bus.emit('sfx', 'elevator.ding');
    this.setDoors(this.currentFloor, false, 350);
    this.time.delayedCall(420, () => {
      bus.emit('sfx', 'elevator.move');
      this.walker.sprite.setAlpha(0);
      this.tweens.add({
        targets: camera,
        scrollY: to.top,
        duration: 900 + Math.abs(floor - this.currentFloor) * 250,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.currentFloor = floor;
          this.walker.teleport(HOTEL.elevatorX, to.floorY);
          this.walker.sprite.setAlpha(1);
          this.setDoors(floor, true, 350);
          bus.emit('sfx', 'elevator.ding');
          this.lockCameraToFloor(floor);
          camera.startFollow(this.walker.sprite, true, 0.09, 0);
          this.updateFloorLabel();
          bus.emit('hotel:floor', floor, to.world);
          this.time.delayedCall(380, () => {
            this.riding = false;
          });
        },
      });
    });
  }

  private setDoors(floor: number, open: boolean, durationMs: number): void {
    const left = this.elevatorDoors[floor * 2];
    const right = this.elevatorDoors[floor * 2 + 1];
    if (left === undefined || right === undefined) return;
    this.tweens.add({
      targets: left,
      x: open ? (left.getData('openX') as number) : (left.getData('closedX') as number),
      duration: durationMs,
      ease: 'Quad.easeInOut',
    });
    this.tweens.add({
      targets: right,
      x: open ? (right.getData('openX') as number) : (right.getData('closedX') as number),
      duration: durationMs,
      ease: 'Quad.easeInOut',
    });
  }

  private lockCameraToFloor(floor: number): void {
    const geometry = floorGeometry(floor);
    this.cameras.main.setBounds(0, geometry.top, HOTEL.floorWidth, GAME_HEIGHT);
    document.body.dataset.floor = String(floor);
  }

  private enter(caseId: string): void {
    if (this.entering) return;
    const slot = this.slots.find((s) => s.caseId === caseId);
    if (slot === undefined) return;
    this.entering = true;
    this.walker.stop();
    document.body.dataset.scene = 'entering';
    bus.emit('hub:selected', caseId);
    bus.emit('sfx', 'painting.enter');
    const runnerData = this.registry.get('runnerData') as RunnerSceneData | undefined;
    const camera = this.cameras.main;
    camera.stopFollow();
    camera.setBounds(0, 0, HOTEL.floorWidth, hotelHeight());
    camera.pan(slot.x, slot.y, 800, 'Sine.easeInOut');
    camera.zoomTo(3, 800, 'Sine.easeIn');
    camera.fadeOut(750, 0x26, 0x16, 0x19);
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      camera.setZoom(1);
      this.scene.start('RunnerScene', runnerData ?? {});
    });
  }

  /** Po ukończeniu historii: iskry nad obrazem i fala naprawy piętra. */
  private celebrate(slot: PaintingSlot, completed: ReadonlySet<string>): void {
    const floor = this.floors[slot.floor];
    if (floor === undefined) return;
    const sparks = this.add.particles(slot.x, slot.y, textureKey('fx.spark'), {
      x: { min: -slot.width / 2, max: slot.width / 2 },
      y: { min: -slot.height / 2, max: slot.height / 2 },
      lifespan: { min: 700, max: 1400 },
      speedY: { min: -30, max: -8 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.9, end: 0 },
      frequency: 100,
      quantity: 1,
    });
    sparks.setDepth(20);
    this.time.delayedCall(1200, () => {
      const fraction = floorRestoration(this.cases, completed, slot.floor);
      bus.emit('hotel:restored', floor.view.world, fraction);
      void floor.restoreFrom(slot.x, slot.y, fraction).then(() => {
        document.body.dataset.floorRestored = fraction >= 1 ? 'full' : 'partial';
      });
    });
    this.time.delayedCall(6000, () => {
      sparks.stop();
    });
  }

  private progressLabel(): string {
    const done = this.progress?.completed.size ?? 0;
    return this.strings.hubProgress
      .replace('{done}', String(done))
      .replace('{total}', String(this.cases.length));
  }

  private updateFloorLabel(): void {
    const world = floorGeometry(this.currentFloor).world;
    const worldName =
      world === 'biznes'
        ? this.strings.hubWorldBiznes
        : world === 'edukacja'
          ? this.strings.hubWorldEdukacja
          : this.strings.hubWorldKultura;
    const floorName =
      this.currentFloor === 0
        ? this.strings.hotelFloorGround
        : this.strings.hotelFloorN.replace('{n}', String(this.currentFloor));
    this.floorLabel.setText(`${floorName} · ${worldName}`);
  }

  override update(time: number, delta: number): void {
    if (this.entering) return;
    this.walker.update(delta);
    if (this.walker.moving && time - this.lastStepAt > 260) {
      this.lastStepAt = time;
      bus.emit('sfx', 'walk.step');
    }
    // Strefa windy.
    const inElevator = Math.abs(this.walker.x - HOTEL.elevatorX) <= HOTEL.elevatorZone;
    if (inElevator !== this.inElevator) {
      this.inElevator = inElevator;
      bus.emit('hotel:elevator', inElevator);
      if (inElevator && this.pendingFloor !== undefined && !this.walker.moving) {
        this.ride(this.pendingFloor);
      }
    } else if (
      inElevator &&
      this.pendingFloor !== undefined &&
      !this.walker.moving &&
      !this.riding
    ) {
      this.ride(this.pendingFloor);
    }
    // Obraz w zasięgu.
    let nearest: PaintingSlot | undefined;
    let best: number = HOTEL.nearDistance;
    for (const slot of this.slots) {
      if (slot.floor !== this.currentFloor) continue;
      const d = Math.abs(slot.x - this.walker.x);
      if (d < best) {
        best = d;
        nearest = slot;
      }
    }
    const nearId = nearest?.caseId;
    if (nearId !== this.nearCase) {
      const previous = this.nearCase === undefined ? undefined : this.paintings.get(this.nearCase);
      if (previous !== undefined) {
        this.tweens.add({ targets: previous, scale: 1, duration: 200 });
        const hint = previous.getByName('hint') as Phaser.GameObjects.Text | null;
        if (hint !== null) this.tweens.add({ targets: hint, alpha: 0, duration: 150 });
        const ghost = previous.getByName('ghost') as Phaser.GameObjects.Image | null;
        if (ghost !== null) this.tweens.add({ targets: ghost, alpha: 0, duration: 200 });
        previous.setDepth(12);
      }
      this.nearCase = nearId;
      const current = nearId === undefined ? undefined : this.paintings.get(nearId);
      if (current !== undefined) {
        this.tweens.add({ targets: current, scale: 1.06, duration: 200, ease: 'Back.easeOut' });
        const hint = current.getByName('hint') as Phaser.GameObjects.Text | null;
        if (hint !== null) this.tweens.add({ targets: hint, alpha: 1, duration: 200 });
        const ghost = current.getByName('ghost') as Phaser.GameObjects.Image | null;
        if (ghost !== null) {
          ghost.setFlipX(this.walker.sprite.flipX);
          this.tweens.add({ targets: ghost, alpha: 0.75, duration: 450, ease: 'Sine.easeOut' });
        }
        current.setDepth(14);
        bus.emit('sfx', 'painting.near');
      }
      bus.emit('hub:focus', nearId);
      document.body.dataset.near = nearId ?? '';
    }
  }
}

function shorten(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}
