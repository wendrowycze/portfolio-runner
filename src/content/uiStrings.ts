import { z } from 'zod';
import uiJson from '../../content/ui.json';

/**
 * Teksty interfejsu (przyciski, podpowiedzi, feedback generyczny) — w content/ui.json,
 * nie w kodzie TS (CLAUDE.md: treść wyłącznie w content/).
 */
const UiStringsSchema = z.strictObject({
  continue: z.string(),
  start: z.string(),
  jumpPrompt: z.string(),
  jumpHint: z.string(),
  choiceHint: z.string(),
  actionWait: z.string(),
  actionNow: z.string(),
  feedbackTimeout: z.string(),
  feedbackEarly: z.string(),
  feedbackLate: z.string(),
  feedbackRight: z.string(),
  retryIn: z.string(),
  fragmentCollected: z.string(),
  fragmentsLabel: z.string(),
  resultsTitle: z.string(),
  resultsSkills: z.string(),
  resultsKpis: z.string(),
  resultsStumbles: z.string(),
  resultsTime: z.string(),
  resultsSee: z.string(),
  finaleReturn: z.string(),
  finaleRestored: z.string(),
  playAgain: z.string(),
  hubHint: z.string(),
  hubDamaged: z.string(),
  hubRestored: z.string(),
  widgetContinue: z.string(),
  puzzleHint: z.string(),
  puzzleDone: z.string(),
  revealHint: z.string(),
  freeRunTitle: z.string(),
  freeRunLead: z.string(),
  freeRunHints: z.array(z.string()),
  buttonThanks: z.string(),
  buttonDonors: z.string(),
  revealTap: z.string(),
  hubEnter: z.string(),
  hubLeadRestored: z.string(),
  runHint: z.string(),
  runHintTouch: z.string(),
  finaleAssembling: z.string(),
  hubProgress: z.string(),
  hubGalleryLead: z.string(),
  hubWorldKultura: z.string(),
  hubWorldEdukacja: z.string(),
  hubWorldBiznes: z.string(),
  startTitle: z.string(),
  startLead: z.string(),
  startName: z.string(),
  startNamePlaceholder: z.string(),
  startEmail: z.string(),
  startEmailPlaceholder: z.string(),
  startEmailHint: z.string(),
  startConsent: z.string(),
  startConsentHint: z.string(),
  startEnter: z.string(),
  startGuest: z.string(),
  startTorches: z.string(),
  startWelcome: z.string(),
  startTouchHint: z.string(),
  hotelTitle: z.string(),
  hotelLead: z.string(),
  hotelControls: z.string(),
  hotelControlsTouch: z.string(),
  hotelFloorGround: z.string(),
  hotelFloorN: z.string(),
  hotelEnterHint: z.string(),
  hotelElevator: z.string(),
  hotelHere: z.string(),
  hotelFloorRestored: z.string(),
  hotelWelcome: z.string(),
  hotelDraft: z.string(),
  audioOn: z.string(),
  audioOff: z.string(),
  audioToggle: z.string(),
  choiceTimeHint: z.string(),
});

export type UiStrings = z.infer<typeof UiStringsSchema>;

export function loadUiStrings(json: unknown = uiJson): UiStrings {
  return UiStringsSchema.parse(json);
}

/** Podstawianie {n}, {total} itd. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_m, key: string) => String(values[key] ?? ''));
}
