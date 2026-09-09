import type Phaser from 'phaser';
import { TUNING } from '../config/tuning';
import { bus } from '../events/bus';
import type { GameState } from '../state/GameState';

/**
 * Spowolnienie czasu świata. Jedno źródło prawdy: GameState.timeScale.
 * Paralaksa, przeszkody, animacja postaci i maszyna do pisania czytają tę samą wartość.
 */
export class TimeDilation {
  private tween: Phaser.Tweens.Tween | undefined;
  private readonly proxy: { value: number };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly state: GameState,
  ) {
    this.proxy = { value: state.timeScale };
  }

  get current(): number {
    return this.state.timeScale;
  }

  /** Płynne przejście do mnożnika (np. 0.35 na czas wyboru, 1 po rozwiązaniu, 0 = stop). */
  setTarget(
    target: number,
    durationMs: number = TUNING.TIME_DILATION_EASE_MS,
    ease = 'Sine.easeInOut',
  ): void {
    this.tween?.stop();
    this.proxy.value = this.state.timeScale;
    if (durationMs <= 0) {
      this.apply(target);
      return;
    }
    this.tween = this.scene.tweens.add({
      targets: this.proxy,
      value: target,
      duration: durationMs,
      ease,
      onUpdate: () => {
        this.apply(this.proxy.value);
      },
      onComplete: () => {
        this.apply(target);
      },
    });
  }

  /**
   * Śledzenie celu klatka po klatce (wykładnicze zbliżanie) — dla biegu sterowanego trzymanym
   * klawiszem w narracji. Przerywa aktywny tween. Dopuszcza wartości ujemne (cofanie).
   */
  track(target: number, deltaMs: number, responseMs: number): void {
    if (this.tween !== undefined) {
      this.tween.stop();
      this.tween = undefined;
    }
    const current = this.state.timeScale;
    const diff = target - current;
    if (Math.abs(diff) < 0.004) {
      this.apply(target);
      return;
    }
    const k = 1 - Math.exp(-deltaMs / Math.max(1, responseMs));
    this.apply(current + diff * k);
  }

  /** Time dilation na czas wyboru/QTE. */
  enter(factor: number = TUNING.TIME_DILATION_FACTOR): void {
    this.setTarget(factor);
  }

  exit(): void {
    this.setTarget(1);
  }

  /** Potknięcie: natychmiastowe zwolnienie, potem powrót (Quad.easeOut). */
  stumble(): void {
    this.apply(this.state.timeScale * TUNING.STUMBLE_SPEED_MULT);
    this.setTarget(1, TUNING.STUMBLE_RECOVERY_MS, 'Quad.easeOut');
  }

  private apply(value: number): void {
    if (value === this.state.timeScale) return;
    this.state.timeScale = value;
    bus.emit('time:scale', value);
  }

  destroy(): void {
    this.tween?.stop();
    this.tween = undefined;
  }
}
