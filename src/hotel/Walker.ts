import type Phaser from 'phaser';
import { PLAYER_RUN_FRAMES, playerRunFrameKey, textureKey } from '../assets/manifest';
import { HOTEL } from '../config/hotel';
import { prefersReducedMotion } from '../ui/dom';

const ANIM_WALK = 'hotel-walk';

/**
 * Gość hotelu: ta sama sylwetka co w biegu, ale chodzi (wolniej, bez fizyki) w lewo/prawo po
 * korytarzu piętra. Cel: klawisz trzymany (kierunek) albo punkt kliknięty na podłodze.
 */
export class Walker {
  readonly sprite: Phaser.GameObjects.Sprite;
  private direction: -1 | 0 | 1 = 0;
  private target: number | undefined;
  private readonly reducedMotion = prefersReducedMotion();
  private bobPhase = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    private floorY: number,
    private readonly minX: number,
    private readonly maxX: number,
  ) {
    if (!scene.anims.exists(ANIM_WALK)) {
      const frames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = 0; i < PLAYER_RUN_FRAMES; i += 1) frames.push({ key: playerRunFrameKey(i) });
      scene.anims.create({ key: ANIM_WALK, frames, frameRate: 9, repeat: -1 });
    }
    this.sprite = scene.add.sprite(x, floorY, textureKey('player.idle')).setOrigin(0.5, 1);
    this.sprite.setDepth(30);
  }

  get x(): number {
    return this.sprite.x;
  }

  get moving(): boolean {
    return this.direction !== 0 || this.target !== undefined;
  }

  setDirection(direction: -1 | 0 | 1): void {
    this.direction = direction;
    if (direction !== 0) this.target = undefined;
  }

  walkTo(x: number): void {
    this.target = Math.max(this.minX, Math.min(this.maxX, x));
  }

  stop(): void {
    this.direction = 0;
    this.target = undefined;
  }

  /** Przeniesienie (winda): nowe piętro, ta sama pozycja x. */
  teleport(x: number, floorY: number): void {
    this.floorY = floorY;
    this.sprite.setPosition(x, floorY);
    this.stop();
  }

  update(deltaMs: number): void {
    let dir = this.direction;
    if (dir === 0 && this.target !== undefined) {
      const diff = this.target - this.sprite.x;
      if (Math.abs(diff) < 4) {
        this.target = undefined;
      } else {
        dir = diff > 0 ? 1 : -1;
      }
    }
    if (dir === 0) {
      if (this.sprite.anims.isPlaying) {
        this.sprite.anims.stop();
        this.sprite.setTexture(textureKey('player.idle'));
        this.sprite.setY(this.floorY);
      }
      return;
    }
    const step = (HOTEL.walkSpeed * deltaMs) / 1000;
    const next = Math.max(this.minX, Math.min(this.maxX, this.sprite.x + dir * step));
    this.sprite.setX(next);
    this.sprite.setFlipX(dir < 0);
    if (!this.sprite.anims.isPlaying) this.sprite.play(ANIM_WALK);
    if (!this.reducedMotion) {
      // Lekkie „bujanie” przy chodzeniu.
      this.bobPhase += deltaMs / 90;
      this.sprite.setY(this.floorY - Math.abs(Math.sin(this.bobPhase)) * 2);
    }
  }
}
