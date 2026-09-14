import Phaser from 'phaser';
import { textureKey } from '../assets/manifest';
import type { World } from '../script/types';
import { prefersReducedMotion } from '../ui/dom';

/**
 * Atmosfera biegu (GRIS: powoli, miękko): snopy światła kołyszące się nad drogą (blend ADD),
 * pyłki kurzu unoszące się w powietrzu, smugi prędkości, gdy świat pędzi (narracja trzymanym
 * klawiszem). Wszystko respektuje prefers-reduced-motion (mniej cząsteczek, bez kołysania).
 */
export class Atmosphere {
  private readonly rays: Phaser.GameObjects.Image[] = [];
  private readonly motes: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly streaks: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly reducedMotion = prefersReducedMotion();
  private baseSpeed = 1;

  constructor(
    scene: Phaser.Scene,
    width: number,
    height: number,
    groundY: number,
    world: World | undefined,
  ) {
    const tint = world === 'biznes' ? 0x9fd8d0 : world === 'edukacja' ? 0xfff2cc : 0xffd9a0;
    const rayCount = this.reducedMotion ? 2 : 4;
    for (let i = 0; i < rayCount; i += 1) {
      const x = width * (0.18 + (i * 0.64) / Math.max(1, rayCount - 1));
      const ray = scene.add
        .image(x, -20, textureKey('fx.ray'))
        .setOrigin(0.5, 0)
        .setDepth(-55)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(tint)
        .setAlpha(0.08 + (i % 2) * 0.04)
        .setScale(1.1 + (i % 3) * 0.25, (groundY + 40) / 480)
        .setAngle(-14 + i * 7);
      this.rays.push(ray);
      if (!this.reducedMotion) {
        scene.tweens.add({
          targets: ray,
          angle: ray.angle + 5,
          alpha: ray.alpha + 0.05,
          duration: 5200 + i * 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }

    this.motes = scene.add.particles(0, 0, textureKey('fx.mote'), {
      x: { min: -20, max: width + 20 },
      y: { min: 20, max: groundY - 10 },
      lifespan: { min: 4000, max: 8000 },
      speedX: { min: -14, max: -4 },
      speedY: { min: -6, max: 6 },
      scale: { start: 0.3, end: 0.9 },
      // Pyłek wyłania się i gaśnie: interpolacja po trzech wartościach.
      alpha: { values: [0, 0.55, 0], interpolation: 'catmull' },
      frequency: this.reducedMotion ? 900 : 260,
      quantity: 1,
      blendMode: Phaser.BlendModes.ADD,
      tint,
    });
    this.motes.setDepth(-52);

    this.streaks = scene.add.particles(width + 60, 0, textureKey('fx.streak'), {
      y: { min: 30, max: groundY - 20 },
      lifespan: 420,
      speedX: { min: -1400, max: -900 },
      scaleX: { min: 1.2, max: 2.6 },
      alpha: { start: 0.35, end: 0 },
      frequency: -1,
      quantity: 1,
      blendMode: Phaser.BlendModes.ADD,
      tint,
    });
    this.streaks.setDepth(-51);
    this.motes.setAlpha(0);
    scene.tweens.add({ targets: this.motes, alpha: 1, duration: 1200 });
  }

  /** Prędkość bazowa świata — smugi pojawiają się powyżej niej. */
  setBaseSpeed(pxPerSec: number): void {
    this.baseSpeed = Math.max(1, pxPerSec);
  }

  update(deltaMs: number, worldSpeedPxPerSec: number): void {
    if (this.reducedMotion) return;
    const boost = worldSpeedPxPerSec / this.baseSpeed - 1.05;
    if (boost <= 0) return;
    // Im szybciej, tym gęściej: do ~2 smug na klatkę przy 2× prędkości.
    const rate = Math.min(2, boost * 4) * (deltaMs / 16.7);
    if (Math.random() < rate) this.streaks.explode(1);
  }

  /** Finał: gaśnie, żeby nie konkurować z obrazem. */
  fadeOut(scene: Phaser.Scene): void {
    scene.tweens.add({ targets: [...this.rays, this.motes], alpha: 0, duration: 1200 });
    this.streaks.stop();
  }
}
