import { z } from 'zod';
import type {
  Case,
  ChoiceOption,
  Counter,
  Cta,
  Kpi,
  Painting,
  Reward,
  RunnerConfig,
  StatDelta,
  World,
} from '../script/types';
import { isObstacleKey } from './obstacles';

/**
 * Walidacja case'a (ADR-7: zod). Schema odpowiada content/schema/case.schema.json
 * i jest typowana jako z.ZodType<Case> — rozjazd z src/script/types.ts nie skompiluje się.
 * Dodatkowo sprawdza reguły spójności spoza JSON Schema (fragmenty, skille, unikalne id).
 */

const WorldSchema: z.ZodType<World> = z.enum(['kultura', 'edukacja', 'biznes']);
const BeatId = z.string().regex(/^b[0-9]{2,}$/, 'id beatu musi mieć postać b01, b02, …');
const Text400 = z.string().min(1).max(400);

const RewardSchema: z.ZodType<Reward> = z.strictObject({ fragment: z.int().min(1) });

const ChoiceOptionSchema: z.ZodType<ChoiceOption> = z.strictObject({
  text: z.string().min(1),
  correct: z.boolean(),
  skill: z.string().min(1).optional(),
  feedback: z.string().min(1),
});

const NarrationSchema = z
  .strictObject({
    id: BeatId,
    type: z.literal('narration'),
    text: Text400,
    advance: z.enum(['tap', 'auto']),
    durationMs: z.int().min(0).optional(),
  })
  .refine((b) => b.advance !== 'auto' || b.durationMs !== undefined, {
    message: 'narration z advance="auto" wymaga durationMs',
    path: ['durationMs'],
  });

const ChoiceSchema = z
  .strictObject({
    id: BeatId,
    type: z.literal('choice'),
    prompt: Text400,
    obstacle: z.string().min(1),
    timerMs: z.int().positive(),
    options: z.array(ChoiceOptionSchema).min(2).max(3),
    reward: RewardSchema.optional(),
  })
  .refine((b) => b.options.some((o) => o.correct), {
    message: 'choice musi mieć co najmniej jedną opcję correct=true',
    path: ['options'],
  });

const ActionSchema = z.strictObject({
  id: BeatId,
  type: z.literal('action'),
  prompt: Text400,
  input: z.literal('jump'),
  obstacle: z.string().min(1),
  windowMs: z.int().positive(),
  reward: RewardSchema.optional(),
});

const CounterSchema: z.ZodType<Counter> = z.strictObject({
  from: z.number(),
  to: z.number(),
  suffix: z.string().optional(),
});

const InteractionSchema = z
  .strictObject({
    id: BeatId,
    type: z.literal('interaction'),
    widget: z.enum(['button', 'reveal', 'puzzle']),
    label: z.string().optional(),
    style: z.string().optional(),
    counter: CounterSchema.optional(),
    text: z.string().max(400).optional(),
    reward: RewardSchema.optional(),
  })
  .superRefine((b, ctx) => {
    if (b.widget === 'button') {
      if (b.label === undefined)
        ctx.addIssue({ code: 'custom', message: 'button wymaga label', path: ['label'] });
      if (b.counter === undefined)
        ctx.addIssue({ code: 'custom', message: 'button wymaga counter', path: ['counter'] });
    }
    if (b.text === undefined) {
      ctx.addIssue({ code: 'custom', message: `widget ${b.widget} wymaga text`, path: ['text'] });
    }
  });

const StatDeltaSchema: z.ZodType<StatDelta> = z.strictObject({
  skill: z.string().min(1),
  delta: z.number(),
});
const KpiSchema: z.ZodType<Kpi> = z.strictObject({
  label: z.string().min(1),
  value: z.string().min(1),
});

const ResultsSchema = z.strictObject({
  id: BeatId,
  type: z.literal('results'),
  stats: z.array(StatDeltaSchema).min(1),
  kpis: z.array(KpiSchema).min(1),
});

const CtaSchema: z.ZodType<Cta> = z.strictObject({
  label: z.string().min(1),
  url: z.url(),
});

const FinaleSchema = z.strictObject({
  id: BeatId,
  type: z.literal('finale'),
  text: Text400,
  cta: CtaSchema,
});

const BeatSchema = z.discriminatedUnion('type', [
  NarrationSchema,
  ChoiceSchema,
  ActionSchema,
  InteractionSchema,
  ResultsSchema,
  FinaleSchema,
]);

const PaintingSchema: z.ZodType<Painting> = z.strictObject({
  src: z.string().min(1),
  cols: z.int().min(1),
  rows: z.int().min(1),
  caption: z.string().min(1),
});

const RunnerConfigSchema: z.ZodType<RunnerConfig> = z.strictObject({
  theme: WorldSchema,
  baseSpeed: z.number().positive(),
  choiceSlowdown: z.number().positive().max(1),
});

export const CaseSchema: z.ZodType<Case> = z
  .strictObject({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id case’a: kebab-case'),
    world: WorldSchema,
    draft: z.boolean().optional(),
    title: z.string().min(1),
    lead: z.string().min(1),
    role: z.string().min(1),
    skills: z.array(z.string().min(1)).min(1).max(3),
    painting: PaintingSchema,
    runner: RunnerConfigSchema,
    beats: z.array(BeatSchema).min(1),
  })
  .superRefine((kejs, ctx) => {
    if (new Set(kejs.skills).size !== kejs.skills.length) {
      ctx.addIssue({ code: 'custom', message: 'skills muszą być unikalne', path: ['skills'] });
    }
    const ids = new Set<string>();
    const fragments = new Map<number, string>();
    const total = kejs.painting.cols * kejs.painting.rows;
    const skills = new Set(kejs.skills);
    kejs.beats.forEach((beat, index) => {
      if (ids.has(beat.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `powtórzone id beatu ${beat.id}`,
          path: ['beats', index, 'id'],
        });
      }
      ids.add(beat.id);
      if (beat.type === 'choice' || beat.type === 'action' || beat.type === 'interaction') {
        const fragment = beat.reward?.fragment;
        if (fragment !== undefined) {
          if (fragment > total) {
            ctx.addIssue({
              code: 'custom',
              message: `fragment ${String(fragment)} poza siatką ${String(total)}`,
              path: ['beats', index, 'reward'],
            });
          }
          const owner = fragments.get(fragment);
          if (owner !== undefined) {
            ctx.addIssue({
              code: 'custom',
              message: `fragment ${String(fragment)} przyznawany dwa razy (${owner}, ${beat.id})`,
              path: ['beats', index, 'reward'],
            });
          }
          fragments.set(fragment, beat.id);
        }
      }
      if (beat.type === 'choice') {
        beat.options.forEach((option, oi) => {
          if (option.skill !== undefined && !skills.has(option.skill)) {
            ctx.addIssue({
              code: 'custom',
              message: `skill „${option.skill}” nie występuje w case.skills`,
              path: ['beats', index, 'options', oi, 'skill'],
            });
          }
        });
      }
      if (beat.type === 'results') {
        beat.stats.forEach((stat, si) => {
          if (!skills.has(stat.skill)) {
            ctx.addIssue({
              code: 'custom',
              message: `skill „${stat.skill}” nie występuje w case.skills`,
              path: ['beats', index, 'stats', si, 'skill'],
            });
          }
        });
      }
    });
    if (fragments.size !== total) {
      ctx.addIssue({
        code: 'custom',
        message: `liczba beatów z nagrodą (${String(fragments.size)}) musi równać się cols×rows (${String(total)})`,
        path: ['beats'],
      });
    }
    const last = kejs.beats[kejs.beats.length - 1];
    if (last?.type !== 'finale') {
      ctx.addIssue({
        code: 'custom',
        message: 'ostatni beat musi być typu finale',
        path: ['beats'],
      });
    }
  });

export class CaseValidationError extends Error {
  constructor(
    message: string,
    readonly issues: readonly string[],
  ) {
    super(message);
    this.name = 'CaseValidationError';
  }
}

/** Waliduje surowy JSON i zwraca typowany Case. Rzuca CaseValidationError z czytelną listą problemów. */
export function loadCase(json: unknown): Case {
  const result = CaseSchema.safeParse(json);
  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `${issue.path.map(String).join('.')}: ${issue.message}`,
    );
    throw new CaseValidationError(`Niepoprawny case:\n${issues.join('\n')}`, issues);
  }
  return result.data;
}

/** Ostrzeżenia nieblokujące (np. przeszkoda bez grafiki — użyty fallback). */
export function caseWarnings(kejs: Case): string[] {
  const warnings: string[] = [];
  for (const beat of kejs.beats) {
    if ((beat.type === 'choice' || beat.type === 'action') && !isObstacleKey(beat.obstacle)) {
      warnings.push(`${beat.id}: nieznana przeszkoda „${beat.obstacle}” — użyty placeholder`);
    }
  }
  return warnings;
}
