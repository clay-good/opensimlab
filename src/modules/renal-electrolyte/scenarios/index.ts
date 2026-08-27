import type { Scenario } from '@anesthesia/scenarios/types';
import { RENAL_HYPERKALEMIA_CARDIOPROTECTION_AND_REBOUND } from './hyperkalemia-cardioprotection-and-rebound';
import { RENAL_HYPOKALEMIA_MAGNESIUM_AND_ONGOING_LOSSES } from './hypokalemia-magnesium-and-ongoing-losses';

export const RENAL_ELECTROLYTE_SCENARIOS: readonly Scenario[] = [RENAL_HYPERKALEMIA_CARDIOPROTECTION_AND_REBOUND, RENAL_HYPOKALEMIA_MAGNESIUM_AND_ONGOING_LOSSES];
export const DEFAULT_RENAL_ELECTROLYTE_SCENARIO_ID = RENAL_HYPERKALEMIA_CARDIOPROTECTION_AND_REBOUND.metadata.id;

export function getRenalElectrolyteScenario(id: string): Scenario | undefined {
  return RENAL_ELECTROLYTE_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
