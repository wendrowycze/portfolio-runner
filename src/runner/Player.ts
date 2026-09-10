import type Phaser from 'phaser';
import { PLAYER_RUN_FRAMES, playerRunFrameKey, textureKey } from '../assets/manifest';
import { PLAYER_SIZE } from '../assets/generators/player';
import { TUNING } from '../config/tuning';
import { col } from '../assets/generators/draw';
import { bus } from '../events/bus';

export type PlayerState = 'run' | 'jump' | 'stumble' | 'idle';

const ANIM_RUN = 'player-run';

/**
 * Postać: bieg automatyczny (świat się przesuwa, postać stoi w miejscu na osi X),
 * skok i potknięcie na Arcade Physics.
 */
export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private state: PlayerState = 'run';
  private stumbleUntil = 0;
  private breathing: Phaser.Tweens.Tween | undefined;
  private readonly dust: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly reducedMotion: boolean;

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    private readonly groundY: number,
  ) {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.ensureAnimations(scene);

    this.sprite = scene.physics.add.sprite(x, groundY, playerRunFrameKey(0));
    this.sprite.setOrigin(0.5, 1).setDepth(10);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBodySize(PLAYER_SIZE.width * 0.5, PLAYER_SIZE.height * 0.9, true);
    this.sprite.play(ANIM_RUN);

    this.dust = scene.add.particles(0, 0, textureKey('fx.dust'), {
      x: { min: -6, max: 6 },
      y: 0,
      lifespan: { min: 250, max: 450 },
      speedX: { min: -90, max: -40 },
      speedY: { min: -40, max: -10 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.7, end: 0 },
      frequency: 90,
      quantity: 1,
      emitting: true,
    });
    this.dust.setDepth(9);
    this.dust.startFollow(this.sprite, -8, 0);
  }

  private ensureAnimations(scene: Phaser.Scene): void {
    if (scene.anims.exists(ANIM_RUN)) return;
    const frames: Phaser.Types.Animations.AnimationFrame[] = [];
    for (let i = 0; i < PLAYER_RUN_FRAMES; i += 1) {
      frames.push({ key: playerRunFrameKey(i) });
    }
    scene.anims.create({ key: ANIM_RUN, frames, frameRate: TUNING.RUN_ANIM_FPS, repeat: -1 });
  }

  get currentState(): PlayerState {
    return this.state;
  }

  get isOnGround(): boolean {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body | null;
    return body?.blocked.down === true || this.sprite.y >= this.groundY - 0.5;
  }

  get isStumbling(): boolean {
    return this.state === 'stumble';
  }

  /** Wraca do biegu (np. po idle w results). */
  run(): void {
    if (this.state === 'stumble' || this.state === 'jump') return;
    this.state = 'run';
    this.stopBreathing();
    this.sprite.play(ANIM_RUN, true);
    if (!this.sprite.anims.forward) this.sprite.anims.reverse();
    this.dust.start();
  }

  idle(): void {
    if (this.state === 'stumble') return;
    this.state = 'idle';
    this.sprite.anims.stop();
    this.sprite.setTexture(textureKey('player.idle'));
    this.dust.stop();
    if (!this.reducedMotion) {
      // Oddech: delikatne unoszenie barków, żeby postać nie „zamarzała”.
      this.breathing = this.scene.tweens.add({
        targets: this.sprite,
        scaleY: 1.025,
        scaleX: 0.99,
        duration: 1300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private stopBreathing(): void {
    if (this.breathing === undefined) return;
    this.breathing.stop();
    this.breathing = undefined;
    this.sprite.setScale(1);
  }

  /** Skok — tylko z ziemi i nie w trakcie potknięcia. Zwraca true, jeśli skok się odbył. */
  jump(): boolean {
    if (!this.isOnGround || this.state === 'stumble') return false;
    this.state = 'jump';
    this.sprite.setVelocityY(TUNING.JUMP_VELOCITY);
    this.sprite.anims.stop();
    this.sprite.setTexture(textureKey('player.jump'));
    this.dust.stop();
    if (!this.reducedMotion) {
      this.scene.tweens.add({
        targets: this.sprite,
        scaleX: 0.86,
        scaleY: 1.14,
        duration: 110,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    }
    bus.emit('runner:jump');
    return true;
  }

  /** Potknięcie: przechył, błysk, chwilowe „ciemniejsze” tło ruchu. */
  stumble(): void {
    if (this.state === 'stumble') return;
    this.state = 'stumble';
    this.stumbleUntil = this.scene.time.now + TUNING.STUMBLE_ANIM_MS;
    this.sprite.anims.stop();
    this.sprite.setTexture(textureKey('player.stumble'));
    this.sprite.setTint(col('warn'));
    this.dust.explode(10);
    this.dust.stop();
    if (!this.reducedMotion) {
      this.scene.tweens.add({
        targets: this.sprite,
        angle: 14,
        duration: TUNING.STUMBLE_ANIM_MS * 0.4,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.sprite.setAngle(0);
        },
      });
      this.scene.cameras.main.shake(150, 0.004);
    }
    this.scene.time.delayedCall(TUNING.STUMBLE_ANIM_MS * 0.5, () => {
      this.sprite.clearTint();
    });
    bus.emit('runner:stumble');
  }

  /**
   * Tempo animacji biegu względem mnożnika czasu świata: przy time dilation postać
   * zwalnia mniej niż tło (GDD sekcja c) — wykładnik dobrany tak, by 0.35 → 0.7.
   * Wartość ujemna = cofanie: ta sama animacja odtwarzana wstecz (jak przewijanie taśmy).
   */
  setTimeScale(timeScale: number): void {
    const exponent =
      Math.log(TUNING.PLAYER_ANIM_DILATION_MULT) / Math.log(TUNING.TIME_DILATION_FACTOR);
    const magnitude = Math.abs(timeScale);
    const animScale = magnitude <= 0 ? 0 : Math.pow(magnitude, exponent);
    this.sprite.anims.timeScale = Math.max(animScale, 0.0001);
    if (this.state !== 'run') return;
    const anims = this.sprite.anims;
    if (magnitude <= 0.02) {
      if (!anims.isPaused) {
        anims.pause();
        this.dust.stop();
      }
      return;
    }
    if (anims.isPaused) anims.resume();
    const backwards = timeScale < 0;
    if (backwards === anims.forward) anims.reverse();
    if (backwards) this.dust.stop();
    else if (!this.dust.emitting) this.dust.start();
  }

  update(now: number): void {
    if (this.state === 'stumble') {
      if (now >= this.stumbleUntil) {
        this.state = 'run';
        this.sprite.setAngle(0);
        this.sprite.play(ANIM_RUN, true);
        this.dust.start();
      }
      return;
    }
    if (this.state === 'jump' && this.isOnGround) {
      const body = this.sprite.body as Phaser.Physics.Arcade.Body | null;
      if (body !== null && body.velocity.y >= 0) {
        this.state = 'run';
        this.sprite.play(ANIM_RUN, true);
        this.dust.explode(6);
        this.dust.start();
        if (!this.reducedMotion) {
          // Lądowanie: „squash” (GRIS/Hades — ciężar postaci widać w stopach).
          this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.14,
            scaleY: 0.86,
            duration: 90,
            yoyo: true,
            ease: 'Quad.easeOut',
          });
        }
      }
    }
  }

  destroy(): void {
    this.stopBreathing();
    this.dust.destroy();
    this.sprite.destroy();
  }
}
