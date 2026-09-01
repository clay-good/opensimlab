import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the ineffective newborn
 * ventilation lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type IneffectiveVentilationSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neonatologyIneffectiveVentilationAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no mask
 * handled, no pressure chosen, no airway placed, no compressions given — which
 * are constants rather than observations.
 */
export type IneffectiveVentilationProgress = Pick<IneffectiveVentilationSnapshot,
  'supportAtTick' | 'contextAtTick' | 'recognitionAtTick'
  | 'readinessAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const INEFFECTIVE_VENTILATION_ACTIONS = [
  'activate-ineffective-neonatal-ventilation-qualified-airway-ventilation-clock-and-dyad-response',
  'reconcile-ineffective-neonatal-ventilation-birth-clock-interface-chest-movement-heart-rate-and-whole-dyad',
  'recognize-ineffective-neonatal-ventilation-from-absent-heart-rate-rise-without-cause-closure',
  'review-qualified-neonatal-ventilation-correction-alternative-airway-and-compression-boundary',
  'review-ineffective-neonatal-ventilation-fixed-two-minute-qualified-response-report',
  'handoff-ineffective-neonatal-ventilation-airway-respiratory-neurologic-parent-and-outcome-risk',
] as const;

export type IneffectiveVentilationAction = (typeof INEFFECTIVE_VENTILATION_ACTIONS)[number];

/** The same identity guard the engine applies, so nothing reads a look-alike scenario. */
export function supportsIneffectiveVentilation(scenario: Scenario): boolean {
  return scenario.metadata.id === 'ineffective-ventilation-correction'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'ineffective-ventilation-correction-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'ineffective-ventilation-correction-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === INEFFECTIVE_VENTILATION_ACTIONS.join('|');
}
