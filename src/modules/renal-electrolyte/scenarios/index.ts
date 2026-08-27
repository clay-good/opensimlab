import type { Scenario } from '@anesthesia/scenarios/types';
import { RENAL_HYPERKALEMIA_CARDIOPROTECTION_AND_REBOUND } from './hyperkalemia-cardioprotection-and-rebound';
import { RENAL_HYPOKALEMIA_MAGNESIUM_AND_ONGOING_LOSSES } from './hypokalemia-magnesium-and-ongoing-losses';
import { RENAL_HYPONATREMIA_SYMPTOMS_AND_REASSESSMENT } from './hyponatremia-symptoms-and-reassessment';
import { RENAL_HYPERNATREMIA_WATER_ACCESS_AND_LOSSES } from './hypernatremia-water-access-and-losses';
import { RENAL_HYPOCALCEMIA_IONIZED_CALCIUM_AND_CKD } from './hypocalcemia-ionized-calcium-and-ckd';

export const RENAL_ELECTROLYTE_SCENARIOS: readonly Scenario[] = [RENAL_HYPERKALEMIA_CARDIOPROTECTION_AND_REBOUND, RENAL_HYPOKALEMIA_MAGNESIUM_AND_ONGOING_LOSSES, RENAL_HYPONATREMIA_SYMPTOMS_AND_REASSESSMENT, RENAL_HYPERNATREMIA_WATER_ACCESS_AND_LOSSES, RENAL_HYPOCALCEMIA_IONIZED_CALCIUM_AND_CKD];
export const DEFAULT_RENAL_ELECTROLYTE_SCENARIO_ID = RENAL_HYPERKALEMIA_CARDIOPROTECTION_AND_REBOUND.metadata.id;

export function getRenalElectrolyteScenario(id: string): Scenario | undefined {
  return RENAL_ELECTROLYTE_SCENARIOS.find((scenario) => scenario.metadata.id === id);
}
