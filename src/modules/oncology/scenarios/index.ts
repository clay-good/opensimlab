import type { Scenario } from '@anesthesia/scenarios/types';
import { DELAYED_IMMUNE_EVENT_A_DRUG_THAT_STOPPED_MONTHS_AGO } from './delayed-immune-event-a-drug-that-stopped-months-ago';

export const ONCOLOGY_SCENARIOS: readonly Scenario[] = [DELAYED_IMMUNE_EVENT_A_DRUG_THAT_STOPPED_MONTHS_AGO];
export const DEFAULT_ONCOLOGY_SCENARIO_ID = DELAYED_IMMUNE_EVENT_A_DRUG_THAT_STOPPED_MONTHS_AGO.metadata.id;

export function getOncologyScenario(id: string): Scenario | undefined {
  return ONCOLOGY_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
