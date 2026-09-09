import type { Scenario } from '@anesthesia/scenarios/types';
import { NEGATIVE_SCAN_A_SCAN_THAT_CANNOT_SAY_NO } from './negative-scan-a-scan-that-cannot-say-no';
import { RISING_REQUIREMENT_A_NUMBER_THAT_UNDER_CALLS } from './rising-requirement-a-number-that-under-calls';
import { UNFINISHED_SURVEY_A_PATIENT_WHO_CANNOT_BE_ASKED } from './unfinished-survey-a-patient-who-cannot-be-asked';

export const SURGERY_TRAUMA_SCENARIOS: readonly Scenario[] = [NEGATIVE_SCAN_A_SCAN_THAT_CANNOT_SAY_NO, RISING_REQUIREMENT_A_NUMBER_THAT_UNDER_CALLS,
  UNFINISHED_SURVEY_A_PATIENT_WHO_CANNOT_BE_ASKED];
export const DEFAULT_SURGERY_TRAUMA_SCENARIO_ID = NEGATIVE_SCAN_A_SCAN_THAT_CANNOT_SAY_NO.metadata.id;

export function getSurgeryTraumaScenario(id: string): Scenario | undefined {
  return SURGERY_TRAUMA_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
