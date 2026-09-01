import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the neonatal bradycardia lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type NeonatalBradycardiaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neonatologyBradycardiaAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no compression
 * performed, no access obtained, no treatment effect proven — which are
 * constants rather than observations.
 */
export type NeonatalBradycardiaProgress = Pick<NeonatalBradycardiaSnapshot,
  'supportAtTick' | 'contextAtTick' | 'recognitionAtTick'
  | 'readinessAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const NEONATAL_BRADYCARDIA_ACTIONS = [
  'activate-neonatal-bradycardia-qualified-compression-ventilation-clock-and-dyad-response',
  'reconcile-neonatal-bradycardia-adequate-ventilation-heart-rate-airway-oxygenation-and-whole-dyad',
  'recognize-neonatal-bradycardia-compression-threshold-after-adequate-ventilation',
  'review-qualified-neonatal-compression-ventilation-coordination-and-epinephrine-boundary',
  'review-neonatal-bradycardia-fixed-three-minute-qualified-response-report',
  'handoff-neonatal-bradycardia-respiratory-circulatory-neurologic-parent-and-outcome-risk',
] as const;

export type NeonatalBradycardiaAction = (typeof NEONATAL_BRADYCARDIA_ACTIONS)[number];

/** The same identity guard the engine applies, so nothing reads a look-alike scenario. */
export function supportsNeonatalBradycardia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'neonatal-bradycardia'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'neonatal-bradycardia-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'neonatal-bradycardia-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === NEONATAL_BRADYCARDIA_ACTIONS.join('|');
}
