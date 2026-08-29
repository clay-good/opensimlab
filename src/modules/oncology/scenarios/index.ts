import type { Scenario } from '@anesthesia/scenarios/types';
import { DELAYED_IMMUNE_EVENT_A_DRUG_THAT_STOPPED_MONTHS_AGO } from './delayed-immune-event-a-drug-that-stopped-months-ago';
import { INCIDENTAL_CLOT_A_DECISION_THE_EVIDENCE_CANNOT_MAKE } from './incidental-clot-a-decision-the-evidence-cannot-make';
import { NORMAL_TEST_TOXICITY_THE_DOSE_IN_HIS_BAG } from './normal-test-toxicity-the-dose-in-his-bag';

export const ONCOLOGY_SCENARIOS: readonly Scenario[] = [DELAYED_IMMUNE_EVENT_A_DRUG_THAT_STOPPED_MONTHS_AGO, INCIDENTAL_CLOT_A_DECISION_THE_EVIDENCE_CANNOT_MAKE, NORMAL_TEST_TOXICITY_THE_DOSE_IN_HIS_BAG];
export const DEFAULT_ONCOLOGY_SCENARIO_ID = DELAYED_IMMUNE_EVENT_A_DRUG_THAT_STOPPED_MONTHS_AGO.metadata.id;

export function getOncologyScenario(id: string): Scenario | undefined {
  return ONCOLOGY_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
