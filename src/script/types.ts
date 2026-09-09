/**
 * Typy case'a i beatów — kontrakt zgodny z content/schema/case.schema.json.
 * Schema zod w src/content/loader.ts jest typowana jako z.ZodType<Case>, więc rozjazd
 * między tym plikiem a walidatorem jest błędem kompilacji.
 *
 * Pola opcjonalne mają typ `T | undefined` (exactOptionalPropertyTypes + wyjście zod).
 */
export type World = 'kultura' | 'edukacja' | 'biznes';

export interface Reward {
  /** Numer fragmentu obrazu (1..cols*rows) przyznawany za sukces. */
  fragment: number;
}

export interface ChoiceOption {
  text: string;
  correct: boolean;
  skill?: string | undefined;
  feedback: string;
}

export interface NarrationBeat {
  id: string;
  type: 'narration';
  text: string;
  advance: 'tap' | 'auto';
  durationMs?: number | undefined;
}

export interface ChoiceBeat {
  id: string;
  type: 'choice';
  prompt: string;
  obstacle: string;
  timerMs: number;
  options: ChoiceOption[];
  reward?: Reward | undefined;
}

export interface ActionBeat {
  id: string;
  type: 'action';
  prompt: string;
  input: 'jump';
  obstacle: string;
  windowMs: number;
  reward?: Reward | undefined;
}

export type WidgetKind = 'button' | 'reveal' | 'puzzle';

export interface Counter {
  from: number;
  to: number;
  suffix?: string | undefined;
}

export interface InteractionBeat {
  id: string;
  type: 'interaction';
  widget: WidgetKind;
  label?: string | undefined;
  style?: string | undefined;
  counter?: Counter | undefined;
  text?: string | undefined;
  reward?: Reward | undefined;
}

export interface StatDelta {
  skill: string;
  delta: number;
}

export interface Kpi {
  label: string;
  value: string;
}

export interface ResultsBeat {
  id: string;
  type: 'results';
  stats: StatDelta[];
  kpis: Kpi[];
}

export interface Cta {
  label: string;
  url: string;
}

export interface FinaleBeat {
  id: string;
  type: 'finale';
  text: string;
  cta: Cta;
}

export type Beat =
  NarrationBeat | ChoiceBeat | ActionBeat | InteractionBeat | ResultsBeat | FinaleBeat;

export type BeatType = Beat['type'];

export interface Painting {
  src: string;
  cols: number;
  rows: number;
  caption: string;
}

export interface RunnerConfig {
  theme: World;
  baseSpeed: number;
  choiceSlowdown: number;
}

export interface Case {
  id: string;
  world: World;
  title: string;
  lead: string;
  role: string;
  skills: string[];
  painting: Painting;
  runner: RunnerConfig;
  beats: Beat[];
}

/** Liczba fragmentów obrazu = liczba pól siatki. */
export function totalFragments(kejs: Case): number {
  return kejs.painting.cols * kejs.painting.rows;
}

/** Beat, który może przyznać fragment. */
export type RewardingBeat = ChoiceBeat | ActionBeat | InteractionBeat;

export function hasReward(beat: Beat): beat is RewardingBeat & { reward: Reward } {
  return (
    (beat.type === 'choice' || beat.type === 'action' || beat.type === 'interaction') &&
    beat.reward !== undefined
  );
}
