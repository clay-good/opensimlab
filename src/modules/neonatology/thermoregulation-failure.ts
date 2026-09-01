import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the neonatal thermoregulation
 * lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type ThermoregulationSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neonatologyThermoregulationAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no warming
 * performed, no set point selected, no rewarming rate prescribed — which are
 * constants rather than observations.
 */
export type ThermoregulationProgress = Pick<ThermoregulationSnapshot,
  'supportAtTick' | 'contextAtTick' | 'recognitionAtTick'
  | 'readinessAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const THERMOREGULATION_ACTIONS = [
  'activate-neonatal-thermoregulation-newborn-thermal-glucose-feeding-and-family-support',
  'reconcile-neonatal-thermoregulation-gestation-admission-temperature-environment-trajectory-physiology-and-whole-dyad',
  'recognize-unintentional-neonatal-hypothermia-requiring-qualified-rewarming-without-rate-cause-or-diagnosis-closure',
  'review-qualified-neonatal-rewarming-monitoring-glucose-feeding-cause-and-hyperthermia-prevention-boundaries',
  'review-neonatal-thermoregulation-fixed-forty-five-minute-qualified-report',
  'handoff-neonatal-thermoregulation-temperature-glucose-feeding-infection-neurologic-family-and-outcome-risk',
] as const;

export type ThermoregulationAction = (typeof THERMOREGULATION_ACTIONS)[number];

/** The same identity guard the engine applies, so nothing reads a look-alike scenario. */
export function supportsThermoregulation(scenario: Scenario): boolean {
  return scenario.metadata.id === 'thermoregulation-failure'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'thermoregulation-failure').length === 1
    && scenario.timeline.filter((event) => event.target === 'thermoregulation-failure-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === THERMOREGULATION_ACTIONS.join('|');
}
