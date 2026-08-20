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

export type GuidanceLevel = 'guided' | 'coached' | 'unassisted';

export interface Prompt {
  readonly id: string;
  /** What to do next. */
  readonly suggestion: string;
  /** Why it matters. A prompt that only says what to do teaches nothing. */
  readonly because: string;
  /** The explainer that goes deeper. */
  readonly concept?: string;
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

/** The prompts this slice can raise, in priority order. */
export const PROMPTS: readonly {
  readonly prompt: Prompt;
  readonly applies: (input: GuidanceInput) => boolean;
  /** Simulated seconds that must have elapsed before this can fire. */
  readonly afterSeconds: number;
}[] = [
  {
    afterSeconds: 60,
    prompt: {
      id: 'preoxygenate',
      suggestion: 'Raise the inspired oxygen fraction and give it a few minutes before you induce.',
      because:
        'Preoxygenation replaces the nitrogen in the lungs with oxygen. It is the difference '
        + 'between about eight minutes of safe apnoea in this patient and under one.',
      concept: 'preoxygenation-and-safe-apnea-time',
    },
    applies: (input) =>
      (input.state?.fio2 ?? 0.21) < 0.8
      && !input.actions.some((action) => action.type === 'bolus'),
  },
  {
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
    if (input.tick < candidate.afterSeconds * TICKS_PER_SECOND) continue;
    if (!candidate.applies(input)) continue;
    // Coached raises only the two prompts about imminent harm.
    if (level === 'coached' && !['ventilate', 'treat-the-mechanism'].includes(candidate.prompt.id)) {
      continue;
    }
    const lastShown = alreadyShown.get(candidate.prompt.id);
    if (lastShown !== undefined && input.tick - lastShown < PROMPT_COOLDOWN_SECONDS * TICKS_PER_SECOND) {
      continue;
    }
    return candidate.prompt;
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
