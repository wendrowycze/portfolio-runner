export interface TypewriterOptions {
  /** Znaków na sekundę przy tempie 1.0. */
  cps: number;
  /** Mnożnik tempa czytany co klatkę (np. mnożnik czasu świata). Domyślnie 1. */
  rate?: (() => number) | undefined;
  /** Pokaż całość natychmiast (prefers-reduced-motion). */
  instant?: boolean | undefined;
  /** Wołane po każdej dopisanej porcji (np. przewijanie kontenera). */
  onProgress?: (() => void) | undefined;
}

export interface TypewriterHandle {
  readonly done: Promise<void>;
  readonly isDone: boolean;
  /** Dopisuje resztę natychmiast. */
  skip(): void;
  /** Przerywa bez dopisywania (np. zmiana widoku). */
  cancel(): void;
}

/**
 * Efekt maszyny do pisania na elemencie DOM. Tempo = cps × rate(), więc przy time dilation
 * (rate 0.35) tekst zwalnia razem ze światem, a przy stopie (rate 0) — stoi.
 */
export function typewrite(
  target: HTMLElement,
  text: string,
  options: TypewriterOptions,
): TypewriterHandle {
  let shown = 0;
  let carry = 0;
  let finished = false;
  let frame = 0;
  let lastTime = 0;
  let resolveDone: () => void = () => undefined;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  const render = (): void => {
    target.textContent = text.slice(0, shown);
    options.onProgress?.();
  };

  const finish = (): void => {
    if (finished) return;
    finished = true;
    shown = text.length;
    render();
    target.classList.remove('is-typing');
    if (frame !== 0) cancelAnimationFrame(frame);
    resolveDone();
  };

  const step = (time: number): void => {
    if (finished) return;
    const dt = lastTime === 0 ? 16 : Math.min(100, time - lastTime);
    lastTime = time;
    const rate = Math.max(0, options.rate?.() ?? 1);
    carry += (options.cps * rate * dt) / 1000;
    const chars = Math.floor(carry);
    if (chars > 0) {
      carry -= chars;
      shown = Math.min(text.length, shown + chars);
      render();
    }
    if (shown >= text.length) {
      finish();
      return;
    }
    frame = requestAnimationFrame(step);
  };

  target.textContent = '';
  if (options.instant === true || text.length === 0) {
    finish();
  } else {
    target.classList.add('is-typing');
    frame = requestAnimationFrame(step);
  }

  return {
    done,
    get isDone() {
      return finished;
    },
    skip: finish,
    cancel: () => {
      if (finished) return;
      finished = true;
      target.classList.remove('is-typing');
      if (frame !== 0) cancelAnimationFrame(frame);
      resolveDone();
    },
  };
}
