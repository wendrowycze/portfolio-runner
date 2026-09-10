import Phaser from 'phaser';
import { FACADE_GATE, FACADE_TORCHES, HOTEL_KEYS } from '../assets/generators/hotel';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { bus } from '../events/bus';
import { prefersReducedMotion } from '../ui/dom';

/**
 * Ekran startowy (tablica FigJam, „ścieżka V1/V2”; referencja: Kingdom Two Crowns):
 * całkowita ciemność, pochodnia prowadzona kursorem/palcem odsłania fasadę pałacu,
 * kolejne pochodnie na fasadzie zapalają się w miarę wypełniania formularza w panelu,
 * po „Wejdź” brama się otwiera i kamera wjeżdża do środka.
 * Formularz jest w DOM (panel); scena zna tylko liczbę zapalonych pochodni z magistrali.
 */
export class StartScene extends Phaser.Scene {
  private darkness!: Phaser.GameObjects.RenderTexture;
  private torchLight!: Phaser.GameObjects.Image;
  private lightX: number = FACADE_GATE.x;
  private lightY: number = FACADE_GATE.y + 60;
  private pointerSeen = false;
  private lit = 0;
  private readonly torches: {
    flame: Phaser.GameObjects.Particles.ParticleEmitter;
    halo: Phaser.GameObjects.Image;
  }[] = [];
  private gateLeft!: Phaser.GameObjects.Image;
  private gateRight!: Phaser.GameObjects.Image;
  private entering = false;
  private readonly reducedMotion = prefersReducedMotion();
  private readonly unsubscribe: (() => void)[] = [];

  constructor() {
    super('StartScene');
  }

  create(): void {
    this.entering = false;
    this.lit = 0;
    this.torches.length = 0;
    document.body.dataset.scene = 'start';
    this.add.image(0, 0, HOTEL_KEYS.facade).setOrigin(0, 0).setDepth(0);
    this.gateLeft = this.add
      .image(FACADE_GATE.x, FACADE_GATE.y + FACADE_GATE.height, HOTEL_KEYS.gateDoor)
      .setOrigin(1, 1)
      .setDepth(2)
      .setFlipX(true);
    this.gateRight = this.add
      .image(FACADE_GATE.x, FACADE_GATE.y + FACADE_GATE.height, HOTEL_KEYS.gateDoor)
      .setOrigin(0, 1)
      .setDepth(2);
    // Ciepłe światło z okien (bardzo słabe, zanim zapłoną pochodnie).
    for (const t of FACADE_TORCHES) {
      this.add.image(t.x, t.y, HOTEL_KEYS.torch).setOrigin(0.5, 0).setDepth(3);
      const halo = this.add
        .image(t.x, t.y, HOTEL_KEYS.glow)
        .setDepth(4)
        .setTint(0xdfb67c)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0)
        .setScale(0.9);
      const flame = this.add.particles(t.x, t.y - 2, HOTEL_KEYS.flame, {
        x: { min: -3, max: 3 },
        lifespan: { min: 300, max: 600 },
        speedY: { min: -60, max: -30 },
        speedX: { min: -8, max: 8 },
        scale: { start: 1.2, end: 0.1 },
        alpha: { start: 1, end: 0 },
        frequency: 55,
        quantity: 1,
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      });
      flame.setDepth(5);
      this.torches.push({ flame, halo });
    }

    // Ciemność: RenderTexture wypełniana czernią, z której „wycieramy” światło pochodni.
    this.darkness = this.add
      .renderTexture(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .setOrigin(0, 0)
      .setDepth(10);
    this.torchLight = this.make.image({ key: HOTEL_KEYS.light, add: false }).setScale(1.4);

    this.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
      this.pointerSeen = true;
      this.lightX = pointer.x;
      this.lightY = pointer.y;
    });
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      this.pointerSeen = true;
      this.lightX = pointer.x;
      this.lightY = pointer.y;
    });

    this.unsubscribe.push(
      bus.on('start:progress', (lit) => {
        this.setLit(lit);
      }),
      bus.on('start:enter', () => {
        this.enter();
      }),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const off of this.unsubscribe) off();
      this.unsubscribe.length = 0;
    });
    this.cameras.main.fadeIn(900, 0, 0, 0);
  }

  private setLit(count: number): void {
    const next = Math.max(0, Math.min(this.torches.length, count));
    for (let i = 0; i < this.torches.length; i += 1) {
      const torch = this.torches[i];
      if (torch === undefined) continue;
      const on = i < next;
      const wasOn = i < this.lit;
      if (on && !wasOn) {
        torch.flame.start();
        torch.flame.explode(18);
        this.tweens.add({
          targets: torch.halo,
          alpha: 0.9,
          scale: 1.2,
          duration: 700,
          ease: 'Quad.easeOut',
        });
        bus.emit('sfx', 'torch');
        if (!this.reducedMotion) this.cameras.main.flash(180, 223, 182, 124, false);
      } else if (!on && wasOn) {
        torch.flame.stop();
        this.tweens.add({ targets: torch.halo, alpha: 0, scale: 0.9, duration: 400 });
      }
    }
    this.lit = next;
    document.body.dataset.torches = String(next);
  }

  private enter(): void {
    if (this.entering) return;
    this.entering = true;
    document.body.dataset.scene = 'entering';
    this.setLit(this.torches.length);
    bus.emit('sfx', 'gate');
    const camera = this.cameras.main;
    // Brama otwiera się do środka (skrzydła zwężają się w perspektywie), światło zalewa portal.
    this.tweens.add({
      targets: this.gateLeft,
      scaleX: 0.15,
      duration: 900,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: this.gateRight,
      scaleX: 0.15,
      duration: 900,
      ease: 'Sine.easeInOut',
    });
    const glow = this.add
      .image(FACADE_GATE.x, FACADE_GATE.y + FACADE_GATE.height / 2, HOTEL_KEYS.glow)
      .setDepth(3)
      .setTint(0xffe1a8)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0)
      .setScale(0.6);
    this.tweens.add({ targets: glow, alpha: 1, scale: 1.8, duration: 1100, ease: 'Quad.easeOut' });
    this.time.delayedCall(500, () => {
      camera.pan(FACADE_GATE.x, FACADE_GATE.y + FACADE_GATE.height / 2, 1300, 'Sine.easeIn');
      camera.zoomTo(4, 1300, 'Sine.easeIn');
      camera.fadeOut(1200, 223, 182, 124);
      camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        camera.setZoom(1);
        this.scene.start('HotelScene', { floor: 0 });
      });
    });
  }

  override update(time: number): void {
    if (!this.pointerSeen) {
      // Zanim gracz ruszy kursorem, pochodnia sama krąży przy bramie.
      this.lightX = FACADE_GATE.x + Math.sin(time / 1700) * 140;
      this.lightY = FACADE_GATE.y + 40 + Math.cos(time / 2300) * 60;
    }
    const flicker = this.reducedMotion
      ? 1
      : 1 + Math.sin(time / 90) * 0.04 + Math.sin(time / 37) * 0.02;
    const openness = this.entering ? 0.2 : 0.97 - this.lit * 0.12;
    this.darkness.clear();
    this.darkness.fill(0x000000, openness);
    this.torchLight.setScale(1.4 * flicker);
    this.darkness.erase(this.torchLight, this.lightX, this.lightY);
    for (let i = 0; i < this.lit; i += 1) {
      const t = FACADE_TORCHES[i];
      if (t === undefined) continue;
      this.torchLight.setScale(0.8 * flicker);
      this.darkness.erase(this.torchLight, t.x, t.y - 10);
    }
  }
}
