import type { Case } from '../script/types';
import { caseWarnings, loadCase } from './loader';

/**
 * Rejestr case'ów: id -> leniwy import JSON (osobny chunk Vite na case).
 * Kolejność = kolejność obrazów w hubie (rekomendacja z content/cases_raw/_INDEKS.md,
 * pilot pierwszy). `hidden` = niewidoczny w galerii (dostępny tylko przez ?case=).
 */
interface CaseEntry {
  load: () => Promise<{ default: unknown }>;
  hidden?: boolean;
}

const CASE_REGISTRY: Record<string, CaseEntry> = {
  'teatr-jest-nasz': { load: () => import('../../content/cases/teatr-jest-nasz.json') },
  'kultura-futura': { load: () => import('../../content/cases/kultura-futura.json') },
  'cyrograf-na-kwadrat': { load: () => import('../../content/cases/cyrograf-na-kwadrat.json') },
  'up-arta': { load: () => import('../../content/cases/up-arta.json') },
  'ko-kreacja-mkidn': { load: () => import('../../content/cases/ko-kreacja-mkidn.json') },
  kalejdoskop: { load: () => import('../../content/cases/kalejdoskop.json') },
  'ewaluacja-festiwali': { load: () => import('../../content/cases/ewaluacja-festiwali.json') },
  'gra-teatralna-improvisio': {
    load: () => import('../../content/cases/gra-teatralna-improvisio.json'),
  },
  'scouting-pfr': { load: () => import('../../content/cases/scouting-pfr.json') },
  _demo: { load: () => import('../../content/cases/_demo.json'), hidden: true },
};

export const DEFAULT_CASE_ID = 'teatr-jest-nasz';

/** Id case'ów widocznych w galerii hubu, w kolejności wieszania. */
export const GALLERY_CASE_IDS: readonly string[] = Object.entries(CASE_REGISTRY)
  .filter(([, entry]) => entry.hidden !== true)
  .map(([id]) => id);

export function isKnownCase(id: string): boolean {
  return Object.hasOwn(CASE_REGISTRY, id);
}

export async function fetchCase(id: string): Promise<Case> {
  const entry = CASE_REGISTRY[id];
  if (entry === undefined) {
    throw new Error(`Nieznany case: ${id}`);
  }
  const module = await entry.load();
  const kejs = loadCase(module.default);
  if (import.meta.env.DEV) {
    for (const warning of caseWarnings(kejs)) console.warn(`[content] ${warning}`);
  }
  return kejs;
}

/** Wszystkie case'y galerii (do hubu i wstępnego ładowania obrazów). */
export async function fetchGalleryCases(): Promise<Case[]> {
  return Promise.all(GALLERY_CASE_IDS.map((id) => fetchCase(id)));
}
