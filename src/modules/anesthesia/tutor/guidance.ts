/**
 * Progressive guidance (learning/pedagogy → Progressive Guidance Levels).
 *
 * Three levels change how much prompting a learner receives. They change NOTHING
 * about the physiology: guidance is presentational, the prompts are derived from
 * state the engine produced anyway, and replaying the same transcript under each
 * level gives identical state traces. `tests/unit/guidance.test.ts` asserts that.
 */

import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { LearnerAction } from '@platform/kernel/protocol';
import type { ContentMaturity } from '@platform/catalog/maturity';

export type GuidanceLevel = 'guided' | 'coached' | 'unassisted';
export type TutorAssistanceLevel = 'orient' | 'notice' | 'connect' | 'prioritize' | 'direct' | 'explain';
export type TutorTriggerId =
  | 'pre-induction-low-fio2'
  | 'apnea-after-bolus'
  | 'recent-bolus'
  | 'map-below-60';

export interface Prompt {
  readonly id: string;
  /** What to do next. */
  readonly suggestion: string;
  /** Why it matters. A prompt that only says what to do teaches nothing. */
  readonly because: string;
  /** The explainer that goes deeper. */
  readonly concept?: string;
  readonly ruleVersion: string;
  readonly assistanceLevel: TutorAssistanceLevel;
  readonly maturity: ContentMaturity;
  readonly sourceId: string;
}

export interface GuidanceInput {
  readonly tick: number;
  readonly state: Readonly<Record<string, number>> | null;
  readonly actions: readonly LearnerAction[];
  /** True once the airway is secured and ventilation is being delivered. */
  readonly ventilating: boolean;
  /** Alarms currently active; a prompt never interrupts a crisis. */
  readonly alarmCount: number;
}

/** How often the same prompt may be repeated, in simulated seconds. */
export const PROMPT_COOLDOWN_SECONDS = 90;

export interface TutorRule {
  readonly schemaVersion: 1;
  readonly version: string;
  readonly objectiveId: string;
  readonly triggerId: TutorTriggerId;
  readonly assistanceLevel: TutorAssistanceLevel;
  readonly sourceId: string;
  readonly maturity: ContentMaturity;
  readonly applicability: string;
  readonly prerequisiteObservations: readonly string[];
  readonly suppressionConditions: readonly string[];
  readonly urgent: boolean;
  readonly cooldownSeconds: number;
  readonly prompt: Omit<Prompt, 'ruleVersion' | 'assistanceLevel' | 'maturity' | 'sourceId'>;
  readonly applies: (input: GuidanceInput) => boolean;
  readonly afterSeconds: number;
}

/** The prompts this slice can raise, in priority order. */
export const TUTOR_RULES: readonly TutorRule[] = [
  {
    schemaVersion: 1, version: '0.1.0', objectiveId: 'preoxygenate', triggerId: 'pre-induction-low-fio2',
    assistanceLevel: 'direct', sourceId: 'preoxygenation-and-safe-apnea-time', maturity: 'draft',
    applicability: 'Before any bolus, while inspired oxygen remains below 0.8.',
    prerequisiteObservations: ['inspired oxygen fraction', 'accepted bolus actions'],
    suppressionConditions: ['any active alarm', 'unassisted mode', 'coached mode', '90-second cooldown'],
    urgent: false, cooldownSeconds: PROMPT_COOLDOWN_SECONDS,
    afterSeconds: 60,
    prompt: {
      id: 'preoxygenate',
      suggestion: 'Raise the inspired oxygen fraction and give it a few minutes before you induce.',
      because:
        'Preoxygenation replaces the nitrogen in the lungs with oxygen and extends the available '
        + 'apnoea time. The margin varies with the patient and must be confirmed at end expiration.',
      concept: 'preoxygenation-and-safe-apnea-time',
    },
    applies: (input) =>
      (input.state?.fio2 ?? 0.21) < 0.8
      && !input.actions.some((action) => action.type === 'bolus'),
  },
  {
    schemaVersion: 1, version: '0.1.0', objectiveId: 'ventilate-before-desaturation', triggerId: 'apnea-after-bolus',
    assistanceLevel: 'direct', sourceId: 'preoxygenation-and-safe-apnea-time', maturity: 'draft',
    applicability: 'After an accepted bolus when modeled respiration is zero and ventilation is absent.',
    prerequisiteObservations: ['modeled respiratory rate', 'ventilation state', 'accepted bolus actions'],
    suppressionConditions: ['any active alarm', 'unassisted mode', '90-second cooldown'],
    urgent: true, cooldownSeconds: PROMPT_COOLDOWN_SECONDS,
    afterSeconds: 0,
    prompt: {
      id: 'ventilate',
      suggestion: 'The patient is apnoeic. Start ventilating.',
      because:
        'The saturation is holding on the plateau of the dissociation curve. Once it passes '
        + '90% the next ten percent go quickly.',
      concept: 'preoxygenation-and-safe-apnea-time',
    },
    applies: (input) =>
      !input.ventilating
      && (input.state?.respiratoryRateBpm ?? 0) === 0
      && input.actions.some((action) => action.type === 'bolus'),
  },
  {
    schemaVersion: 1, version: '0.1.0', objectiveId: 'avoid-stacking', triggerId: 'recent-bolus',
    assistanceLevel: 'direct', sourceId: 'hysteresis-and-effect-site-lag', maturity: 'draft',
    applicability: 'Within 100 simulated seconds of the most recent accepted bolus.',
    prerequisiteObservations: ['accepted bolus actions', 'simulated time since bolus'],
    suppressionConditions: ['any active alarm', 'unassisted mode', 'coached mode', '90-second cooldown'],
    urgent: false, cooldownSeconds: PROMPT_COOLDOWN_SECONDS,
    afterSeconds: 0,
    prompt: {
      id: 'wait-for-effect-site',
      suggestion: 'Wait before giving more. The last dose has not finished arriving.',
      because:
        'Effect-site concentration is still climbing toward its peak. A second dose now lands '
        + 'on top of the first at full effect, which is how a routine induction becomes a '
        + 'profound hypotension.',
      concept: 'hysteresis-and-effect-site-lag',
    },
    applies: (input) => {
      const boluses = input.actions.filter((action) => action.type === 'bolus');
      const last = boluses[boluses.length - 1];
      if (!last) return false;
      // Within the time-to-peak-effect window of the most recent dose.
      return input.tick - last.tick < 100 * TICKS_PER_SECOND;
    },
  },
  {
    schemaVersion: 1, version: '0.1.0', objectiveId: 'treat-the-mechanism', triggerId: 'map-below-60',
    assistanceLevel: 'connect', sourceId: 'vasodilation-versus-hypovolemia', maturity: 'draft',
    applicability: 'When the modeled mean arterial pressure is below 60 mmHg.',
    prerequisiteObservations: ['mean arterial pressure'],
    suppressionConditions: ['any active alarm', 'unassisted mode', '90-second cooldown'],
    urgent: true, cooldownSeconds: PROMPT_COOLDOWN_SECONDS,
    afterSeconds: 0,
    prompt: {
      id: 'treat-the-mechanism',
      suggestion: 'The pressure is low. Ask what is holding it down before you treat the number.',
      because:
        'Vasodilation and hypovolaemia give the same number and need different treatment. The '
        + 'Why panel will rank what is actually contributing.',
      concept: 'vasodilation-versus-hypovolemia',
    },
    applies: (input) => (input.state?.meanArterialMmHg ?? 100) < 60,
  },
];

/** Backward-compatible name for consumers that enumerate current rules. */
export const PROMPTS = TUTOR_RULES;

export function promptStillEligible(
  level: GuidanceLevel,
  input: GuidanceInput,
  promptId: string,
): boolean {
  if (level === 'unassisted' || input.alarmCount > 0) return false;
  const rule = TUTOR_RULES.find((candidate) => candidate.prompt.id === promptId);
  if (!rule || input.tick < rule.afterSeconds * TICKS_PER_SECOND) return false;
  if (level === 'coached' && !rule.urgent) return false;
  return rule.applies(input);
}

/**
 * The prompt to show, if any.
 *
 * Guided prompts readily. Coached prompts only for the things that are about to
 * hurt the patient. Unassisted says nothing at all — the patient behaves
 * identically and the omission is recorded for the debrief.
 *
 * No prompt appears while an alarm is active, because interrupting a learner
 * mid-crisis teaches the wrong reflex.
 */
export function promptFor(
  level: GuidanceLevel,
  input: GuidanceInput,
  alreadyShown: ReadonlyMap<string, number>,
): Prompt | null {
  if (level === 'unassisted') return null;
  if (input.alarmCount > 0) return null;

  for (const candidate of PROMPTS) {
    if (!promptStillEligible(level, input, candidate.prompt.id)) continue;
    const lastShown = alreadyShown.get(candidate.prompt.id);
    if (lastShown !== undefined && input.tick - lastShown < candidate.cooldownSeconds * TICKS_PER_SECOND) {
      continue;
    }
    return {
      ...candidate.prompt,
      ruleVersion: candidate.version,
      assistanceLevel: candidate.assistanceLevel,
      maturity: candidate.maturity,
      sourceId: candidate.sourceId,
    };
  }
  return null;
}

/**
 * What the learner was not prompted about, recorded for the debrief so an
 * omission under Unassisted is still visible afterwards.
 */
export function unpromptedOmissions(input: GuidanceInput): string[] {
  return PROMPTS
    .filter((candidate) => input.tick >= candidate.afterSeconds * TICKS_PER_SECOND && candidate.applies(input))
    .map((candidate) => candidate.prompt.id);
}
