import type { Scenario } from '@anesthesia/scenarios/types';
import { LOW_SCORE_WHAT_THE_THRESHOLD_DOES_NOT_EXCLUDE } from './low-score-what-the-threshold-does-not-exclude';

export const MEDICAL_SURGICAL_NURSING_SCENARIOS: readonly Scenario[] = [LOW_SCORE_WHAT_THE_THRESHOLD_DOES_NOT_EXCLUDE];
export const DEFAULT_MEDICAL_SURGICAL_NURSING_SCENARIO_ID = LOW_SCORE_WHAT_THE_THRESHOLD_DOES_NOT_EXCLUDE.metadata.id;

export function getMedicalSurgicalNursingScenario(id: string): Scenario | undefined {
  return MEDICAL_SURGICAL_NURSING_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
