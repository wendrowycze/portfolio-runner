/**
 * Syntezowane dźwięki-placeholdery (decyzja Arka z 2026-09-10: na razie bez plików audio).
 * Web Audio API bez zależności: proste oscylatory, szum i obwiednie. Wszystko w jednym module,
 * żeby podmiana na pliki (ASSETS_ATTRIBUTION.md, public/assets/cc0/) sprowadzała się do
 * podmiany implementacji `play(name)`.
 */
export type Wave = OscillatorType;

export class AudioEngine {
  private context: AudioContext | undefined;
  private master: GainNode | undefined;
  private ambientGain: GainNode | undefined;
  private ambientNodes: AudioNode[] = [];
  private ambientTimer: number | undefined;
  private muted = false;
  private noiseBuffer: AudioBuffer | undefined;

  /** Tworzy kontekst dopiero po pierwszym geście użytkownika (polityka autoplay). */
  unlock(): void {
    if (this.context !== undefined) {
      if (this.context.state === 'suspended') void this.context.resume();
      return;
    }
    const Ctor = window.AudioContext as typeof AudioContext | undefined;
    if (Ctor === undefined) return;
    this.context = new Ctor();
    this.master = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(this.context.destination);
    this.ambientGain = this.context.createGain();
    this.ambientGain.gain.value = 0;
    this.ambientGain.connect(this.master);
  }

  get ready(): boolean {
    return this.context?.state === 'running';
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master !== undefined && this.context !== undefined) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.8, this.context.currentTime, 0.05);
    }
  }

  get isMuted(): boolean {
    return this.muted;
  }

  private get now(): number {
    return this.context?.currentTime ?? 0;
  }

  /** Ton z obwiednią ADSR-lite. */
  tone(
    frequency: number,
    durationMs: number,
    options: {
      type?: Wave;
      volume?: number;
      attackMs?: number;
      slideTo?: number;
      delayMs?: number;
    } = {},
  ): void {
    const ctx = this.context;
    const master = this.master;
    if (ctx === undefined || master === undefined) return;
    const t0 = this.now + (options.delayMs ?? 0) / 1000;
    const osc = ctx.createOscillator();
    osc.type = options.type ?? 'sine';
    osc.frequency.setValueAtTime(frequency, t0);
    if (options.slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, options.slideTo),
        t0 + durationMs / 1000,
      );
    }
    const gain = ctx.createGain();
    const volume = options.volume ?? 0.2;
    const attack = (options.attackMs ?? 8) / 1000;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durationMs / 1000);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + durationMs / 1000 + 0.05);
  }

  /** Krótki szum (kroki, potknięcie, pochodnia) przez filtr. */
  noise(
    durationMs: number,
    options: {
      volume?: number;
      filter?: number;
      type?: BiquadFilterType;
      delayMs?: number;
      q?: number;
    } = {},
  ): void {
    const ctx = this.context;
    const master = this.master;
    if (ctx === undefined || master === undefined) return;
    const t0 = this.now + (options.delayMs ?? 0) / 1000;
    const src = ctx.createBufferSource();
    src.buffer = this.getNoise(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = options.type ?? 'bandpass';
    filter.frequency.value = options.filter ?? 1200;
    filter.Q.value = options.q ?? 0.8;
    const gain = ctx.createGain();
    const volume = options.volume ?? 0.15;
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durationMs / 1000);
    src.connect(filter).connect(gain).connect(master);
    src.start(t0);
    src.stop(t0 + durationMs / 1000 + 0.05);
  }

  /** Akord (arpeggio przy stagger > 0). */
  chord(
    frequencies: number[],
    durationMs: number,
    staggerMs = 0,
    type: Wave = 'triangle',
    volume = 0.12,
  ): void {
    frequencies.forEach((f, i) => {
      this.tone(f, durationMs, { type, volume, delayMs: i * staggerMs, attackMs: 20 });
    });
  }

  /**
   * Tło: pad z dwóch rozstrojonych oscylatorów przez filtr dolnoprzepustowy + (opcjonalnie)
   * „trzask kominka”. Jeden aktywny ambient naraz; przełączenie = crossfade.
   */
  ambient(kind: 'none' | 'start' | 'hotel' | 'kultura' | 'edukacja' | 'biznes'): void {
    const ctx = this.context;
    const bus = this.ambientGain;
    if (ctx === undefined || bus === undefined) return;
    this.stopAmbient();
    if (kind === 'none') return;
    const nodes: AudioNode[] = [];
    const chordByKind: Record<Exclude<typeof kind, 'none'>, number[]> = {
      start: [55, 82.4],
      hotel: [65.4, 98, 130.8],
      kultura: [73.4, 110, 146.8, 220],
      edukacja: [65.4, 98, 164.8, 246.9],
      biznes: [58.3, 87.3, 174.6, 233.1],
    };
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = kind === 'start' ? 220 : 420;
    filter.connect(bus);
    nodes.push(filter);
    for (const f of chordByKind[kind]) {
      for (const detune of [-6, 6]) {
        const osc = ctx.createOscillator();
        osc.type = kind === 'biznes' ? 'sawtooth' : 'triangle';
        osc.frequency.value = f;
        osc.detune.value = detune;
        const g = ctx.createGain();
        g.gain.value = kind === 'biznes' ? 0.035 : 0.06;
        osc.connect(g).connect(filter);
        osc.start();
        nodes.push(osc, g);
      }
    }
    // Wolny LFO na filtrze — „oddech”.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = kind === 'start' ? 90 : 160;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    nodes.push(lfo, lfoGain);
    // Wiatr (start) albo kominek (hotel): szum przez filtr.
    if (kind === 'start' || kind === 'hotel') {
      const src = ctx.createBufferSource();
      src.buffer = this.getNoise(ctx);
      src.loop = true;
      const nf = ctx.createBiquadFilter();
      nf.type = kind === 'start' ? 'bandpass' : 'lowpass';
      nf.frequency.value = kind === 'start' ? 500 : 900;
      nf.Q.value = kind === 'start' ? 0.4 : 0.7;
      const ng = ctx.createGain();
      ng.gain.value = kind === 'start' ? 0.05 : 0.025;
      src.connect(nf).connect(ng).connect(bus);
      src.start();
      nodes.push(src, nf, ng);
      if (kind === 'hotel') {
        const crackle = (): void => {
          this.noise(40 + Math.random() * 60, {
            volume: 0.05,
            filter: 1800 + Math.random() * 1500,
            q: 2,
          });
          this.ambientTimer = window.setTimeout(crackle, 180 + Math.random() * 700);
        };
        this.ambientTimer = window.setTimeout(crackle, 400);
      }
    }
    this.ambientNodes = nodes;
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setValueAtTime(0.0001, ctx.currentTime);
    bus.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 2.5);
  }

  stopAmbient(): void {
    const ctx = this.context;
    const bus = this.ambientGain;
    if (this.ambientTimer !== undefined) {
      window.clearTimeout(this.ambientTimer);
      this.ambientTimer = undefined;
    }
    if (ctx === undefined || bus === undefined) return;
    const old = this.ambientNodes;
    this.ambientNodes = [];
    if (old.length === 0) return;
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setValueAtTime(bus.gain.value, ctx.currentTime);
    bus.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    window.setTimeout(() => {
      for (const node of old) {
        if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
          try {
            node.stop();
          } catch {
            // już zatrzymany
          }
        }
        node.disconnect();
      }
    }, 1400);
  }

  private getNoise(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer !== undefined) return this.noiseBuffer;
    const seconds = 1.5;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;
    return buffer;
  }
}
