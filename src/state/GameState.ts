/**
 * Stan gry — wyłącznie w pamięci (ADR-4: brak localStorage w PoC).
 * Jeden obiekt współdzielony przez scenę biegu i UI; resetowany na wejściu do case'a.
 */
export interface GameState {
  /** Zebrane numery fragmentów obrazu (w kolejności zebrania). */
  fragments: number[];
  /** Suma przyrostów per skill (surowy licznik silnika). */
  skills: Record<string, number>;
  /** Licznik potknięć. */
  stumbles: number;
  /** Czas od startu case'a (ms, czas rzeczywisty). */
  elapsedMs: number;
  /**
   * Wspólny mnożnik czasu świata (1 = normalnie, 0.35 = time dilation, 0 = stop).
   * Jedno źródło prawdy dla paralaksy, przeszkód, animacji postaci i maszyny do pisania.
   */
  timeScale: number;
  /** Bazowa prędkość świata w px/s (z case'a lub TUNING.BASE_SPEED). */
  baseSpeed: number;
}

export function createGameState(baseSpeed: number): GameState {
  return {
    fragments: [],
    skills: {},
    stumbles: 0,
    elapsedMs: 0,
    timeScale: 1,
    baseSpeed,
  };
}

export function resetGameState(state: GameState, baseSpeed: number): void {
  state.fragments.length = 0;
  for (const key of Object.keys(state.skills)) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- czyścimy słownik in-place, żeby referencja została ta sama
    delete state.skills[key];
  }
  state.stumbles = 0;
  state.elapsedMs = 0;
  state.timeScale = 1;
  state.baseSpeed = baseSpeed;
}

/** Aktualna prędkość świata w px/s (baza × mnożnik czasu). */
export function worldSpeed(state: GameState): number {
  return state.baseSpeed * state.timeScale;
}
