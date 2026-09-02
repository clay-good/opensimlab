import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the five controls of the acute-severe-asthma lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps. This is the first Respiratory Medicine lesson
 * to carry that evidence, and the module's lessons have five steps rather than
 * the six used elsewhere.
 */
export type AcuteSevereAsthmaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['acuteSevereAsthmaAssessment']>;

/**
 * The five recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no medication
 * or oxygen delivered, no airway procedure performed, no ventilator setting
 * selected — which are constants rather than observations.
 */
export type AcuteSevereAsthmaProgress = Pick<AcuteSevereAsthmaSnapshot,
  'treatmentAtTick' | 'failureAtTick' | 'escalationAtTick'
  | 'risksAtTick' | 'handoffAtTick'>;

export const ACUTE_SEVERE_ASTHMA_ACTIONS = [
  'reconcile-acute-severe-asthma-treatment-and-trajectory',
  'recognize-acute-severe-asthma-respiratory-failure',
  'activate-acute-severe-asthma-critical-care-escalation',
  'review-acute-severe-asthma-alternatives-and-ventilation-risks',
  'handoff-acute-severe-asthma-reassessment',
] as const;

export type AcuteSevereAsthmaAction = (typeof ACUTE_SEVERE_ASTHMA_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Unlike the lessons in other modules, this timeline is not all narrative: a
 * single authored lower-airway-obstruction waveform cue drives the monitor. It
 * is required by name rather than tolerated, along with the two reassessment
 * narratives and the one boundary.
 */
export function supportsAcuteSevereAsthma(scenario: Scenario): boolean {
  return scenario.metadata.id === 'acute-severe-asthma'
    && scenario.timeline.every((event) => event.type === 'narrative' || event.type === 'obstruction')
    && scenario.timeline.filter((event) => event.type === 'obstruction').length === 1
    && scenario.timeline.filter((event) => event.target === 'acute-severe-asthma-reassessment').length === 2
    && scenario.timeline.filter((event) => event.target === 'acute-severe-asthma-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ACUTE_SEVERE_ASTHMA_ACTIONS.join('|');
}
