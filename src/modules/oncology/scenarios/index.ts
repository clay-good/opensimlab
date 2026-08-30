import type { Scenario } from '@anesthesia/scenarios/types';
import { DELAYED_IMMUNE_EVENT_A_DRUG_THAT_STOPPED_MONTHS_AGO } from './delayed-immune-event-a-drug-that-stopped-months-ago';
import { INCIDENTAL_CLOT_A_DECISION_THE_EVIDENCE_CANNOT_MAKE } from './incidental-clot-a-decision-the-evidence-cannot-make';
import { NORMAL_TEST_TOXICITY_THE_DOSE_IN_HIS_BAG } from './normal-test-toxicity-the-dose-in-his-bag';
import { PROGNOSIS_QUESTION_A_NUMBER_HE_ASKED_FOR } from './prognosis-question-a-number-he-asked-for';
import { LABORATORY_TLS_A_SYNDROME_HE_DOES_NOT_HAVE_YET } from './laboratory-tls-a-syndrome-he-does-not-have-yet';
import { RARE_EARLY_MYOCARDITIS_A_BASE_RATE_IS_NOT_A_THRESHOLD } from './rare-early-myocarditis-a-base-rate-is-not-a-threshold';
import { LOWERING_THE_COUNT_A_NUMBER_THAT_CAN_BE_MOVED } from './lowering-the-count-a-number-that-can-be-moved';
import { INHERITED_URGENCY_AN_EMERGENCY_THAT_MOSTLY_IS_NOT_ONE } from './inherited-urgency-an-emergency-that-mostly-is-not-one';

export const ONCOLOGY_SCENARIOS: readonly Scenario[] = [DELAYED_IMMUNE_EVENT_A_DRUG_THAT_STOPPED_MONTHS_AGO, INCIDENTAL_CLOT_A_DECISION_THE_EVIDENCE_CANNOT_MAKE, NORMAL_TEST_TOXICITY_THE_DOSE_IN_HIS_BAG, PROGNOSIS_QUESTION_A_NUMBER_HE_ASKED_FOR, LABORATORY_TLS_A_SYNDROME_HE_DOES_NOT_HAVE_YET, RARE_EARLY_MYOCARDITIS_A_BASE_RATE_IS_NOT_A_THRESHOLD, LOWERING_THE_COUNT_A_NUMBER_THAT_CAN_BE_MOVED, INHERITED_URGENCY_AN_EMERGENCY_THAT_MOSTLY_IS_NOT_ONE];
export const DEFAULT_ONCOLOGY_SCENARIO_ID = DELAYED_IMMUNE_EVENT_A_DRUG_THAT_STOPPED_MONTHS_AGO.metadata.id;

export function getOncologyScenario(id: string): Scenario | undefined {
  return ONCOLOGY_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
