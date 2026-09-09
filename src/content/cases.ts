import type { Case } from '../script/types';
import { caseWarnings, loadCase } from './loader';

/** Rejestr case'ów: id -> leniwy import JSON (osobny chunk Vite na case). */
const CASE_LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  _demo: () => import('../../content/cases/_demo.json'),
  'teatr-jest-nasz': () => import('../../content/cases/teatr-jest-nasz.json'),
};

export const DEFAULT_CASE_ID = '_demo';

export function isKnownCase(id: string): boolean {
  return Object.hasOwn(CASE_LOADERS, id);
}

export async function fetchCase(id: string): Promise<Case> {
  const loader = CASE_LOADERS[id];
  if (loader === undefined) {
    throw new Error(`Nieznany case: ${id}`);
  }
  const module = await loader();
  const kejs = loadCase(module.default);
  if (import.meta.env.DEV) {
    for (const warning of caseWarnings(kejs)) console.warn(`[content] ${warning}`);
  }
  return kejs;
}
