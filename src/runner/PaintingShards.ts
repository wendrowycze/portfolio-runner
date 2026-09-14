import type Phaser from 'phaser';
import { PAINTING_RASTER, paintingTextureKey } from '../assets/manifest';
import { clampToScreen, shardLayout, shardX, type ShardSlot } from './shardLayout';

/**
 * Kawałki obrazu „ukryte” w scenerii biegu: kafle obrazu case'a dryfują w warstwach paralaksy
 * (wyblakłe, sepiowe), po zebraniu fragmentu rozjaśniają się. Finał zbiera je z miejsc, w których
 * akurat są — tło dosłownie składa się w obraz.
 */
export class PaintingShards {
  private readonly tiles = new Map<number, Phaser.GameObjects.Image>();
  private readonly slots: ShardSlot[];
  private readonly cycleWidth: number;
  private readonly collected = new Set<number>();

  constructor(
    private readonly scene: Phaser.Scene,
    caseId: string,
    private readonly cols: number,
    private readonly rows: number,
    private readonly screenWidth: number,
    private readonly groundY: number,
    tileWidth = 96,
  ) {
    const total = cols * rows;
    this.cycleWidth = screenWidth * 2.2;
    this.slots = shardLayout(total, this.cycleWidth);
    const key = paintingTextureKey(caseId);
    const texture = scene.textures.get(key);
    const srcW = PAINTING_RASTER.width / cols;
    const srcH = PAINTING_RASTER.height / rows;
    for (const slot of this.slots) {
      const frameName = PaintingShards.frameName(cols, rows, slot.fragment);
      if (!texture.has(frameName)) {
        const c = (slot.fragment - 1) % cols;
        const r = Math.floor((slot.fragment - 1) / cols);
        texture.add(frameName, 0, c * srcW, r * srcH, srcW, srcH);
      }
      const tile = scene.add
        .image(0, groundY - slot.height * groundY, key, frameName)
        .setScale(tileWidth / srcW)
        .setDepth(slot.factor > 0.5 ? -58 : -68)
        .setAlpha(0.42)
        .setTint(0xc9ab7c)
        .setAngle((slot.fragment % 2 === 0 ? 1 : -1) * (4 + slot.fragment * 1.5));
      this.tiles.set(slot.fragment, tile);
      // Lekkie unoszenie — jak liście w powietrzu.
      scene.tweens.add({
        targets: tile,
        y: tile.y - 8 - slot.fragment * 2,
        duration: 2400 + slot.fragment * 380,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    this.update(0);
  }

  static frameName(cols: number, rows: number, fragment: number): string {
    return `tile-${String(cols)}x${String(rows)}-${String(fragment)}`;
  }

  /** Pozycje kafli wg przebytej drogi świata (px). */
  update(distance: number): void {
    for (const slot of this.slots) {
      const tile = this.tiles.get(slot.fragment);
      if (tile === undefined) continue;
      tile.setX(
        shardX(slot, distance, this.cycleWidth) - this.cycleWidth / 2 + this.screenWidth / 2,
      );
    }
  }

  /** Fragment zebrany: kafel rozjaśnia się i traci sepię (zostaje w scenerii do finału). */
  collect(fragment: number): void {
    if (this.collected.has(fragment)) return;
    this.collected.add(fragment);
    const tile = this.tiles.get(fragment);
    if (tile === undefined) return;
    tile.clearTint();
    this.scene.tweens.add({
      targets: tile,
      alpha: { from: 1, to: 0.85 },
      scale: { from: tile.scale * 1.25, to: tile.scale },
      duration: 700,
      ease: 'Back.easeOut',
    });
  }

  /**
   * Oddaje kafle finałowi: zatrzymuje unoszenie, sprowadza pozycje spoza kadru na ekran i podnosi
   * na wierzch. Zwraca kafle po numerach fragmentów (1..total).
   */
  handOff(depth: number): Map<number, Phaser.GameObjects.Image> {
    for (const [fragment, tile] of this.tiles) {
      this.scene.tweens.killTweensOf(tile);
      tile.setDepth(depth);
      tile.setX(clampToScreen(tile.x, this.screenWidth, 60));
      tile.setY(Math.min(tile.y, this.groundY - 40));
      if (!this.collected.has(fragment)) tile.setTint(0xdfb67c);
    }
    return this.tiles;
  }

  get gridSize(): { cols: number; rows: number } {
    return { cols: this.cols, rows: this.rows };
  }
}
