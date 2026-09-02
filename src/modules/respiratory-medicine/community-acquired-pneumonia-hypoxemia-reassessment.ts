import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the five controls of the hypoxemic-pneumonia lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type CapHypoxemiaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['capHypoxemiaAssessment']>;

/**
 * The five recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no oxygen
 * delivered, no support device or antimicrobial selected, no test acquired —
 * which are constants rather than observations.
 */
export type CapHypoxemiaProgress = Pick<CapHypoxemiaSnapshot,
  'supportAtTick' | 'evidenceAtTick' | 'severityAtTick'
  | 'treatmentIntentAtTick' | 'handoffAtTick'>;

export const CAP_HYPOXEMIA_ACTIONS = [
  'corroborate-and-support-cap-hypoxemia',
  'reconcile-cap-evidence-and-dangerous-alternatives',
  'classify-cap-severity-and-escalation-needs',
  'record-cap-testing-and-empiric-treatment-intent',
  'handoff-cap-hypoxemia-reassessment',
] as const;

export type CapHypoxemiaAction = (typeof CAP_HYPOXEMIA_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Unlike the asthma and COPD labs this timeline carries no waveform cue: three
 * narratives and one boundary, all narrative, required by name.
 */
export function supportsCapHypoxemia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'community-acquired-pneumonia-hypoxemia-reassessment'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'community-acquired-pneumonia-hypoxemia-reassessment').length === 3
    && scenario.timeline.filter((event) => event.target === 'community-acquired-pneumonia-hypoxemia-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === CAP_HYPOXEMIA_ACTIONS.join('|');
}
