export type Layout = 'stack' | 'side';

const LAYOUTS: readonly Layout[] = ['stack', 'side'];

export function isLayout(value: string | null | undefined): value is Layout {
  return value !== null && value !== undefined && (LAYOUTS as readonly string[]).includes(value);
}

/**
 * Layout w runtime: parametr URL `?layout=stack|side` wygrywa; potem VITE_LAYOUT (build-time,
 * tylko wartość domyślna); na końcu `side` (decyzja Arka z 2026-09-09, docs/DZIENNIK.md).
 */
export function resolveLayout(search: string, envDefault: string | undefined): Layout {
  const fromUrl = new URLSearchParams(search).get('layout');
  if (isLayout(fromUrl)) return fromUrl;
  if (isLayout(envDefault)) return envDefault;
  return 'side';
}

/** Flaga boolean z URL: `?debug=1`, `?debug=true`. */
export function urlFlag(search: string, name: string): boolean {
  const value = new URLSearchParams(search).get(name);
  return value === '1' || value === 'true';
}
