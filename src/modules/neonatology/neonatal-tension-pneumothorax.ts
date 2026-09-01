import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the neonatal tension pneumothorax
 * lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type TensionPneumothoraxSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neonatologyTensionPneumothoraxAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no device
 * operated, no decompression performed, no outcome predicted — which are
 * constants rather than observations.
 */
export type TensionPneumothoraxProgress = Pick<TensionPneumothoraxSnapshot,
  'supportAtTick' | 'contextAtTick' | 'recognitionAtTick'
  | 'readinessAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const TENSION_PNEUMOTHORAX_ACTIONS = [
  'activate-neonatal-tension-pneumothorax-respiratory-decompression-monitoring-and-family-support',
  'reconcile-neonatal-tension-pneumothorax-support-clock-sudden-change-asymmetry-perfusion-and-whole-dyad',
  'recognize-suspected-neonatal-tension-pneumothorax-with-cardiopulmonary-compromise-without-imaging-delay',
  'review-qualified-neonatal-tension-pneumothorax-oxygenation-ventilation-decompression-drain-and-reassessment-boundaries',
  'review-neonatal-tension-pneumothorax-fixed-two-minute-qualified-report',
  'handoff-neonatal-tension-pneumothorax-air-leak-lung-support-circulatory-family-and-outcome-risk',
] as const;

export type TensionPneumothoraxAction = (typeof TENSION_PNEUMOTHORAX_ACTIONS)[number];

/** The same identity guard the engine applies, so nothing reads a look-alike scenario. */
export function supportsTensionPneumothorax(scenario: Scenario): boolean {
  return scenario.metadata.id === 'neonatal-tension-pneumothorax'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'neonatal-tension-pneumothorax').length === 1
    && scenario.timeline.filter((event) => event.target === 'neonatal-tension-pneumothorax-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === TENSION_PNEUMOTHORAX_ACTIONS.join('|');
}
