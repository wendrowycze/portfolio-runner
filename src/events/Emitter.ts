/**
 * Minimalny, typowany emiter zdarzeń — bez zależności od Phasera, żeby logika w script/
 * dawała się testować w Node (Vitest) i żeby UI nie importowało nic z silnika gry.
 */
export type EventMap = Record<string, unknown[]>;

type AnyListener = (...args: unknown[]) => void;

export class Emitter<E extends EventMap> {
  private readonly listeners = new Map<keyof E, Set<AnyListener>>();

  on<K extends keyof E>(event: K, listener: (...args: E[K]) => void): () => void {
    let set = this.listeners.get(event);
    if (set === undefined) {
      set = new Set();
      this.listeners.set(event, set);
    }
    const anyListener = listener as unknown as AnyListener;
    set.add(anyListener);
    return () => {
      set.delete(anyListener);
    };
  }

  once<K extends keyof E>(event: K, listener: (...args: E[K]) => void): () => void {
    const off = this.on(event, (...args) => {
      off();
      listener(...args);
    });
    return off;
  }

  off<K extends keyof E>(event: K, listener: (...args: E[K]) => void): void {
    this.listeners.get(event)?.delete(listener as unknown as AnyListener);
  }

  emit<K extends keyof E>(event: K, ...args: E[K]): void {
    const set = this.listeners.get(event);
    if (set === undefined) return;
    // Kopia — słuchacz może się wypisać w trakcie emisji.
    for (const listener of [...set]) {
      listener(...args);
    }
  }

  removeAll(): void {
    this.listeners.clear();
  }
}
