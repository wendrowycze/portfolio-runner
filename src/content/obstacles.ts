import type { AssetKey } from '../assets/manifest';

/**
 * Słownik przeszkód: klucz z JSON case'a -> etykieta + tekstura placeholder + wymiary.
 * Nowa przeszkoda w treści = nowy wpis tutaj + generator tekstury w BootScene.
 */
export interface ObstacleDef {
  /** Klucz tekstury z manifestu. */
  texture: AssetKey;
  /** Szerokość/wysokość tekstury (px) — spójne z generatorem. */
  width: number;
  height: number;
  /** Szerokość ciała fizycznego (px) — nieco węższa niż grafika, żeby kolizje były „uczciwe”. */
  bodyWidth: number;
  bodyHeight: number;
}

export const OBSTACLES = {
  barierka: {
    texture: 'obstacle.barierka',
    width: 72,
    height: 52,
    bodyWidth: 56,
    bodyHeight: 44,
  },
  skrzynia: {
    texture: 'obstacle.skrzynia',
    width: 52,
    height: 52,
    bodyWidth: 44,
    bodyHeight: 46,
  },
  kolumna: {
    texture: 'obstacle.kolumna',
    width: 44,
    height: 76,
    bodyWidth: 32,
    bodyHeight: 70,
  },
  'kordon-kamer': {
    texture: 'obstacle.kordon-kamer',
    width: 104,
    height: 72,
    bodyWidth: 88,
    bodyHeight: 60,
  },
  boty: {
    texture: 'obstacle.boty',
    width: 96,
    height: 64,
    bodyWidth: 80,
    bodyHeight: 52,
  },
  telefony: {
    texture: 'obstacle.telefony',
    width: 72,
    height: 60,
    bodyWidth: 60,
    bodyHeight: 52,
  },
  brama: {
    texture: 'obstacle.brama',
    width: 84,
    height: 84,
    bodyWidth: 70,
    bodyHeight: 78,
  },
} as const satisfies Record<string, ObstacleDef>;

export type ObstacleKey = keyof typeof OBSTACLES;

export const OBSTACLE_KEYS = Object.keys(OBSTACLES) as ObstacleKey[];

export function isObstacleKey(key: string): key is ObstacleKey {
  return Object.hasOwn(OBSTACLES, key);
}

/** Przeszkoda dla nieznanego klucza — bezpieczny fallback zamiast crasha na złej treści. */
export function obstacleDef(key: string): ObstacleDef {
  return isObstacleKey(key) ? OBSTACLES[key] : OBSTACLES.skrzynia;
}
