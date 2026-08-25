import type { Scenario } from '@anesthesia/scenarios/types';
import { ACUTE_SEVERE_ASTHMA } from './acute-severe-asthma';
import { COPD_EXACERBATION_TRANSITION_REASSESSMENT } from './copd-exacerbation-transition-reassessment';

export const RESPIRATORY_MEDICINE_SCENARIOS: readonly Scenario[] = [
  ACUTE_SEVERE_ASTHMA,
  COPD_EXACERBATION_TRANSITION_REASSESSMENT,
];
export const DEFAULT_RESPIRATORY_MEDICINE_SCENARIO_ID = ACUTE_SEVERE_ASTHMA.metadata.id;

export function getRespiratoryMedicineScenario(id: string): Scenario | undefined {
  return RESPIRATORY_MEDICINE_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
