import Phaser from 'phaser';
import { HOTEL_KEYS, PAINT_SCALE, WALL_TILE, worldTheme } from '../assets/generators/hotel';
import { HOTEL } from '../config/hotel';
import { statueImageKey } from '../assets/manifest';
import type { World } from '../script/types';
import { prefersReducedMotion } from '../ui/dom';

/**
 * Jedno piętro hotelu: korytarz w wersji pixelartowej i malarskiej (przenikanie wg ułamka
 * odrestaurowanych obrazów), drzwi, kinkiety z płomieniem, posąg, rośliny.
 * Obrazy i winda żyją w scenie — piętro to tło i meble.
 */
export interface FloorView {
  world: World;
  index: number;
  top: number;
  floorY: number;
}

export class Floor {
  private readonly paintLayers: Phaser.GameObjects.GameObject[] = [];
  private readonly paintTile: Phaser.GameObjects.TileSprite;
  private readonly flames: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private readonly reducedMotion = prefersReducedMotion();
  readonly statue: Phaser.GameObjects.Image;
  private restoration = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly view: FloorView,
    initialRestoration: number,
    statueX: number,
  ) {
    const { world, top, floorY } = view;
    const width = HOTEL.floorWidth;
    const theme = worldTheme(world);
    scene.add
      .tileSprite(0, top, width, WALL_TILE.height, HOTEL_KEYS.wall(world, 'pixel'))
      .setOrigin(0, 0)
      .setDepth(0);
    this.paintTile = scene.add
      .tileSprite(0, top, width, WALL_TILE.height, HOTEL_KEYS.wall(world, 'paint'))
      .setOrigin(0, 0)
      .setDepth(1)
      .setTileScale(1 / PAINT_SCALE);
    this.paintLayers.push(this.paintTile);

    // Drzwi między obrazami (co drugi odstęp) i kinkiety nad każdą przerwą.
    for (
      let x = HOTEL.firstPaintingX + HOTEL.paintingGap / 2;
      x < width - 300;
      x += HOTEL.paintingGap
    ) {
      const doorIndex = Math.round((x - HOTEL.firstPaintingX) / HOTEL.paintingGap);
      if (doorIndex % 2 === 1) {
        scene.add.image(x, floorY, HOTEL_KEYS.door('pixel')).setOrigin(0.5, 1).setDepth(2);
        const paintDoor = scene.add
          .image(x, floorY, HOTEL_KEYS.door('paint'))
          .setOrigin(0.5, 1)
          .setScale(1 / PAINT_SCALE)
          .setDepth(3);
        this.paintLayers.push(paintDoor);
      } else {
        this.addSconce(x, top + 150);
      }
    }
    this.addSconce(HOTEL.elevatorX + 130, top + 150);
    scene.add
      .image(statueX - 120, floorY, HOTEL_KEYS.plant)
      .setOrigin(0.5, 1)
      .setDepth(4);
    scene.add
      .image(HOTEL.elevatorX + 200, floorY, HOTEL_KEYS.plant)
      .setOrigin(0.5, 1)
      .setDepth(4);
    // Posąg: render z Meshy (jeśli wczytany) barwiony per świat, inaczej popiersie rysowane kodem.
    const statueKey = statueImageKey(world);
    if (scene.textures.exists(statueKey)) {
      const tint = world === 'biznes' ? 0xc9a063 : world === 'edukacja' ? 0xf2f4ef : 0xe6d7c3;
      // Cokół pod renderem, żeby posąg nie „wisiał” nad podłogą.
      scene.add.rectangle(statueX, floorY, 72, 14, theme.wainscot, 1).setOrigin(0.5, 1).setDepth(5);
      scene.add
        .rectangle(statueX, floorY - 14, 60, 4, theme.ornament, 0.9)
        .setOrigin(0.5, 1)
        .setDepth(5);
      this.statue = scene.add
        .image(statueX, floorY - 18, statueKey)
        .setOrigin(0.5, 1)
        .setDepth(5)
        .setTint(tint);
      this.statue.setScale(180 / this.statue.height);
    } else {
      this.statue = scene.add
        .image(statueX, floorY, HOTEL_KEYS.statue(world))
        .setOrigin(0.5, 1)
        .setDepth(5);
    }

    // Tabliczka piętra przy windzie.
    scene.add
      .rectangle(HOTEL.elevatorX, top + 90, 110, 22, theme.wainscot, 1)
      .setStrokeStyle(2, theme.ornament, 0.9)
      .setDepth(6);
    this.setRestoration(initialRestoration);
  }

  private addSconce(x: number, y: number): void {
    this.scene.add.image(x, y, HOTEL_KEYS.sconce('pixel')).setOrigin(0.5, 0.5).setDepth(2);
    const paint = this.scene.add
      .image(x, y, HOTEL_KEYS.sconce('paint'))
      .setOrigin(0.5, 0.5)
      .setScale(1 / PAINT_SCALE)
      .setDepth(3);
    this.paintLayers.push(paint);
    const halo = this.scene.add
      .image(x, y - 6, HOTEL_KEYS.glow)
      .setDepth(3)
      .setTint(0xdfb67c)
      .setAlpha(0.55)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.7);
    if (!this.reducedMotion) {
      this.scene.tweens.add({
        targets: halo,
        alpha: { from: 0.45, to: 0.7 },
        scale: { from: 0.66, to: 0.74 },
        duration: 900 + Math.round(Math.random() * 500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    const flame = this.scene.add.particles(x, y - 6, HOTEL_KEYS.flame, {
      x: { min: -2, max: 2 },
      lifespan: { min: 260, max: 520 },
      speedY: { min: -46, max: -22 },
      speedX: { min: -6, max: 6 },
      scale: { start: 0.9, end: 0.1 },
      alpha: { start: 0.95, end: 0 },
      frequency: this.reducedMotion ? 220 : 70,
      quantity: 1,
      blendMode: Phaser.BlendModes.ADD,
    });
    flame.setDepth(4);
    this.flames.push(flame);
  }

  get restorationFraction(): number {
    return this.restoration;
  }

  /** Natychmiastowe ustawienie ułamka „malarskości”. */
  setRestoration(fraction: number): void {
    this.restoration = Math.max(0, Math.min(1, fraction));
    for (const layer of this.paintLayers) {
      (layer as Phaser.GameObjects.Image).setAlpha(this.restoration);
    }
  }

  /**
   * Fala naprawy: malarska wersja rozlewa się kołem z punktu (odrestaurowany obraz) na całe
   * piętro, potem zostaje jako nowy ułamek.
   */
  restoreFrom(x: number, y: number, fraction: number, durationMs = 2600): Promise<void> {
    const from = this.restoration;
    const to = Math.max(0, Math.min(1, fraction));
    if (to <= from) {
      this.setRestoration(to);
      return Promise.resolve();
    }
    if (this.reducedMotion) {
      this.setRestoration(to);
      return Promise.resolve();
    }
    const wave = this.scene.add
      .tileSprite(
        0,
        this.view.top,
        HOTEL.floorWidth,
        WALL_TILE.height,
        HOTEL_KEYS.wall(this.view.world, 'paint'),
      )
      .setOrigin(0, 0)
      .setDepth(1.5)
      .setTileScale(1 / PAINT_SCALE)
      .setAlpha(to);
    const shape = this.scene.make.graphics({ x: 0, y: 0 }, false);
    const mask = shape.createGeometryMask();
    wave.setMask(mask);
    const ring = this.scene.add
      .circle(x, y, 10, 0xdfb67c, 0)
      .setStrokeStyle(4, 0xdfb67c, 0.8)
      .setDepth(7);
    const proxy = { r: 10 };
    const maxR = HOTEL.floorWidth + 200;
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: proxy,
        r: maxR,
        duration: durationMs,
        ease: 'Cubic.easeOut',
        onUpdate: () => {
          shape.clear();
          shape.fillStyle(0xffffff, 1);
          shape.fillCircle(x, y, proxy.r);
          ring.setRadius(Math.min(proxy.r, 900)).setAlpha(Math.max(0, 1 - proxy.r / 1200));
        },
        onComplete: () => {
          this.setRestoration(to);
          wave.clearMask(true);
          wave.destroy();
          shape.destroy();
          ring.destroy();
          resolve();
        },
      });
    });
  }

  /** Posąg: reakcja na klik (easter egg). */
  pokeStatue(count: number): void {
    if (this.reducedMotion) return;
    this.scene.tweens.add({
      targets: this.statue,
      angle: count % 2 === 0 ? 3 : -3,
      duration: 90,
      yoyo: true,
    });
  }
}
