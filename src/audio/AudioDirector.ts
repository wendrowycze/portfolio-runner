import { bus, type SfxName } from '../events/bus';
import type { ScriptRunner } from '../script/ScriptRunner';
import { AudioEngine } from './AudioEngine';

/**
 * Reżyser dźwięku: tłumaczy zdarzenia magistrali i ScriptRunnera na dźwięki AudioEngine.
 * Jedyny moduł, który wie „co brzmi jak”; sceny i UI tylko emitują nazwy.
 * Nie importuje scen ani UI (CLAUDE.md: Phaser <-> DOM tylko przez magistralę).
 */
export class AudioDirector {
  private readonly engine = new AudioEngine();
  private readonly unsubscribe: (() => void)[] = [];
  private muted: boolean;
  private lastTypeAt = 0;

  constructor(runner: ScriptRunner, options: { muted: boolean }) {
    this.muted = options.muted;
    this.engine.setMuted(this.muted);
    const unlock = (): void => {
      this.engine.unlock();
    };
    // Kontekst audio wolno utworzyć dopiero po geście użytkownika.
    for (const type of ['pointerdown', 'keydown', 'touchstart']) {
      document.addEventListener(type, unlock, { passive: true });
    }
    this.unsubscribe.push(
      bus.on('sfx', (name) => {
        this.play(name);
      }),
      bus.on('audio:muted', (muted) => {
        this.muted = muted;
        this.engine.setMuted(muted);
      }),
      bus.on('runner:jump', () => {
        this.play('jump');
      }),
      bus.on('runner:stumble', () => {
        this.play('stumble');
      }),
      bus.on('finale:assembled', () => {
        this.play('finale');
      }),
      bus.on('hotel:floor', () => {
        this.engine.ambient('hotel');
      }),
      bus.on('hotel:restored', () => {
        this.play('restore');
      }),
      bus.on('hotel:statue', (_world, count) => {
        this.play('statue');
        if (count % 10 === 0) this.easterEgg();
      }),
      bus.on('runner:ready', () => {
        // Świat biegu: pad zależny od świata case'a ustawia main.ts przez `runner:world`.
      }),
      runner.on('fragment:collected', () => {
        this.play('fragment');
      }),
      runner.on('beat:resolved', (_beat, outcome) => {
        if (outcome.correct) this.play('success');
      }),
      runner.on('narration:progress', () => {
        // Cichy „tyk” maszyny do pisania w rytmie biegu — nie częściej niż co 70 ms.
        const now = performance.now();
        if (now - this.lastTypeAt > 70) {
          this.lastTypeAt = now;
          this.engine.tone(1800 + Math.random() * 400, 25, { type: 'square', volume: 0.012 });
        }
      }),
    );
  }

  /** Tło sceny. */
  ambient(kind: Parameters<AudioEngine['ambient']>[0]): void {
    this.engine.ambient(kind);
  }

  play(name: SfxName): void {
    const e = this.engine;
    switch (name) {
      case 'ui.tick':
        e.tone(880, 60, { type: 'square', volume: 0.05 });
        break;
      case 'ui.confirm':
        e.chord([523.3, 659.3, 784], 260, 40, 'triangle', 0.1);
        break;
      case 'ui.type':
        e.tone(2200, 20, { type: 'square', volume: 0.02 });
        break;
      case 'torch':
        e.noise(420, { volume: 0.22, filter: 900, type: 'bandpass', q: 0.6 });
        e.tone(220, 500, { type: 'sine', volume: 0.08, slideTo: 440, attackMs: 60 });
        break;
      case 'gate':
        e.noise(900, { volume: 0.18, filter: 300, type: 'lowpass' });
        e.chord([130.8, 196, 261.6, 392, 523.3], 1800, 120, 'triangle', 0.09);
        break;
      case 'walk.step':
        e.noise(60, { volume: 0.05, filter: 400 + Math.random() * 200, type: 'lowpass' });
        break;
      case 'elevator.ding':
        e.tone(1318.5, 380, { type: 'sine', volume: 0.12, attackMs: 4 });
        e.tone(1975.5, 300, { type: 'sine', volume: 0.06, delayMs: 60 });
        break;
      case 'elevator.move':
        e.tone(70, 1400, { type: 'triangle', volume: 0.1, slideTo: 95, attackMs: 300 });
        break;
      case 'painting.near':
        e.tone(1046.5, 120, { type: 'sine', volume: 0.05 });
        break;
      case 'painting.enter':
        e.chord([261.6, 329.6, 392, 523.3], 900, 70, 'sine', 0.1);
        e.noise(700, { volume: 0.06, filter: 2500, type: 'highpass' });
        break;
      case 'fragment':
        e.chord([1046.5, 1318.5, 1568], 360, 55, 'sine', 0.11);
        break;
      case 'choice.open':
        e.tone(392, 220, { type: 'triangle', volume: 0.07, slideTo: 349.2 });
        break;
      case 'timer.low':
        e.tone(330, 90, { type: 'square', volume: 0.05 });
        e.tone(330, 90, { type: 'square', volume: 0.05, delayMs: 140 });
        break;
      case 'success':
        e.chord([523.3, 784], 180, 60, 'triangle', 0.08);
        break;
      case 'stumble':
        e.noise(220, { volume: 0.2, filter: 250, type: 'lowpass' });
        e.tone(140, 260, { type: 'sawtooth', volume: 0.08, slideTo: 60 });
        break;
      case 'jump':
        e.tone(300, 180, { type: 'sine', volume: 0.08, slideTo: 640 });
        break;
      case 'finale':
        e.chord([261.6, 329.6, 392, 523.3, 659.3, 784], 2600, 140, 'triangle', 0.09);
        break;
      case 'restore':
        e.chord([196, 293.7, 392, 493.9, 587.3], 2200, 180, 'sine', 0.09);
        e.noise(1600, { volume: 0.05, filter: 3000, type: 'highpass' });
        break;
      case 'statue':
        e.tone(180, 90, { type: 'triangle', volume: 0.06, slideTo: 120 });
        break;
    }
  }

  /** 10 kliknięć w posąg: krótka melodyjka-placeholder (docelowo „Tacio”, max 10 s). */
  private easterEgg(): void {
    const melody = [392, 440, 493.9, 587.3, 493.9, 440, 392, 329.6, 392, 587.3, 784];
    melody.forEach((f, i) => {
      this.engine.tone(f, 220, { type: 'square', volume: 0.07, delayMs: i * 170, attackMs: 5 });
    });
  }

  destroy(): void {
    for (const off of this.unsubscribe) off();
    this.engine.stopAmbient();
  }
}
