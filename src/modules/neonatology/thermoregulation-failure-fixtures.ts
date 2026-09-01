import type { ThermoregulationAction } from './thermoregulation-failure';

/**
 * Reference transcripts for the neonatal thermoregulation lesson.
 *
 * The error path recognizes the hypothermia and moves straight to warming her.
 * A cold newborn with a warming-continuity gap has an explanation sitting right
 * there, and the shape refused here is acting on it before the team, the
 * trajectory and the rest of the newborn have been connected — because the
 * available explanation is what makes the illness easy to miss. The recovery
 * path starts from exactly those refusals and still reaches a correct handoff
 * in the same run.
 */
export const THERMOREGULATION_FIXTURES = {
  scenarioId: 'thermoregulation-failure', contentVersion: '0.1.0', seed: 4517,
  noAction: [],
  expert: [
    [0, 'activate-neonatal-thermoregulation-newborn-thermal-glucose-feeding-and-family-support'],
    [1, 'reconcile-neonatal-thermoregulation-gestation-admission-temperature-environment-trajectory-physiology-and-whole-dyad'],
    [2, 'recognize-unintentional-neonatal-hypothermia-requiring-qualified-rewarming-without-rate-cause-or-diagnosis-closure'],
    [3, 'review-qualified-neonatal-rewarming-monitoring-glucose-feeding-cause-and-hyperthermia-prevention-boundaries'],
    [4, 'review-neonatal-thermoregulation-fixed-forty-five-minute-qualified-report'],
    [5, 'handoff-neonatal-thermoregulation-temperature-glucose-feeding-infection-neurologic-family-and-outcome-risk'],
  ],
  commonError: [
    [0, 'recognize-unintentional-neonatal-hypothermia-requiring-qualified-rewarming-without-rate-cause-or-diagnosis-closure'],
    [1, 'review-neonatal-thermoregulation-fixed-forty-five-minute-qualified-report'],
    [2, 'handoff-neonatal-thermoregulation-temperature-glucose-feeding-infection-neurologic-family-and-outcome-risk'],
  ],
  recovery: [
    [0, 'recognize-unintentional-neonatal-hypothermia-requiring-qualified-rewarming-without-rate-cause-or-diagnosis-closure'],
    [1, 'handoff-neonatal-thermoregulation-temperature-glucose-feeding-infection-neurologic-family-and-outcome-risk'],
    [2, 'activate-neonatal-thermoregulation-newborn-thermal-glucose-feeding-and-family-support'],
    [3, 'reconcile-neonatal-thermoregulation-gestation-admission-temperature-environment-trajectory-physiology-and-whole-dyad'],
    [4, 'recognize-unintentional-neonatal-hypothermia-requiring-qualified-rewarming-without-rate-cause-or-diagnosis-closure'],
    [5, 'review-qualified-neonatal-rewarming-monitoring-glucose-feeding-cause-and-hyperthermia-prevention-boundaries'],
    [6, 'review-neonatal-thermoregulation-fixed-forty-five-minute-qualified-report'],
    [7, 'handoff-neonatal-thermoregulation-temperature-glucose-feeding-infection-neurologic-family-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, ThermoregulationAction])[];
  expert: readonly (readonly [number, ThermoregulationAction])[];
  commonError: readonly (readonly [number, ThermoregulationAction])[];
  recovery: readonly (readonly [number, ThermoregulationAction])[];
};
