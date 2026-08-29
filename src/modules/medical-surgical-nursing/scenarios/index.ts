import type { Scenario } from '@anesthesia/scenarios/types';
import { LOW_SCORE_WHAT_THE_THRESHOLD_DOES_NOT_EXCLUDE } from './low-score-what-the-threshold-does-not-exclude';
import { COUNTED_RATE_A_NUMBER_NOBODY_COUNTED } from './counted-rate-a-number-nobody-counted';
import { PAIRED_READING_A_NUMBER_WRONG_IN_ONE_DIRECTION } from './paired-reading-a-number-wrong-in-one-direction';
import { AFFERENT_LIMB_A_THRESHOLD_MET_AND_A_CALL_NOT_MADE } from './afferent-limb-a-threshold-met-and-a-call-not-made';
import { QUIET_PATIENT_A_SCREEN_THAT_WAS_NEVER_DONE } from './quiet-patient-a-screen-that-was-never-done';
import { PROXY_SCALE_A_NUMBER_WITHOUT_A_STANDARD } from './proxy-scale-a-number-without-a-standard';
import { LAST_KNOWN_WELL_A_TIME_NOBODY_CAN_SUPPLY } from './last-known-well-a-time-nobody-can-supply';
import { OXYGEN_TARGET_SCALE_A_SCORE_THAT_SHOULD_BE_LOWER } from './oxygen-target-scale-a-score-that-should-be-lower';

export const MEDICAL_SURGICAL_NURSING_SCENARIOS: readonly Scenario[] = [LOW_SCORE_WHAT_THE_THRESHOLD_DOES_NOT_EXCLUDE, COUNTED_RATE_A_NUMBER_NOBODY_COUNTED, PAIRED_READING_A_NUMBER_WRONG_IN_ONE_DIRECTION, AFFERENT_LIMB_A_THRESHOLD_MET_AND_A_CALL_NOT_MADE, QUIET_PATIENT_A_SCREEN_THAT_WAS_NEVER_DONE, PROXY_SCALE_A_NUMBER_WITHOUT_A_STANDARD, LAST_KNOWN_WELL_A_TIME_NOBODY_CAN_SUPPLY, OXYGEN_TARGET_SCALE_A_SCORE_THAT_SHOULD_BE_LOWER];
export const DEFAULT_MEDICAL_SURGICAL_NURSING_SCENARIO_ID = LOW_SCORE_WHAT_THE_THRESHOLD_DOES_NOT_EXCLUDE.metadata.id;

export function getMedicalSurgicalNursingScenario(id: string): Scenario | undefined {
  return MEDICAL_SURGICAL_NURSING_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
