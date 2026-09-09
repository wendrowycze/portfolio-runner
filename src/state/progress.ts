/**
 * Postęp gracza między case'ami — wyłącznie w pamięci (ADR-4: brak localStorage w PoC).
 * Zbiór id ukończonych historii; hub pokazuje ich obrazy jako odrestaurowane.
 */
export interface Progress {
  completed: Set<string>;
}

export function createProgress(): Progress {
  return { completed: new Set() };
}
