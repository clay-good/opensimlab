import type { Scenario } from '@anesthesia/scenarios/types';
import { NEGATIVE_SCAN_A_SCAN_THAT_CANNOT_SAY_NO } from './negative-scan-a-scan-that-cannot-say-no';
import { RISING_REQUIREMENT_A_NUMBER_THAT_UNDER_CALLS } from './rising-requirement-a-number-that-under-calls';
import { UNFINISHED_SURVEY_A_PATIENT_WHO_CANNOT_BE_ASKED } from './unfinished-survey-a-patient-who-cannot-be-asked';
import { TRANSIENT_RESPONSE_A_PATIENT_WHO_WILL_NOT_STAY_UP } from './transient-response-a-patient-who-will-not-stay-up';
import { QUIET_CHEST_AN_INJURY_WHOSE_SEVERITY_IS_NOT_YET_VISIBLE } from './quiet-chest-an-injury-whose-severity-is-not-yet-visible';
import { UNOWNED_DELAY_A_WAIT_THAT_NOBODY_DECIDED } from './unowned-delay-a-wait-that-nobody-decided';
import { THIRD_ATTENDANCE_A_QUESTION_TWO_PEOPLE_HAVE_ALREADY_ANSWERED } from './third-attendance-a-question-two-people-have-already-answered';
import { DEFERRED_STEP_A_DECISION_ATTACHED_TO_A_PERSON } from './deferred-step-a-decision-attached-to-a-person';
import { KNOWN_LABEL_AN_EXPLANATION_THAT_EXCLUDES_NOTHING } from './known-label-an-explanation-that-excludes-nothing';
import { UNSPOKEN_DOUBT_AN_INTERVAL_NOBODY_ELSE_CAN_SEE } from './unspoken-doubt-an-interval-nobody-else-can-see';

export const SURGERY_TRAUMA_SCENARIOS: readonly Scenario[] = [NEGATIVE_SCAN_A_SCAN_THAT_CANNOT_SAY_NO, RISING_REQUIREMENT_A_NUMBER_THAT_UNDER_CALLS,
  UNFINISHED_SURVEY_A_PATIENT_WHO_CANNOT_BE_ASKED, TRANSIENT_RESPONSE_A_PATIENT_WHO_WILL_NOT_STAY_UP,
  QUIET_CHEST_AN_INJURY_WHOSE_SEVERITY_IS_NOT_YET_VISIBLE, UNOWNED_DELAY_A_WAIT_THAT_NOBODY_DECIDED,
  THIRD_ATTENDANCE_A_QUESTION_TWO_PEOPLE_HAVE_ALREADY_ANSWERED, DEFERRED_STEP_A_DECISION_ATTACHED_TO_A_PERSON,
  KNOWN_LABEL_AN_EXPLANATION_THAT_EXCLUDES_NOTHING, UNSPOKEN_DOUBT_AN_INTERVAL_NOBODY_ELSE_CAN_SEE];
export const DEFAULT_SURGERY_TRAUMA_SCENARIO_ID = NEGATIVE_SCAN_A_SCAN_THAT_CANNOT_SAY_NO.metadata.id;

export function getSurgeryTraumaScenario(id: string): Scenario | undefined {
  return SURGERY_TRAUMA_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
